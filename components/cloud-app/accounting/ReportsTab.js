'use client';
/**
 * Accounting > Financial Statements.
 *
 * Trial balance, profit and loss, and balance sheet. The trial balance reports
 * its own imbalance honestly rather than asserting it is balanced, which is why
 * the out-of-balance banner exists and has to stay visible.
 *
 * Presentational: every value and every action arrives as a prop.
 */
import { money } from './constants';

export default function ReportsTab({ bsData, loadReports, plData, reportFromDate, reportLoading, reportSubTab, reportToDate, setReportFromDate, setReportSubTab, setReportToDate, trialBalanceData }) {
    return (
        <div style={{ background: 'var(--bg-white)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            {/* Sub-tab switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { id: 'trial-balance', label: 'Trial Balance' },
                        { id: 'pl', label: 'Profit & Loss Statement' },
                        { id: 'balance-sheet', label: 'Balance Sheet' },
                    ].map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => setReportSubTab(sub.id)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: reportSubTab === sub.id ? '1px solid var(--primary-color)' : '1px solid #e2e8f0',
                                background: reportSubTab === sub.id ? 'var(--primary-color)' : 'var(--bg-light)',
                                color: reportSubTab === sub.id ? '#fff' : 'var(--text-main)',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                            }}
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="date"
                        value={reportFromDate}
                        onChange={e => setReportFromDate(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
                    <input
                        type="date"
                        value={reportToDate}
                        onChange={e => setReportToDate(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                    />
                    <button
                        onClick={loadReports}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--secondary-color)', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Filter
                    </button>
                </div>
            </div>

            {reportLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Computing Financial Statements...</div>
            ) : (
                <>
                    {/* Sub-Tab 1: TRIAL BALANCE */}
                    {reportSubTab === 'trial-balance' && trialBalanceData && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--secondary-color)' }}>
                                    Trial Balance as of {reportToDate || 'Today'}
                                </h3>
                                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', background: trialBalanceData.totals?.isBalanced ? '#dcfce7' : '#fee2e2', color: trialBalanceData.totals?.isBalanced ? '#16a34a' : '#dc2626' }}>
                                    {trialBalanceData.totals?.isBalanced ? 'Balanced (Dr = Cr)' : 'Unbalanced'}
                                </span>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                                        <th style={{ padding: '10px 14px' }}>Particulars (Group / Ledger)</th>
                                        <th style={{ padding: '10px 14px' }}>Pillar</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Debit (₹)</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Credit (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trialBalanceData.groups?.map(g => (
                                        <tr key={g.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--secondary-color)' }}>
                                                {g.name}
                                            </td>
                                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                                {g.pillar}
                                            </td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: g.debit > 0 ? '600' : 'normal' }}>
                                                {g.debit > 0 ? money(g.debit) : '-'}
                                            </td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: g.credit > 0 ? '600' : 'normal' }}>
                                                {g.credit > 0 ? money(g.credit) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: 'var(--bg-light)', fontWeight: '700', borderTop: '2px solid #94a3b8' }}>
                                        <td colSpan={2} style={{ padding: '12px 14px' }}>Total Trial Balance:</td>
                                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#16a34a' }}>₹{money(trialBalanceData.totals?.debit)}</td>
                                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#dc2626' }}>₹{money(trialBalanceData.totals?.credit)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Sub-Tab 2: PROFIT & LOSS */}
                    {reportSubTab === 'pl' && plData && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                            {/* Trading Account (Gross Profit) */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700', color: 'var(--secondary-color)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                    Trading Account (Direct Revenue & Cost)
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                        <span>Direct Sales & Incomes:</span>
                                        <span style={{ color: '#16a34a' }}>₹{money(plData.tradingAccount?.directIncomes?.total)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                        <span>Less: Purchases & Direct Expenses:</span>
                                        <span style={{ color: '#dc2626' }}>₹{money(plData.tradingAccount?.directExpenses?.total)}</span>
                                    </div>
                                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1rem' }}>
                                        <span>Gross Profit:</span>
                                        <span style={{ color: plData.tradingAccount?.grossProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                                            ₹{money(plData.tradingAccount?.grossProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Operating P&L (Net Profit) */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700', color: 'var(--secondary-color)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                    Operating Profit & Loss Account
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                        <span>Gross Profit b/f:</span>
                                        <span>₹{money(plData.tradingAccount?.grossProfit)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                        <span>Add: Indirect Incomes:</span>
                                        <span style={{ color: '#16a34a' }}>₹{money(plData.operatingAccount?.indirectIncomes?.total)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                        <span>Less: Operating Expenses:</span>
                                        <span style={{ color: '#dc2626' }}>₹{money(plData.operatingAccount?.indirectExpenses?.total)}</span>
                                    </div>
                                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.05rem' }}>
                                        <span>Net Profit / (Loss):</span>
                                        <span style={{ color: plData.operatingAccount?.netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                                            ₹{money(plData.operatingAccount?.netProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sub-Tab 3: BALANCE SHEET */}
                    {reportSubTab === 'balance-sheet' && bsData && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--secondary-color)' }}>
                                    Balance Sheet as of {reportToDate || 'Today'}
                                </h3>
                                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', background: bsData.isBalanced ? '#dcfce7' : '#fee2e2', color: bsData.isBalanced ? '#16a34a' : '#dc2626' }}>
                                    {bsData.isBalanced ? 'Balanced (Liabilities = Assets)' : 'Discrepancy'}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                {/* Liabilities & Capital Column */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                                    <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--secondary-color)', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                                        Liabilities & Capital
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Capital Account & Retained Earnings:</span>
                                            <strong>₹{money(bsData.liabilities?.capital?.total)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Loans (Liability):</span>
                                            <strong>₹{money(bsData.liabilities?.loans?.total)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Current Liabilities (Creditors & Taxes):</span>
                                            <strong>₹{money(bsData.liabilities?.currentLiabilities?.total)}</strong>
                                        </div>
                                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1rem', color: 'var(--secondary-color)' }}>
                                            <span>Total Liabilities:</span>
                                            <span>₹{money(bsData.liabilities?.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Assets Column */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                                    <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--secondary-color)', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                                        Assets
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                                        {bsData.assets?.sections?.map(sec => (
                                            <div key={sec.title} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{sec.title}:</span>
                                                <strong>₹{money(sec.total)}</strong>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1rem', color: 'var(--secondary-color)' }}>
                                            <span>Total Assets:</span>
                                            <span>₹{money(bsData.assets?.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
