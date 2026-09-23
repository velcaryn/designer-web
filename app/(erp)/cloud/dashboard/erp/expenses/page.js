'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Trash2, X } from 'lucide-react';

const STATUS_COLORS = {
    draft: { bg: '#f3f4f6', color: 'var(--text-muted)' },
    submitted: { bg: 'var(--status-info-bg)', color: 'var(--status-info-fg)' },
    approved: { bg: 'var(--status-success-bg)', color: 'var(--status-success-fg)' },
    rejected: { bg: 'var(--status-danger-bg)', color: 'var(--status-danger-fg)' },
    paid: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
};

const NEXT_ACTIONS = {
    draft: [{ label: 'Submit for Approval', to: 'submitted' }],
    submitted: [{ label: '✓ Approve', to: 'approved' }, { label: '✕ Reject', to: 'rejected' }],
    approved: [{ label: '💸 Mark Paid', to: 'paid' }],
    rejected: [{ label: '↺ Move back to Draft', to: 'draft' }],
    paid: [],
};

function money(n) {
    return (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ExpensesPage() {
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryName, setCategoryName] = useState('');

    const emptyForm = () => ({ employeeName: '', category: '', amount: '', date: '', receiptUrl: '', notes: '' });
    const [form, setForm] = useState(emptyForm());

    const loadExpenses = useCallback(async () => {
        try {
            const q = statusFilter ? `?status=${statusFilter}` : '';
            const res = await fetch(`/api/cloud/erp/expenses${q}`);
            const data = await res.json();
            setExpenses(data.expenses || []);
        } catch { toast.error('Failed to load expenses'); }
        finally { setLoading(false); }
    }, [statusFilter]);

    const loadCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/expenses/categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch { /* non-fatal */ }
    }, []);

    useEffect(() => { loadExpenses(); }, [loadExpenses]);
    useEffect(() => { loadCategories(); }, [loadCategories]);

    async function handleSave(e) {
        e.preventDefault();
        if (!form.employeeName.trim()) return toast.error('Employee / claimant name is required.');
        if (!form.category) return toast.error('Select a category.');
        if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount.');

        try {
            const res = await fetch('/api/cloud/erp/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: Number(form.amount) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Expense ${data.expenseNumber} created!`);
            setShowForm(false);
            setForm(emptyForm());
            loadExpenses();
        } catch (err) { toast.error(err.message || 'Failed to create expense.'); }
    }

    async function handleTransition(expense, to) {
        try {
            const res = await fetch(`/api/cloud/erp/expenses/${expense._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: to }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${expense.expenseNumber} moved to "${to}"`);
            loadExpenses();
        } catch (err) { toast.error(err.message || 'Failed to update status.'); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this draft expense?')) return;
        try {
            const res = await fetch(`/api/cloud/erp/expenses/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Expense deleted.');
            loadExpenses();
        } catch (err) { toast.error(err.message || 'Failed to delete.'); }
    }

    async function handleAddCategory(e) {
        e.preventDefault();
        if (!categoryName.trim()) return toast.error('Category name is required.');
        try {
            const res = await fetch('/api/cloud/erp/expenses/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: categoryName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Category added!');
            setCategoryName('');
            setShowCategoryForm(false);
            loadCategories();
        } catch (err) { toast.error(err.message || 'Failed to add category.'); }
    }

    if (loading) {
        return <SkeletonPage stats={3} rows={6} cols={5} />;
    }

    return (
        <div>
            <div className="erp-exp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>🧾 Expenses</h1>
                    <p style={{ fontSize: 13, color: '#6c757d', margin: '4px 0 0' }}>Employee expense claims with a draft → submitted → approved/rejected → paid workflow.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => setShowCategoryForm(true)} style={btnSecondary}>+ Category</button>
                    <button onClick={() => setShowForm(true)} style={btnPrimary}>+ New Expense</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {['', 'draft', 'submitted', 'approved', 'rejected', 'paid'].map(s => (
                    <button
                        key={s || 'all'} onClick={() => setStatusFilter(s)}
                        style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                            border: '1.5px solid', borderColor: statusFilter === s ? 'var(--primary-color)' : '#e2e0ea',
                            background: statusFilter === s ? 'var(--primary-color)' : 'var(--surface)',
                            color: statusFilter === s ? '#fff' : 'var(--text-secondary)', textTransform: 'capitalize',
                        }}
                    >
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {expenses.length === 0 ? (
                <div className="erp-empty-state"><h3>No expense claims yet</h3><p>Create one to start tracking employee expenses.</p></div>
            ) : (
                <div className="erp-exp-grid">
                    {expenses.map(exp => {
                        const sc = STATUS_COLORS[exp.status] || STATUS_COLORS.draft;
                        const actions = NEXT_ACTIONS[exp.status] || [];
                        return (
                            <div key={exp._id} className="erp-vendor-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <code style={{ background: '#f3f0f7', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: 'var(--primary-light)' }}>{exp.expenseNumber}</code>
                                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color }}>
                                        {exp.status}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--secondary-color)' }}>{exp.employeeName}</div>
                                <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 8 }}>{exp.category} · {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--secondary-color)' }}>₹{money(exp.amount)}</div>
                                {exp.notes && <div style={{ fontSize: 12, color: 'var(--text-main)', marginTop: 8 }}>{exp.notes}</div>}
                                {exp.receiptUrl && (
                                    <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--primary-color)', display: 'inline-block', marginTop: 8 }}>📎 View Receipt</a>
                                )}
                                <div className="erp-vendor-card-actions" style={{ flexWrap: 'wrap' }}>
                                    {actions.map(a => (
                                        <button key={a.to} className="erp-action-btn" onClick={() => handleTransition(exp, a.to)}>{a.label}</button>
                                    ))}
                                    {exp.status === 'draft' && (
                                        <button className="erp-action-btn erp-action-btn-del" onClick={() => handleDelete(exp._id)}><Trash2 size={14} aria-hidden="true" /> Delete</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Expense Modal */}
            {showForm && (
                <div className="erp-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="erp-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>New Expense Claim</h2>
                            <button className="erp-modal-close" onClick={() => setShowForm(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <form onSubmit={handleSave} className="erp-lead-form">
                            <div className="erp-form-grid">
                                <label className="erp-form-field">
                                    <span>Employee / Claimant *</span>
                                    <input value={form.employeeName} onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} />
                                </label>
                                <label className="erp-form-field">
                                    <span>Category *</span>
                                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                        <option value="">Select category…</option>
                                        {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </label>
                                <label className="erp-form-field">
                                    <span>Amount (₹) *</span>
                                    <input type="number" onFocus={(e) => e.target.select()} step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                                </label>
                                <label className="erp-form-field">
                                    <span>Date</span>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                                </label>
                            </div>
                            <label className="erp-form-field" style={{ marginTop: 12 }}>
                                <span>Receipt URL</span>
                                <input value={form.receiptUrl} onChange={e => setForm(p => ({ ...p, receiptUrl: e.target.value }))} placeholder="https://…" />
                            </label>
                            <label className="erp-form-field" style={{ marginTop: 12 }}>
                                <span>Notes</span>
                                <textarea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                            </label>
                            <div className="erp-form-actions">
                                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                                <button type="submit" style={btnPrimary}>Create Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showCategoryForm && (
                <div className="erp-modal-overlay" onClick={() => setShowCategoryForm(false)}>
                    <div className="erp-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>New Expense Category</h2>
                            <button className="erp-modal-close" onClick={() => setShowCategoryForm(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <form onSubmit={handleAddCategory} className="erp-lead-form">
                            <label className="erp-form-field">
                                <span>Category Name *</span>
                                <input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. Travel, Meals, Office Supplies" />
                            </label>
                            <div className="erp-form-actions">
                                <button type="button" onClick={() => setShowCategoryForm(false)} style={btnSecondary}>Cancel</button>
                                <button type="submit" style={btnPrimary}>Add Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .erp-exp-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }
                .erp-vendor-card {
                    background: var(--surface); border-radius: 12px; padding: 20px;
                    border: 1px solid #f0edf5; transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .erp-vendor-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(72,38,131,0.12); border-color: #d8d0e8; }
                .erp-vendor-card-actions { display: flex; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--bg-light); }
                .erp-action-btn {
                    background: none; border: 1px solid var(--border); padding: 6px 12px;
                    border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit;
                    transition: all 0.15s; min-height: 32px;
                }
                .erp-action-btn:hover { background: var(--bg-light); border-color: #d8d0e8; }
                .erp-action-btn-del:hover { background: var(--status-danger-bg); border-color: #fca5a5; }

                .erp-empty-state { text-align: center; padding: 48px 24px; color: #6c757d; background: var(--surface); border-radius: 12px; border: 1px solid #f0edf5; }
                .erp-empty-state h3 { color: var(--secondary-color); margin: 0 0 8px; }

                .erp-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; padding: 20px; backdrop-filter: blur(4px);
                }
                .erp-modal {
                    background: var(--surface); border-radius: 16px; width: 100%;
                    max-height: 90vh; overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(45,23,82,0.25);
                }
                .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f0edf5; }
                .erp-modal-header h2 { margin: 0; font-size: 18px; font-weight: 800; color: var(--secondary-color); }
                .erp-modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6c757d; width: 36px; height: 36px; border-radius: 8px; }
                .erp-modal-close:hover { background: var(--bg-light); color: var(--secondary-color); }
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
                .erp-form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0edf5; }

                @media (max-width: 768px) {
                    .erp-form-grid { grid-template-columns: 1fr; }
                    .erp-exp-grid { grid-template-columns: 1fr; }
                    .erp-exp-header { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </div>
    );
}

const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
