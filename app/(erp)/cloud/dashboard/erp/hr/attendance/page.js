'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';

const STATUS_OPTIONS = [
    { v: 'present', l: 'Present', color: '#166534', bg: '#dcfce7' },
    { v: 'half-day', l: 'Half-Day', color: '#92400e', bg: '#fef3c7' },
    { v: 'leave', l: 'Leave', color: '#6d28d9', bg: '#ede9fe' },
    { v: 'absent', l: 'Absent', color: '#991b1b', bg: '#fee2e2' },
];

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [records, setRecords] = useState([]);
    const [date, setDate] = useState(todayStr());
    const [saving, setSaving] = useState({});

    const loadEmployees = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/hr/employees?status=active');
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch { toast.error('Failed to load employees'); }
        finally { setLoading(false); }
    }, []);

    const loadRecords = useCallback(async () => {
        try {
            const res = await fetch(`/api/cloud/erp/hr/attendance?date=${date}`);
            const data = await res.json();
            setRecords(data.records || []);
        } catch { /* non-fatal */ }
    }, [date]);

    useEffect(() => { loadEmployees(); }, [loadEmployees]);
    useEffect(() => { loadRecords(); }, [loadRecords]);

    function recordFor(employeeId) {
        return records.find(r => r.employeeId === employeeId);
    }

    async function markStatus(employee, status) {
        setSaving(p => ({ ...p, [employee._id]: true }));
        try {
            const res = await fetch('/api/cloud/erp/hr/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employee._id, date, status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            loadRecords();
        } catch (err) {
            toast.error(err.message || 'Failed to mark attendance.');
        } finally {
            setSaving(p => ({ ...p, [employee._id]: false }));
        }
    }

    if (loading) {
        return <SkeletonPage rows={6} cols={5} />;
    }

    return (
        <div>
            <div className="erp-att-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <Link href="/cloud/dashboard/erp/hr/employees" style={btnSecondary}>👷 Employees</Link>
                        <Link href="/cloud/dashboard/erp/hr/leaves" style={btnSecondary}>🌴 Leaves</Link>
                        <Link href="/cloud/dashboard/erp/hr/payroll" style={btnSecondary}>💵 Payroll</Link>
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>🕐 Attendance</h1>
                    <p style={{ fontSize: 13, color: '#6c757d', margin: '4px 0 0' }}>Mark daily attendance for your active employees.</p>
                </div>
                <label className="erp-date-field">
                    <span>Date</span>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} max={todayStr()} />
                </label>
            </div>

            {employees.length === 0 ? (
                <div className="erp-empty-state"><h3>No active employees</h3><p>Add employees under the Employees page first.</p></div>
            ) : (
                <div className="erp-att-list">
                    {employees.map(emp => {
                        const rec = recordFor(emp._id);
                        return (
                            <div key={emp._id} className="erp-att-row">
                                <div className="erp-att-name">
                                    <div style={{ fontWeight: 700, color: 'var(--secondary-color)' }}>{emp.name}</div>
                                    <div style={{ fontSize: 12, color: '#6c757d' }}>{emp.designation || '-'}</div>
                                </div>
                                <div className="erp-att-actions">
                                    {STATUS_OPTIONS.map(opt => {
                                        const active = rec?.status === opt.v;
                                        return (
                                            <button
                                                key={opt.v}
                                                disabled={saving[emp._id]}
                                                onClick={() => markStatus(emp, opt.v)}
                                                style={{
                                                    padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                                                    border: '1.5px solid', borderColor: active ? opt.color : '#e2e0ea',
                                                    background: active ? opt.bg : '#fff', color: active ? opt.color : 'var(--text-main)',
                                                    minHeight: 36,
                                                }}
                                            >
                                                {opt.l}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .erp-att-list { display: flex; flex-direction: column; gap: 10px; }
                .erp-att-row {
                    background: var(--surface); border: 1px solid #f0edf5; border-radius: 12px; padding: 16px 20px;
                    display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                }
                .erp-att-name { min-width: 140px; }
                .erp-att-actions { display: flex; gap: 8px; flex-wrap: wrap; }

                .erp-date-field { display: flex; flex-direction: column; gap: 4px; }
                .erp-date-field span { font-size: 11px; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.05em; }
                .erp-date-field input {
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 10px 12px;
                    font-size: 14px; font-family: inherit; outline: none; min-height: 40px; background: var(--surface-sunken);
                }

                .erp-empty-state { text-align: center; padding: 32px 24px; color: #6c757d; background: var(--surface); border-radius: 12px; border: 1px solid #f0edf5; }
                .erp-empty-state h3 { color: var(--secondary-color); margin: 0 0 8px; }

                @media (max-width: 768px) {
                    .erp-att-header { flex-direction: column; align-items: stretch; }
                    .erp-att-row { flex-direction: column; align-items: stretch; }
                    .erp-att-actions { justify-content: space-between; }
                    .erp-att-actions button { flex: 1; }
                }
            `}</style>
        </div>
    );
}

const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
