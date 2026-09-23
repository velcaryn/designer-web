'use client';
/**
 * Accounting > Voucher Entry.
 *
 * The double-entry form. It shows a running Dr/Cr total and refuses to submit
 * while the two sides differ - the server refuses an unbalanced voucher too,
 * but discovering that after a round trip is a poor way to enter forty of them.
 *
 * Presentational: every value and every action arrives as a prop.
 */
import { groupLabel } from '@/lib/cloud/accounting/groups';
import { Plus, Receipt, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { money, VOUCHER_TYPE_LABELS } from './constants';

export default function VoucherEntryTab({ addVoucherRow, handlePostVoucher, ledgers, removeVoucherRow, setActiveTab, setVoucherDate, setVoucherNarration, setVoucherRef, setVoucherType, submittingVoucher, updateVoucherRow, voucherDate, voucherEntries, voucherNarration, voucherRef, voucherTotals, voucherType }) {
    return (
        <div style={{ background: 'var(--bg-white)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--secondary-color)', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--primary-color)" aria-hidden="true" />
                Create Double-Entry Voucher
            </h2>

            {/* Voucher Type Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '1.5rem' }}>
                {Object.entries(VOUCHER_TYPE_LABELS).slice(0, 6).map(([key, info]) => {
                    const isSelected = voucherType === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setVoucherType(key)}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                border: isSelected ? `2px solid ${info.color}` : '1px solid #e2e8f0',
                                background: isSelected ? info.bg : 'var(--bg-white)',
                                color: isSelected ? info.color : 'var(--text-main)',
                                fontWeight: isSelected ? '700' : '500',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                textAlign: 'center',
                            }}
                        >
                            {info.label}
                        </button>
                    );
                })}
            </div>

            <form onSubmit={handlePostVoucher}>
                {/* Header Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Voucher Date *</label>
                        <input
                            type="date"
                            required
                            value={voucherDate}
                            onChange={e => setVoucherDate(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Reference / Cheque No.</label>
                        <input
                            type="text"
                            placeholder="e.g. CHQ-991823 or INV-1002"
                            value={voucherRef}
                            onChange={e => setVoucherRef(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Narration</label>
                        <input
                            type="text"
                            placeholder="e.g. Being payment made towards monthly office rent..."
                            value={voucherNarration}
                            onChange={e => setVoucherNarration(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                        />
                    </div>
                </div>

                {/* Multi-Line Entry Grid */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--secondary-color)' }}>Accounting Entries (Dr / Cr)</span>
                        <button
                            type="button"
                            onClick={addVoucherRow}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'var(--bg-light)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                            <Plus size={14} aria-hidden="true" /> Add Line
                        </button>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-light)', textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '8px 12px', width: '90px' }}>Dr / Cr</th>
                                    <th style={{ padding: '8px 12px' }}>Particulars (Ledger)</th>
                                    <th style={{ padding: '8px 12px', width: '150px' }}>Amount (₹)</th>
                                    <th style={{ padding: '8px 12px' }}>Line Narration</th>
                                    <th style={{ padding: '8px 12px', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {voucherEntries.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 12px' }}>
                                            <select
                                                value={row.entryType}
                                                onChange={e => updateVoucherRow(idx, 'entryType', e.target.value)}
                                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', color: row.entryType === 'debit' ? '#16a34a' : '#dc2626', outline: 'none' }}
                                            >
                                                <option value="debit">By (Dr)</option>
                                                <option value="credit">To (Cr)</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <select
                                                value={row.ledgerId}
                                                onChange={e => updateVoucherRow(idx, 'ledgerId', e.target.value)}
                                                required
                                                style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                                            >
                                                <option value="">-- Select Ledger Account --</option>
                                                {ledgers.map(l => (
                                                    <option key={l._id} value={l._id}>
                                                        {l.name} - {groupLabel(l.groupCode)}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                placeholder="0.00"
                                                required
                                                value={row.amount}
                                                onChange={e => updateVoucherRow(idx, 'amount', e.target.value)}
                                                style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '600', outline: 'none' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <input
                                                type="text"
                                                placeholder="Line note (optional)"
                                                value={row.narration}
                                                onChange={e => updateVoucherRow(idx, 'narration', e.target.value)}
                                                style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => removeVoucherRow(idx)}
                                                style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                                            >
                                                <X size={16} aria-hidden="true" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Balance Validation Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: voucherTotals.isBalanced ? '#f0fdf4' : '#fef2f2', border: voucherTotals.isBalanced ? '1px solid #bbf7d0' : '1px solid #fecaca', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {voucherTotals.isBalanced ? (
                            <CheckCircle2 size={20} color="#16a34a" aria-hidden="true" />
                        ) : (
                            <AlertCircle size={20} color="#dc2626" aria-hidden="true" />
                        )}
                        <span style={{ fontWeight: '600', fontSize: '0.85rem', color: voucherTotals.isBalanced ? '#16a34a' : '#dc2626' }}>
                            {voucherTotals.isBalanced
                                ? 'Voucher is balanced (Total Debit = Total Credit).'
                                : `Unbalanced Voucher: Difference of ₹${money(voucherTotals.difference)}`}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', fontWeight: '700' }}>
                        <span>Total Dr: ₹{money(voucherTotals.totalDebit)}</span>
                        <span>Total Cr: ₹{money(voucherTotals.totalCredit)}</span>
                    </div>
                </div>

                {/* Submit Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'var(--bg-white)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!voucherTotals.isBalanced || submittingVoucher}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: voucherTotals.isBalanced ? 'var(--primary-color)' : '#94a3b8',
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: voucherTotals.isBalanced && !submittingVoucher ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {submittingVoucher ? 'Posting...' : 'Post Double-Entry Voucher'}
                    </button>
                </div>
            </form>
        </div>
    );
}
