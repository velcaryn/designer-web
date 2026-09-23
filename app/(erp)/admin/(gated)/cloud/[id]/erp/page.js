'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const PO_STATUS_COLORS = {
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    confirmed: { bg: '#dbeafe', color: '#1d4ed8' },
    received: { bg: '#ede9fe', color: '#6d28d9' },
    billed: { bg: '#fef3c7', color: '#92400e' },
    paid: { bg: '#dcfce7', color: '#166534' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

function money(n) {
    return (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TenantErpOverviewPage({ params }) {
    const router = useRouter();
    const { id } = React.use(params);

    const [tenant, setTenant] = useState(null);
    const [erp, setErp] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/cloud/tenants/${id}`).then(r => r.json()),
            fetch(`/api/admin/cloud/tenants/${id}/erp`).then(r => r.json()),
        ]).then(([tenantData, erpData]) => {
            if (tenantData.error) {
                toast.error(tenantData.error);
                router.push('/admin/cloud');
                return;
            }
            setTenant(tenantData.client);
            setErp(erpData);
        }).catch(() => toast.error('Failed to load ERP overview'))
            .finally(() => setLoading(false));
    }, [id, router]);

    if (loading) return <div style={{ padding: '40px', color: '#6b7280' }}>Loading ERP overview…</div>;
    if (!tenant || !erp) return null;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                <Link href="/admin/cloud" style={{ fontSize: '13px', color: '#4A1088', fontWeight: 600, textDecoration: 'none' }}>← All Clients</Link>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#2d1752', marginTop: '4px' }}>🏢 ERP Overview - {tenant.businessName}</h1>
                <p style={{ color: '#6c757d' }}>Read-only view of this client&rsquo;s CRM pipeline and purchasing activity, as recorded in their Cloud dashboard.</p>
            </div>

            {/* CRM Summary */}
            <section style={{ marginBottom: '28px' }}>
                <h2 style={sectionHeading}>💼 CRM - Leads Pipeline</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <StatCard label="Total Leads" value={erp.crm.totalLeads} />
                    <StatCard label="Open Pipeline Value" value={`₹${money(erp.crm.openPipelineValue)}`} />
                    <StatCard label="Won Value" value={`₹${money(erp.crm.wonValue)}`} accent="#166534" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    {erp.crm.byStage.map(s => (
                        <div key={s.id} style={{ flex: '1 1 140px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', background: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{s.name}</span>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e1b4b' }}>{s.count}</div>
                            <div style={{ fontSize: '11.5px', color: '#6b7280' }}>₹{money(s.value)}</div>
                        </div>
                    ))}
                </div>

                <div style={tableWrap}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8f6fc' }}>
                                <th style={thStyle}>Lead #</th>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Company</th>
                                <th style={thStyle}>Stage</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Expected Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {erp.crm.recentLeads.length === 0 && (
                                <tr><td colSpan={5} style={emptyStyle}>No leads recorded yet.</td></tr>
                            )}
                            {erp.crm.recentLeads.map(l => (
                                <tr key={l._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}><code style={codeStyle}>{l.leadNumber}</code></td>
                                    <td style={tdStyle}>{l.name}</td>
                                    <td style={tdStyle}>{l.company || '-'}</td>
                                    <td style={tdStyle}><span style={pillStyle}>{l.stage}</span></td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>₹{money(l.expectedRevenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Purchases Summary */}
            <section>
                <h2 style={sectionHeading}>🛒 Purchases - Orders &amp; Vendors</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <StatCard label="Total Purchase Orders" value={erp.purchases.totalOrders} />
                    <StatCard label="Total Vendors" value={erp.purchases.totalVendors} />
                    <StatCard label="Total PO Value" value={`₹${money(erp.purchases.totalPoValue)}`} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    {erp.purchases.byStatus.filter(s => s.count > 0).map(s => {
                        const sc = PO_STATUS_COLORS[s.status] || PO_STATUS_COLORS.draft;
                        return (
                            <div key={s.status} style={{ flex: '1 1 140px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', background: '#fff' }}>
                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color, marginBottom: '6px' }}>
                                    {s.status}
                                </span>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e1b4b' }}>{s.count}</div>
                                <div style={{ fontSize: '11.5px', color: '#6b7280' }}>₹{money(s.value)}</div>
                            </div>
                        );
                    })}
                    {erp.purchases.byStatus.every(s => s.count === 0) && (
                        <div style={{ color: '#9ca3af', fontSize: '13px', padding: '8px' }}>No purchase orders recorded yet.</div>
                    )}
                </div>

                <div style={tableWrap}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8f6fc' }}>
                                <th style={thStyle}>PO #</th>
                                <th style={thStyle}>Vendor</th>
                                <th style={thStyle}>Status</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Grand Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {erp.purchases.recentOrders.length === 0 && (
                                <tr><td colSpan={4} style={emptyStyle}>No purchase orders recorded yet.</td></tr>
                            )}
                            {erp.purchases.recentOrders.map(o => (
                                <tr key={o._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}><code style={codeStyle}>{o.poNumber}</code></td>
                                    <td style={tdStyle}>{o.vendorName}</td>
                                    <td style={tdStyle}><span style={pillStyle}>{o.status}</span></td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>₹{money(o.grandTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Inventory Summary */}
            <section style={{ marginTop: '28px' }}>
                <h2 style={sectionHeading}>📦 Inventory - Stock Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <StatCard label="Warehouses" value={erp.inventory.totalWarehouses} />
                    <StatCard label="Stock Moves Recorded" value={erp.inventory.totalStockMoves} />
                    <StatCard label="Items with Negative Stock" value={erp.inventory.negativeStockCount} accent={erp.inventory.negativeStockCount > 0 ? '#dc2626' : '#166534'} />
                </div>

                <div style={tableWrap}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8f6fc' }}>
                                <th style={thStyle}>Item</th>
                                <th style={thStyle}>Warehouse</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Qty on Hand</th>
                            </tr>
                        </thead>
                        <tbody>
                            {erp.inventory.stockLevels.length === 0 && (
                                <tr><td colSpan={3} style={emptyStyle}>No stock recorded yet.</td></tr>
                            )}
                            {erp.inventory.stockLevels.map((l, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}>{l.itemName}</td>
                                    <td style={tdStyle}>{l.warehouseName}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: l.qty < 0 ? '#dc2626' : '#1e1b4b' }}>{l.qty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Expenses Summary */}
            <section style={{ marginTop: '28px' }}>
                <h2 style={sectionHeading}>🧾 Expenses - Claims Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <StatCard label="Total Claims" value={erp.expenses.totalExpenses} />
                    <StatCard label="Pending Approval Value" value={`₹${money(erp.expenses.pendingApprovalValue)}`} accent="#1d4ed8" />
                    <StatCard label="Total Paid" value={`₹${money(erp.expenses.totalPaidExpenses)}`} accent="#166534" />
                </div>

                <div style={tableWrap}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8f6fc' }}>
                                <th style={thStyle}>Expense #</th>
                                <th style={thStyle}>Employee</th>
                                <th style={thStyle}>Category</th>
                                <th style={thStyle}>Status</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {erp.expenses.recentExpenses.length === 0 && (
                                <tr><td colSpan={5} style={emptyStyle}>No expense claims recorded yet.</td></tr>
                            )}
                            {erp.expenses.recentExpenses.map(e => (
                                <tr key={e._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}><code style={codeStyle}>{e.expenseNumber}</code></td>
                                    <td style={tdStyle}>{e.employeeName}</td>
                                    <td style={tdStyle}>{e.category}</td>
                                    <td style={tdStyle}><span style={pillStyle}>{e.status}</span></td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>₹{money(e.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Accounting Summary */}
            <section style={{ marginTop: '28px' }}>
                <h2 style={sectionHeading}>💰 Accounting - Ledger Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <StatCard label="Total Income" value={`₹${money(erp.accounting.totalIncome)}`} accent="#166534" />
                    <StatCard label="Total Expense" value={`₹${money(erp.accounting.totalExpense)}`} accent="#dc2626" />
                    <StatCard label="Net" value={`₹${money(erp.accounting.net)}`} accent={erp.accounting.net >= 0 ? '#166534' : '#dc2626'} />
                    <StatCard label="Unreconciled Entries" value={erp.accounting.unreconciledCount} accent={erp.accounting.unreconciledCount > 0 ? '#92400e' : '#166534'} />
                </div>

                {erp.accounting.bankAccounts.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        {erp.accounting.bankAccounts.map(b => (
                            <div key={b._id} style={{ flex: '1 1 160px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', background: '#fff' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>{b.bankName}</div>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e1b4b' }}>₹{money(b.balance)}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={tableWrap}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8f6fc' }}>
                                <th style={thStyle}>Entry #</th>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Category</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Reconciled</th>
                            </tr>
                        </thead>
                        <tbody>
                            {erp.accounting.recentEntries.length === 0 && (
                                <tr><td colSpan={6} style={emptyStyle}>No ledger entries recorded yet.</td></tr>
                            )}
                            {erp.accounting.recentEntries.map(e => (
                                <tr key={e._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}><code style={codeStyle}>{e.entryNumber}</code></td>
                                    <td style={tdStyle}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td style={tdStyle}><span style={pillStyle}>{e.type}</span></td>
                                    <td style={tdStyle}>{e.category}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>{e.type === 'income' ? '+' : '−'}₹{money(e.amount)}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{e.reconciled ? '✓' : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* HR Summary */}
            <section style={{ marginTop: '28px' }}>
                <h2 style={sectionHeading}>👷 HR - Team Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <StatCard label="Total Employees" value={erp.hr.totalEmployees} />
                    <StatCard label="Active Employees" value={erp.hr.activeEmployees} accent="#166534" />
                    <StatCard label="Pending Leave Requests" value={erp.hr.pendingLeaveCount} accent={erp.hr.pendingLeaveCount > 0 ? '#92400e' : '#166534'} />
                    {erp.hr.latestPayrollRun && (
                        <StatCard label={`Latest Payroll (${erp.hr.latestPayrollRun.month}/${erp.hr.latestPayrollRun.year})`} value={`₹${money(erp.hr.latestPayrollRun.totalNet)}`} />
                    )}
                </div>

                <div style={tableWrap}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8f6fc' }}>
                                <th style={thStyle}>Employee #</th>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Designation</th>
                                <th style={thStyle}>Department</th>
                                <th style={thStyle}>Status</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Monthly Salary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {erp.hr.recentEmployees.length === 0 && (
                                <tr><td colSpan={6} style={emptyStyle}>No employees recorded yet.</td></tr>
                            )}
                            {erp.hr.recentEmployees.map(e => (
                                <tr key={e._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}><code style={codeStyle}>{e.employeeNumber}</code></td>
                                    <td style={tdStyle}>{e.name}</td>
                                    <td style={tdStyle}>{e.designation || '-'}</td>
                                    <td style={tdStyle}>{e.departmentName || '-'}</td>
                                    <td style={tdStyle}><span style={pillStyle}>{e.status}</span></td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>₹{money(e.salary)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function StatCard({ label, value, accent = '#4A1088' }) {
    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', background: '#fff' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: accent }}>{value}</div>
        </div>
    );
}

const sectionHeading = { fontSize: '15px', fontWeight: 800, color: '#2d1752', marginBottom: '14px', paddingBottom: '8px', borderBottom: '2px solid #ede9fe' };
const tableWrap = { background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' };
const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2d1752', borderBottom: '2px solid #ede9fe' };
const tdStyle = { padding: '12px 14px', color: '#374151' };
const emptyStyle = { padding: '32px', textAlign: 'center', color: '#9ca3af' };
const codeStyle = { background: '#f3f0f7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#6a3bb5' };
const pillStyle = { fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: '#f5f3f9', color: '#482683', fontWeight: 600, textTransform: 'capitalize' };
