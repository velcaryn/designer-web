'use client';
import { SERIES } from './format';
import { EmptyState } from './ChartCard';

/**
 * A proper funnel: tapering bars sized by count, with the conversion rate and
 * drop-off between consecutive stages rendered in the gap between them.
 */
export default function FunnelChart({ stages, onSelect, emptyLabel = 'No pipeline data for this period' }) {
    const list = (Array.isArray(stages) ? stages : []).map(s => ({
        id: s.stageId ?? s.status ?? s.stage ?? s.label,
        label: s.stage ?? s.label ?? s.status ?? '-',
        count: Number(s.count || 0),
        color: s.color,
        conversionFromPrev: s.conversionFromPrev,
        dropOffPct: s.dropOffPct,
    }));

    if (list.length === 0 || list.every(s => s.count === 0)) return <EmptyState label={emptyLabel} />;

    const max = Math.max(...list.map(s => s.count), 1);
    // Base the "share of funnel" column on the first stage that actually has
    // records - an empty first stage would otherwise make every row read 0%.
    const base = list.find(s => s.count > 0)?.count || 0;

    return (
        <div className="fn">
            {list.map((s, i) => {
                // An empty stage must read as empty - never give it a minimum bar.
                const width = s.count > 0 ? Math.max(6, (s.count / max) * 100) : 0;
                const color = s.color || SERIES[i % SERIES.length];
                const overall = base > 0 ? (s.count / base) * 100 : null;
                // Prefer the server's number; fall back to deriving it locally.
                const conv = s.conversionFromPrev ?? (i > 0 && list[i - 1].count > 0
                    ? (s.count / list[i - 1].count) * 100 : null);
                const drop = s.dropOffPct ?? (conv != null ? 100 - conv : null);

                return (
                    <div key={s.id || i} className="fn-step">
                        {i > 0 && conv != null && (
                            <div className="fn-connector">
                                <span className="fn-conv" style={{ color: conv >= 50 ? '#166534' : conv >= 25 ? '#92400e' : '#991b1b' }}>
                                    {/* Stages aren't strictly monotonic (records can enter mid-funnel),
                                        so phrase it as a ratio rather than claiming >100% "converted",
                                        and point the arrow the way the count actually moved. */}
                                    <span aria-hidden="true">{conv > 100 ? '↑' : '↓'}</span>{' '}
                                    {conv.toFixed(1)}% of previous stage
                                </span>
                                {drop != null && drop > 0 && (
                                    <span className="fn-drop">−{drop.toFixed(1)}% drop-off</span>
                                )}
                            </div>
                        )}
                        <button
                            type="button"
                            className={`fn-bar-row ${onSelect ? 'fn-click' : ''}`}
                            onClick={() => onSelect?.(s)}
                            disabled={!onSelect}
                            aria-label={`${s.label}: ${s.count} records`}
                        >
                            <span className="fn-label">{s.label}</span>
                            <span className="fn-track">
                                {s.count > 0 ? (
                                    <span className="fn-bar" style={{ width: `${width}%`, background: color }}>
                                        <span className="fn-count">{s.count.toLocaleString('en-IN')}</span>
                                    </span>
                                ) : <span className="fn-zero">0</span>}
                            </span>
                            <span className="fn-overall">{overall == null ? '-' : `${overall.toFixed(0)}%`}</span>
                        </button>
                    </div>
                );
            })}
            <style jsx>{`
                .fn { display: flex; flex-direction: column; }
                .fn-step { display: flex; flex-direction: column; }
                .fn-connector {
                    display: flex; align-items: center; gap: 10px; padding: 3px 0 3px 124px;
                    font-size: 10.5px; font-weight: 800; font-variant-numeric: tabular-nums;
                }
                .fn-drop { color: #94a3b8; font-weight: 700; }
                .fn-zero {
                    display: flex; align-items: center; height: 30px; padding: 0 10px;
                    font-size: 11.5px; font-weight: 800; color: #b6b0c9;
                    font-variant-numeric: tabular-nums;
                }
                .fn-bar-row {
                    display: flex; align-items: center; gap: 10px; width: 100%;
                    background: none; border: none; padding: 4px 6px; border-radius: 8px;
                    font-family: inherit; text-align: left;
                    transition: background 150ms ease;
                }
                .fn-click { cursor: pointer; }
                .fn-click:hover { background: var(--surface-sunken); }
                .fn-click:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 1px; }
                .fn-label {
                    width: 108px; flex-shrink: 0; font-size: 12px; font-weight: 700;
                    color: var(--secondary-color, #2d1753); text-transform: capitalize;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .fn-track { flex: 1; min-width: 0; background: var(--surface-sunken); border-radius: 6px; overflow: hidden; }
                .fn-bar {
                    display: flex; align-items: center; justify-content: flex-end;
                    height: 30px; border-radius: 6px; padding: 0 8px; min-width: 34px;
                    transition: width 300ms cubic-bezier(0.2, 0.8, 0.3, 1);
                }
                .fn-count {
                    font-size: 11.5px; font-weight: 800; color: #fff;
                    font-variant-numeric: tabular-nums; text-shadow: 0 1px 2px rgba(0,0,0,0.18);
                }
                .fn-overall {
                    width: 40px; flex-shrink: 0; text-align: right; font-size: 11px;
                    font-weight: 800; color: #94a3b8; font-variant-numeric: tabular-nums;
                }
                @media (max-width: 520px) {
                    .fn-label { width: 74px; font-size: 11px; }
                    .fn-connector { padding-left: 84px; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .fn-bar, .fn-bar-row { transition: none; }
                }
            `}</style>
        </div>
    );
}
