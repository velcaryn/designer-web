'use client';
/**
 * Accounting > create a custom ledger.
 *
 * Rendered by the page rather than by a tab, because a ledger can be created
 * from anywhere in the section.
 *
 * Presentational: every value and every action arrives as a prop.
 */
import { X } from 'lucide-react';

export default function NewLedgerModal({ coaGroups, handleCreateLedger, ledgerForm, setLedgerForm, setShowLedgerModal }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'var(--bg-white)', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--secondary-color)' }}>
                        Create New Ledger Account
                    </h3>
                    <button onClick={() => setShowLedgerModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleCreateLedger}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Ledger Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. HDFC Bank Current A/c or Kaveri Healthcare"
                                value={ledgerForm.name}
                                onChange={e => setLedgerForm(p => ({ ...p, name: e.target.value }))}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Under Group *</label>
                            <select
                                value={ledgerForm.groupCode}
                                onChange={e => setLedgerForm(p => ({ ...p, groupCode: e.target.value }))}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                            >
                                {coaGroups.map(g => (
                                    <option key={g.code} value={g.code}>
                                        {g.name} - {g.pillar}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Opening Balance (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={ledgerForm.openingBalance}
                                    onChange={e => setLedgerForm(p => ({ ...p, openingBalance: e.target.value }))}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Dr / Cr</label>
                                <select
                                    value={ledgerForm.openingBalanceType}
                                    onChange={e => setLedgerForm(p => ({ ...p, openingBalanceType: e.target.value }))}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                                >
                                    <option value="debit">Dr</option>
                                    <option value="credit">Cr</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>GSTIN (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="33AAAAA0000A1Z5"
                                    value={ledgerForm.gstin}
                                    onChange={e => setLedgerForm(p => ({ ...p, gstin: e.target.value }))}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>PAN (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="ABCDE1234F"
                                    value={ledgerForm.pan}
                                    onChange={e => setLedgerForm(p => ({ ...p, pan: e.target.value }))}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>Description / Notes</label>
                            <input
                                type="text"
                                placeholder="Optional description"
                                value={ledgerForm.description}
                                onChange={e => setLedgerForm(p => ({ ...p, description: e.target.value }))}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setShowLedgerModal(false)}
                            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'var(--bg-white)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: '#fff', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Create Ledger
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
