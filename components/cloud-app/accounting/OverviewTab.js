'use client';
/**
 * Accounting > Overview.
 *
 * Presentational. Every value it renders and every action it can take arrives
 * as a prop, so the tab holds no opinion about how the ledger is loaded and can
 * be reasoned about without reading the page it sits in.
 */
import { Receipt, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { money, drCr, voucherLabel, toneStyle, VOUCHER_TYPE_LABELS } from './constants';

export default function OverviewTab({ metrics, ledgers, vouchers, setActiveTab, setSelectedLedgerId }) {
    return (
        <div>
            {/* Financial KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-white)', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Cash & Bank Balances</span>
                        <Wallet size={18} color="var(--primary-color)" aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary-color)' }}>
                        ₹{money(metrics.cashBankTotal)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Live Liquid Funds</span>
                </div>

                <div style={{ background: 'var(--bg-white)', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Accounts Receivable</span>
                        <ArrowDownLeft size={18} color="#16a34a" aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                        ₹{money(metrics.receivableTotal)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sundry Debtors (Clients)</span>
                </div>

                <div style={{ background: 'var(--bg-white)', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Accounts Payable</span>
                        <ArrowUpRight size={18} color="#dc2626" aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                        ₹{money(metrics.payableTotal)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sundry Creditors (Vendors)</span>
                </div>

                <div style={{ background: 'var(--bg-white)', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Net Profit / (Loss)</span>
                        <TrendingUp size={18} color={metrics.netProfit >= 0 ? '#16a34a' : '#dc2626'} aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: metrics.netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                        ₹{money(metrics.netProfit)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From Operating P&L</span>
                </div>
            </div>

            {/* Quick Split: Bank Accounts & Recent Vouchers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Bank Accounts Widget */}
                <div style={{ background: 'var(--bg-white)', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CreditCard size={18} color="var(--primary-color)" aria-hidden="true" />
                            Cash & Bank Ledgers
                        </h3>
                        <button onClick={() => setActiveTab('coa')} style={{ border: 'none', background: 'transparent', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                            View All Ledgers
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ledgers.filter(l => ['BANK_ACCOUNTS', 'CASH_IN_HAND'].includes(l.groupCode)).map(acc => (
                            <div
                                key={acc._id}
                                onClick={() => { setSelectedLedgerId(acc._id); setActiveTab('khata'); }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    background: 'var(--bg-light)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>{acc.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.groupCode === 'CASH_IN_HAND' ? 'Cash Account' : 'Commercial Bank Account'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: acc.closingBalanceType === 'debit' ? '#16a34a' : '#dc2626' }}>
                                        ₹{money(acc.closingBalance)} {drCr(acc.closingBalanceType)}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary-color)' }}>View Statement &rarr;</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Vouchers Feed */}
                <div style={{ background: 'var(--bg-white)', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Receipt size={18} color="var(--primary-color)" aria-hidden="true" />
                            Recent Double-Entry Vouchers
                        </h3>
                        <button onClick={() => setActiveTab('daybook')} style={{ border: 'none', background: 'transparent', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                            Open Daybook
                        </button>
                    </div>
                    {vouchers.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No vouchers recorded yet. Record your first voucher using the button above.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {vouchers.slice(0, 5).map(v => {
                                const badge = { label: voucherLabel(v.voucherType), style: toneStyle(VOUCHER_TYPE_LABELS[v.voucherType]?.tone || 'neutral') };
                                return (
                                    <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', ...badge.style }}>
                                                    {badge.label}
                                                </span>
                                                <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--secondary-color)' }}>{v.voucherNumber}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {new Date(v.date).toLocaleDateString('en-IN')} &bull; {v.narration || 'Journal transaction'}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--secondary-color)' }}>
                                            ₹{money(v.totalAmount)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
