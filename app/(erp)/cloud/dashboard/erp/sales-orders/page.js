'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Check, Trash2, X } from 'lucide-react';

const STATUS_COLORS = {
    draft: { bg: '#f0f0f0', text: '#6b7280', label: 'Draft' },
    confirmed: { bg: '#ede9fe', text: '#6d28d9', label: 'Confirmed' },
    fulfilled: { bg: '#ecfdf5', text: '#059669', label: 'Fulfilled' },
    invoiced: { bg: '#d1fae5', text: '#047857', label: 'Invoiced' },
    cancelled: { bg: '#fef2f2', text: '#dc2626', label: 'Cancelled' },
};

function money(n) {
    return `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// UTC-consistent - matches the calendar's date handling so an "Expected Date"
// picked here lands on the same day the Calendar shows it.
function toDateInputValue(d) {
    if (!d) return '';
    return new Date(d).toISOString().slice(0, 10);
}

const STEPS = ['draft', 'confirmed', 'fulfilled', 'invoiced'];

// A compact 4-dot progress trail so the order's position in Quote → SO → Fulfilled →
// Invoiced is visible at a glance, not just a status pill you have to read the word of.
function StepTrail({ status }) {
    if (status === 'cancelled') {
        return <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}><X size={14} aria-hidden="true" /> Cancelled</span>;
    }
    const idx = STEPS.indexOf(status);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {STEPS.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    <div title={STATUS_COLORS[s].label} style={{
                        width: 9, height: 9, borderRadius: '50%',
                        background: i <= idx ? 'var(--primary-color)' : '#e5e7eb',
                        transition: 'background 0.2s',
                    }} />
                    {i < STEPS.length - 1 && (
                        <div style={{ width: 14, height: 2, background: i < idx ? 'var(--primary-color)' : '#e5e7eb' }} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function SalesOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState('');
    const [newExpectedDate, setNewExpectedDate] = useState('');
    const [fulfillOrder, setFulfillOrder] = useState(null);
    const [fulfillWarehouseId, setFulfillWarehouseId] = useState('');
    const selectedQuote = quotes.find(q => q._id === selectedQuoteId) || null;

    const loadData = useCallback(async () => {
        try {
            const [ordersRes, docsRes, warehousesRes] = await Promise.all([
                fetch(`/api/cloud/erp/sales/orders${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.json()),
                fetch('/api/cloud/documents').then(r => r.json()),
                fetch('/api/cloud/erp/inventory/warehouses').then(r => r.json()),
            ]);
            setOrders(ordersRes.orders || []);
            setQuotes((docsRes.documents || []).filter(d => d.docType === 'Quote' && d.status !== 'draft'));
            setWarehouses(warehousesRes.warehouses || []);
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleConvert() {
        if (!selectedQuoteId) return toast.error('Select a quote to convert.');
        try {
            const res = await fetch('/api/cloud/erp/sales/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quoteDocumentId: selectedQuoteId, expectedDate: newExpectedDate || undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Sales Order ${data.soNumber} created!`);
            setShowConvertModal(false);
            setSelectedQuoteId('');
            setNewExpectedDate('');
            loadData();
        } catch (err) { toast.error(err.message || 'Failed to create Sales Order.'); }
    }

    async function handleStatusChange(orderId, status, extra = {}) {
        try {
            const res = await fetch(`/api/cloud/erp/sales/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, ...extra }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (status === 'invoiced') toast.success(`Invoice ${data.invoiceDocNumber} generated!`);
            else toast.success(`Status → ${status}`);
            // Update the order in local state immediately so the current tab
            // never flashes empty while the refetch (which may re-filter this
            // order out under the active status tab) is still in flight.
            setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, ...extra, status } : o)));
            await loadData();
            return data;
        } catch (err) { toast.error(err.message); throw err; }
    }

    function handleConfirm(order) {
        if (!confirm(`Confirm ${order.soNumber}? This locks in the order for fulfillment.`)) return;
        handleStatusChange(order._id, 'confirmed');
    }

    function handleGenerateInvoice(order) {
        if (!confirm(`Generate an invoice for ${order.soNumber} (${money(order.grandTotal)})? This creates a new sent Invoice ready to send to ${order.customer?.name || 'the customer'}.`)) return;
        handleStatusChange(order._id, 'invoiced');
    }

    function handleCancel(order) {
        if (!confirm(`Cancel ${order.soNumber}? This cannot be undone.`)) return;
        handleStatusChange(order._id, 'cancelled');
    }

    async function handleDelete(orderId) {
        if (!confirm('Delete this Sales Order?')) return;
        try {
            const res = await fetch(`/api/cloud/erp/sales/orders/${orderId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Sales Order deleted.');
            loadData();
        } catch (err) { toast.error(err.message); }
    }

    async function handleExpectedDateChange(order, value) {
        try {
            const res = await fetch(`/api/cloud/erp/sales/orders/${order._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expectedDate: value || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setOrders(prev => prev.map(o => (o._id === order._id ? { ...o, expectedDate: value || null } : o)));
        } catch (err) { toast.error(err.message || 'Failed to update expected date.'); }
    }

    function openFulfillModal(order) {
        setFulfillOrder(order);
        setFulfillWarehouseId(warehouses[0]?._id || '');
    }

    async function confirmFulfill() {
        if (!fulfillWarehouseId) return toast.error('Select a warehouse to fulfill from.');
        await handleStatusChange(fulfillOrder._id, 'fulfilled', { warehouseId: fulfillWarehouseId });
        setFulfillOrder(null);
    }

    if (loading) {
        return <SkeletonPage stats={3} rows={6} cols={5} />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>📑 Sales Orders</h1>
                    <p style={{ fontSize: 13, color: '#6c757d', margin: '4px 0 0' }}>Quote → Sales Order → Invoice. Fulfillment auto-deducts stock.</p>
                </div>
                <button onClick={() => setShowConvertModal(true)} style={btnPrimary}>+ Convert Quote to SO</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[{ v: '', l: 'All' }, ...Object.entries(STATUS_COLORS).map(([v, c]) => ({ v, l: c.label }))].map(o => (
                    <button key={o.v} onClick={() => setStatusFilter(o.v)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: '1.5px solid', borderColor: statusFilter === o.v ? 'var(--primary-color)' : '#e2e0ea', background: statusFilter === o.v ? 'var(--primary-color)' : 'var(--surface)', color: statusFilter === o.v ? '#fff' : 'var(--text-secondary)' }}>{o.l}</button>
                ))}
            </div>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6c757d', background: 'var(--surface)', borderRadius: 12, border: '1px solid #f0edf5' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📑</div>
                    <h3 style={{ color: 'var(--secondary-color)', margin: '0 0 8px' }}>No Sales Orders yet</h3>
                    <p style={{ margin: 0 }}>Convert a sent Quote into a Sales Order to get started.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto', background: 'var(--bg-white)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 780 }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                                <th style={thStyle}>SO Number</th>
                                <th style={thStyle}>Customer</th>
                                <th style={thStyle}>Progress</th>
                                <th style={thStyle}>Items</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                                <th style={thStyle}>Expected Date</th>
                                <th style={thStyle}>Invoice</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const sc = STATUS_COLORS[order.status] || STATUS_COLORS.draft;
                                return (
                                    <tr key={order._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={tdStyle}>
                                            <strong style={{ color: 'var(--secondary-color)' }}>{order.soNumber}</strong>
                                            {order.quoteDocNumber && order.quoteDocumentId && (
                                                <div>
                                                    <a href={`/api/cloud/documents/${order.quoteDocumentId}/pdf`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
                                                        📝 from {order.quoteDocNumber}
                                                    </a>
                                                </div>
                                            )}
                                        </td>
                                        <td style={tdStyle}>{order.customer?.name || '-'}</td>
                                        <td style={tdStyle}>
                                            <StepTrail status={order.status} />
                                            <div style={{ fontSize: 10.5, fontWeight: 700, color: sc.text, marginTop: 4, textTransform: 'uppercase' }}>{sc.label}</div>
                                        </td>
                                        <td style={tdStyle}>{(order.lineItems || []).length}</td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{money(order.grandTotal)}</td>
                                        <td style={tdStyle}>
                                            {(order.status === 'draft' || order.status === 'confirmed') ? (
                                                <input
                                                    type="date"
                                                    defaultValue={toDateInputValue(order.expectedDate)}
                                                    onBlur={e => e.target.value !== toDateInputValue(order.expectedDate) && handleExpectedDateChange(order, e.target.value)}
                                                    style={{ border: '1.5px solid #e2e0ea', borderRadius: 6, padding: '5px 8px', fontSize: 12.5, fontFamily: 'inherit', width: 130 }}
                                                />
                                            ) : (order.expectedDate ? toDateInputValue(order.expectedDate) : '-')}
                                        </td>
                                        <td style={tdStyle}>
                                            {order.invoiceDocNumber && order.invoiceDocumentId ? (
                                                <a href={`/api/cloud/documents/${order.invoiceDocumentId}/pdf`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 700 }}>
                                                    🧾 {order.invoiceDocNumber}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {order.status === 'draft' && (
                                                    <>
                                                        <button onClick={() => handleConfirm(order)} style={btnSmallConfirm}><Check size={14} aria-hidden="true" /> Confirm</button>
                                                        <button onClick={() => handleDelete(order._id)} style={btnSmallDel}><Trash2 size={14} aria-hidden="true" /> Delete</button>
                                                    </>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button onClick={() => openFulfillModal(order)} style={btnSmallConfirm}>📦 Fulfill</button>
                                                )}
                                                {order.status === 'fulfilled' && (
                                                    <button onClick={() => handleGenerateInvoice(order)} style={btnSmallConfirm}>🧾 Generate Invoice</button>
                                                )}
                                                {(order.status === 'draft' || order.status === 'confirmed') && (
                                                    <button onClick={() => handleCancel(order)} style={btnSmallDel}><X size={14} aria-hidden="true" /> Cancel</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showConvertModal && (
                <div style={overlayStyle} onClick={() => setShowConvertModal(false)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'var(--secondary-color)' }}>Convert Quote to Sales Order</h2>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Quote *</span>
                            <select value={selectedQuoteId} onChange={e => setSelectedQuoteId(e.target.value)} style={selectStyle}>
                                <option value="">- Select a sent quote -</option>
                                {quotes.map(q => <option key={q._id} value={q._id}>{q.docNumber} - {q.customer?.name || 'No customer'} - {money(q.grandTotal)}</option>)}
                            </select>
                            {quotes.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No sent quotes yet - create and send one under Documents first.</span>}
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Expected Date (optional)</span>
                            <input type="date" value={newExpectedDate} onChange={e => setNewExpectedDate(e.target.value)} style={selectStyle} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shown on the Calendar as the expected fulfillment/delivery date.</span>
                        </label>
                        {selectedQuote && (
                            <div style={{ marginTop: 14, padding: 14, background: 'var(--bg-light)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>What will carry over</div>
                                <div style={{ fontSize: 13, marginBottom: 6 }}><strong>{selectedQuote.customer?.name || 'No customer'}</strong>{selectedQuote.customer?.company ? ` (${selectedQuote.customer.company})` : ''}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                                    {(selectedQuote.lineItems || []).map((li, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569' }}>
                                            <span>{li.product || li.description} × {li.qty}</span>
                                            <span>{money(li.totalPrice)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: 'var(--secondary-color)', borderTop: '1px solid #e2e0ea', paddingTop: 8 }}>
                                    <span>Total</span><span>{money(selectedQuote.grandTotal)}</span>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button onClick={() => setShowConvertModal(false)} style={btnSecondary}>Cancel</button>
                            <button onClick={handleConvert} style={btnPrimary}>Create Sales Order</button>
                        </div>
                    </div>
                </div>
            )}

            {fulfillOrder && (
                <div style={overlayStyle} onClick={() => setFulfillOrder(null)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: 'var(--secondary-color)' }}>Fulfill {fulfillOrder.soNumber}</h2>
                        <p style={{ fontSize: 13, color: '#6c757d', marginTop: 0 }}>Line items matching your Items catalog (by name) will be auto-deducted from the selected warehouse.</p>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Fulfill From Warehouse *</span>
                            <select value={fulfillWarehouseId} onChange={e => setFulfillWarehouseId(e.target.value)} style={selectStyle}>
                                <option value="">- Select warehouse -</option>
                                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                            </select>
                            {warehouses.length === 0 && <span style={{ fontSize: 11, color: '#dc2626' }}>No warehouses yet - add one under Inventory first.</span>}
                        </label>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button onClick={() => setFulfillOrder(null)} style={btnSecondary}>Cancel</button>
                            <button onClick={confirmFulfill} style={btnPrimary}><Check size={14} aria-hidden="true" /> Confirm Fulfilled</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--secondary-color)', borderBottom: '2px solid var(--border)' };
const tdStyle = { padding: '12px 14px', color: 'var(--text-main)' };
const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSmallConfirm = { background: 'var(--status-success-bg)', border: '1px solid #a7f3d0', color: '#059669', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, minHeight: 32, whiteSpace: 'nowrap', fontFamily: 'inherit' };
const btnSmallDel = { background: 'var(--status-danger-bg)', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, minHeight: 32, whiteSpace: 'nowrap', fontFamily: 'inherit' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)' };
const modalStyle = { background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 60px rgba(45,23,82,0.25)' };
const selectStyle = { border: '1.5px solid #e2e0ea', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' };
