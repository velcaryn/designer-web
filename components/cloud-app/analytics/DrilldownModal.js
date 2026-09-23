'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { money, shortDate, compactMoney } from './format';
import { X } from 'lucide-react';

const DIM_LABEL = {
    client: 'Client', item: 'Item', agingBucket: 'Aging bucket', soStatus: 'Sales order status',
    leadStage: 'Lead stage', paymentMethod: 'Payment method', period: 'Period',
};

/**
 * Click-through from any chart element to the underlying documents.
 * Fetches /api/cloud/erp/analytics/drilldown and lists up to 100 rows.
 */
export default function DrilldownModal({ target, from, to, onClose, onFilterHere }) {
    const [state, setState] = useState({ loading: true, error: '', data: null });
    const closeRef = useRef(null);

    const dimension = target?.dimension;
    const value = target?.value;

    const load = useCallback(async () => {
        if (!dimension) return;
        setState({ loading: true, error: '', data: null });
        try {
            const params = new URLSearchParams({ dimension, value: String(value ?? ''), from, to });
            const res = await fetch(`/api/cloud/erp/analytics/drilldown?${params}`);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || `Drill-down failed (${res.status})`);
            setState({ loading: false, error: '', data: json });
        } catch (err) {
            setState({ loading: false, error: err.message || 'Failed to load records', data: null });
        }
    }, [dimension, value, from, to]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        closeRef.current?.focus();
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    if (!target) return null;
    const { loading, error, data } = state;
    const rows = data?.rows || [];

    return (
        <div className="dd-overlay" role="dialog" aria-modal="true" aria-label="Drill-down records" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="dd-panel">
                <div className="dd-head">
                    <div className="dd-headtext">
                        <span className="dd-dim">{DIM_LABEL[dimension] || dimension}</span>
                        <h2 className="dd-title">{target.label || String(value)}</h2>
                    </div>
                    <button ref={closeRef} type="button" className="dd-close" onClick={onClose} aria-label="Close drill-down"><X size={14} aria-hidden="true" /> </button>
                </div>

                <div className="dd-summary">
                    <div className="dd-stat">
                        <span className="dd-stat-label">Records</span>
                        <strong>{loading ? '-' : (data?.totalCount ?? rows.length).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="dd-stat">
                        <span className="dd-stat-label">Total value</span>
                        <strong title={money(data?.totalAmount)}>{loading ? '-' : compactMoney(data?.totalAmount)}</strong>
                    </div>
                    {onFilterHere && (
                        <button type="button" className="dd-filterbtn" onClick={() => { onFilterHere(target); onClose(); }}>
                            Filter dashboard to this
                        </button>
                    )}
                </div>

                <div className="dd-body">
                    {loading && (
                        <div className="dd-skel">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="skeleton-shimmer" style={{ height: 34, borderRadius: 8, marginBottom: 8, opacity: 1 - i * 0.12 }} />
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="dd-msg dd-err">
                            <strong>Couldn’t load records</strong>
                            <p>{error}</p>
                            <button type="button" className="dd-retry" onClick={load}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && rows.length === 0 && (
                        <div className="dd-msg">
                            <strong>No records</strong>
                            <p>Nothing matched this selection in the current date range.</p>
                        </div>
                    )}

                    {!loading && !error && rows.length > 0 && (
                        <div className="dd-tablewrap">
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Document</th><th>Date</th><th>Client</th>
                                        <th className="dd-num">Amount</th><th>Status</th>
                                        <th className="dd-num">Balance</th><th aria-label="Links" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={r.id || i}>
                                            <td>
                                                <span className="dd-type">{r.type}</span>
                                                <span className="dd-doc">{r.docNumber || '-'}</span>
                                            </td>
                                            <td className="dd-muted">{shortDate(r.date)}</td>
                                            <td className="dd-ellip" title={r.client}>{r.client || '-'}</td>
                                            <td className="dd-num dd-strong">{money(r.amount)}</td>
                                            <td><span className="dd-status">{r.status || '-'}</span></td>
                                            <td className="dd-num" style={{ color: r.balanceDue > 0 ? '#991b1b' : '#94a3b8' }}>
                                                {r.balanceDue ? money(r.balanceDue) : '-'}
                                            </td>
                                            <td className="dd-links">
                                                {r.href && <Link href={r.href} className="dd-link">Open</Link>}
                                                {r.pdfHref && <a href={r.pdfHref} target="_blank" rel="noopener noreferrer" className="dd-link">PDF</a>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {rows.length >= 100 && <p className="dd-cap">Showing the 100 most recent records.</p>}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .dd-overlay {
                    position: fixed; inset: 0; background: rgba(26, 10, 46, 0.45);
                    backdrop-filter: blur(2px); z-index: 1000;
                    display: flex; align-items: center; justify-content: center; padding: 20px;
                    animation: ddfade 180ms ease;
                }
                @keyframes ddfade { from { opacity: 0; } to { opacity: 1; } }
                .dd-panel {
                    background: var(--bg-white, #fff); border-radius: 16px; width: min(980px, 100%);
                    max-height: min(86vh, 820px); display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 24px 60px rgba(26, 10, 46, 0.35);
                    animation: ddrise 200ms cubic-bezier(0.2, 0.8, 0.3, 1);
                }
                @keyframes ddrise { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }
                .dd-head {
                    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
                    padding: 16px 18px 12px; border-bottom: 1px solid #f0ecfb;
                }
                .dd-dim {
                    font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.08em;
                }
                .dd-title {
                    font-size: 17px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    margin: 3px 0 0; letter-spacing: -0.02em; word-break: break-word;
                }
                .dd-close {
                    border: none; background: var(--surface-hover); color: #4a3aa7; width: 30px; height: 30px;
                    border-radius: 8px; font-size: 20px; line-height: 1; cursor: pointer;
                    flex-shrink: 0; font-family: inherit; transition: background 150ms ease;
                }
                .dd-close:hover { background: var(--accent-subtle); }
                .dd-summary {
                    display: flex; gap: 22px; align-items: center; flex-wrap: wrap;
                    padding: 12px 18px; background: var(--surface-sunken); border-bottom: 1px solid #f0ecfb;
                }
                .dd-stat-label {
                    display: block; font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .dd-stat strong {
                    font-size: 16px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums;
                }
                .dd-filterbtn {
                    margin-left: auto; border: 1.5px solid #ddd3fb; background: var(--surface); color: #4a3aa7;
                    border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 800;
                    cursor: pointer; font-family: inherit; transition: background 150ms ease;
                }
                .dd-filterbtn:hover { background: var(--surface-hover); }
                .dd-body { overflow: auto; padding: 14px 18px 18px; flex: 1; }
                .dd-skel { padding: 4px 0; }
                .dd-msg { text-align: center; padding: 44px 20px; color: #6c757d; }
                .dd-msg strong { display: block; font-size: 14px; color: var(--secondary-color, #2d1753); }
                .dd-msg p { font-size: 12.5px; margin: 6px 0 0; }
                .dd-err strong { color: #991b1b; }
                .dd-retry {
                    margin-top: 12px; border: 1.5px solid #e2e0ea; background: var(--surface); border-radius: 8px;
                    padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
                }
                .dd-tablewrap { overflow-x: auto; }
                .dd-table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 720px; }
                .dd-table th {
                    text-align: left; font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 10px;
                    border-bottom: 2px solid #f0ecfb; position: sticky; top: 0; background: var(--bg-white, #fff);
                }
                .dd-table td { padding: 9px 10px; border-bottom: 1px solid #f6f4fb; vertical-align: middle; }
                .dd-table tbody tr { transition: background 120ms ease; }
                .dd-table tbody tr:hover { background: var(--surface-sunken); }
                .dd-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
                .dd-strong { font-weight: 700; color: var(--secondary-color, #2d1753); }
                .dd-muted { color: #6c757d; white-space: nowrap; }
                .dd-type {
                    display: block; font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.05em;
                }
                .dd-doc { font-weight: 700; color: var(--secondary-color, #2d1753); }
                .dd-ellip { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .dd-status {
                    display: inline-block; font-size: 10.5px; font-weight: 700; text-transform: capitalize;
                    background: var(--surface-hover); color: #4a3aa7; padding: 2px 8px; border-radius: 20px;
                }
                .dd-links { white-space: nowrap; text-align: right; }
                .dd-link {
                    font-size: 11.5px; font-weight: 800; color: #4a3aa7; text-decoration: none;
                    margin-left: 8px; border-bottom: 1px solid transparent;
                }
                .dd-link:hover { border-bottom-color: currentColor; }
                .dd-cap { font-size: 11px; color: #94a3b8; text-align: center; margin: 12px 0 0; }
                .dd-close:focus-visible, .dd-filterbtn:focus-visible, .dd-retry:focus-visible, .dd-link:focus-visible {
                    outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 2px;
                }
                @media (max-width: 640px) {
                    .dd-overlay { padding: 0; align-items: flex-end; }
                    .dd-panel { max-height: 92vh; border-radius: 16px 16px 0 0; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .dd-overlay, .dd-panel { animation: none; }
                }
            `}</style>
        </div>
    );
}
