'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PERMISSION_MODULES, defaultPermissions } from '@/lib/permissions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Pencil, X } from 'lucide-react';
import { contact } from '@/config/site';

export default function EmployeesPage() {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [statusFilter, setStatusFilter] = useState('active');

    const [showEmpForm, setShowEmpForm] = useState(false);
    const emptyEmpForm = () => ({ name: '', email: '', phone: '', designation: '', departmentId: '', salary: '', dateOfJoining: '', notes: '' });
    const [empForm, setEmpForm] = useState(emptyEmpForm());
    const [editEmp, setEditEmp] = useState(null);

    const [showDeptForm, setShowDeptForm] = useState(false);
    const [deptForm, setDeptForm] = useState({ name: '', managerName: '' });

    // Account (Employee → User) modal
    const [accountEmp, setAccountEmp] = useState(null); // employee currently being managed
    const [accountMode, setAccountMode] = useState('create'); // 'create' | 'manage'
    const emptyAccountForm = () => ({ username: '', password: '', role: 'admin', permissions: defaultPermissions(), active: true });
    const [accountForm, setAccountForm] = useState(emptyAccountForm());
    const [savingAccount, setSavingAccount] = useState(false);

    const loadDepartments = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/hr/departments');
            const data = await res.json();
            setDepartments(data.departments || []);
        } catch { /* non-fatal */ }
    }, []);

    const loadEmployees = useCallback(async () => {
        try {
            const q = statusFilter ? `?status=${statusFilter}` : '';
            const res = await fetch(`/api/cloud/erp/hr/employees${q}`);
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch { toast.error('Failed to load employees'); }
        finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { loadDepartments(); }, [loadDepartments]);
    useEffect(() => { loadEmployees(); }, [loadEmployees]);

    function openNew() {
        setEmpForm(emptyEmpForm());
        setEditEmp(null);
        setShowEmpForm(true);
    }

    function openEdit(emp) {
        setEditEmp(emp);
        setEmpForm({
            name: emp.name || '', email: emp.email || '', phone: emp.phone || '',
            designation: emp.designation || '', departmentId: emp.departmentId || '',
            salary: emp.salary || '', dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().slice(0, 10) : '',
            notes: emp.notes || '',
        });
        setShowEmpForm(true);
    }

    async function handleSaveEmp(e) {
        e.preventDefault();
        if (!empForm.name.trim()) return toast.error('Employee name is required.');
        try {
            const url = editEmp ? `/api/cloud/erp/hr/employees/${editEmp._id}` : '/api/cloud/erp/hr/employees';
            const method = editEmp ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...empForm, salary: Number(empForm.salary) || 0 }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(editEmp ? 'Employee updated!' : `Employee ${data.employeeNumber} added!`);
            setShowEmpForm(false);
            loadEmployees();
        } catch (err) { toast.error(err.message || 'Failed to save employee.'); }
    }

    async function toggleStatus(emp) {
        const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
        try {
            const res = await fetch(`/api/cloud/erp/hr/employees/${emp._id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${emp.name} marked ${nextStatus}.`);
            loadEmployees();
        } catch (err) { toast.error(err.message || 'Failed to update.'); }
    }

    async function openAccount(emp) {
        setAccountEmp(emp);
        if (!emp.account) {
            setAccountMode('create');
            setAccountForm(emptyAccountForm());
            return;
        }
        setAccountMode('manage');
        try {
            const res = await fetch(`/api/cloud/erp/hr/employees/${emp._id}/account`);
            const data = await res.json();
            const acc = data.account;
            setAccountForm({
                username: acc?.username || '', password: '',
                role: acc?.role || 'admin',
                permissions: { ...defaultPermissions(), ...(acc?.permissions || {}) },
                active: acc?.active !== false,
            });
        } catch {
            toast.error('Failed to load account details.');
        }
    }

    async function handleSaveAccount(e) {
        e.preventDefault();
        setSavingAccount(true);
        try {
            if (accountMode === 'create') {
                if (!accountForm.username.trim()) throw new Error('Username is required.');
                if (accountForm.password.length < 8) throw new Error('Password must be at least 8 characters.');
                const res = await fetch(`/api/cloud/erp/hr/employees/${accountEmp._id}/account`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(accountForm),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                toast.success(`Login account created for ${accountEmp.name}!`);
            } else {
                const res = await fetch(`/api/cloud/erp/hr/employees/${accountEmp._id}/account`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(accountForm),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                toast.success('Account updated!');
            }
            setAccountEmp(null);
            loadEmployees();
        } catch (err) {
            toast.error(err.message || 'Failed to save account.');
        } finally {
            setSavingAccount(false);
        }
    }

    async function handleSaveDept(e) {
        e.preventDefault();
        if (!deptForm.name.trim()) return toast.error('Department name is required.');
        try {
            const res = await fetch('/api/cloud/erp/hr/departments', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deptForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Department added!');
            setShowDeptForm(false);
            setDeptForm({ name: '', managerName: '' });
            loadDepartments();
        } catch (err) { toast.error(err.message || 'Failed to add department.'); }
    }

    if (loading) {
        return <SkeletonPage rows={6} cols={5} />;
    }

    return (
        <div>
            <div className="erp-hr-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <Link href="/cloud/dashboard/erp/hr/attendance" style={btnSecondary}>🕐 Attendance</Link>
                        <Link href="/cloud/dashboard/erp/hr/leaves" style={btnSecondary}>🌴 Leaves</Link>
                        <Link href="/cloud/dashboard/erp/hr/payroll" style={btnSecondary}>💵 Payroll</Link>
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>👷 Employees</h1>
                    <p style={{ fontSize: 13, color: '#6c757d', margin: '4px 0 0' }}>Your team directory, departments, and salary records.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowDeptForm(true)} style={btnSecondary}>+ Department</button>
                    <button onClick={openNew} style={btnPrimary}>+ Add Employee</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[{ v: 'active', l: 'Active' }, { v: 'inactive', l: 'Inactive' }, { v: '', l: 'All' }].map(o => (
                    <button
                        key={o.v} onClick={() => setStatusFilter(o.v)}
                        style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                            border: '1.5px solid', borderColor: statusFilter === o.v ? 'var(--primary-color)' : '#e2e0ea',
                            background: statusFilter === o.v ? 'var(--primary-color)' : 'var(--surface)', color: statusFilter === o.v ? '#fff' : 'var(--text-secondary)',
                        }}
                    >
                        {o.l}
                    </button>
                ))}
            </div>

            {employees.length === 0 ? (
                <div className="erp-empty-state"><h3>No employees yet</h3><p>Add your first team member to get started.</p></div>
            ) : (
                <div className="erp-hr-grid">
                    {employees.map(emp => (
                        <div key={emp._id} className="erp-vendor-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--secondary-color)' }}>{emp.name}</div>
                                    <div style={{ fontSize: 12, color: '#6c757d' }}>{emp.designation || '-'}{emp.departmentName ? ` · ${emp.departmentName}` : ''}</div>
                                </div>
                                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'uppercase', background: emp.status === 'active' ? '#dcfce7' : '#f3f4f6', color: emp.status === 'active' ? '#166534' : '#6b7280' }}>
                                    {emp.status}
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: '#333', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <code style={{ background: '#f3f0f7', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: 'var(--primary-light)', width: 'fit-content' }}>{emp.employeeNumber}</code>
                                {emp.email && <div>📧 {emp.email}</div>}
                                {emp.phone && <div>📞 {emp.phone}</div>}
                                <div style={{ fontWeight: 700, color: 'var(--secondary-color)' }}>₹{(emp.salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/mo</div>
                            </div>

                            <div className="erp-account-row">
                                {emp.account ? (
                                    <span className={`erp-account-badge ${emp.account.active ? 'is-active' : 'is-inactive'}`}>
                                        {emp.account.active ? '🔓' : '🔒'} {emp.account.role === 'admin' ? 'Admin' : 'Custom'} account {emp.account.active ? '' : '(inactive)'}
                                    </span>
                                ) : (
                                    <span className="erp-account-badge is-none">No login account</span>
                                )}
                            </div>

                            <div className="erp-vendor-card-actions">
                                <button className="erp-action-btn" onClick={() => openEdit(emp)}><Pencil size={14} aria-hidden="true" /> Edit</button>
                                <button className="erp-action-btn" onClick={() => toggleStatus(emp)}>{emp.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}</button>
                                <button className="erp-action-btn erp-action-btn-account" onClick={() => openAccount(emp)}>
                                    {emp.account ? '🔑 Manage Account' : '➕ Create Account'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Employee Modal */}
            {showEmpForm && (
                <div className="erp-modal-overlay" onClick={() => setShowEmpForm(false)}>
                    <div className="erp-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>{editEmp ? 'Edit Employee' : 'New Employee'}</h2>
                            <button className="erp-modal-close" onClick={() => setShowEmpForm(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <form id="emp-form" onSubmit={handleSaveEmp} className="erp-lead-form">
                                <div className="erp-form-grid">
                                    <label className="erp-form-field">
                                        <span>Name *</span>
                                        <input value={empForm.name} onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} />
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Designation</span>
                                        <input value={empForm.designation} onChange={e => setEmpForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Sales Executive" />
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Email</span>
                                        <input type="email" value={empForm.email} onChange={e => setEmpForm(p => ({ ...p, email: e.target.value }))} />
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Phone</span>
                                        <input value={empForm.phone} placeholder={contact.phonePlaceholder} onChange={e => setEmpForm(p => ({ ...p, phone: e.target.value }))} />
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Department</span>
                                        <select value={empForm.departmentId} onChange={e => setEmpForm(p => ({ ...p, departmentId: e.target.value }))}>
                                            <option value="">- None -</option>
                                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                        </select>
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Monthly Salary (₹)</span>
                                        <input type="number" onFocus={(e) => e.target.select()} step="0.01" value={empForm.salary} onChange={e => setEmpForm(p => ({ ...p, salary: e.target.value }))} />
                                    </label>
                                    <label className="erp-form-field">
                                        <span>Date of Joining</span>
                                        <input type="date" value={empForm.dateOfJoining} onChange={e => setEmpForm(p => ({ ...p, dateOfJoining: e.target.value }))} />
                                    </label>
                                </div>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Notes</span>
                                    <textarea rows={2} value={empForm.notes} onChange={e => setEmpForm(p => ({ ...p, notes: e.target.value }))} />
                                </label>
                            </form>
                        </div>
                        <div className="erp-modal-footer">
                            <button type="button" onClick={() => setShowEmpForm(false)} style={btnSecondary}>Cancel</button>
                            <button type="submit" form="emp-form" style={btnPrimary}>{editEmp ? 'Update Employee' : 'Add Employee'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee → User Account Modal */}
            {accountEmp && (
                <div className="erp-modal-overlay" onClick={() => setAccountEmp(null)}>
                    <div className="erp-modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>{accountMode === 'create' ? `Create Login for ${accountEmp.name}` : `Manage Account - ${accountEmp.name}`}</h2>
                            <button className="erp-modal-close" onClick={() => setAccountEmp(null)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <form id="account-form" onSubmit={handleSaveAccount} className="erp-lead-form">
                                {accountMode === 'create' && (
                                    <div className="erp-form-grid">
                                        <label className="erp-form-field">
                                            <span>Username *</span>
                                            <input
                                                value={accountForm.username}
                                                onChange={e => setAccountForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                                placeholder="e.g. rajesh-k"
                                            />
                                        </label>
                                        <label className="erp-form-field">
                                            <span>Password *</span>
                                            <input type="password" value={accountForm.password} onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 8 characters" />
                                        </label>
                                    </div>
                                )}

                                {accountMode === 'manage' && (
                                    <>
                                        <div className="erp-form-grid">
                                            <div style={{ fontSize: 13, color: '#6c757d' }}>Username: <strong style={{ color: 'var(--secondary-color)' }}>{accountForm.username}</strong></div>
                                            <label className="erp-form-field">
                                                <span>Reset Password (optional)</span>
                                                <input type="password" value={accountForm.password} onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current" />
                                            </label>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={accountForm.active} onChange={e => setAccountForm(p => ({ ...p, active: e.target.checked }))} />
                                            Account is active (uncheck to lock this person out without deleting anything)
                                        </label>
                                    </>
                                )}

                                <div style={{ marginTop: 18 }}>
                                    <span className="erp-role-label">Access Level</span>
                                    <div className="erp-role-toggle">
                                        <button
                                            type="button" onClick={() => setAccountForm(p => ({ ...p, role: 'admin' }))}
                                            className={accountForm.role === 'admin' ? 'active' : ''}
                                        >
                                            🛡️ Admin - Full universal access
                                        </button>
                                        <button
                                            type="button" onClick={() => setAccountForm(p => ({ ...p, role: 'custom' }))}
                                            className={accountForm.role === 'custom' ? 'active' : ''}
                                        >
                                            🎛️ Custom - Pick exactly what they can see
                                        </button>
                                    </div>
                                </div>

                                {accountForm.role === 'custom' && (
                                    <div className="erp-permission-grid">
                                        {PERMISSION_MODULES.map(m => {
                                            const checked = !!accountForm.permissions[m.key];
                                            return (
                                                <label key={m.key} className={`erp-permission-chip ${checked ? 'checked' : ''}`}>
                                                    <input
                                                        type="checkbox" checked={checked}
                                                        onChange={e => setAccountForm(p => ({ ...p, permissions: { ...p.permissions, [m.key]: e.target.checked } }))}
                                                    />
                                                    {m.label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="erp-modal-footer">
                            <button type="button" onClick={() => setAccountEmp(null)} style={btnSecondary}>Cancel</button>
                            <button type="submit" form="account-form" style={btnPrimary} disabled={savingAccount}>
                                {savingAccount ? 'Saving…' : (accountMode === 'create' ? 'Create Account' : 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            {showDeptForm && (
                <div className="erp-modal-overlay" onClick={() => setShowDeptForm(false)}>
                    <div className="erp-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>New Department</h2>
                            <button className="erp-modal-close" onClick={() => setShowDeptForm(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <form id="dept-form" onSubmit={handleSaveDept} className="erp-lead-form">
                                <label className="erp-form-field">
                                    <span>Department Name *</span>
                                    <input value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sales, Operations" />
                                </label>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Manager Name</span>
                                    <input value={deptForm.managerName} onChange={e => setDeptForm(p => ({ ...p, managerName: e.target.value }))} />
                                </label>
                            </form>
                        </div>
                        <div className="erp-modal-footer">
                            <button type="button" onClick={() => setShowDeptForm(false)} style={btnSecondary}>Cancel</button>
                            <button type="submit" form="dept-form" style={btnPrimary}>Save Department</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .erp-hr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
                .erp-vendor-card {
                    background: var(--surface); border-radius: 12px; padding: 20px;
                    border: 1px solid #f0edf5; transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .erp-vendor-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(72,38,131,0.12); border-color: #d8d0e8; }
                .erp-vendor-card-actions { display: flex; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--bg-light); flex-wrap: wrap; }
                .erp-action-btn {
                    background: none; border: 1px solid var(--border); padding: 6px 12px;
                    border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit;
                    transition: all 0.15s; min-height: 32px;
                }
                .erp-action-btn:hover { background: var(--bg-light); border-color: #d8d0e8; }
                .erp-action-btn-account { border-color: var(--primary-color); color: var(--primary-color); font-weight: 700; }
                .erp-action-btn-account:hover { background: var(--accent-subtle); }

                .erp-account-row { margin-top: 10px; }
                .erp-account-badge {
                    display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px;
                    border-radius: 10px; white-space: nowrap;
                }
                .erp-account-badge.is-active { background: var(--accent-subtle); color: #6d28d9; }
                .erp-account-badge.is-inactive { background: var(--status-warning-bg); color: #92400e; }
                .erp-account-badge.is-none { background: var(--surface-sunken); color: #6b7280; }

                .erp-role-label { font-size: 12px; font-weight: 600; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 8px; }
                .erp-role-toggle { display: flex; gap: 10px; flex-wrap: wrap; }
                .erp-role-toggle button {
                    flex: 1 1 220px; padding: 14px 16px; border-radius: 10px; font-size: 13.5px; font-weight: 700;
                    border: 1.5px solid #e2e0ea; background: var(--surface-sunken); color: #475569; cursor: pointer;
                    text-align: left; transition: all 0.15s; min-height: 48px;
                }
                .erp-role-toggle button.active {
                    border-color: var(--primary-color); background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: #fff;
                    box-shadow: 0 4px 12px rgba(72,38,131,0.25);
                }

                .erp-permission-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px;
                    margin-top: 14px; padding: 14px; background: var(--surface-sunken); border-radius: 10px; border: 1px solid var(--border);
                }
                .erp-permission-chip {
                    display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px;
                    border: 1.5px solid #e2e0ea; background: var(--surface); font-size: 12.5px; font-weight: 600; color: #475569;
                    cursor: pointer; transition: all 0.15s; min-height: 36px;
                }
                .erp-permission-chip input { accent-color: var(--primary-color); width: 15px; height: 15px; flex-shrink: 0; }
                .erp-permission-chip.checked { border-color: var(--primary-color); background: var(--accent-subtle); color: var(--primary-color); }

                .erp-empty-state { text-align: center; padding: 32px 24px; color: #6c757d; background: var(--surface); border-radius: 12px; border: 1px solid #f0edf5; }
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
                .erp-modal-header {
                    flex: 0 0 auto;
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px; border-bottom: 1px solid #f0edf5;
                }
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
                    .erp-hr-grid { grid-template-columns: 1fr; }
                    .erp-hr-header { flex-direction: column; align-items: stretch; }
                    .erp-hr-header > div:last-child { display: flex; flex-direction: column; }
                    .erp-modal { max-height: 100dvh; border-radius: 0; }
                    .erp-modal-overlay { padding: 0; }
                    .erp-role-toggle { flex-direction: column; }
                    .erp-permission-grid { grid-template-columns: 1fr 1fr; }
                }
            `}</style>
        </div>
    );
}

const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, minHeight: 40, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
