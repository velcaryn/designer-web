'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Trash2, X } from 'lucide-react';

function money(n) {
    return `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const FREQ_LABELS = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };

export default function RecurringInvoicesPage() {
    const [schedules, setSchedules] = useState([]);
    const [mrr, setMrr] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const emptyForm = () => ({
        customerName: '', customerEmail: '', frequency: 'monthly', startDate: '', endDate: '',
        lineItems: [{ product: '', qty: 1, unitPrice: 0, taxRate: 18 }],
    });
    const [form, setForm] = useState(emptyForm());

    const loadData = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/accounting/recurring-invoices');
            const data = await res.json();
            setSchedules(data.schedules || []);
            setMrr(data.mrr || 0);
        } catch { toast.error('Failed to load recurring invoices'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    function updateLineItem(idx, field, value) {
        setForm(f => ({ ...f, lineItems: f.lineItems.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
    }
    function addLineItem() {
        setForm(f => ({ ...f, lineItems: [...f.lineItems, { product: '', qty: 1, unitPrice: 0, taxRate: 18 }] }));
    }
    function removeLineItem(idx) {
        setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.customerName.trim()) return toast.error('Customer name is required.');
        try {
            const res = await fetch('/api/cloud/erp/accounting/recurring-invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: { name: form.customerName, email: form.customerEmail },
                    lineItems: form.lineItems,
                    frequency: form.frequency,
                    startDate: form.startDate || undefined,
                    endDate: form.endDate || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Recurring schedule created!');
            setShowForm(false);
            setForm(emptyForm());
            loadData();
        } catch (err) { toast.error(err.message || 'Failed to save.'); }
    }

    async function toggleActive(schedule) {
        try {
            const res = await fetch(`/api/cloud/erp/accounting/recurring-invoices/${schedule._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !schedule.active }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            loadData();
        } catch (err) { toast.error(err.message); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this recurring schedule? Already-generated invoices are unaffected.')) return;
        try {
            const res = await fetch(`/api/cloud/erp/accounting/recurring-invoices/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Deleted.');
            loadData();
        } catch (err) { toast.error(err.message); }
    }

    if (loading) return <SkeletonPage rows={6} cols={5} />;

    return (
        <div>
            <Link href="/cloud/dashboard/erp/accounting" style={{ fontSize: 13, color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>← Back to Accounting</Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>🔁 Recurring Invoices</h1>
                    <p style={{ fontSize: 13, color: '#6c757d', margin: '4px 0 0' }}>Schedules auto-generate Invoices on their due date (processed by a background job).</p>
                </div>
                <button onClick={() => setShowForm(true)} style={btnPrimary}>+ New Schedule</button>
            </div>

            <div style={{ marginBottom: 20 }}>
                <div style={{ ...cardStyle, display: 'inline-block' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated MRR (active schedules)</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#166534', marginTop: 6 }}>{money(mrr)}</div>
                </div>
            </div>

            {schedules.length === 0 ? (
                <div style={emptyStyle}><h3 style={{ margin: '0 0 6px', color: 'var(--secondary-color)' }}>No recurring schedules yet</h3><p style={{ margin: 0 }}>Set one up for a repeat-billing client.</p></div>
            ) : (
                <div style={{ overflowX: 'auto', background: 'var(--bg-white)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 720 }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                                <th style={thStyle}>Customer</th>
                                <th style={thStyle}>Frequency</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                                <th style={thStyle}>Next Run</th>
                                <th style={thStyle}>Generated</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map(s => (
                                <tr key={s._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={tdStyle}><strong>{s.customer?.name}</strong>{s.customer?.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.customer.email}</div>}</td>
                                    <td style={tdStyle}>{FREQ_LABELS[s.frequency]}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{money(s.grandTotal)}</td>
                                    <td style={tdStyle}>{new Date(s.nextRunDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td style={tdStyle}>{s.generatedCount || 0}x</td>
                                    <td style={tdStyle}>
                                        <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: s.active ? '#dcfce7' : '#f3f4f6', color: s.active ? '#166534' : '#6b7280' }}>
                                            {s.active ? 'Active' : 'Paused'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => toggleActive(s)} style={btnSmallConfirm}>{s.active ? '⏸ Pause' : '▶ Resume'}</button>
                                            <button onClick={() => handleDelete(s._id)} style={btnSmallDel}><Trash2 size={14} aria-hidden="true" /> </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div style={overlayStyle} onClick={() => setShowForm(false)}>
                    <div style={{ ...modalStyle, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'var(--secondary-color)' }}>New Recurring Schedule</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label style={fieldStyle}><span>Customer Name *</span><input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} style={inputStyle} /></label>
                                <label style={fieldStyle}><span>Customer Email</span><input value={form.customerEmail} onChange={e => setForm(p => ({ ...p, customerEmail: e.target.value }))} style={inputStyle} /></label>
                                <label style={fieldStyle}>
                                    <span>Frequency</span>
                                    <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))} style={inputStyle}>
                                        {Object.entries(FREQ_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                    </select>
                                </label>
                                <label style={fieldStyle}><span>Start Date</span><input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} style={inputStyle} /></label>
                                <label style={fieldStyle}><span>End Date (optional)</span><input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} style={inputStyle} /></label>
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', marginTop: 8 }}>Line Items</div>
                            {form.lineItems.map((item, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 1fr 0.7fr auto', gap: 8, alignItems: 'center' }}>
                                    <input placeholder="Product/service" value={item.product} onChange={e => updateLineItem(idx, 'product', e.target.value)} style={inputStyle} />
                                    <input type="number" onFocus={(e) => e.target.select()} placeholder="Qty" value={item.qty} onChange={e => updateLineItem(idx, 'qty', e.target.value)} style={inputStyle} />
                                    <input type="number" onFocus={(e) => e.target.select()} placeholder="Unit Price" value={item.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)} style={inputStyle} />
                                    <input type="number" onFocus={(e) => e.target.select()} placeholder="Tax %" value={item.taxRate} onChange={e => updateLineItem(idx, 'taxRate', e.target.value)} style={inputStyle} />
                                    {form.lineItems.length > 1 && <button type="button" onClick={() => removeLineItem(idx)} style={btnSmallDel}><X size={14} aria-hidden="true" /> </button>}
                                </div>
                            ))}
                            <button type="button" onClick={addLineItem} style={{ ...btnSecondary, alignSelf: 'flex-start' }}>+ Add Line</button>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                                <button type="submit" style={btnPrimary}>Create Schedule</button>
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
const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--secondary-color)', borderBottom: '2px solid var(--border)' };
const tdStyle = { padding: '12px 14px', color: 'var(--text-main)' };
const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSmallConfirm = { background: 'var(--status-success-bg)', border: '1px solid #a7f3d0', color: '#059669', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 };
const btnSmallDel = { background: 'var(--status-danger-bg)', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)' };
const modalStyle = { background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 60px rgba(45,23,82,0.25)' };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const inputStyle = { border: '1.5px solid #e2e0ea', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', textTransform: 'none', fontWeight: 400, color: '#111' };
