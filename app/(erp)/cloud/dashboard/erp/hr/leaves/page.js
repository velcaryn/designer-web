'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Trash2, X } from 'lucide-react';

const STATUS_COLORS = {
    pending: { bg: 'var(--status-info-bg)', color: 'var(--status-info-fg)' },
    approved: { bg: 'var(--status-success-bg)', color: 'var(--status-success-fg)' },
    rejected: { bg: 'var(--status-danger-bg)', color: 'var(--status-danger-fg)' },
    cancelled: { bg: '#f3f4f6', color: 'var(--text-muted)' },
};

const NEXT_ACTIONS = {
    pending: [{ label: '✓ Approve', to: 'approved' }, { label: '✕ Reject', to: 'rejected' }],
    approved: [{ label: 'Cancel', to: 'cancelled' }],
    rejected: [{ label: '↺ Reconsider', to: 'pending' }],
    cancelled: [],
};

const LEAVE_TYPES = ['sick', 'casual', 'earned', 'unpaid'];

export default function LeavesPage() {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');

    const [showForm, setShowForm] = useState(false);
    const emptyForm = () => ({ employeeId: '', type: 'casual', from: '', to: '', reason: '' });
    const [form, setForm] = useState(emptyForm());

    const loadEmployees = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/hr/employees?status=active');
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch { /* non-fatal */ }
    }, []);

    const loadLeaves = useCallback(async () => {
        try {
            const q = statusFilter ? `?status=${statusFilter}` : '';
            const res = await fetch(`/api/cloud/erp/hr/leaves${q}`);
            const data = await res.json();
            setLeaves(data.leaves || []);
        } catch { toast.error('Failed to load leave requests'); }
        finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { loadEmployees(); }, [loadEmployees]);
    useEffect(() => { loadLeaves(); }, [loadLeaves]);

    async function handleSave(e) {
        e.preventDefault();
        if (!form.employeeId) return toast.error('Select an employee.');
        if (!form.from || !form.to) return toast.error('From and To dates are required.');
        try {
            const res = await fetch('/api/cloud/erp/hr/leaves', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Leave request ${data.leaveNumber} created!`);
            setShowForm(false);
            setForm(emptyForm());
            loadLeaves();
        } catch (err) { toast.error(err.message || 'Failed to create leave request.'); }
    }

    async function handleTransition(leave, to) {
        try {
            const res = await fetch(`/api/cloud/erp/hr/leaves/${leave._id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: to }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${leave.leaveNumber} moved to "${to}"`);
            loadLeaves();
        } catch (err) { toast.error(err.message || 'Failed to update status.'); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this pending leave request?')) return;
        try {
            const res = await fetch(`/api/cloud/erp/hr/leaves/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Leave request deleted.');
            loadLeaves();
        } catch (err) { toast.error(err.message || 'Failed to delete.'); }
    }

    if (loading) {
        return <SkeletonPage rows={6} cols={5} />;
    }

    return (
        <div>
            <div className="erp-lv-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <Link href="/cloud/dashboard/erp/hr/employees" style={btnSecondary}>👷 Employees</Link>
                        <Link href="/cloud/dashboard/erp/hr/attendance" style={btnSecondary}>🕐 Attendance</Link>
                        <Link href="/cloud/dashboard/erp/hr/payroll" style={btnSecondary}>💵 Payroll</Link>
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>🌴 Leave Requests</h1>
                    <p style={{ fontSize: 13, color: '#6c757d', margin: '4px 0 0' }}>Pending → Approved/Rejected workflow for employee leave.</p>
                </div>
                <button onClick={() => setShowForm(true)} style={btnPrimary}>+ New Leave Request</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {['', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
                    <button
                        key={s || 'all'} onClick={() => setStatusFilter(s)}
                        style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                            border: '1.5px solid', borderColor: statusFilter === s ? 'var(--primary-color)' : '#e2e0ea',
                            background: statusFilter === s ? 'var(--primary-color)' : 'var(--surface)', color: statusFilter === s ? '#fff' : 'var(--text-secondary)',
                        }}
                    >
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {leaves.length === 0 ? (
                <div className="erp-empty-state"><h3>No leave requests yet</h3><p>Create one to start tracking employee leave.</p></div>
            ) : (
                <div className="erp-lv-grid">
                    {leaves.map(lv => {
                        const sc = STATUS_COLORS[lv.status] || STATUS_COLORS.pending;
                        const actions = NEXT_ACTIONS[lv.status] || [];
                        return (
                            <div key={lv._id} className="erp-vendor-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <code style={{ background: '#f3f0f7', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: 'var(--primary-light)' }}>{lv.leaveNumber}</code>
                                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color }}>{lv.status}</span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--secondary-color)' }}>{lv.employeeName}</div>
                                <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 8, textTransform: 'capitalize' }}>{lv.type} leave · {lv.days} day{lv.days === 1 ? '' : 's'}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-main)' }}>
                                    {new Date(lv.from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(lv.to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                {lv.reason && <div style={{ fontSize: 12, color: 'var(--text-main)', marginTop: 8 }}>{lv.reason}</div>}
                                <div className="erp-vendor-card-actions" style={{ flexWrap: 'wrap' }}>
                                    {actions.map(a => (
                                        <button key={a.to} className="erp-action-btn" onClick={() => handleTransition(lv, a.to)}>{a.label}</button>
                                    ))}
                                    {lv.status === 'pending' && (
                                        <button className="erp-action-btn erp-action-btn-del" onClick={() => handleDelete(lv._id)}><Trash2 size={14} aria-hidden="true" /> Delete</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Leave Request Modal */}
            {showForm && (
                <div className="erp-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="erp-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>New Leave Request</h2>
                            <button className="erp-modal-close" onClick={() => setShowForm(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <form id="leave-form" onSubmit={handleSave} className="erp-lead-form">
                                <label className="erp-form-field">
                                    <span>Employee *</span>
                                    <select value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}>
                                        <option value="">Select employee…</option>
                                        {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                                    </select>
                                </label>
                                <div className="erp-form-grid" style={{ marginTop: 12 }}>
                                    <label className="erp-form-field">
                                        <span>Leave Type *</span>
                                        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                            {LEAVE_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                                        </select>
                                    </label>
                                    <div />
                                    <label className="erp-form-field">
                                        <span>From *</span>
                                        <input type="date" value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))} />
                                    </label>
                                    <label className="erp-form-field">
                                        <span>To *</span>
                                        <input type="date" value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} />
                                    </label>
                                </div>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Reason</span>
                                    <textarea rows={2} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                                </label>
                            </form>
                        </div>
                        <div className="erp-modal-footer">
                            <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                            <button type="submit" form="leave-form" style={btnPrimary}>Create Request</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .erp-lv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
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
                    max-height: min(88vh, 88dvh);
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 20px 60px rgba(45,23,82,0.25);
                }
                .erp-modal-header { flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f0edf5; }
                .erp-modal-header h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--secondary-color); }
                .erp-modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6c757d; width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; }
                .erp-modal-close:hover { background: var(--bg-light); color: var(--secondary-color); }
                .erp-modal-body { flex: 1 1 auto; overflow-y: auto; min-height: 0; }
                .erp-modal-footer { flex: 0 0 auto; display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid #f0edf5; }
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
                    .erp-lv-grid { grid-template-columns: 1fr; }
                    .erp-lv-header { flex-direction: column; align-items: stretch; }
                    .erp-modal { max-height: 100dvh; border-radius: 0; }
                    .erp-modal-overlay { padding: 0; }
                }
            `}</style>
        </div>
    );
}

const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
