'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_COLORS = {
    draft: { bg: '#f3f4f6', color: 'var(--text-muted)' },
    finalized: { bg: 'var(--status-info-bg)', color: 'var(--status-info-fg)' },
    paid: { bg: 'var(--status-success-bg)', color: 'var(--status-success-fg)' },
    cancelled: { bg: 'var(--status-danger-bg)', color: 'var(--status-danger-fg)' },
};

const NEXT_ACTIONS = {
    draft: [{ label: '✓ Finalize', to: 'finalized' }, { label: '✕ Cancel', to: 'cancelled' }],
    finalized: [{ label: '💸 Mark Paid', to: 'paid' }, { label: '↺ Back to Draft', to: 'draft' }],
    paid: [],
    cancelled: [],
};

function money(n) {
    return (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayrollPage() {
    const [loading, setLoading] = useState(true);
    const [runs, setRuns] = useState([]);
    const [expanded, setExpanded] = useState(null);

    const now = new Date();
    const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
    const [genYear, setGenYear] = useState(now.getFullYear());
    const [generating, setGenerating] = useState(false);

    const loadRuns = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/hr/payroll');
            const data = await res.json();
            setRuns(data.runs || []);
        } catch { toast.error('Failed to load payroll runs'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadRuns(); }, [loadRuns]);

    async function handleGenerate(e) {
        e.preventDefault();
        setGenerating(true);
        try {
            const res = await fetch('/api/cloud/erp/hr/payroll', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month: genMonth, year: genYear }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Payroll run ${data.runNumber} generated!`);
            loadRuns();
        } catch (err) { toast.error(err.message || 'Failed to generate payroll run.'); }
        finally { setGenerating(false); }
    }

    async function handleTransition(run, to) {
        try {
            const res = await fetch(`/api/cloud/erp/hr/payroll/${run._id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: to }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${run.runNumber} moved to "${to}"`);
            loadRuns();
        } catch (err) { toast.error(err.message || 'Failed to update status.'); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this draft payroll run?')) return;
        try {
            const res = await fetch(`/api/cloud/erp/hr/payroll/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Payroll run deleted.');
            loadRuns();
        } catch (err) { toast.error(err.message || 'Failed to delete.'); }
    }

    if (loading) {
        return <SkeletonPage rows={6} cols={5} />;
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <Link href="/cloud/dashboard/erp/hr/employees" style={btnSecondary}>👷 Employees</Link>
                <Link href="/cloud/dashboard/erp/hr/attendance" style={btnSecondary}>🕐 Attendance</Link>
                <Link href="/cloud/dashboard/erp/hr/leaves" style={btnSecondary}>🌴 Leaves</Link>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: '0 0 4px' }}>💵 Payroll</h1>
            <p style={{ fontSize: 13, color: '#6c757d', margin: '0 0 20px' }}>
                Generate a monthly run from active employees. Approved unpaid leave is deducted at salary/30 per day - a simplified proration, not full attendance-based payroll.
            </p>

            {/* Generate Run */}
            <div className="erp-payroll-gen">
                <form onSubmit={handleGenerate} className="erp-payroll-gen-form">
                    <label className="erp-form-field">
                        <span>Month</span>
                        <select value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
                            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                    </label>
                    <label className="erp-form-field">
                        <span>Year</span>
                        <input type="number" onFocus={(e) => e.target.select()} value={genYear} onChange={e => setGenYear(Number(e.target.value))} />
                    </label>
                    <button type="submit" style={btnPrimary} disabled={generating}>{generating ? 'Generating…' : '+ Generate Run'}</button>
                </form>
            </div>

            {runs.length === 0 ? (
                <div className="erp-empty-state"><h3>No payroll runs yet</h3><p>Generate your first run above.</p></div>
            ) : (
                <div className="erp-payroll-list">
                    {runs.map(run => {
                        const sc = STATUS_COLORS[run.status] || STATUS_COLORS.draft;
                        const actions = NEXT_ACTIONS[run.status] || [];
                        const isOpen = expanded === run._id;
                        return (
                            <div key={run._id} className="erp-payroll-card">
                                <div className="erp-payroll-card-top" onClick={() => setExpanded(isOpen ? null : run._id)}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--secondary-color)' }}>{MONTH_NAMES[run.month - 1]} {run.year}</div>
                                        <code style={{ fontSize: 11, color: 'var(--primary-light)' }}>{run.runNumber}</code>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--secondary-color)' }}>₹{money(run.totalNet)}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{run.entries.length} employees</div>
                                        </div>
                                        <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color }}>{run.status}</span>
                                        <span style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: '#94a3b8' }}>▶</span>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="erp-payroll-detail">
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--surface-sunken)' }}>
                                                        <th style={thStyle}>Employee</th>
                                                        <th style={{ ...thStyle, textAlign: 'right' }}>Base Salary</th>
                                                        <th style={{ ...thStyle, textAlign: 'right' }}>Unpaid Days</th>
                                                        <th style={{ ...thStyle, textAlign: 'right' }}>Deductions</th>
                                                        <th style={{ ...thStyle, textAlign: 'right' }}>Net Pay</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {run.entries.map((e, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                            <td style={tdStyle}>{e.employeeName}</td>
                                                            <td style={{ ...tdStyle, textAlign: 'right' }}>₹{money(e.baseSalary)}</td>
                                                            <td style={{ ...tdStyle, textAlign: 'right' }}>{e.unpaidDays}</td>
                                                            <td style={{ ...tdStyle, textAlign: 'right', color: e.deductions > 0 ? '#dc2626' : '#9ca3af' }}>₹{money(e.deductions)}</td>
                                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>₹{money(e.netPay)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="erp-payroll-actions">
                                            {actions.map(a => (
                                                <button key={a.to} className="erp-action-btn" onClick={() => handleTransition(run, a.to)}>{a.label}</button>
                                            ))}
                                            {run.status === 'draft' && (
                                                <button className="erp-action-btn erp-action-btn-del" onClick={() => handleDelete(run._id)}><Trash2 size={14} aria-hidden="true" /> Delete</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .erp-payroll-gen {
                    background: var(--surface-sunken); border: 1.5px solid var(--border); border-radius: 12px;
                    padding: 16px 20px; margin-bottom: 24px;
                }
                .erp-payroll-gen-form { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
                .erp-form-field { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
                .erp-form-field span { font-size: 12px; font-weight: 600; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.04em; }
                .erp-form-field input, .erp-form-field select {
                    width: 100%; box-sizing: border-box; min-width: 0;
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 10px 12px;
                    font-size: 14px; font-family: inherit; outline: none; background: var(--surface); min-height: 40px;
                }

                .erp-payroll-list { display: flex; flex-direction: column; gap: 12px; }
                .erp-payroll-card { background: var(--surface); border: 1px solid #f0edf5; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
                .erp-payroll-card-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; gap: 12px; flex-wrap: wrap; }
                .erp-payroll-detail { padding: 0 20px 16px; border-top: 1px solid var(--bg-light); }
                .erp-payroll-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
                .erp-action-btn {
                    background: none; border: 1px solid var(--border); padding: 6px 12px;
                    border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit;
                    transition: all 0.15s; min-height: 32px;
                }
                .erp-action-btn:hover { background: var(--bg-light); border-color: #d8d0e8; }
                .erp-action-btn-del:hover { background: var(--status-danger-bg); border-color: #fca5a5; }

                .erp-empty-state { text-align: center; padding: 48px 24px; color: #6c757d; background: var(--surface); border-radius: 12px; border: 1px solid #f0edf5; }
                .erp-empty-state h3 { color: var(--secondary-color); margin: 0 0 8px; }

                @media (max-width: 768px) {
                    .erp-payroll-gen-form { flex-direction: column; align-items: stretch; }
                    .erp-payroll-card-top { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </div>
    );
}

const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--secondary-color)', borderBottom: '2px solid var(--border)' };
const tdStyle = { padding: '10px 12px', color: 'var(--text-main)' };
