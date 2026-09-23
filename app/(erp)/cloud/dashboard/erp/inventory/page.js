'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import CsvImportButton from '@/components/cloud-app/CsvImportButton';
import { Pencil, Trash2, X } from 'lucide-react';

const MOVE_TYPE_LABELS = { in: '📥 Stock In', out: '📤 Stock Out', adjustment: '⚖️ Adjustment' };
const MOVE_TYPE_ALIASES = {
    in: 'in', stockin: 'in', 'stock in': 'in', receipt: 'in', purchase: 'in',
    out: 'out', stockout: 'out', 'stock out': 'out', sale: 'out', consumption: 'out',
    adjustment: 'adjustment', adjust: 'adjustment', correction: 'adjustment',
};

function getValueCaseInsensitive(row, keys) {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
        const match = rowKeys.find(k => k.trim().toLowerCase() === key);
        if (match && row[match] !== undefined && String(row[match]).trim() !== '') return row[match];
    }
    return '';
}

export default function InventoryPage() {
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState([]);
    const [items, setItems] = useState([]);
    const [stockLevels, setStockLevels] = useState([]);
    const [recentMoves, setRecentMoves] = useState([]);

    const [showWarehouseForm, setShowWarehouseForm] = useState(false);
    const [editWarehouseId, setEditWarehouseId] = useState(null);
    const [warehouseForm, setWarehouseForm] = useState({ name: '', address: '', isDefault: false });

    const [showMoveForm, setShowMoveForm] = useState(false);
    const [moveForm, setMoveForm] = useState({ itemId: '', warehouseId: '', type: 'in', qty: '', reference: '', notes: '' });

    // CSV import state
    const fileInputRef = useRef(null);
    const [csvRows, setCsvRows] = useState([]);
    const [showCsvPreview, setShowCsvPreview] = useState(false);
    const [importingCsv, setImportingCsv] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [whRes, itemsRes, stockRes] = await Promise.all([
                fetch('/api/cloud/erp/inventory/warehouses').then(r => r.json()),
                fetch('/api/cloud/items').then(r => r.json()),
                fetch('/api/cloud/erp/inventory/stock').then(r => r.json()),
            ]);
            setWarehouses(whRes.warehouses || []);
            setItems(itemsRes.items || []);
            setStockLevels(stockRes.stockLevels || []);
            setRecentMoves(stockRes.recentMoves || []);
        } catch {
            toast.error('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    function openNewWarehouse() {
        setEditWarehouseId(null);
        // Auto-check "default" when it's the very first warehouse - there's no
        // meaningful choice yet, and leaving it unchecked just adds a click tenants
        // immediately have to undo.
        setWarehouseForm({ name: '', address: '', isDefault: warehouses.length === 0 });
        setShowWarehouseForm(true);
    }

    function openEditWarehouse(w) {
        setEditWarehouseId(w._id);
        setWarehouseForm({ name: w.name || '', address: w.address || '', isDefault: !!w.isDefault });
        setShowWarehouseForm(true);
    }

    async function handleSaveWarehouse(e) {
        e.preventDefault();
        if (!warehouseForm.name.trim()) return toast.error('Warehouse name is required.');
        try {
            const url = editWarehouseId ? `/api/cloud/erp/inventory/warehouses/${editWarehouseId}` : '/api/cloud/erp/inventory/warehouses';
            const method = editWarehouseId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(warehouseForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(editWarehouseId ? 'Warehouse updated!' : 'Warehouse added!');
            setShowWarehouseForm(false);
            setEditWarehouseId(null);
            setWarehouseForm({ name: '', address: '', isDefault: false });
            loadAll();
        } catch (err) { toast.error(err.message || 'Failed to save warehouse.'); }
    }

    async function handleDeleteWarehouse(id) {
        if (!confirm('Delete this warehouse?')) return;
        try {
            const res = await fetch(`/api/cloud/erp/inventory/warehouses/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Warehouse deleted.');
            loadAll();
        } catch (err) { toast.error(err.message || 'Failed to delete warehouse.'); }
    }

    async function handleRecordMove(e) {
        e.preventDefault();
        if (!moveForm.itemId) return toast.error('Select an item.');
        if (!moveForm.warehouseId) return toast.error('Select a warehouse.');
        if (!moveForm.qty || Number(moveForm.qty) === 0) return toast.error('Enter a non-zero quantity.');
        try {
            const res = await fetch('/api/cloud/erp/inventory/stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...moveForm, qty: Number(moveForm.qty) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Stock move ${data.moveNumber} recorded!`);
            setShowMoveForm(false);
            setMoveForm({ itemId: '', warehouseId: '', type: 'in', qty: '', reference: '', notes: '' });
            loadAll();
        } catch (err) { toast.error(err.message || 'Failed to record stock move.'); }
    }

    // ─── CSV Import ─────────────────────────────────────────────────────────
    function resolveItem(nameOrSku) {
        const needle = String(nameOrSku || '').trim().toLowerCase();
        if (!needle) return null;
        return items.find(i => i.name?.toLowerCase() === needle || i.sku?.toLowerCase() === needle) || null;
    }

    function resolveWarehouse(name) {
        const needle = String(name || '').trim().toLowerCase();
        if (!needle) return null;
        return warehouses.find(w => w.name?.toLowerCase() === needle) || null;
    }

    function handleCsvUpload(file) {
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete({ data }) {
                if (!data.length) { toast.error('CSV file is empty.'); return; }

                const parsed = data.map(row => {
                    const itemText = getValueCaseInsensitive(row, ['item', 'item name', 'product', 'product name', 'sku']);
                    const warehouseText = getValueCaseInsensitive(row, ['warehouse', 'warehouse name', 'location']);
                    const rawType = String(getValueCaseInsensitive(row, ['type', 'move type', 'movement'])).trim().toLowerCase();
                    const rawQty = getValueCaseInsensitive(row, ['qty', 'quantity']);
                    const reference = getValueCaseInsensitive(row, ['reference', 'ref', 'ref no', 'reference no']);
                    const notes = getValueCaseInsensitive(row, ['notes', 'note', 'remarks']);

                    const matchedItem = resolveItem(itemText);
                    const matchedWarehouse = resolveWarehouse(warehouseText);
                    const type = MOVE_TYPE_ALIASES[rawType] || null;
                    const qty = parseFloat(String(rawQty).replace(/[^0-9.-]/g, ''));

                    const errors = [];
                    if (!matchedItem) errors.push(`Item "${itemText}" not found`);
                    if (!matchedWarehouse) errors.push(`Warehouse "${warehouseText}" not found`);
                    if (!type) errors.push(`Type "${rawType}" must be in/out/adjustment`);
                    if (!Number.isFinite(qty) || qty === 0) errors.push('Quantity must be non-zero');
                    if (type && type !== 'adjustment' && qty < 0) errors.push('Quantity must be positive for in/out');

                    return {
                        itemText, warehouseText, type: type || rawType, qty,
                        reference, notes,
                        itemId: matchedItem?.itemId || null,
                        itemName: matchedItem?.name || null,
                        warehouseId: matchedWarehouse?._id || null,
                        warehouseName: matchedWarehouse?.name || null,
                        valid: errors.length === 0,
                        errors,
                    };
                });

                setCsvRows(parsed);
                setShowCsvPreview(true);
                const validCount = parsed.filter(r => r.valid).length;
                toast.success(`Parsed ${parsed.length} rows - ${validCount} ready to import. Review before uploading.`);
            },
            error: err => toast.error('CSV parse error: ' + err.message),
        });
    }

    async function commitCsvImport() {
        const validRows = csvRows.filter(r => r.valid);
        if (validRows.length === 0) return toast.error('No valid rows to import.');
        setImportingCsv(true);
        try {
            const res = await fetch('/api/cloud/erp/inventory/stock/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moves: validRows }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Imported ${data.count} stock move${data.count === 1 ? '' : 's'}!${data.skipped ? ` (${data.skipped} skipped)` : ''}`);
            setShowCsvPreview(false);
            setCsvRows([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadAll();
        } catch (err) {
            toast.error(err.message || 'Bulk import failed.');
        } finally {
            setImportingCsv(false);
        }
    }

    function closeCsvPreview() {
        setShowCsvPreview(false);
        setCsvRows([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    if (loading) {
        return <SkeletonPage stats={2} rows={6} cols={5} />;
    }

    return (
        <div>
            <div className="erp-inv-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>📦 Inventory</h1>
                    <p style={{ fontSize: 13, color: '#6c757d', margin: '4px 0 0' }}>Warehouses, stock levels, and stock movement history.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={openNewWarehouse} style={btnSecondary}>+ Warehouse</button>
                    <CsvImportButton
                        columns={['item', 'warehouse', 'type', 'qty', 'reference', 'notes']}
                        sampleRow={{ item: 'Surgical Gloves (Box of 100)', warehouse: 'Main Warehouse', type: 'in', qty: 50, reference: 'PO-1024', notes: 'Initial stock' }}
                        filename="stock-moves-sample.csv"
                        onFile={handleCsvUpload}
                        disabled={!warehouses.length || !items.length}
                    />
                    <button onClick={() => setShowMoveForm(true)} style={btnPrimary} disabled={!warehouses.length || !items.length}>+ Record Stock Move</button>
                </div>
            </div>

            {(!warehouses.length || !items.length) && (
                <div className="erp-empty-state" style={{ marginBottom: 20 }}>
                    {!warehouses.length && <p>Add a warehouse to start tracking stock.</p>}
                    {!items.length && <p>Add items under <strong>Items</strong> before recording stock moves.</p>}
                </div>
            )}

            {/* Warehouses */}
            <section style={{ marginBottom: 24 }}>
                <h2 style={sectionHeading}>Warehouses</h2>
                {warehouses.length === 0 ? (
                    <div className="erp-empty-state"><h3>No warehouses yet</h3><p>Add your first warehouse to begin tracking stock.</p></div>
                ) : (
                    <div className="erp-inv-warehouse-grid">
                        {warehouses.map(w => (
                            <div key={w._id} className="erp-vendor-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--secondary-color)' }}>{w.name}</div>
                                        {w.address && <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>{w.address}</div>}
                                    </div>
                                    {w.isDefault && <span className="erp-vendor-badge">Default</span>}
                                </div>
                                <div className="erp-vendor-card-actions">
                                    <button className="erp-action-btn" onClick={() => openEditWarehouse(w)}><Pencil size={14} aria-hidden="true" /> Edit</button>
                                    <button className="erp-action-btn erp-action-btn-del" onClick={() => handleDeleteWarehouse(w._id)}><Trash2 size={14} aria-hidden="true" /> Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Stock Levels */}
            <section style={{ marginBottom: 24 }}>
                <h2 style={sectionHeading}>Stock on Hand</h2>
                <div style={{ overflowX: 'auto', background: 'var(--bg-white)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                                <th style={thStyle}>Item</th>
                                <th style={thStyle}>SKU</th>
                                <th style={thStyle}>Warehouse</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Qty on Hand</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockLevels.length === 0 && (
                                <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No stock recorded yet.</td></tr>
                            )}
                            {stockLevels.map((l, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={tdStyle}>{l.itemName}</td>
                                    <td style={tdStyle}>{l.sku || '-'}</td>
                                    <td style={tdStyle}>{l.warehouseName}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: l.qty < 0 ? '#dc2626' : 'var(--secondary-color)' }}>
                                        {l.qty} {l.unit}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Recent Moves */}
            <section>
                <h2 style={sectionHeading}>Recent Stock Moves</h2>
                <div style={{ overflowX: 'auto', background: 'var(--bg-white)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 620 }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                                <th style={thStyle}>Move #</th>
                                <th style={thStyle}>Item</th>
                                <th style={thStyle}>Warehouse</th>
                                <th style={thStyle}>Type</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                                <th style={thStyle}>Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentMoves.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No stock moves recorded yet.</td></tr>
                            )}
                            {recentMoves.map(m => (
                                <tr key={m._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={tdStyle}><code style={{ background: '#f3f0f7', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: 'var(--primary-light)' }}>{m.moveNumber}</code></td>
                                    <td style={tdStyle}>{m.itemName}</td>
                                    <td style={tdStyle}>{m.warehouseName}</td>
                                    <td style={tdStyle}>{MOVE_TYPE_LABELS[m.type] || m.type}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>{m.qty}</td>
                                    <td style={tdStyle}>
                                        {m.linkedDocId ? (
                                            <a href={`/api/cloud/documents/${m.linkedDocId}/pdf`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textDecoration: 'none' }}>
                                                🧾 {m.reference}
                                            </a>
                                        ) : (m.reference || '-')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Add Warehouse Modal */}
            {showWarehouseForm && (
                <div className="erp-modal-overlay" onClick={() => setShowWarehouseForm(false)}>
                    <div className="erp-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>{editWarehouseId ? 'Edit Warehouse' : 'New Warehouse'}</h2>
                            <button className="erp-modal-close" onClick={() => setShowWarehouseForm(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <form id="warehouse-form" onSubmit={handleSaveWarehouse} className="erp-lead-form">
                                <label className="erp-form-field">
                                    <span>Warehouse Name *</span>
                                    <input value={warehouseForm.name} onChange={e => setWarehouseForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Main Warehouse" />
                                </label>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Address</span>
                                    <textarea rows={2} value={warehouseForm.address} onChange={e => setWarehouseForm(p => ({ ...p, address: e.target.value }))} />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: 'var(--text-main)', cursor: warehouseForm.isDefault && warehouses.length <= 1 ? 'not-allowed' : 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={warehouseForm.isDefault}
                                        disabled={warehouseForm.isDefault && editWarehouseId && warehouses.length <= 1}
                                        onChange={e => setWarehouseForm(p => ({ ...p, isDefault: e.target.checked }))}
                                    />
                                    Set as default warehouse
                                </label>
                                {warehouseForm.isDefault && editWarehouseId && warehouses.length <= 1 && (
                                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Your only warehouse must stay the default.</p>
                                )}
                                {!warehouseForm.isDefault && (
                                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>The default warehouse is pre-selected on new stock moves and purchase-order receipts - set it to wherever most of your stock actually sits.</p>
                                )}
                            </form>
                        </div>
                        <div className="erp-modal-footer">
                            <button type="button" onClick={() => setShowWarehouseForm(false)} style={btnSecondary}>Cancel</button>
                            <button type="submit" form="warehouse-form" style={btnPrimary}>{editWarehouseId ? 'Save Changes' : 'Save Warehouse'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Stock Move Modal */}
            {showMoveForm && (
                <div className="erp-modal-overlay" onClick={() => setShowMoveForm(false)}>
                    <div className="erp-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>Record Stock Move</h2>
                            <button className="erp-modal-close" onClick={() => setShowMoveForm(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <form id="move-form" onSubmit={handleRecordMove} className="erp-lead-form">
                                <div className="erp-form-grid">
                                    <label className="erp-form-field">
                                        <span>Item *</span>
                                        <select value={moveForm.itemId} onChange={e => setMoveForm(p => ({ ...p, itemId: e.target.value }))}>
                                            <option value="">Select item…</option>
                                            {items.map(i => <option key={i.itemId} value={i.itemId}>{i.name} {i.sku ? `(${i.sku})` : ''}</option>)}
                                        </select>
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Warehouse *</span>
                                        <select value={moveForm.warehouseId} onChange={e => setMoveForm(p => ({ ...p, warehouseId: e.target.value }))}>
                                            <option value="">Select warehouse…</option>
                                            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                        </select>
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Move Type *</span>
                                        <select value={moveForm.type} onChange={e => setMoveForm(p => ({ ...p, type: e.target.value }))}>
                                            <option value="in">📥 Stock In</option>
                                            <option value="out">📤 Stock Out</option>
                                            <option value="adjustment">⚖️ Adjustment (+/-)</option>
                                        </select>
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Quantity *</span>
                                        <input type="number" onFocus={(e) => e.target.select()} step="any" value={moveForm.qty} onChange={e => setMoveForm(p => ({ ...p, qty: e.target.value }))} placeholder={moveForm.type === 'adjustment' ? 'e.g. -5 or 5' : 'e.g. 10'} />
                                    </label>
                                </div>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Reference (PO #, Invoice #, etc.)</span>
                                    <input value={moveForm.reference} onChange={e => setMoveForm(p => ({ ...p, reference: e.target.value }))} />
                                </label>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Notes</span>
                                    <textarea rows={2} value={moveForm.notes} onChange={e => setMoveForm(p => ({ ...p, notes: e.target.value }))} />
                                </label>
                            </form>
                        </div>
                        <div className="erp-modal-footer">
                            <button type="button" onClick={() => setShowMoveForm(false)} style={btnSecondary}>Cancel</button>
                            <button type="submit" form="move-form" style={btnPrimary}>Record Move</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Import Preview Modal */}
            {showCsvPreview && (
                <div className="erp-modal-overlay" onClick={closeCsvPreview}>
                    <div className="erp-modal" style={{ maxWidth: 820 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>📋 Stock Move Import Preview ({csvRows.length} rows, {csvRows.filter(r => r.valid).length} valid)</h2>
                            <button className="erp-modal-close" onClick={closeCsvPreview}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-sunken)', borderBottom: '2px solid #cbd5e1' }}>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Item</th>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Warehouse</th>
                                        <th style={{ padding: 8, textAlign: 'center' }}>Type</th>
                                        <th style={{ padding: 8, textAlign: 'right' }}>Qty</th>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvRows.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: row.valid ? 'transparent' : '#fef2f2' }}>
                                            <td style={{ padding: 8 }}>{row.itemName || row.itemText}</td>
                                            <td style={{ padding: 8 }}>{row.warehouseName || row.warehouseText}</td>
                                            <td style={{ padding: 8, textAlign: 'center' }}>{MOVE_TYPE_LABELS[row.type] || row.type}</td>
                                            <td style={{ padding: 8, textAlign: 'right' }}>{row.qty}</td>
                                            <td style={{ padding: 8, color: row.valid ? '#166534' : '#991b1b', fontSize: 12 }}>
                                                {row.valid ? '✓ Ready' : row.errors.join('; ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="erp-modal-footer">
                            <button onClick={closeCsvPreview} style={btnSecondary}>Cancel</button>
                            <button onClick={commitCsvImport} disabled={importingCsv || csvRows.every(r => !r.valid)} style={{ ...btnPrimary, background: '#16a34a' }}>
                                {importingCsv ? 'Importing…' : `Import ${csvRows.filter(r => r.valid).length} Move${csvRows.filter(r => r.valid).length === 1 ? '' : 's'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .erp-inv-warehouse-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 16px;
                }
                .erp-vendor-card {
                    background: var(--surface); border-radius: 12px; padding: 20px;
                    border: 1px solid #f0edf5; transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .erp-vendor-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(72,38,131,0.12); border-color: #d8d0e8; }
                .erp-vendor-badge {
                    display: inline-block; background: var(--accent-subtle); color: #6d28d9;
                    padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
                }
                .erp-vendor-card-actions { display: flex; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--bg-light); }
                .erp-action-btn {
                    background: none; border: 1px solid var(--border); padding: 6px 12px;
                    border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit;
                    transition: all 0.15s; min-height: 32px;
                }
                .erp-action-btn-del:hover { background: var(--status-danger-bg); border-color: #fca5a5; }

                .erp-empty-state { text-align: center; padding: 32px 24px; color: #6c757d; background: var(--surface); border-radius: 12px; border: 1px solid #f0edf5; }
                .erp-empty-state h3 { color: var(--secondary-color); margin: 0 0 8px; }

                /* Modal: fixed header + fixed footer, only the body scrolls - avoids the
                   whole-dialog scroll that made short forms feel oddly cut off / jumpy. */
                .erp-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; padding: 20px; backdrop-filter: blur(4px);
                }
                .erp-modal {
                    background: var(--surface); border-radius: 16px; width: 100%;
                    max-height: min(88vh, 88dvh);
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 20px 60px rgba(45,23,82,0.25);
                }
                .erp-modal-header {
                    flex: 0 0 auto;
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px; border-bottom: 1px solid #f0edf5;
                }
                .erp-modal-header h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--secondary-color); }
                .erp-modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6c757d; width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; }
                .erp-modal-close:hover { background: var(--bg-light); color: var(--secondary-color); }
                .erp-modal-body { flex: 1 1 auto; overflow-y: auto; min-height: 0; }
                .erp-modal-footer {
                    flex: 0 0 auto;
                    display: flex; gap: 12px; justify-content: flex-end;
                    padding: 16px 24px; border-top: 1px solid #f0edf5;
                }
                .erp-lead-form { padding: 24px; }
                .erp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
                .erp-form-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
                .erp-form-field span { font-size: 12px; font-weight: 600; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.04em; }
                .erp-form-field input, .erp-form-field select, .erp-form-field textarea {
                    width: 100%; box-sizing: border-box; min-width: 0;
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 10px 12px;
                    font-size: 14px; font-family: inherit; outline: none;
                    transition: border-color 0.2s; background: var(--surface-sunken); min-height: 40px;
                }
                .erp-form-field input:focus, .erp-form-field select:focus, .erp-form-field textarea:focus { border-color: var(--primary-color); background: var(--surface); }

                @media (max-width: 768px) {
                    .erp-form-grid { grid-template-columns: 1fr; }
                    .erp-inv-warehouse-grid { grid-template-columns: 1fr; }
                    .erp-inv-header { flex-direction: column; align-items: stretch; }
                    .erp-inv-header > div:last-child { display: flex; flex-direction: column; }
                    .erp-modal { max-height: 100dvh; border-radius: 0; }
                    .erp-modal-overlay { padding: 0; }
                }
            `}</style>
        </div>
    );
}

const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const sectionHeading = { fontSize: 15, fontWeight: 800, color: 'var(--secondary-color)', marginBottom: 12 };
const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--secondary-color)', borderBottom: '2px solid var(--border)' };
const tdStyle = { padding: '12px 14px', color: 'var(--text-main)' };
