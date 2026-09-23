'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SkeletonPage, Bone } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';

function money(n) {
    return `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TaxProfilesPage() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const emptyForm = () => ({ name: '', rate: '18', isExempt: false, hsnCodes: '' });
    const [form, setForm] = useState(emptyForm());

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [gst, setGst] = useState(null);
    // Tracked separately from `loading` (which only covers the tax-profiles
    // fetch) - profiles usually resolve first since it's a tiny collection,
    // which used to leave the GST section rendering as a bare header with
    // nothing under it until its own fetch caught up. Also re-set on every
    // month/year change so switching periods doesn't blank the cards either.
    const [gstLoading, setGstLoading] = useState(true);

    const loadProfiles = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/config/tax-profiles');
            const data = await res.json();
            setProfiles(data.profiles || []);
        } catch { toast.error('Failed to load tax profiles'); }
        finally { setLoading(false); }
    }, []);

    const loadGstSummary = useCallback(async () => {
        setGstLoading(true);
        try {
            const res = await fetch(`/api/cloud/erp/reports/gst-summary?month=${month}&year=${year}`);
            const data = await res.json();
            setGst(data);
        } catch { /* non-fatal */ }
        finally { setGstLoading(false); }
    }, [month, year]);

    useEffect(() => { loadProfiles(); }, [loadProfiles]);
    useEffect(() => { loadGstSummary(); }, [loadGstSummary]);

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim()) return toast.error('Profile name is required.');
        try {
            const res = await fetch('/api/cloud/erp/config/tax-profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    rate: Number(form.rate) || 0,
                    isExempt: form.isExempt,
                    hsnCodes: form.hsnCodes.split(',').map(h => h.trim()).filter(Boolean),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Tax profile saved!');
            setShowForm(false);
            setForm(emptyForm());
            loadProfiles();
        } catch (err) { toast.error(err.message || 'Failed to save.'); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this tax profile?')) return;
        try {
            const res = await fetch(`/api/cloud/erp/config/tax-profiles/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Deleted.');
            loadProfiles();
        } catch (err) { toast.error(err.message); }
    }

    if (loading) return <SkeletonPage rows={5} cols={4} />;

    return (
        <div style={{ maxWidth: 900 }}>
            <Link href="/cloud/dashboard/config" style={{ fontSize: 13, color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>← Back to Config</Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>💰 Tax Profiles & GST Filing</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Named tax rates auto-applied by HSN code, plus a monthly output/input tax summary.</p>
                </div>
                <button onClick={() => setShowForm(true)} style={btnPrimary}>+ New Tax Profile</button>
            </div>

            {/* Tax Profiles */}
            <section style={{ marginBottom: 28 }}>
                {profiles.length === 0 ? (
                    <div style={emptyStyle}><h3 style={{ margin: '0 0 6px', color: 'var(--secondary-color)' }}>No tax profiles yet</h3><p style={{ margin: 0 }}>Add one (e.g. &ldquo;GST 18%&rdquo;) to start auto-applying rates by HSN code.</p></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                        {profiles.map(p => (
                            <div key={p._id} style={cardStyle}>
                                <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--secondary-color)' }}>{p.name}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: p.isExempt ? '#6b7280' : '#166534', marginTop: 6 }}>{p.isExempt ? 'Exempt' : `${p.rate}%`}</div>
                                {p.hsnCodes?.length > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>HSN: {p.hsnCodes.join(', ')}</div>
                                )}
                                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--bg-light)' }}>
                                    <button onClick={() => handleDelete(p._id)} style={btnSmallDel}><Trash2 size={14} aria-hidden="true" /> Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* GST Filing Summary */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>GST Filing Summary</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selectStyle}>
                            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                        <select value={year} onChange={e => setYear(Number(e.target.value))} style={selectStyle}>
                            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {gstLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={cardStyle}>
                                <Bone w="120px" h="11px" />
                                <Bone w="90px" h="22px" style={{ marginTop: 8 }} />
                                <Bone w="70px" h="11px" style={{ marginTop: 6 }} />
                            </div>
                        ))}
                    </div>
                ) : gst && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        <div style={cardStyle}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Output Tax (collected)</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#166534', marginTop: 6 }}>{money(gst.outputTax.total)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{gst.outputTax.invoiceCount} invoice(s)</div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Input Tax (paid)</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginTop: 6 }}>{money(gst.inputTax.total)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{gst.inputTax.poCount} purchase order(s)</div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Payable</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: gst.netPayable >= 0 ? '#b45309' : '#166534', marginTop: 6 }}>{money(gst.netPayable)}</div>
                        </div>
                    </div>
                )}
            </section>

            {showForm && (
                <div style={overlayStyle} onClick={() => setShowForm(false)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'var(--secondary-color)' }}>New Tax Profile</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={fieldStyle}>
                                <span>Name *</span>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. GST 18%, IGST 18%, Exempt" style={inputStyle} />
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                                <input type="checkbox" checked={form.isExempt} onChange={e => setForm(p => ({ ...p, isExempt: e.target.checked }))} />
                                Mark as tax-exempt (0%)
                            </label>
                            {!form.isExempt && (
                                <label style={fieldStyle}>
                                    <span>Rate (%) *</span>
                                    <input type="number" onFocus={(e) => e.target.select()} step="0.5" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} style={inputStyle} />
                                </label>
                            )}
                            <label style={fieldStyle}>
                                <span>HSN Codes (comma-separated, optional)</span>
                                <input value={form.hsnCodes} onChange={e => setForm(p => ({ ...p, hsnCodes: e.target.value }))} placeholder="e.g. 8471, 8517" style={inputStyle} />
                            </label>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                                <button type="submit" style={btnPrimary}>Save Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const emptyStyle = { textAlign: 'center', padding: '40px 24px', color: '#6c757d', background: 'var(--surface)', borderRadius: 12, border: '1px solid #f0edf5' };
const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSmallDel = { background: 'var(--status-danger-bg)', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const selectStyle = { border: '1.5px solid #e2e0ea', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)' };
const modalStyle = { background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 60px rgba(45,23,82,0.25)' };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const inputStyle = { border: '1.5px solid #e2e0ea', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', textTransform: 'none', fontWeight: 400, color: '#111' };
