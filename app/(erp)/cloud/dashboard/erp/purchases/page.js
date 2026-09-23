'use client';
import { useState, useEffect, useCallback } from 'react';
import { useCloudUser } from '@/app/(erp)/cloud/dashboard/layout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';

const STATUS_COLORS = {
    draft: { bg: '#f0f0f0', text: '#6b7280', label: 'Draft' },
    confirmed: { bg: '#ede9fe', text: '#6d28d9', label: 'Confirmed' },
    received: { bg: '#ecfdf5', text: '#059669', label: 'Received' },
    billed: { bg: '#fef3c7', text: '#d97706', label: 'Billed' },
    paid: { bg: '#d1fae5', text: '#047857', label: 'Paid' },
    cancelled: { bg: '#fef2f2', text: '#dc2626', label: 'Cancelled' },
};

export default function PurchasesPage() {
    const user = useCloudUser();
    const [orders, setOrders] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editOrder, setEditOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [warehouses, setWarehouses] = useState([]);
    const [receivingOrder, setReceivingOrder] = useState(null);
    const [receiveWarehouseId, setReceiveWarehouseId] = useState('');

    const [form, setForm] = useState({
        vendorId: '', notes: '', expectedDate: '', shippingAddress: '',
        lineItems: [{ product: '', description: '', hsnCode: '', qty: 1, unit: 'Nos', unitPrice: 0, taxRate: 18 }],
    });

    const loadData = useCallback(async () => {
        try {
            const [ordersRes, vendorsRes, warehousesRes] = await Promise.all([
                fetch(`/api/cloud/erp/purchases/orders${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.json()),
                fetch('/api/cloud/erp/purchases/vendors').then(r => r.json()),
                fetch('/api/cloud/erp/inventory/warehouses').then(r => r.json()),
            ]);
            setOrders(ordersRes.orders || []);
            setVendors(vendorsRes.vendors || []);
            setWarehouses(warehousesRes.warehouses || []);
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { loadData(); }, [loadData]);

    const money = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    function addLineItem() {
        setForm(f => ({
            ...f,
            lineItems: [...f.lineItems, { product: '', description: '', hsnCode: '', qty: 1, unit: 'Nos', unitPrice: 0, taxRate: 18 }],
        }));
    }

    function removeLineItem(i) {
        setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }));
    }

    function updateLineItem(i, field, value) {
        setForm(f => ({
            ...f,
            lineItems: f.lineItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item),
        }));
    }

    const subtotal = form.lineItems.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0), 0);
    const taxTotal = form.lineItems.reduce((s, i) => {
        const lineTotal = (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0);
        return s + (lineTotal * (parseFloat(i.taxRate) || 0) / 100);
    }, 0);

    async function handleSave(e) {
        e.preventDefault();
        if (!form.vendorId) return toast.error('Select a vendor.');
        if (form.lineItems.length === 0) return toast.error('Add at least one line item.');

        try {
            const url = editOrder
                ? `/api/cloud/erp/purchases/orders/${editOrder._id}`
                : '/api/cloud/erp/purchases/orders';
            const method = editOrder ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(editOrder ? 'PO updated!' : 'Purchase Order created!');
            setShowForm(false);
            setEditOrder(null);
            resetForm();
            loadData();
        } catch (err) {
            toast.error(err.message || 'Failed to save.');
        }
    }

    function resetForm() {
        setForm({
            vendorId: '', notes: '', expectedDate: '', shippingAddress: '',
            lineItems: [{ product: '', description: '', hsnCode: '', qty: 1, unit: 'Nos', unitPrice: 0, taxRate: 18 }],
        });
    }

    async function handleStatusChange(orderId, newStatus, extra = {}) {
        try {
            const res = await fetch(`/api/cloud/erp/purchases/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, ...extra }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Status → ${newStatus}`);
            loadData();
        } catch (err) { toast.error(err.message); }
    }

    function openReceiveModal(order) {
        setReceivingOrder(order);
        setReceiveWarehouseId(warehouses[0]?._id || '');
    }

    async function confirmReceive() {
        if (!receiveWarehouseId) return toast.error('Select a warehouse to receive stock into.');
        await handleStatusChange(receivingOrder._id, 'received', { warehouseId: receiveWarehouseId });
        setReceivingOrder(null);
    }

    async function handleDelete(orderId) {
        if (!confirm('Delete this purchase order?')) return;
        try {
            const res = await fetch(`/api/cloud/erp/purchases/orders/${orderId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('PO deleted');
            loadData();
        } catch (err) { toast.error(err.message); }
    }

    function openEdit(order) {
        setEditOrder(order);
        setForm({
            vendorId: order.vendorId || '',
            notes: order.notes || '',
            expectedDate: order.expectedDate ? order.expectedDate.slice(0, 10) : '',
            shippingAddress: order.shippingAddress || '',
            lineItems: order.lineItems || [],
        });
        setShowForm(true);
    }

    // Summary stats
    const draftCount = orders.filter(o => o.status === 'draft').length;
    const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
    const totalValue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.grandTotal || 0), 0);

    if (loading) {
        return <SkeletonPage stats={3} rows={6} cols={5} />;
    }

    return (
        <div className="erp-po">
            {/* Header */}
            <div className="erp-po-header">
                <div>
                    <h1 className="erp-po-title">Purchase Orders</h1>
                    <p className="erp-po-subtitle">Manage procurement from vendors</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link href="/cloud/dashboard/erp/purchases/vendors" className="erp-btn-secondary">
                        🏭 Vendors
                    </Link>
                    <button onClick={() => { resetForm(); setEditOrder(null); setShowForm(true); }} className="erp-btn-primary">
                        <Plus size={14} aria-hidden="true" /> New PO
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="erp-stats-bar">
                <div className="erp-stat-chip">
                    <span className="erp-stat-chip-label">Total POs</span>
                    <span className="erp-stat-chip-value">{orders.length}</span>
                </div>
                <div className="erp-stat-chip">
                    <span className="erp-stat-chip-label">Drafts</span>
                    <span className="erp-stat-chip-value">{draftCount}</span>
                </div>
                <div className="erp-stat-chip">
                    <span className="erp-stat-chip-label">Confirmed</span>
                    <span className="erp-stat-chip-value">{confirmedCount}</span>
                </div>
                <div className="erp-stat-chip erp-stat-chip-won">
                    <span className="erp-stat-chip-label">Total Value</span>
                    <span className="erp-stat-chip-value">{money(totalValue)}</span>
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="erp-filter-select"
                    style={{ marginLeft: 'auto' }}
                >
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_COLORS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
            </div>

            {/* Orders Table */}
            <div className="erp-table-container">
                {orders.length === 0 ? (
                    <div className="erp-empty-state">
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                        <h3>No Purchase Orders</h3>
                        <p>Create your first purchase order to get started.</p>
                    </div>
                ) : (
                    <table className="erp-table responsive-table">
                        <thead>
                            <tr>
                                <th>PO Number</th>
                                <th>Vendor</th>
                                <th>Status</th>
                                <th>Items</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th>Expected</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const sc = STATUS_COLORS[order.status] || STATUS_COLORS.draft;
                                return (
                                    <tr key={order._id}>
                                        <td data-label="PO Number">
                                            <span style={{ fontWeight: 700, color: 'var(--secondary-color)', fontSize: 13 }}>{order.poNumber}</span>
                                        </td>
                                        <td data-label="Vendor">{order.vendorName}</td>
                                        <td data-label="Status">
                                            <span className="erp-status-badge" style={{ background: sc.bg, color: sc.text }}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td data-label="Items">{(order.lineItems || []).length}</td>
                                        <td data-label="Total" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--secondary-color)' }}>
                                            {money(order.grandTotal)}
                                        </td>
                                        <td data-label="Expected">
                                            {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('en-IN') : '-'}
                                        </td>
                                        <td data-label="Actions">
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {order.status === 'draft' && (
                                                    <>
                                                        <button onClick={() => openEdit(order)} className="erp-action-btn"><Pencil size={14} aria-hidden="true" /> </button>
                                                        <button onClick={() => handleStatusChange(order._id, 'confirmed')} className="erp-action-btn erp-action-btn-confirm" title="Confirm"><Check size={14} aria-hidden="true" /> </button>
                                                        <button onClick={() => handleDelete(order._id)} className="erp-action-btn erp-action-btn-del" title="Delete"><Trash2 size={14} aria-hidden="true" /> </button>
                                                    </>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button onClick={() => openReceiveModal(order)} className="erp-action-btn erp-action-btn-confirm" title="Mark Received">📦</button>
                                                )}
                                                {order.status === 'received' && (
                                                    <button onClick={() => handleStatusChange(order._id, 'billed')} className="erp-action-btn erp-action-btn-confirm" title="Mark Billed">🧾</button>
                                                )}
                                                {order.status === 'billed' && (
                                                    <button onClick={() => handleStatusChange(order._id, 'paid')} className="erp-action-btn erp-action-btn-confirm" title="Mark Paid">💰</button>
                                                )}
                                                {(order.status === 'draft' || order.status === 'confirmed') && (
                                                    <button onClick={() => handleStatusChange(order._id, 'cancelled')} className="erp-action-btn erp-action-btn-del" title="Cancel"><X size={14} aria-hidden="true" /> </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PO Form Modal */}
            {showForm && (
                <div className="erp-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="erp-modal erp-modal-wide" onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>{editOrder ? `Edit ${editOrder.poNumber}` : 'New Purchase Order'}</h2>
                            <button onClick={() => setShowForm(false)} className="erp-modal-close"><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <form onSubmit={handleSave} className="erp-lead-form">
                            <div className="erp-form-grid">
                                <label className="erp-form-field">
                                    <span>Vendor *</span>
                                    <select value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} required>
                                        <option value="">Select vendor…</option>
                                        {vendors.map(v => <option key={v._id} value={v._id}>{v.name}{v.company ? ` - ${v.company}` : ''}</option>)}
                                    </select>
                                </label>
                                <label className="erp-form-field">
                                    <span>Expected Date</span>
                                    <input type="date" value={form.expectedDate} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))} />
                                </label>
                            </div>

                            <label className="erp-form-field" style={{ marginTop: 12 }}>
                                <span>Shipping Address</span>
                                <input value={form.shippingAddress} onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))} />
                            </label>

                            {/* Line Items */}
                            <div style={{ marginTop: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--secondary-color)' }}>Line Items</span>
                                    <button type="button" onClick={addLineItem} className="erp-btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>
                                        + Add Item
                                    </button>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="erp-table erp-line-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>HSN</th>
                                                <th style={{ width: 70 }}>Qty</th>
                                                <th style={{ width: 70 }}>Unit</th>
                                                <th style={{ width: 100 }}>Unit Price</th>
                                                <th style={{ width: 70 }}>Tax %</th>
                                                <th style={{ width: 100, textAlign: 'right' }}>Total</th>
                                                <th style={{ width: 40 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.lineItems.map((item, i) => (
                                                <tr key={i}>
                                                    <td><input value={item.product} onChange={e => updateLineItem(i, 'product', e.target.value)} placeholder="Product name" className="erp-line-input" /></td>
                                                    <td><input value={item.hsnCode} onChange={e => updateLineItem(i, 'hsnCode', e.target.value)} placeholder="HSN" className="erp-line-input" style={{ width: 70 }} /></td>
                                                    <td><input type="number" onFocus={(e) => e.target.select()} value={item.qty} onChange={e => updateLineItem(i, 'qty', e.target.value)} className="erp-line-input" style={{ width: 60 }} /></td>
                                                    <td><input value={item.unit} onChange={e => updateLineItem(i, 'unit', e.target.value)} className="erp-line-input" style={{ width: 60 }} /></td>
                                                    <td><input type="number" onFocus={(e) => e.target.select()} value={item.unitPrice} onChange={e => updateLineItem(i, 'unitPrice', e.target.value)} className="erp-line-input" style={{ width: 90 }} /></td>
                                                    <td><input type="number" onFocus={(e) => e.target.select()} value={item.taxRate} onChange={e => updateLineItem(i, 'taxRate', e.target.value)} className="erp-line-input" style={{ width: 60 }} /></td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>
                                                        {money((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0))}
                                                    </td>
                                                    <td>
                                                        <button type="button" onClick={() => removeLineItem(i)} className="erp-action-btn erp-action-btn-del" style={{ padding: 4 }}><X size={14} aria-hidden="true" /> </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="erp-po-totals">
                                    <div className="erp-po-total-row">
                                        <span>Subtotal</span><span>{money(subtotal)}</span>
                                    </div>
                                    <div className="erp-po-total-row">
                                        <span>Tax</span><span>{money(taxTotal)}</span>
                                    </div>
                                    <div className="erp-po-total-row erp-po-total-grand">
                                        <span>Grand Total</span><span>{money(subtotal + taxTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            <label className="erp-form-field" style={{ marginTop: 12 }}>
                                <span>Notes</span>
                                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </label>

                            <div className="erp-form-actions">
                                <button type="button" onClick={() => setShowForm(false)} className="erp-btn-secondary">Cancel</button>
                                <button type="submit" className="erp-btn-primary">{editOrder ? 'Update PO' : 'Create PO'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {receivingOrder && (
                <div className="erp-modal-overlay" onClick={() => setReceivingOrder(null)}>
                    <div className="erp-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>Receive PO {receivingOrder.poNumber}</h2>
                            <button onClick={() => setReceivingOrder(null)} className="erp-modal-close"><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div style={{ padding: 24 }}>
                            <p style={{ fontSize: 13, color: '#6c757d', marginTop: 0 }}>
                                Line items matching an item in your Items catalog (by name) will be auto-stocked into the selected warehouse.
                            </p>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Receive Into Warehouse *</span>
                                <select value={receiveWarehouseId} onChange={e => setReceiveWarehouseId(e.target.value)} style={{ border: '1.5px solid #e2e0ea', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }}>
                                    <option value="">- Select warehouse -</option>
                                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                </select>
                                {warehouses.length === 0 && <span style={{ fontSize: 11, color: '#dc2626' }}>No warehouses yet - add one under Inventory first.</span>}
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #f0edf5' }}>
                            <button type="button" onClick={() => setReceivingOrder(null)} className="erp-btn-secondary">Cancel</button>
                            <button type="button" onClick={confirmReceive} className="erp-btn-primary"><Check size={14} aria-hidden="true" /> Confirm Received</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .erp-po { font-family: 'Inter', sans-serif; }
                .erp-po-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
                }
                .erp-po-title {
                    font-size: clamp(1.4rem, 3vw, 1.8rem); font-weight: 800;
                    color: var(--secondary-color); margin: 0 0 4px;
                }
                .erp-po-subtitle { color: #6c757d; font-size: 14px; margin: 0; }

                .erp-btn-primary {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: white;
                    border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600;
                    font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 4px 12px rgba(72,38,131,0.25);
                    display: inline-flex; align-items: center; gap: 6px;
                }
                .erp-btn-primary:hover {
                    background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(72,38,131,0.35);
                }
                .erp-btn-secondary {
                    background: var(--bg-light); color: var(--primary-color); border: 1.5px solid #e2e0ea;
                    padding: 10px 20px; border-radius: 10px; font-weight: 600;
                    font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: none;
                    transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
                }
                .erp-btn-secondary:hover { background: var(--accent-subtle); border-color: var(--primary-color); }

                .erp-stats-bar {
                    display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;
                }
                .erp-stat-chip {
                    background: var(--surface); border-radius: 10px; padding: 10px 16px;
                    display: flex; flex-direction: column; gap: 2px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #f0edf5;
                }
                .erp-stat-chip-label { font-size: 11px; color: #6c757d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; }
                .erp-stat-chip-value { font-size: 18px; font-weight: 800; color: var(--secondary-color); }
                .erp-stat-chip-won { border-left: 3px solid #10b981; }
                .erp-stat-chip-won .erp-stat-chip-value { color: #059669; }

                .erp-filter-select {
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 8px 14px;
                    font-size: 13px; font-family: inherit; outline: none; background: var(--surface);
                    cursor: pointer;
                }

                .erp-table-container {
                    background: var(--surface); border-radius: 12px; overflow: hidden;
                    border: 1px solid #f0edf5; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .erp-table {
                    width: 100%; border-collapse: collapse;
                }
                .erp-table th {
                    text-align: left; padding: 12px 14px; font-size: 11px;
                    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
                    color: #6c757d; background: var(--surface-sunken); border-bottom: 2px solid var(--border);
                }
                .erp-table td {
                    padding: 12px 14px; border-bottom: 1px solid var(--bg-light); font-size: 13px; color: #333;
                }
                .erp-table tr:hover td { background: var(--surface-sunken); }

                .erp-status-badge {
                    display: inline-block; padding: 4px 10px; border-radius: 20px;
                    font-size: 11px; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.04em;
                }

                .erp-action-btn {
                    background: none; border: 1px solid var(--border); padding: 6px 8px;
                    border-radius: 6px; cursor: pointer; font-size: 12px;
                    transition: all 0.15s; min-width: 32px; min-height: 32px;
                }
                .erp-action-btn:hover { background: var(--bg-light); border-color: #d8d0e8; }
                .erp-action-btn-confirm { border-color: #d1fae5; }
                .erp-action-btn-confirm:hover { background: var(--status-success-bg); border-color: #10b981; }
                .erp-action-btn-del:hover { background: var(--status-danger-bg); border-color: #fca5a5; }

                .erp-empty-state {
                    text-align: center; padding: 48px 24px; color: #6c757d;
                }
                .erp-empty-state h3 { color: var(--secondary-color); margin: 0 0 8px; font-size: 18px; }

                /* Modal */
                .erp-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; padding: 20px; backdrop-filter: blur(4px);
                }
                .erp-modal {
                    background: var(--surface); border-radius: 16px; width: 100%; max-width: 620px;
                    max-height: 90vh; overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(45,23,82,0.25);
                    animation: erp-modal-in 0.25s ease;
                }
                .erp-modal-wide { max-width: 860px; }
                @keyframes erp-modal-in {
                    from { opacity: 0; transform: translateY(20px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .erp-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px; border-bottom: 1px solid #f0edf5;
                }
                .erp-modal-header h2 { margin: 0; font-size: 18px; font-weight: 800; color: var(--secondary-color); }
                .erp-modal-close {
                    background: none; border: none; font-size: 18px; cursor: pointer;
                    color: #6c757d; width: 36px; height: 36px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                }
                .erp-modal-close:hover { background: var(--bg-light); color: var(--secondary-color); }

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
                    transition: border-color 0.2s; background: var(--surface-sunken);
                }
                .erp-form-field input:focus, .erp-form-field select:focus, .erp-form-field textarea:focus {
                    border-color: var(--primary-color); background: var(--surface);
                }
                .erp-form-actions {
                    display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;
                    padding-top: 16px; border-top: 1px solid #f0edf5;
                }

                /* Line Items */
                .erp-line-table th { padding: 8px 6px; font-size: 10px; }
                .erp-line-table td { padding: 6px; }
                .erp-line-input {
                    border: 1px solid #e2e0ea; border-radius: 6px; padding: 6px 8px;
                    font-size: 13px; font-family: inherit; outline: none; width: 100%;
                    background: var(--surface-sunken);
                }
                .erp-line-input:focus { border-color: var(--primary-color); background: var(--surface); }

                /* PO Totals */
                .erp-po-totals {
                    margin-top: 12px; display: flex; flex-direction: column;
                    align-items: flex-end; gap: 4px;
                }
                .erp-po-total-row {
                    display: flex; gap: 32px; font-size: 13px; color: #333;
                }
                .erp-po-total-row span:first-child { color: #6c757d; min-width: 80px; }
                .erp-po-total-row span:last-child { font-weight: 600; min-width: 100px; text-align: right; }
                .erp-po-total-grand {
                    font-size: 15px; font-weight: 800; color: var(--secondary-color); 
                    padding-top: 8px; border-top: 2px solid var(--border); margin-top: 4px;
                }
                .erp-po-total-grand span:last-child { color: var(--secondary-color); }

                @media (max-width: 768px) {
                    .erp-form-grid { grid-template-columns: 1fr; }
                    .erp-stats-bar { flex-direction: column; }
                    .erp-modal-wide { max-width: 100%; }
                    .erp-po-header { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}
