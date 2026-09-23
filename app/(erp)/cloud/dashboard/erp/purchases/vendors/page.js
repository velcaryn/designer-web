'use client';
import { useState, useEffect, useCallback } from 'react';
import { useCloudUser } from '@/app/(erp)/cloud/dashboard/layout';
import Link from 'next/link';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import CsvImportButton from '@/components/cloud-app/CsvImportButton';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { contact } from '@/config/site';

function getValueCaseInsensitive(row, keys) {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
        const match = rowKeys.find(k => k.trim().toLowerCase() === key);
        if (match && row[match] !== undefined && String(row[match]).trim() !== '') return row[match];
    }
    return '';
}

export default function VendorsPage() {
    const user = useCloudUser();
    const [vendors, setVendors] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editVendor, setEditVendor] = useState(null);
    const [search, setSearch] = useState('');
    const [mode, setMode] = useState('new'); // 'new' | 'existing' - only relevant when creating
    const [existingClientId, setExistingClientId] = useState('');

    const emptyForm = () => ({
        name: '', company: '', email: '', phone: '', address: '',
        gstin: '', panNumber: '', paymentTerms: '', notes: '',
        bankDetails: { bankName: '', accountNo: '', ifscCode: '', branch: '' },
    });

    const [form, setForm] = useState(emptyForm());

    // CSV import state
    const [csvRows, setCsvRows] = useState([]);
    const [showCsvPreview, setShowCsvPreview] = useState(false);
    const [importingCsv, setImportingCsv] = useState(false);

    const loadVendors = useCallback(async () => {
        try {
            const q = search ? `?q=${encodeURIComponent(search)}` : '';
            const res = await fetch(`/api/cloud/erp/purchases/vendors${q}`);
            const data = await res.json();
            setVendors(data.vendors || []);
        } catch { toast.error('Failed to load vendors'); }
        finally { setLoading(false); }
    }, [search]);

    const loadClients = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/clients');
            const data = await res.json();
            setClients(data.clients || []);
        } catch { /* non-fatal */ }
    }, []);

    useEffect(() => { loadVendors(); }, [loadVendors]);
    useEffect(() => { loadClients(); }, [loadClients]);

    // Clients not already tagged as vendors - the only ones worth "promoting"
    const promotableClients = clients.filter(c => !(c.roles || []).includes('vendor'));

    function openNew() {
        setForm(emptyForm());
        setEditVendor(null);
        setMode(promotableClients.length ? 'existing' : 'new');
        setExistingClientId('');
        setShowForm(true);
    }

    async function handleSave(e) {
        e.preventDefault();

        if (!editVendor && mode === 'existing') {
            if (!existingClientId) return toast.error('Select a client to make a vendor.');
            try {
                const res = await fetch('/api/cloud/erp/purchases/vendors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ existingClientId }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                toast.success('Client is now also a vendor!');
                setShowForm(false);
                loadVendors();
                loadClients();
            } catch (err) { toast.error(err.message); }
            return;
        }

        if (!form.name.trim()) return toast.error('Vendor name is required.');
        try {
            const url = editVendor
                ? `/api/cloud/erp/purchases/vendors/${editVendor._id}`
                : '/api/cloud/erp/purchases/vendors';
            const method = editVendor ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(editVendor ? 'Vendor updated!' : 'Vendor added!');
            setShowForm(false);
            setEditVendor(null);
            setForm(emptyForm());
            loadVendors();
            loadClients();
        } catch (err) { toast.error(err.message); }
    }

    async function handleDelete(vendor) {
        const alsoCustomer = (vendor.roles || []).includes('customer');
        const msg = alsoCustomer
            ? `Remove the vendor role from "${vendor.name}"? They'll remain in your Clients list.`
            : `Remove "${vendor.name}" from your contacts? This contact isn't a customer, so it will be deleted entirely.`;
        if (!confirm(msg)) return;
        try {
            const res = await fetch(`/api/cloud/erp/purchases/vendors/${vendor._id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            toast.success(alsoCustomer ? 'Vendor role removed.' : 'Vendor deleted.');
            loadVendors();
            loadClients();
        } catch { toast.error('Failed to update vendor.'); }
    }

    function handleCsvUpload(file) {
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete({ data }) {
                if (!data.length) { toast.error('CSV file is empty.'); return; }

                const parsed = data.map(row => {
                    const name = getValueCaseInsensitive(row, ['name', 'vendor', 'vendor name', 'supplier', 'supplier name']);
                    const company = getValueCaseInsensitive(row, ['company', 'company name']);
                    const email = getValueCaseInsensitive(row, ['email', 'email address']);
                    const phone = getValueCaseInsensitive(row, ['phone', 'mobile', 'contact number']);
                    const address = getValueCaseInsensitive(row, ['address', 'street', 'location']);
                    const gstin = getValueCaseInsensitive(row, ['gstin', 'gst', 'gst number']);
                    const panNumber = getValueCaseInsensitive(row, ['pan', 'pan number', 'pannumber']);
                    const paymentTerms = getValueCaseInsensitive(row, ['paymentterms', 'payment terms', 'terms']);

                    return {
                        name: String(name || '').trim(),
                        company: String(company || '').trim(),
                        email: String(email || '').trim().toLowerCase(),
                        phone: String(phone || '').trim(),
                        address: String(address || '').trim(),
                        gstin: String(gstin || '').trim().toUpperCase(),
                        panNumber: String(panNumber || '').trim().toUpperCase(),
                        paymentTerms: String(paymentTerms || '').trim(),
                    };
                }).filter(row => row.name.trim() !== '');

                if (parsed.length === 0) {
                    toast.error("No valid vendors found. Column 'name' is mandatory.");
                    return;
                }

                setCsvRows(parsed);
                setShowCsvPreview(true);
                toast.success(`Parsed ${parsed.length} vendors. Review before uploading.`);
            },
            error: err => toast.error('CSV parse error: ' + err.message),
        });
    }

    async function commitCsvImport() {
        setImportingCsv(true);
        try {
            const res = await fetch('/api/cloud/erp/purchases/vendors/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendors: csvRows }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Imported ${data.count} vendor${data.count === 1 ? '' : 's'}!`);
            setShowCsvPreview(false);
            setCsvRows([]);
            loadVendors();
        } catch (err) {
            toast.error(err.message || 'Bulk import failed.');
        } finally {
            setImportingCsv(false);
        }
    }

    function openEdit(vendor) {
        setEditVendor(vendor);
        setMode('new');
        setForm({
            name: vendor.name || '',
            company: vendor.company || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            address: vendor.address || '',
            gstin: vendor.gstin || '',
            panNumber: vendor.panNumber || '',
            paymentTerms: vendor.paymentTerms || '',
            notes: vendor.notes || '',
            bankDetails: vendor.bankDetails || { bankName: '', accountNo: '', ifscCode: '', branch: '' },
        });
        setShowForm(true);
    }

    if (loading) {
        return <SkeletonPage rows={6} cols={5} />;
    }

    return (
        <div className="erp-vendors">
            <div className="erp-vendors-header">
                <div>
                    <h1 className="erp-vendors-title">Vendor Directory</h1>
                    <p className="erp-vendors-subtitle">Suppliers you buy from - shares the same contact list as Clients, so a contact can be both.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link href="/cloud/dashboard/erp/purchases" className="erp-btn-secondary">← Purchase Orders</Link>
                    <CsvImportButton
                        columns={['name', 'company', 'email', 'phone', 'address', 'gstin', 'panNumber', 'paymentTerms']}
                        sampleRow={{ name: 'MedSupply Distributors', company: 'MedSupply Pvt Ltd', email: 'sales@medsupply.com', phone: contact.phonePlaceholder, address: '45 Industrial Estate, Pune', gstin: '27AAAAA1234A1Z5', panNumber: 'AAAAA1234A', paymentTerms: 'Net 30' }}
                        filename="vendors-sample.csv"
                        onFile={handleCsvUpload}
                    />
                    <button onClick={openNew} className="erp-btn-primary">
                        <Plus size={14} aria-hidden="true" /> Add Vendor
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="Search vendors by name, company, email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="erp-search-input"
                    style={{ width: '100%', maxWidth: 400 }}
                />
            </div>

            {/* Vendor Cards */}
            {vendors.length === 0 ? (
                <div className="erp-empty-state">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏭</div>
                    <h3>No Vendors</h3>
                    <p>Add your first vendor to start creating purchase orders.</p>
                </div>
            ) : (
                <div className="erp-vendor-grid">
                    {vendors.map(vendor => (
                        <div key={vendor._id} className="erp-vendor-card">
                            <div className="erp-vendor-card-header">
                                <div className="erp-vendor-avatar">
                                    {(vendor.name || 'V')[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="erp-vendor-name">{vendor.name}</div>
                                    {vendor.company && <div className="erp-vendor-company">{vendor.company}</div>}
                                </div>
                            </div>

                            <div className="erp-vendor-details">
                                {vendor.email && <div>📧 {vendor.email}</div>}
                                {vendor.phone && <div>📞 {vendor.phone}</div>}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                                    {vendor.gstin && <span className="erp-vendor-badge">GSTIN: {vendor.gstin}</span>}
                                    {(vendor.roles || []).includes('customer') && (
                                        <span className="erp-vendor-badge" style={{ background: 'var(--status-success-bg)', color: '#166534' }}>Also a Customer</span>
                                    )}
                                </div>
                                {vendor.paymentTerms && <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>💳 {vendor.paymentTerms}</div>}
                            </div>

                            <div className="erp-vendor-card-actions">
                                <button onClick={() => openEdit(vendor)} className="erp-action-btn"><Pencil size={14} aria-hidden="true" /> Edit</button>
                                <button onClick={() => handleDelete(vendor)} className="erp-action-btn erp-action-btn-del"><Trash2 size={14} aria-hidden="true" /> </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Vendor Form Modal */}
            {showForm && (
                <div className="erp-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="erp-modal" onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>{editVendor ? 'Edit Vendor' : 'New Vendor'}</h2>
                            <button onClick={() => setShowForm(false)} className="erp-modal-close"><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <form id="vendor-form" onSubmit={handleSave} className="erp-lead-form">
                                {!editVendor && promotableClients.length > 0 && (
                                    <div className="erp-mode-toggle">
                                        <button type="button" onClick={() => setMode('existing')} className={mode === 'existing' ? 'active' : ''}>Existing Client</button>
                                        <button type="button" onClick={() => setMode('new')} className={mode === 'new' ? 'active' : ''}>New Contact</button>
                                    </div>
                                )}

                                {!editVendor && mode === 'existing' ? (
                                    <label className="erp-form-field">
                                        <span>Select Client *</span>
                                        <select value={existingClientId} onChange={e => setExistingClientId(e.target.value)}>
                                            <option value="">Choose a client…</option>
                                            {promotableClients.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                                            ))}
                                        </select>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 400, marginTop: 2 }}>
                                            This adds the vendor role to an existing contact - their customer details are kept as-is.
                                        </span>
                                    </label>
                                ) : (
                                    <>
                                        <div className="erp-form-grid">
                                            <label className="erp-form-field">
                                                <span>Vendor Name *</span>
                                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                                            </label>
                                            <label className="erp-form-field">
                                                <span>Company</span>
                                                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                                            </label>
                                            <label className="erp-form-field">
                                                <span>Email</span>
                                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                                            </label>
                                            <label className="erp-form-field">
                                                <span>Phone</span>
                                                <input value={form.phone} placeholder={contact.phonePlaceholder} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                                            </label>
                                            <label className="erp-form-field">
                                                <span>GSTIN</span>
                                                <input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} maxLength={15} placeholder="22AAAAA0000A1Z5" />
                                            </label>
                                            <label className="erp-form-field">
                                                <span>PAN Number</span>
                                                <input value={form.panNumber} onChange={e => setForm(f => ({ ...f, panNumber: e.target.value }))} maxLength={10} placeholder="ABCDE1234F" />
                                            </label>
                                        </div>

                                        <label className="erp-form-field" style={{ marginTop: 12 }}>
                                            <span>Address</span>
                                            <textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                                        </label>

                                        <label className="erp-form-field" style={{ marginTop: 12 }}>
                                            <span>Payment Terms</span>
                                            <input value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} placeholder="Net 30, COD, etc." />
                                        </label>

                                        {/* Bank Details */}
                                        <div style={{ marginTop: 16, padding: '14px', background: 'var(--surface-sunken)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--secondary-color)', display: 'block', marginBottom: 10 }}>🏦 Bank Details</span>
                                            <div className="erp-form-grid">
                                                <label className="erp-form-field">
                                                    <span>Bank Name</span>
                                                    <input value={form.bankDetails.bankName} onChange={e => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, bankName: e.target.value } }))} />
                                                </label>
                                                <label className="erp-form-field">
                                                    <span>Account No</span>
                                                    <input value={form.bankDetails.accountNo} onChange={e => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, accountNo: e.target.value } }))} />
                                                </label>
                                                <label className="erp-form-field">
                                                    <span>IFSC Code</span>
                                                    <input value={form.bankDetails.ifscCode} onChange={e => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, ifscCode: e.target.value } }))} maxLength={11} />
                                                </label>
                                                <label className="erp-form-field">
                                                    <span>Branch</span>
                                                    <input value={form.bankDetails.branch} onChange={e => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, branch: e.target.value } }))} />
                                                </label>
                                            </div>
                                        </div>

                                        <label className="erp-form-field" style={{ marginTop: 12 }}>
                                            <span>Notes</span>
                                            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                                        </label>
                                    </>
                                )}
                            </form>
                        </div>
                        <div className="erp-form-actions">
                            <button type="button" onClick={() => setShowForm(false)} className="erp-btn-secondary">Cancel</button>
                            <button type="submit" form="vendor-form" className="erp-btn-primary">
                                {editVendor ? 'Update Vendor' : (mode === 'existing' ? 'Make Vendor' : 'Add Vendor')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Import Preview Modal */}
            {showCsvPreview && (
                <div className="erp-modal-overlay" onClick={() => setShowCsvPreview(false)}>
                    <div className="erp-modal" onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>📋 CSV Import Preview ({csvRows.length} Vendors)</h2>
                            <button onClick={() => setShowCsvPreview(false)} className="erp-modal-close"><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body" style={{ padding: 24 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-sunken)', borderBottom: '2px solid #cbd5e1' }}>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Company</th>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Email</th>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Phone</th>
                                        <th style={{ padding: 8, textAlign: 'left' }}>GSTIN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvRows.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: 8, fontWeight: 600 }}>{row.name}</td>
                                            <td style={{ padding: 8 }}>{row.company || '-'}</td>
                                            <td style={{ padding: 8 }}>{row.email || '-'}</td>
                                            <td style={{ padding: 8 }}>{row.phone || '-'}</td>
                                            <td style={{ padding: 8 }}><code>{row.gstin || '-'}</code></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="erp-form-actions">
                            <button onClick={() => { setShowCsvPreview(false); setCsvRows([]); }} className="erp-btn-secondary">Cancel</button>
                            <button onClick={commitCsvImport} disabled={importingCsv} className="erp-btn-primary">
                                {importingCsv ? 'Importing…' : `Import ${csvRows.length} Vendors`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .erp-vendors { font-family: 'Inter', sans-serif; }
                .erp-vendors-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
                }
                .erp-vendors-title {
                    font-size: clamp(1.4rem, 3vw, 1.8rem); font-weight: 800;
                    color: var(--secondary-color); margin: 0 0 4px;
                }
                .erp-vendors-subtitle { color: #6c757d; font-size: 14px; margin: 0; }

                .erp-btn-primary {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: white;
                    border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600;
                    font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 4px 12px rgba(72,38,131,0.25);
                    display: inline-flex; align-items: center; gap: 6px; min-height: 40px;
                }
                .erp-btn-primary:hover {
                    background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
                    transform: translateY(-2px);
                }
                .erp-btn-secondary {
                    background: var(--bg-light); color: var(--primary-color); border: 1.5px solid #e2e0ea;
                    padding: 10px 20px; border-radius: 10px; font-weight: 600;
                    font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: none;
                    transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; min-height: 40px;
                }
                .erp-btn-secondary:hover { background: var(--accent-subtle); border-color: var(--primary-color); }

                .erp-search-input {
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 10px 14px;
                    font-size: 14px; font-family: inherit; outline: none;
                    transition: border-color 0.2s; box-sizing: border-box; min-height: 40px;
                }
                .erp-search-input:focus { border-color: var(--primary-color); }

                .erp-vendor-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 16px;
                }
                .erp-vendor-card {
                    background: var(--surface); border-radius: 12px; padding: 20px;
                    border: 1px solid #f0edf5; transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .erp-vendor-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px rgba(72,38,131,0.12);
                    border-color: #d8d0e8;
                }
                .erp-vendor-card-header {
                    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
                }
                .erp-vendor-avatar {
                    width: 42px; height: 42px; border-radius: 10px;
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
                    color: white; font-weight: 800; font-size: 18px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .erp-vendor-name { font-weight: 700; font-size: 15px; color: var(--secondary-color); }
                .erp-vendor-company { font-size: 12px; color: #6c757d; }
                .erp-vendor-details {
                    font-size: 12px; color: #333; display: flex; flex-direction: column; gap: 4px;
                    padding: 10px 0; border-top: 1px solid var(--bg-light);
                }
                .erp-vendor-badge {
                    display: inline-block; background: var(--accent-subtle); color: #6d28d9;
                    padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
                    width: fit-content;
                }
                .erp-vendor-card-actions {
                    display: flex; gap: 6px; margin-top: 12px; padding-top: 10px;
                    border-top: 1px solid var(--bg-light);
                }

                .erp-action-btn {
                    background: none; border: 1px solid var(--border); padding: 6px 12px;
                    border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit;
                    transition: all 0.15s; min-height: 32px;
                }
                .erp-action-btn:hover { background: var(--bg-light); border-color: #d8d0e8; }
                .erp-action-btn-del:hover { background: var(--status-danger-bg); border-color: #fca5a5; }

                .erp-empty-state {
                    text-align: center; padding: 48px 24px; color: #6c757d;
                    background: var(--surface); border-radius: 12px; border: 1px solid #f0edf5;
                }
                .erp-empty-state h3 { color: var(--secondary-color); margin: 0 0 8px; }

                .erp-mode-toggle {
                    display: flex; gap: 8px; margin-bottom: 16px; padding-bottom: 16px;
                    border-bottom: 1px solid #f0edf5;
                }
                .erp-mode-toggle button {
                    flex: 1; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 700;
                    border: 1.5px solid #e2e0ea; background: var(--surface); color: #475569; cursor: pointer;
                    min-height: 36px; font-family: inherit;
                }
                .erp-mode-toggle button.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }

                .erp-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; padding: 20px; backdrop-filter: blur(4px);
                }
                .erp-modal {
                    background: var(--surface); border-radius: 16px; width: 100%; max-width: 620px;
                    max-height: min(88vh, 88dvh);
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 20px 60px rgba(45,23,82,0.25);
                }
                .erp-modal-header {
                    flex: 0 0 auto;
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px; border-bottom: 1px solid #f0edf5;
                }
                .erp-modal-header h2 { margin: 0; font-size: 18px; font-weight: 800; color: var(--secondary-color); }
                .erp-modal-close {
                    background: none; border: none; font-size: 18px; cursor: pointer;
                    color: #6c757d; width: 36px; height: 36px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .erp-modal-close:hover { background: var(--bg-light); color: var(--secondary-color); }
                .erp-modal-body { flex: 1 1 auto; overflow-y: auto; min-height: 0; }
                .erp-lead-form { padding: 24px; }
                .erp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
                .erp-form-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
                .erp-form-field span {
                    font-size: 12px; font-weight: 600; color: var(--primary-color);
                    text-transform: uppercase; letter-spacing: 0.04em;
                }
                .erp-form-field input, .erp-form-field select, .erp-form-field textarea {
                    width: 100%; box-sizing: border-box; min-width: 0;
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 10px 12px;
                    font-size: 14px; font-family: inherit; outline: none;
                    transition: border-color 0.2s; background: var(--surface-sunken); min-height: 40px;
                }
                .erp-form-field input:focus, .erp-form-field select:focus, .erp-form-field textarea:focus {
                    border-color: var(--primary-color); background: var(--surface);
                }
                .erp-form-actions {
                    flex: 0 0 auto;
                    display: flex; gap: 12px; justify-content: flex-end;
                    padding: 16px 24px; border-top: 1px solid #f0edf5;
                }

                @media (max-width: 768px) {
                    .erp-form-grid { grid-template-columns: 1fr; }
                    .erp-vendor-grid { grid-template-columns: 1fr; }
                    .erp-vendors-header { flex-direction: column; }
                    .erp-modal { max-height: 100dvh; border-radius: 0; }
                    .erp-modal-overlay { padding: 0; }
                }
            `}</style>
        </div>
    );
}
