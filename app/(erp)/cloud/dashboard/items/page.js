'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Papa from 'papaparse';
import InventoryPanel from '@/app/(erp)/cloud/dashboard/erp/inventory/page';
import { SkeletonPage } from '@/components/ui/skeleton';
import CsvImportButton from '@/components/cloud-app/CsvImportButton';
import { Pencil, Trash2, X } from 'lucide-react';

const UNITS = ['Nos', 'Pcs', 'Box', 'Set', 'Pack', 'Dozen', 'Carton', 'Roll', 'Kg', 'Litre', 'Metre'];

// Items (the catalog) and Inventory (stock levels per warehouse) are still
// separate collections - inventory only applies to stock-tracked goods, not
// services - but they're the same mental model to the user ("my products"):
// add a product here, then either raise a quote/invoice against it directly,
// or track its stock below and raise the quote/invoice once it's in inventory.
// Both sections live on one page (Items first, Inventory below) instead of
// behind a tab click, so that flow reads as one continuous page, not two
// separate tools.
export default function CloudItemsPage() {
    return (
        <div>
            <ItemsPanel />
            <div className="cd-section-divider">
                <span>🏬 Inventory</span>
            </div>
            <InventoryPanel />
            <style>{`
                .cd-section-divider {
                    display: flex; align-items: center; gap: 10px;
                    margin: 36px 0 20px; font-size: 15px; font-weight: 800;
                    color: var(--secondary-color);
                }
                .cd-section-divider::after {
                    content: ''; flex: 1; height: 2px; background: var(--accent-subtle);
                }
            `}</style>
        </div>
    );
}

function ItemsPanel() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', sku: '', hsnCode: '', unit: 'Nos', defaultUnitPrice: '', taxRate: '18', costPrice: '', stockCount: '' });

    // CSV states
    const [csvData, setCsvData] = useState([]);
    const [showCsvPreview, setShowCsvPreview] = useState(false);
    const [importingCsv, setImportingCsv] = useState(false);
    const fileInputRef = useRef(null);

    function loadItems() {
        fetch('/api/cloud/items').then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false));
    }

    useEffect(() => {
        loadItems();
    }, []);

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
        setForm({ name: '', sku: '', hsnCode: '', unit: 'Nos', defaultUnitPrice: '', taxRate: '18', costPrice: '', stockCount: '' });
        triggerForm(false);
    }

    function startEdit(item) {
        setForm({ name: item.name || '', sku: item.sku || '', hsnCode: item.hsnCode || '', unit: item.unit || 'Nos', defaultUnitPrice: String(item.defaultUnitPrice || ''), taxRate: String(item.taxRate || '18'), costPrice: String(item.costPrice || ''), stockCount: String(item.stockCount || '') });
        setEditId(item._id);
        triggerForm(true, true);
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Product name is required.'); return; }
        setSaving(true);
        try {
            const payload = { ...form, defaultUnitPrice: parseFloat(form.defaultUnitPrice) || 0, taxRate: parseFloat(form.taxRate) || 18, costPrice: parseFloat(form.costPrice) || 0, stockCount: parseInt(form.stockCount) || 0 };
            const url = editId ? `/api/cloud/items/${editId}` : '/api/cloud/items';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Save failed.'); return; }
            toast.success(editId ? 'Product updated!' : 'Product added!');
            resetForm(); loadItems();
        } catch { toast.error('Network error.'); }
        finally { setSaving(false); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this product?')) return;
        try {
            const res = await fetch(`/api/cloud/items/${id}`, { method: 'DELETE' });
            if (!res.ok) { toast.error('Delete failed.'); return; }
            toast.success('Product deleted.');
            loadItems();
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

    function parseNum(val) {
        if (val === undefined || val === null) return 0;
        const str = String(val).replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(str);
        return isNaN(parsed) ? 0 : parsed;
    }

    // CSV parsing triggers
    function handleCsvUpload(file) {
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete({ data }) {
                if (!data.length) { toast.error('CSV file is empty.'); return; }
                
                // Normalise and validate columns (only name is mandatory)
                const parsed = data.map(row => {
                    const name = getValueCaseInsensitive(row, ['name', 'product', 'item', 'product name', 'item name', 'title']);
                    const sku = getValueCaseInsensitive(row, ['sku', 'sku code', 'code', 'part number', 'partno']);
                    const hsnCode = getValueCaseInsensitive(row, ['hsn', 'hsn code', 'hsn/sac', 'sac', 'hsncode']);
                    const unit = getValueCaseInsensitive(row, ['unit', 'units', 'uom']) || 'Nos';
                    const rawPrice = getValueCaseInsensitive(row, ['price', 'default unit price', 'unit price', 'rate', 'unitprice', 'mrp']);
                    const rawTax = getValueCaseInsensitive(row, ['tax', 'tax rate', 'tax %', 'taxrate', 'gst', 'gst %', 'gst rate']);
                    const rawCost = getValueCaseInsensitive(row, ['cost', 'cost price', 'costprice', 'purchase price', 'purchaseprice']);
                    const rawStock = getValueCaseInsensitive(row, ['stock', 'qty', 'quantity', 'stock count', 'stockcount', 'count']);

                    const mapped = {
                        name: String(name || '').trim(),
                        sku: String(sku || '').trim(),
                        hsnCode: String(hsnCode || '').trim(),
                        unit: String(unit || '').trim(),
                        defaultUnitPrice: parseNum(rawPrice),
                        taxRate: rawTax ? parseNum(rawTax) : 18,
                        costPrice: rawCost ? parseNum(rawCost) : 0,
                        stockCount: Math.round(parseNum(rawStock)),
                    };
                    return mapped;
                }).filter(row => row.name.trim() !== '');

                if (parsed.length === 0) {
                    toast.error("No valid products found. Column 'name' is mandatory.");
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                setCsvData(parsed);
                setShowCsvPreview(true);
                toast.success(`Parsed ${parsed.length} products. Review the list before uploading.`);
            },
            error: err => toast.error('CSV parse error: ' + err.message)
        });
    }

    async function commitCsvImport() {
        setImportingCsv(true);
        try {
            const res = await fetch('/api/cloud/items/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: csvData })
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || 'Bulk upload failed.'); return; }
            
            toast.success(`Successfully imported ${data.count} products!`);
            setShowCsvPreview(false);
            setCsvData([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadItems();
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
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Products</span>
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>📦 Products Inventory</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Manage your product catalog, pricing, and stock details.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <CsvImportButton
                        columns={['name', 'sku', 'hsnCode', 'unit', 'defaultUnitPrice', 'taxRate', 'costPrice', 'stockCount']}
                        sampleRow={{ name: 'Surgical Gloves (Box of 100)', sku: 'SG-100', hsnCode: '4015', unit: 'Box', defaultUnitPrice: 450, taxRate: 12, costPrice: 300, stockCount: 200 }}
                        filename="items-sample.csv"
                        onFile={handleCsvUpload}
                    />
                    <button onClick={() => { resetForm(); triggerForm(true); }} style={btnPrimary}>+ Add Product</button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--secondary-color)', marginBottom: '16px' }}>{editId ? 'Edit Product' : 'Add New Product'}</h3>
                    <form onSubmit={handleSave} className="responsive-form responsive-form-3" style={{ gap: '14px' }}>
                        <div className="full-width">
                            <label style={labelStyle}>Product Name *</label>
                            <input style={inputStyle} placeholder="e.g. Industrial Centrifugal Pump" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>SKU Code</label>
                            <input style={inputStyle} placeholder="SKU-001" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>HSN Code</label>
                            <input style={inputStyle} placeholder="84137010" value={form.hsnCode} onChange={e => setForm(p => ({ ...p, hsnCode: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Unit</label>
                            <select style={inputStyle} value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Default Unit Price (₹)</label>
                            <input type="number" onFocus={(e) => e.target.select()} step="0.01" style={inputStyle} placeholder="0.00" value={form.defaultUnitPrice} onChange={e => setForm(p => ({ ...p, defaultUnitPrice: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Tax Rate (%)</label>
                            <input type="number" onFocus={(e) => e.target.select()} step="0.5" style={inputStyle} placeholder="18" value={form.taxRate} onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Cost Price (₹)</label>
                            <input type="number" onFocus={(e) => e.target.select()} step="0.01" style={inputStyle} placeholder="0.00" value={form.costPrice} onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))} />
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Optional - enables margin analytics</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Stock Count</label>
                            <input type="number" onFocus={(e) => e.target.select()} style={inputStyle} placeholder="0" value={form.stockCount} onChange={e => setForm(p => ({ ...p, stockCount: e.target.value }))} />
                        </div>
                        <div className="full-width" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : (editId ? 'Update Product' : 'Add Product')}</button>
                            <button type="button" onClick={resetForm} style={btnSecondary}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Products Table */}
            <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                                <th style={thStyle}>Product Name</th>
                                <th style={thStyle}>SKU</th>
                                <th style={thStyle}>HSN</th>
                                <th style={thStyle}>Unit</th>
                                <th style={thStyle}>Price (₹)</th>
                                <th style={thStyle}>Stock</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No products yet. Add your first product or import a CSV!</td></tr>
                            )}
                            {items.map((item, i) => (
                                <tr key={item._id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td data-label="Product Name" style={tdStyle}><strong style={{ color: 'var(--secondary-color)' }}>{item.name}</strong></td>
                                    <td data-label="SKU" style={tdStyle}><code style={{ fontSize: '12px', color: 'var(--primary-light)' }}>{item.sku || '-'}</code></td>
                                    <td data-label="HSN" style={tdStyle}><span style={{ fontFamily: 'monospace' }}>{item.hsnCode || '-'}</span></td>
                                    <td data-label="Unit" style={tdStyle}>{item.unit}</td>
                                    <td data-label="Price" style={tdStyle}>{(item.defaultUnitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td data-label="Stock" style={tdStyle}>{item.stockCount || 0}</td>
                                    <td data-label="Actions" style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => startEdit(item)} style={btnSmall}><Pencil size={14} aria-hidden="true" /> Edit</button>
                                            <button onClick={() => handleDelete(item._id)} style={{ ...btnSmall, background: 'var(--status-danger-bg)', color: '#991b1b' }}><Trash2 size={14} aria-hidden="true" /> </button>
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
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--secondary-color)' }}>📋 CSV Import Preview ({csvData.length} Products)</h3>
                            <button onClick={() => { setShowCsvPreview(false); setCsvData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-sunken)', borderBottom: '2px solid #cbd5e1' }}>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Product Name</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>HSN</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>Unit</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Price (₹)</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvData.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '8px', fontWeight: 600 }}>{row.name}</td>
                                            <td style={{ padding: '8px' }}><code>{row.sku || '-'}</code></td>
                                            <td style={{ padding: '8px' }}>{row.hsnCode || '-'}</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>{row.unit}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{row.defaultUnitPrice.toFixed(2)}</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>{row.stockCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '16px 24px', background: 'var(--surface-sunken)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => { setShowCsvPreview(false); setCsvData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={btnSecondary}>Cancel</button>
                            <button onClick={commitCsvImport} disabled={importingCsv} style={{ ...btnPrimary, background: '#16a34a' }}>
                                {importingCsv ? 'Importing…' : `Import ${csvData.length} Products`}
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
