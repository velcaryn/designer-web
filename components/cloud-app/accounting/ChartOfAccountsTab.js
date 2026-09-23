'use client';
/**
 * Accounting > Chart of Accounts.
 *
 * The group tree, its pillar filter and its search. Purely presentational: the
 * expand/collapse state and the ledger list both live on the page, so the tree
 * keeps its open groups when you leave the tab and come back.
 *
 * Presentational: every value and every action arrives as a prop.
 */
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { money, drCr } from './constants';

export default function ChartOfAccountsTab({ coaGroups, coaPillarFilter, coaSearch, expandedGroups, setActiveTab, setCoaPillarFilter, setCoaSearch, setSelectedLedgerId, toggleGroupExpand }) {
    return (
        <div style={{ background: 'var(--bg-white)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            {/* Controls Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['ALL', 'Assets', 'Liabilities', 'Income', 'Expenses'].map(p => (
                        <button
                            key={p}
                            onClick={() => setCoaPillarFilter(p)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: coaPillarFilter === p ? '1px solid var(--primary-color)' : '1px solid #e2e8f0',
                                background: coaPillarFilter === p ? 'var(--primary-color)' : 'var(--bg-light)',
                                color: coaPillarFilter === p ? '#fff' : 'var(--text-main)',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', minWidth: '260px' }}>
                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Search groups or ledgers..."
                        value={coaSearch}
                        onChange={e => setCoaSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 34px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            {/* COA Groups List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {coaGroups
                    .filter(g => coaPillarFilter === 'ALL' || g.pillar === coaPillarFilter)
                    .filter(g => {
                        if (!coaSearch.trim()) return true;
                        const q = coaSearch.toLowerCase();
                        const groupMatch = g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);
                        const ledgerMatch = (g.ledgers || []).some(l => l.name.toLowerCase().includes(q) || (l.code && l.code.toLowerCase().includes(q)));
                        return groupMatch || ledgerMatch;
                    })
                    .map(group => {
                        const isExpanded = expandedGroups[group.code] !== false;
                        const ledgersCount = (group.ledgers || []).length;
                        return (
                            <div key={group.code} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                {/* Group Header */}
                                <div
                                    onClick={() => toggleGroupExpand(group.code)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'var(--bg-light)',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {isExpanded ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--secondary-color)' }}>
                                            {group.name}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#e2e8f0', color: 'var(--text-muted)' }}>
                                            {group.pillar}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            ({ledgersCount} {ledgersCount === 1 ? 'ledger' : 'ledgers'})
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--secondary-color)' }}>
                                            Debit: ₹{money(group.totalDebit)} | Credit: ₹{money(group.totalCredit)}
                                        </span>
                                    </div>
                                </div>

                                {/* Group Ledgers Table */}
                                {isExpanded && (
                                    <div style={{ overflowX: 'auto' }}>
                                        {ledgersCount === 0 ? (
                                            <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                No custom ledgers created under this group.
                                            </div>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-white)', borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)', textAlign: 'left' }}>
                                                        <th style={{ padding: '8px 16px' }}>Ledger Name</th>
                                                        <th style={{ padding: '8px 16px' }}>Type</th>
                                                        <th style={{ padding: '8px 16px', textAlign: 'right' }}>Total Debit (₹)</th>
                                                        <th style={{ padding: '8px 16px', textAlign: 'right' }}>Total Credit (₹)</th>
                                                        <th style={{ padding: '8px 16px', textAlign: 'right' }}>Closing Balance (₹)</th>
                                                        <th style={{ padding: '8px 16px', textAlign: 'center' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.ledgers.map(l => (
                                                        <tr key={l._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                            <td style={{ padding: '8px 16px', fontWeight: '600', color: 'var(--secondary-color)' }}>
                                                                {l.name}
                                                                {l.isSystem && (
                                                                    <span style={{ marginLeft: '6px', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: '#ede9fe', color: '#6d28d9' }}>
                                                                        System
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '8px 16px', color: 'var(--text-muted)' }}>
                                                                {l.normalBalance === 'debit' ? 'Dr Normal' : 'Cr Normal'}
                                                            </td>
                                                            <td style={{ padding: '8px 16px', textAlign: 'right', color: 'var(--text-main)' }}>
                                                                {money(l.totalDebit)}
                                                            </td>
                                                            <td style={{ padding: '8px 16px', textAlign: 'right', color: 'var(--text-main)' }}>
                                                                {money(l.totalCredit)}
                                                            </td>
                                                            <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: '700', color: l.closingBalanceType === 'debit' ? '#16a34a' : '#dc2626' }}>
                                                                {money(l.closingBalance)} {drCr(l.closingBalanceType)}
                                                            </td>
                                                            <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => { setSelectedLedgerId(l._id); setActiveTab('khata'); }}
                                                                    style={{ border: 'none', background: 'transparent', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                                                                >
                                                                    View Statement
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
