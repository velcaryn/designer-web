'use client';
import { useState, useEffect } from 'react';
import { useCloudUser } from './layout';
import Link from 'next/link';
import { Bone } from '@/components/ui/skeleton';
import AttentionStrip from '@/components/cloud-app/home/AttentionStrip';

export default function CloudDashboardHome() {
    const user = useCloudUser();
    const [stats, setStats] = useState({ products: 0, clients: 0, documents: 0 });
    const [recentDocs, setRecentDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [home, setHome] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [insights, setInsights] = useState([]);
    const [attentionLoading, setAttentionLoading] = useState(true);

    useEffect(() => {
        // One consolidated read. This used to fetch the ENTIRE items, clients and
        // documents collections purely to call .length on them - three full
        // payloads for three integers.
        fetch('/api/cloud/erp/home')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) {
                    setStats({
                        products: d.counts.products,
                        clients: d.counts.clients,
                        documents: d.counts.documents,
                    });
                    setRecentDocs(d.recentDocs || []);
                    setHome(d);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Alerts and insights are NOT recomputed here - they come from the
        // engines that already own those definitions, so the home page can
        // never quietly disagree with Calendar or Analytics.
        fetch('/api/cloud/erp/calendar?scope=alerts')
            .then(r => r.ok ? r.json() : null)
            .then(setAlerts)
            .catch(() => {})
            .finally(() => setAttentionLoading(false));

        fetch('/api/cloud/erp/analytics')
            .then(r => r.ok ? r.json() : null)
            .then(d => setInsights(d?.insights || []))
            .catch(() => {});

        // Sub-users without the 'accounting' permission get a 403 here - that's expected,
        // the KPI/reporting section below simply doesn't render for them.
        fetch('/api/cloud/erp/reports/summary').then(r => r.ok ? r.json() : null).then(setReport).catch(() => {});
    }, []);

    const money = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="vco-dashboard">
            {/* Welcome Card */}
            <div className="vco-welcome-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* 1:1 Aspect Ratio White-Background Logo Container */}
                <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '20px',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
                    border: '3px solid rgba(255,255,255,0.4)',
                    padding: '12px',
                    aspectRatio: '1 / 1',
                    flexShrink: 0,
                    overflow: 'hidden'
                }}>
                    <img 
                        src={user?.branding?.brandLogo || '/vb-mark-light.svg'} 
                        alt={user?.businessName || 'Brand Logo'} 
                        style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain'
                        }} 
                    />
                </div>

                <h1 className="vco-welcome-title" style={{ textAlign: 'center' }}>
                    Welcome, {user?.name || user?.username || 'Rajan'} 👋
                </h1>
                <p className="vco-welcome-sub" style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 20px' }}>
                    Your workspace is active. Create quotes, manage products catalog, and share invoices instantly.
                </p>
                <div className="vco-header-actions" style={{ justifyContent: 'center' }}>
                    <Link href="/cloud/dashboard/documents/new?type=Quote" className="vco-btn-primary">📝 Create Quote</Link>
                    <Link href="/cloud/dashboard/documents/new?type=Invoice" className="vco-btn-primary">🧾 Create Invoice</Link>
                    <Link href="/cloud/dashboard/items" className="vco-btn-secondary">📦 Add Product</Link>
                </div>
            </div>

            {/* What needs attention, before any vanity metric */}
            <AttentionStrip alerts={alerts} insights={insights} loading={attentionLoading} />

            {/* Stats Grid */}
            <div className="vco-stats-grid">
                {[
                    { label: 'Products Catalog', value: stats.products, icon: '📦', color: 'var(--primary-color)' },
                    { label: 'Active Clients', value: stats.clients, icon: '👥', color: 'var(--primary-light)' },
                    { label: 'Total Documents', value: stats.documents, icon: '📄', color: 'var(--secondary-color)' },
                ].map((s, i) => (
                    <div key={i} className="vco-stat-card">
                        <div className="vco-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                        <div>
                            <div className="vco-stat-val">{loading ? '-' : s.value}</div>
                            <div className="vco-stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ERP Home Dashboard - KPIs, P&L, Receivables Aging, widgets (Phase 6b) */}
            {report && (
                <>
                    <div className="vco-kpi-grid">
                        <div className="vco-kpi-card">
                            <div className="vco-kpi-label">Total Revenue</div>
                            <div className="vco-kpi-val" style={{ color: '#166534' }}>{money(report.kpis.totalRevenue)}</div>
                        </div>
                        <div className="vco-kpi-card">
                            <div className="vco-kpi-label">Outstanding</div>
                            <div className="vco-kpi-val" style={{ color: '#b45309' }}>{money(report.kpis.outstanding)}</div>
                        </div>
                        <div className="vco-kpi-card">
                            <div className="vco-kpi-label">Expenses This Month</div>
                            <div className="vco-kpi-val" style={{ color: '#dc2626' }}>{money(report.kpis.expensesThisMonth)}</div>
                        </div>
                        <div className="vco-kpi-card">
                            <div className="vco-kpi-label">Cash in Bank</div>
                            {/* ₹0.00 read as a real balance when the truth was "no bank
                                account exists yet" - two very different situations. */}
                            {home && !home.bank?.configured ? (
                                <Link href="/cloud/dashboard/erp/accounting" className="vco-kpi-setup">
                                    Not set up - add an account →
                                </Link>
                            ) : (
                                <div className="vco-kpi-val" style={{ color: '#1d4ed8' }}>{money(report.kpis.cashInBank)}</div>
                            )}
                        </div>
                    </div>

                    <div className="vco-widget-grid">
                        <div className="vco-widget-card">
                            <h3 className="vco-widget-title">P&L Summary</h3>
                            <div className="vco-pnl-row"><span>Income</span><strong style={{ color: '#166534' }}>{money(report.profitAndLoss.income)}</strong></div>
                            <div className="vco-pnl-row"><span>Expense</span><strong style={{ color: '#dc2626' }}>{money(report.profitAndLoss.expense)}</strong></div>
                            <div className="vco-pnl-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                                <span>Net</span><strong style={{ color: report.profitAndLoss.net >= 0 ? '#166534' : '#dc2626' }}>{money(report.profitAndLoss.net)}</strong>
                            </div>
                        </div>

                        <div className="vco-widget-card">
                            <h3 className="vco-widget-title">Receivables Aging</h3>
                            {Object.entries(report.receivablesAging).every(([, v]) => v === 0) ? (
                                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No overdue invoices.</p>
                            ) : (
                                Object.entries(report.receivablesAging).map(([bucket, amount]) => (
                                    <div key={bucket} className="vco-pnl-row"><span>{bucket} days</span><strong style={{ color: amount > 0 ? '#dc2626' : '#94a3b8' }}>{money(amount)}</strong></div>
                                ))
                            )}
                        </div>

                        <div className="vco-widget-card">
                            <h3 className="vco-widget-title">Sales Pipeline & Inventory</h3>
                            <div className="vco-pnl-row"><span>Open Pipeline Value</span><strong style={{ color: 'var(--primary-color)' }}>{money(report.salesPipelineValue)}</strong></div>
                            <div className="vco-pnl-row"><span>Inventory Valuation</span><strong style={{ color: '#1d4ed8' }}>{money(report.kpis.inventoryValuation)}</strong></div>
                        </div>

                        <div className="vco-widget-card">
                            <h3 className="vco-widget-title">Expense Breakdown (this month)</h3>
                            {report.expenseBreakdown.length === 0 ? (
                                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No expenses recorded this month.</p>
                            ) : (
                                report.expenseBreakdown.slice(0, 5).map(e => (
                                    <div key={e.category} className="vco-pnl-row"><span>{e.category}</span><strong style={{ color: '#dc2626' }}>{money(e.amount)}</strong></div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Recent Documents Table & Collapsible Cards */}
            <div className="vco-list-container">
                <div className="vco-section-header">
                    <h3 className="vco-section-title">Recent Documents</h3>
                    <Link href="/cloud/dashboard/documents" className="vco-view-all-link">View All Documents →</Link>
                </div>

                {loading ? (
                    <div className="vco-table-scroll">
                        <div className="vco-list-header">
                            <div className="vco-col-id">Doc Number</div>
                            <div className="vco-col-date">Date Issued</div>
                            <div className="vco-col-items">Client Name</div>
                            <div className="vco-col-status">Type</div>
                            <div className="vco-col-total">Grand Total</div>
                        </div>
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="vco-row-wrapper">
                                <div className="vco-row">
                                    <div className="vco-col-id"><Bone w="90px" h="14px" /></div>
                                    <div className="vco-col-date"><Bone w="80px" h="13px" /></div>
                                    <div className="vco-col-items"><Bone w="140px" h="13px" /></div>
                                    <div className="vco-col-status"><Bone w="64px" h="20px" r="12px" /></div>
                                    <div className="vco-col-total" style={{ display: 'flex', justifyContent: 'flex-end' }}><Bone w="80px" h="14px" /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentDocs.length === 0 ? (
                    <div className="vco-empty">
                        <div className="vco-empty-icon">📄</div>
                        <h3>No Documents Generated</h3>
                        <p>Generate your first Quotation or Tax Invoice using the quick actions above.</p>
                    </div>
                ) : (
                    <div className="vco-table-scroll">
                        <div className="vco-list-header">
                            <div className="vco-col-id">Doc Number</div>
                            <div className="vco-col-date">Date Issued</div>
                            <div className="vco-col-items">Client Name</div>
                            <div className="vco-col-status">Type</div>
                            <div className="vco-col-total">Grand Total</div>
                        </div>
                        {recentDocs.map((doc, idx) => {
                            const isInvoice = doc.docType === 'Invoice';
                            const dateStr = new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                            return (
                                <div key={doc._id || idx} className="vco-row-wrapper">
                                    <div className="vco-row">
                                        <div className="vco-col-id">
                                            <strong>{doc.docNumber || 'Draft'}</strong>
                                        </div>
                                        <div className="vco-col-date">
                                            {dateStr}
                                        </div>
                                        <div className="vco-col-items">
                                            {doc.customer?.name || '-'}
                                        </div>
                                        <div className="vco-col-status">
                                            <span className="vco-status-badge" style={{
                                                background: isInvoice ? 'var(--accent-subtle)' : 'var(--status-info-bg)',
                                                color: isInvoice ? 'var(--accent)' : 'var(--status-info-fg)',
                                            }}>
                                                {doc.docType}
                                            </span>
                                        </div>
                                        <div className="vco-col-total">
                                            <strong>{money(doc.grandTotal)}</strong>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                /* ── Layout & Aestetics ─────────────────────────────────── */
                .vco-dashboard { display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px; }
                
                /* Welcome Card with Slanted Glass Background */
                .vco-welcome-card {
                    background: linear-gradient(135deg, #0f051d 0%, #1c093a 50%, #2b0b54 100%);
                    border-radius: 16px; padding: 32px; color: #ffffff !important;
                    box-shadow: 0 10px 30px rgba(74,16,136,0.3);
                }
                .vco-welcome-title { font-size: 26px; font-weight: 800; margin: 0 0 8px 0; color: #ffffff !important; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
                .vco-welcome-sub { font-size: 14px; color: rgba(255,255,255,0.85) !important; margin: 0 0 20px 0; line-height: 1.6; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
                
                /* Buttons styles */
                .vco-header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
                .vco-btn-primary { background: var(--primary-color); color: white; padding: 10px 20px; border-radius: 10px; font-size: 13.5px; font-weight: 700; text-decoration: none; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(72,38,131,0.25); }
                .vco-btn-primary:hover { opacity: 0.95; transform: translateY(-1px); }
                .vco-btn-secondary { background: rgba(255,255,255,0.1); color: white; padding: 10px 20px; border-radius: 10px; font-size: 13.5px; font-weight: 700; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); transition: all 0.2s; }
                .vco-btn-secondary:hover { background: rgba(255,255,255,0.2); }

                /* Stats Grid & Glass Cards */
                .vco-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
                .vco-kpi-setup {
                    display: inline-block; margin-top: 4px; font-size: 12.5px; font-weight: 600;
                    color: var(--primary-light); text-decoration: none;
                }
                .vco-kpi-setup:hover { text-decoration: underline; }
                .vco-stat-card { 
                    background: var(--bg-white); 
                    border: 1px solid rgba(167, 139, 250, 0.2); 
                    border-radius: 16px; 
                    padding: 20px; 
                    display: flex; 
                    align-items: center; 
                    gap: 16px; 
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15); 
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .vco-stat-card:hover { transform: translateY(-3px); boxShadow: 0 12px 30px rgba(124, 58, 237, 0.25); }
                .vco-stat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
                .vco-stat-val { font-size: 24px; font-weight: 800; color: var(--text-main); line-height: 1.1; }
                .vco-stat-label { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

                /* ERP Home Dashboard - KPIs & widgets */
                .vco-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
                .vco-kpi-card { background: var(--bg-white); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 14px; padding: 16px 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
                .vco-kpi-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
                .vco-kpi-val { font-size: 20px; font-weight: 800; }

                .vco-widget-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
                .vco-widget-card { background: var(--bg-white); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 14px; padding: 18px 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
                .vco-widget-title { font-size: 13.5px; font-weight: 800; color: var(--text-main); margin: 0 0 12px; }
                .vco-pnl-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-muted); padding: 5px 0; }

                /* List container & Data Tables */
                .vco-list-container { background: var(--bg-white); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
                .vco-section-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(167, 139, 250, 0.15); }
                .vco-section-title { font-size: 15px; font-weight: 700; color: var(--text-main); margin: 0; }
                .vco-view-all-link { font-size: 13px; color: var(--primary-light); font-weight: 600; text-decoration: none; }
                .vco-view-all-link:hover { text-decoration: underline; }

                /* Table styles */
                .vco-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .vco-list-header { display: flex; padding: 16px 24px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(167, 139, 250, 0.15); font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; min-width: 560px; }
                
                .vco-col-id { flex: 1.5; min-width: 120px; }
                .vco-col-date { flex: 1; min-width: 100px; }
                .vco-col-items { flex: 2; min-width: 180px; }
                .vco-col-status { flex: 1.2; min-width: 110px; }
                .vco-col-total { flex: 1.2; min-width: 110px; text-align: right; }

                .vco-row-wrapper { border-bottom: 1px solid rgba(255,255,255,0.06); }
                .vco-row-wrapper:last-child { border-bottom: none; }
                .vco-row { display: flex; align-items: center; padding: 16px 24px; min-width: 560px; }
                
                .vco-row .vco-col-id { color: var(--primary-light); font-family: monospace; font-size: 14px; }
                .vco-row .vco-col-date { color: var(--text-muted); font-size: 13.5px; }
                .vco-row .vco-col-items { color: var(--text-main); font-size: 13.5px; }
                
                .vco-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.02em; }

                /* Loading / Spinner */
                .vco-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #64748b; font-size: 14px; }
                .vco-spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Empty states */
                .vco-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; color: #64748b; }
                .vco-empty-icon { font-size: 40px; margin-bottom: 12px; }
                .vco-empty h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 6px 0; }
                .vco-empty p { font-size: 13.5px; margin: 0; }

                /* ── Mobile Responsive Standard (max-width: 640px) ── */
                @media (max-width: 640px) {
                    .vco-list-header { display: none; }
                    .vco-row { flex-wrap: wrap; gap: 8px; padding: 14px 16px; min-width: unset; }
                    .vco-col-id { flex: 0 0 100%; font-size: 14px !important; }
                    .vco-col-date { flex: 1; min-width: unset; font-size: 12px !important; color: #94a3b8 !important; }
                    .vco-col-status { flex: 0 0 auto; }
                    .vco-col-items { flex: 0 0 100%; font-size: 13px !important; color: #64748b !important; margin-top: 2px; }
                    .vco-col-total { flex: 0 0 100%; text-align: left; font-size: 15px !important; margin-top: 4px; }
                }
            `}</style>
        </div>
    );
}
