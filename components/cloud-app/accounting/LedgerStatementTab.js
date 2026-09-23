'use client';
/**
 * Accounting > Ledger Statement.
 *
 * One ledger's running account over a date range - what an accountant means by
 * a khata. The statement itself is fetched by the page; this renders it.
 *
 * Presentational: every value and every action arrives as a prop.
 */
import { groupLabel } from '@/lib/cloud/accounting/groups';
import { Printer } from 'lucide-react';
import { money, drCr, voucherLabel, toneStyle, VOUCHER_TYPE_LABELS } from './constants';

export default function LedgerStatementTab({ khataFromDate, khataLoading, khataStatement, khataToDate, ledgers, loadKhataStatement, selectedLedgerId, setKhataFromDate, setKhataToDate, setSelectedLedgerId }) {
    return (
        <div style={{ background: 'var(--bg-white)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            {/* Ledger Selector & Date Filter Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Select Account Ledger</label>
                        <select
                            value={selectedLedgerId}
                            onChange={e => setSelectedLedgerId(e.target.value)}
                            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: '600', color: 'var(--secondary-color)', minWidth: '240px', outline: 'none' }}
                        >
                            {ledgers.map(l => (
                                <option key={l._id} value={l._id}>
                                    {l.name} - {groupLabel(l.groupCode)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>From Date</label>
                        <input
                            type="date"
                            value={khataFromDate}
                            onChange={e => setKhataFromDate(e.target.value)}
                            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>To Date</label>
                        <input
                            type="date"
                            value={khataToDate}
                            onChange={e => setKhataToDate(e.target.value)}
                            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                        />
                    </div>

                    <button
                        onClick={() => loadKhataStatement(selectedLedgerId, khataFromDate, khataToDate)}
                        style={{ marginTop: '18px', padding: '8px 14px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: '#fff', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        Apply Filter
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => window.print()}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'var(--bg-light)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                        <Printer size={15} aria-hidden="true" />
                        Print Khata
                    </button>
                </div>
            </div>

            {/* Statement Table */}
            {khataLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ledger statement...</div>
            ) : !khataStatement ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Please select a ledger to view statement.</div>
            ) : (
                <div>
                    {/* Statement Header Card */}
                    <div style={{ background: 'var(--bg-light)', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--secondary-color)' }}>
                                {khataStatement.ledger?.name}
                            </h2>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {/* The human group name, not the SCREAMING_SNAKE code. Ledger
                                    documents persist groupCode but not the group's name, so this
                                    used to render "Group: SUNDRY_DEBTORS - Pillar: Assets". */}
                                <strong>{groupLabel(khataStatement.ledger?.groupCode)}</strong> &bull; {khataStatement.ledger?.pillar}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Closing Balance</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: khataStatement.totals?.closingBalanceType === 'debit' ? '#16a34a' : '#dc2626' }}>
                                ₹{money(khataStatement.totals?.closingBalance)} {drCr(khataStatement.totals?.closingBalanceType)}
                            </div>
                        </div>
                    </div>

                    {/* Ledger Transactions Grid */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--secondary-color)', color: '#fff', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px' }}>Date</th>
                                    <th style={{ padding: '10px 14px' }}>Vch Type</th>
                                    <th style={{ padding: '10px 14px' }}>Vch No.</th>
                                    <th style={{ padding: '10px 14px' }}>Particulars (Counter Account)</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Debit (₹)</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Credit (₹)</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Running Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Opening Balance Row */}
                                <tr style={{ background: '#f8fafc', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '10px 14px' }}>{khataStatement.openingBalance?.date ? new Date(khataStatement.openingBalance.date).toLocaleDateString('en-IN') : '-'}</td>
                                    <td style={{ padding: '10px 14px' }}>Opening</td>
                                    <td style={{ padding: '10px 14px' }}>-</td>
                                    <td style={{ padding: '10px 14px', fontStyle: 'italic' }}>Opening Balance b/f</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>{khataStatement.openingBalance?.debit ? money(khataStatement.openingBalance.debit) : '-'}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>{khataStatement.openingBalance?.credit ? money(khataStatement.openingBalance.credit) : '-'}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700' }}>
                                        ₹{money(khataStatement.openingBalance?.balance)} {drCr(khataStatement.openingBalance?.balanceType)}
                                    </td>
                                </tr>

                                {/* Transaction Rows */}
                                {khataStatement.transactions?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No transactions recorded in this period.
                                        </td>
                                    </tr>
                                ) : (
                                    khataStatement.transactions?.map(row => {
                                        const badge = { label: voucherLabel(row.voucherType), style: toneStyle(VOUCHER_TYPE_LABELS[row.voucherType]?.tone || 'neutral') };
                                        return (
                                            <tr key={row._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px 14px', color: 'var(--text-main)' }}>
                                                    {new Date(row.date).toLocaleDateString('en-IN')}
                                                </td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', ...badge.style }}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--secondary-color)' }}>
                                                    {row.voucherNumber}
                                                </td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <div style={{ fontWeight: '600', color: 'var(--secondary-color)' }}>{row.particulars}</div>
                                                    {row.narration && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.narration}</div>}
                                                </td>
                                                <td style={{ padding: '10px 14px', textAlign: 'right', color: row.debit > 0 ? '#16a34a' : 'inherit', fontWeight: row.debit > 0 ? '600' : 'normal' }}>
                                                    {row.debit > 0 ? money(row.debit) : '-'}
                                                </td>
                                                <td style={{ padding: '10px 14px', textAlign: 'right', color: row.credit > 0 ? '#dc2626' : 'inherit', fontWeight: row.credit > 0 ? '600' : 'normal' }}>
                                                    {row.credit > 0 ? money(row.credit) : '-'}
                                                </td>
                                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700' }}>
                                                    ₹{money(row.balance)} {drCr(row.balanceType)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}

                                {/* Totals Row */}
                                <tr style={{ background: 'var(--bg-light)', fontWeight: '700', borderTop: '2px solid #cbd5e1' }}>
                                    <td colSpan={4} style={{ padding: '12px 14px', textAlign: 'right' }}>Total Period Activity & Closing:</td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#16a34a' }}>₹{money(khataStatement.totals?.debit)}</td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#dc2626' }}>₹{money(khataStatement.totals?.credit)}</td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--primary-color)' }}>
                                        ₹{money(khataStatement.totals?.closingBalance)} {drCr(khataStatement.totals?.closingBalanceType)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
