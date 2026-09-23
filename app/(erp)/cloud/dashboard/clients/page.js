'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Papa from 'papaparse';
import VendorsPanel from '@/app/(erp)/cloud/dashboard/erp/purchases/vendors/page';
import { SkeletonPage } from '@/components/ui/skeleton';
import CsvImportButton from '@/components/cloud-app/CsvImportButton';
import { Pencil, Trash2, X } from 'lucide-react';
import { normalizePhone } from '@/lib/phone';
import { contact } from '@/config/site';

// Clients and Vendors are still separate collections under the hood (vendors
// carry bank/GSTIN/payment-terms fields clients don't need), but to the person
// using the app they're the same rolodex of "who do I do business with" - so
// they live under one nav entry with a tab switch instead of two menu items.
export default function CloudClientsPage() {
    const [tab, setTab] = useState('clients');
    return (
        <div>
            <div className="cd-tabbar">
                <button type="button" onClick={() => setTab('clients')} className={`cd-tab ${tab === 'clients' ? 'active' : ''}`}>👥 Clients</button>
                <button type="button" onClick={() => setTab('vendors')} className={`cd-tab ${tab === 'vendors' ? 'active' : ''}`}>🏭 Vendors</button>
            </div>
            {tab === 'clients' ? <ClientsPanel /> : <VendorsPanel />}
            <style>{`
                .cd-tabbar { display: flex; gap: 6px; margin-bottom: 20px; border-bottom: 2px solid var(--border); }
                .cd-tab {
                    border: none; background: none; cursor: pointer; font-family: inherit;
                    font-size: 14px; font-weight: 700; color: var(--text-muted);
                    padding: 10px 6px; margin-bottom: -2px; border-bottom: 2px solid transparent;
                    transition: color 0.15s, border-color 0.15s;
                }
                .cd-tab:hover { color: var(--primary-color); }
                .cd-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
            `}</style>
        </div>
    );
}

function ClientsPanel() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '', isVendor: false });

    // CSV states
    const [csvData, setCsvData] = useState([]);
    const [showCsvPreview, setShowCsvPreview] = useState(false);
    const [importingCsv, setImportingCsv] = useState(false);
    const fileInputRef = useRef(null);

    function loadClients() {
        fetch('/api/cloud/clients').then(r => r.json()).then(d => { setClients(d.clients || []); setLoading(false); }).catch(() => setLoading(false));
    }
    useEffect(() => { loadClients(); }, []);

    // Handle hash state navigation to cleanly integrate browser Back button
    useEffect(() => {
        function handleHashChange() {
            if (window.location.hash !== '#form') {
                setShowForm(false);
                setEditId(null);
            }
        }
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    function triggerForm(open, isEdit = false) {
        if (open) {
            window.location.assign('#form');
            setShowForm(true);
        } else {
            if (window.location.hash === '#form') {
                window.history.back();
            } else {
                setShowForm(false);
                setEditId(null);
            }
        }
    }

    function resetForm() {
        setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '', isVendor: false });
        triggerForm(false);
    }

    function startEdit(c) {
        setForm({ name: c.name || '', contactPerson: c.contactPerson || '', phone: c.phone || '', email: c.email || '', address: c.address || '', gstin: c.gstin || '', isVendor: (c.roles || []).includes('vendor') });
        setEditId(c._id);
        triggerForm(true, true);
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Client name is required.'); return; }
        setSaving(true);
        try {
            const url = editId ? `/api/cloud/clients/${editId}` : '/api/cloud/clients';
            const method = editId ? 'PUT' : 'POST';
            const { isVendor, ...rest } = form;
            const roles = isVendor ? ['customer', 'vendor'] : ['customer'];
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rest, roles }) });
            if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Save failed.'); return; }
            toast.success(editId ? 'Client updated!' : 'Client added!');
            resetForm(); loadClients();
        } catch { toast.error('Network error.'); }
        finally { setSaving(false); }
    }

    async function handleDelete(client) {
        const alsoVendor = (client.roles || []).includes('vendor');
        const msg = alsoVendor
            ? `Remove "${client.name}" from your Clients list? They'll remain in your Vendors list.`
            : `Delete this client?`;
        if (!confirm(msg)) return;
        try {
            const res = await fetch(`/api/cloud/clients/${client._id}`, { method: 'DELETE' });
            if (!res.ok) { toast.error('Delete failed.'); return; }
            toast.success('Client deleted.');
            loadClients();
        } catch { toast.error('Network error.'); }
    }

    function getValueCaseInsensitive(row, potentialKeys) {
        const keys = Object.keys(row);
        for (const key of keys) {
            const cleanKey = key.toLowerCase().trim();
            if (potentialKeys.includes(cleanKey)) {
                return row[key];
            }
        }
        return '';
    }

    // CSV upload triggers
    function handleCsvUpload(file) {
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete({ data }) {
                if (!data.length) { toast.error('CSV file is empty.'); return; }

                const parsed = data.map(row => {
                    const name = getValueCaseInsensitive(row, ['name', 'client', 'company', 'client name', 'company name', 'hospital', 'buyer']);
                    const contactPerson = getValueCaseInsensitive(row, ['contactperson', 'contact person', 'contact', 'contact name', 'attention', 'attn']);
                    const phone = getValueCaseInsensitive(row, ['phone', 'mobile', 'contact number', 'phone number', 'tel']);
                    const email = getValueCaseInsensitive(row, ['email', 'email address', 'emailid', 'mail']);
                    const address = getValueCaseInsensitive(row, ['address', 'street', 'location', 'billing address']);
                    const gstin = getValueCaseInsensitive(row, ['gstin', 'gst', 'gst number', 'tax id', 'tax number']);

                    const mapped = {
                        name: String(name || '').trim(),
                        contactPerson: String(contactPerson || '').trim(),
                        phone: String(phone || '').trim(),
                        email: String(email || '').trim().toLowerCase(),
                        address: String(address || '').trim(),
                        gstin: String(gstin || '').trim().toUpperCase(),
                    };
                    return mapped;
                }).filter(row => row.name.trim() !== '');

                if (parsed.length === 0) {
                    toast.error("No valid clients found. Column 'name' is mandatory.");
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                setCsvData(parsed);
                setShowCsvPreview(true);
                toast.success(`Parsed ${parsed.length} clients. Review the list before uploading.`);
            },
            error: err => toast.error('CSV parse error: ' + err.message)
        });
    }

    async function commitCsvImport() {
        setImportingCsv(true);
        try {
            const res = await fetch('/api/cloud/clients/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients: csvData })
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || 'Bulk upload failed.'); return; }

            toast.success(`Successfully imported ${data.count} clients!`);
            setShowCsvPreview(false);
            setCsvData([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadClients();
        } catch {
            toast.error('Network error during bulk import.');
        } finally {
            setImportingCsv(false);
        }
    }

    if (loading) return <SkeletonPage rows={6} cols={6} />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <Link href="/cloud/dashboard" style={{ textDecoration: 'none', color: 'var(--primary-color)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', minHeight: '40px', padding: '0 8px' }}>
                            🏠 Dashboard
                        </Link>
                        <span style={{ color: '#cbd5e1' }}>/</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Clients</span>
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>👥 Client Directory</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Manage your customer contacts for quick billing.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <CsvImportButton
                        columns={['name', 'contactPerson', 'phone', 'email', 'address', 'gstin']}
                        sampleRow={{ name: 'Apex Hospital', contactPerson: 'Mr. Rajan', phone: contact.phonePlaceholder, email: 'accounts@apexhospital.com', address: '12 MG Road, Chennai', gstin: '33AAAAA1234A1Z1' }}
                        filename="clients-sample.csv"
                        onFile={handleCsvUpload}
                    />
                    <button onClick={() => { resetForm(); triggerForm(true); }} style={btnPrimary}>+ Add Client</button>
                </div>
            </div>

            {showForm && (
                <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--secondary-color)', marginBottom: '16px' }}>{editId ? 'Edit Client Details' : 'Add New Client'}</h3>
                    <form onSubmit={handleSave} className="responsive-form" style={{ gap: '14px' }}>
                        <div>
                            <label style={labelStyle}>Client / Company Name *</label>
                            <input style={inputStyle} placeholder="e.g. Apex Industries" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Contact Person</label>
                            <input style={inputStyle} placeholder="e.g. Mr. Rajan" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input type="tel" style={inputStyle} placeholder={contact.phonePlaceholder} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} onBlur={e => setForm(p => ({ ...p, phone: normalizePhone(e.target.value) }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input type="email" style={inputStyle} placeholder="contact@client.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                        </div>
                        <div className="full-width">
                            <label style={labelStyle}>Address</label>
                            <input style={inputStyle} placeholder="Full address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>GSTIN</label>
                            <input style={inputStyle} placeholder="33AAAAA1234A1Z1" maxLength="15" value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} />
                        </div>
                        <div className="full-width">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--secondary-color)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.isVendor} onChange={e => setForm(p => ({ ...p, isVendor: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                                Also register this contact as a Vendor (shows up under ERP → Vendors)
                            </label>
                        </div>
                        <div className="full-width" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '10px' }}>
                            <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : (editId ? 'Update Client' : 'Add Client')}</button>
                            <button type="button" onClick={resetForm} style={btnSecondary}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Clients Table */}
            <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                                <th style={thStyle}>Client Name</th>
                                <th style={thStyle}>Contact Person</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Phone</th>
                                <th style={thStyle}>GSTIN</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No clients yet. Add your first client profile or import a CSV!</td></tr>
                            )}
                            {clients.map((c, i) => (
                                <tr key={c._id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td data-label="Client Name" style={tdStyle}>
                                        <strong style={{ color: 'var(--secondary-color)' }}>{c.name}</strong>
                                        {(c.roles || []).includes('vendor') && (
                                            <span style={{ marginLeft: '6px', fontSize: '11px', padding: '1px 8px', borderRadius: '10px', background: 'var(--accent-subtle)', color: '#6d28d9', fontWeight: 600 }}>Vendor</span>
                                        )}
                                    </td>
                                    <td data-label="Contact Person" style={tdStyle}>{c.contactPerson || '-'}</td>
                                    <td data-label="Email" style={tdStyle}>{c.email || '-'}</td>
                                    <td data-label="Phone" style={tdStyle}>{c.phone || '-'}</td>
                                    <td data-label="GSTIN" style={tdStyle}><code style={{ fontSize: '12.5px' }}>{c.gstin || '-'}</code></td>
                                    <td data-label="Actions" style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => startEdit(c)} style={btnSmall}><Pencil size={14} aria-hidden="true" /> Edit</button>
                                            <button onClick={() => handleDelete(c)} style={{ ...btnSmall, background: 'var(--status-danger-bg)', color: '#991b1b' }}><Trash2 size={14} aria-hidden="true" /> </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CSV Import Preview Modal */}
            {showCsvPreview && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ background: 'var(--bg-white)', borderRadius: '16px', maxWidth: '820px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
                        <div style={{ padding: '18px 24px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--secondary-color)' }}>📋 CSV Import Preview ({csvData.length} Clients)</h3>
                            <button onClick={() => { setShowCsvPreview(false); setCsvData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-sunken)', borderBottom: '2px solid #cbd5e1' }}>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Client Name</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Contact</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Phone</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>GSTIN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvData.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '8px', fontWeight: 600 }}>{row.name}</td>
                                            <td style={{ padding: '8px' }}>{row.contactPerson || '-'}</td>
                                            <td style={{ padding: '8px' }}>{row.email || '-'}</td>
                                            <td style={{ padding: '8px' }}>{row.phone || '-'}</td>
                                            <td style={{ padding: '8px' }}><code>{row.gstin || '-'}</code></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '16px 24px', background: 'var(--surface-sunken)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => { setShowCsvPreview(false); setCsvData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={btnSecondary}>Cancel</button>
                            <button onClick={commitCsvImport} disabled={importingCsv} style={{ ...btnPrimary, background: '#16a34a' }}>
                                {importingCsv ? 'Importing…' : `Import ${csvData.length} Clients`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--secondary-color)', borderBottom: '2px solid var(--border)' };
const tdStyle = { padding: '12px 14px', color: 'var(--text-main)' };
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s', background: 'var(--bg-white)' };
const btnPrimary = { padding: '10px 20px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', minHeight: '40px', transition: 'all 0.2s', fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 20px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid var(--border)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', minHeight: '40px', fontFamily: 'inherit' };
const btnSmall = { padding: '6px 12px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, minHeight: '32px', fontFamily: 'inherit' };
