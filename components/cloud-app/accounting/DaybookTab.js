'use client';
/**
 * Accounting > Daybook.
 *
 * Every voucher posted on one date, optionally filtered by type. The daybook is
 * the chronological view of the ledger, as opposed to the per-account view in
 * the ledger statement.
 *
 * Presentational: every value and every action arrives as a prop.
 */
import { money, voucherLabel, toneStyle, VOUCHER_TYPE_LABELS } from './constants';

export default function DaybookTab({ daybookData, daybookDate, daybookLoading, daybookTypeFilter, loadDaybook, setDaybookDate, setDaybookTypeFilter }) {
    return (
        <div style={{ background: 'var(--bg-white)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            {/* Daybook Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Transaction Date</label>
                        <input
                            type="date"
                            value={daybookDate}
                            onChange={e => setDaybookDate(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Voucher Type</label>
                        <select
                            value={daybookTypeFilter}
                            onChange={e => setDaybookTypeFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                        >
                            <option value="">All Voucher Types</option>
                            {/* Driven off the one label map rather than a second hardcoded
                                list, so these can never drift from the chips again. */}
                            {Object.keys(VOUCHER_TYPE_LABELS).map(t => (
                                <option key={t} value={t}>{VOUCHER_TYPE_LABELS[t].label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => loadDaybook(daybookDate, daybookTypeFilter)}
                        style={{ marginTop: '18px', padding: '8px 14px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: '#fff', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        Refresh
                    </button>
                </div>

                <div style={{ background: 'var(--bg-light)', padding: '8px 16px', borderRadius: '8px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Total Volume: </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--secondary-color)' }}>₹{money(daybookData.totalAmount)}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({daybookData.totalCount} vouchers)</span>
                </div>
            </div>

            {/* Daybook Vouchers List */}
            {daybookLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Daybook...</div>
            ) : daybookData.vouchers?.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No vouchers found for {daybookDate}.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {daybookData.vouchers.map(v => {
                        const badge = { label: voucherLabel(v.voucherType), style: toneStyle(VOUCHER_TYPE_LABELS[v.voucherType]?.tone || 'neutral') };
                        return (
                            <div key={v._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--bg-light)', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', ...badge.style }}>
                                            {badge.label}
                                        </span>
                                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>
                                            {v.voucherNumber}
                                        </span>
                                        {v.referenceNo && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Ref: {v.referenceNo}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--secondary-color)' }}>
                                        ₹{money(v.totalAmount)}
                                    </div>
                                </div>

                                {/* Multi-line breakdown */}
                                <div style={{ padding: '10px 16px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <tbody>
                                            {v.entries?.map((line, idx) => (
                                                <tr key={idx} style={{ borderBottom: idx === v.entries.length - 1 ? 'none' : '1px dashed #f1f5f9' }}>
                                                    <td style={{ padding: '6px 0', width: '40px', fontWeight: '700', color: line.entryType === 'debit' ? '#16a34a' : '#dc2626' }}>
                                                        {line.entryType === 'debit' ? 'By (Dr)' : 'To (Cr)'}
                                                    </td>
                                                    <td style={{ padding: '6px 12px', fontWeight: '600', color: 'var(--secondary-color)' }}>
                                                        {line.ledgerName}
                                                        {line.narration && <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontWeight: 'normal' }}>({line.narration})</span>}
                                                    </td>
                                                    <td style={{ padding: '6px 12px', textAlign: 'right', width: '120px', fontWeight: '600' }}>
                                                        ₹{money(line.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {v.narration && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                                            Narration: {v.narration}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
