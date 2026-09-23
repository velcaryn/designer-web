'use client';
import { SERIES, compactMoney, money } from './format';
import { EmptyState } from './ChartCard';

const RISK = {
    low: { fg: '#166534', bg: '#f0fdf4', border: '#bbf7d0', label: 'Low risk', copy: 'Revenue is well spread across clients.' },
    moderate: { fg: '#92400e', bg: '#fffbeb', border: '#fde68a', label: 'Moderate risk', copy: 'A few clients carry a meaningful share of revenue.' },
    high: { fg: '#991b1b', bg: '#fef2f2', border: '#fecaca', label: 'High risk', copy: 'Revenue is heavily dependent on a small number of clients.' },
};

/**
 * Share-of-total treemap for revenue by client, paired with the server's
 * concentration metrics as an explicit dependency-risk read-out.
 */
export default function ConcentrationCard({ byClient, concentration, onSelect }) {
    const clients = (Array.isArray(byClient) ? byClient : []).filter(c => Number(c?.revenue) > 0);
    if (clients.length === 0) return <EmptyState label="No client revenue in this period" />;

    const total = clients.reduce((s, c) => s + Number(c.revenue || 0), 0);
    const top = clients.slice(0, 12);
    const risk = RISK[concentration?.riskLevel] || RISK.moderate;

    return (
        <div className="cc">
            {concentration && (
                <div className="cc-risk" style={{ background: risk.bg, borderColor: risk.border }}>
                    <div className="cc-risk-head">
                        <span className="cc-risk-badge" style={{ color: risk.fg }}>{risk.label}</span>
                        {concentration.hhi != null && (
                            <span className="cc-hhi" title="Herfindahl-Hirschman Index (0–10,000). Higher means more concentrated.">
                                HHI {Math.round(concentration.hhi).toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                    <p className="cc-risk-copy">{risk.copy}</p>
                    <div className="cc-shares">
                        {[['Top 1', concentration.top1Share], ['Top 3', concentration.top3Share], ['Top 5', concentration.top5Share]].map(([label, v]) => (
                            <div key={label} className="cc-share">
                                <span className="cc-share-label">{label}</span>
                                <strong style={{ color: risk.fg }}>{v == null ? '-' : `${Number(v).toFixed(1)}%`}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="cc-tree">
                {top.map((c, i) => {
                    const share = c.share != null ? Number(c.share) : (total > 0 ? (c.revenue / total) * 100 : 0);
                    // Area-proportional-ish: flex-grow by revenue, with a floor so
                    // tiny clients stay readable rather than collapsing to slivers.
                    const grow = Math.max(share, 3);
                    const color = SERIES[i % SERIES.length];
                    return (
                        <button
                            key={c.id || c.name || i}
                            type="button"
                            className="cc-tile"
                            style={{ flexGrow: grow, flexBasis: `${Math.max(grow * 2.2, 88)}px`, background: color }}
                            onClick={() => onSelect?.(c)}
                            title={`${c.name} - ${money(c.revenue)} (${share.toFixed(1)}%)`}
                            aria-label={`${c.name}: ${money(c.revenue)}, ${share.toFixed(1)} percent of revenue`}
                        >
                            <span className="cc-tile-name">{c.name}</span>
                            <span className="cc-tile-val">{compactMoney(c.revenue)}</span>
                            <span className="cc-tile-share">{share.toFixed(1)}%</span>
                        </button>
                    );
                })}
            </div>
            <p className="cc-hint">Click a tile to drill into that client’s documents.</p>

            <style jsx>{`
                .cc { display: flex; flex-direction: column; gap: 12px; }
                .cc-risk { border: 1px solid; border-radius: 10px; padding: 10px 12px; }
                .cc-risk-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
                .cc-risk-badge { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                .cc-hhi { font-size: 10.5px; font-weight: 700; color: #6c757d; font-variant-numeric: tabular-nums; cursor: help; }
                .cc-risk-copy { font-size: 11.5px; color: #475569; margin: 4px 0 0; }
                .cc-shares { display: flex; gap: 20px; margin-top: 9px; }
                .cc-share-label {
                    display: block; font-size: 9px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.05em;
                }
                .cc-share strong { font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; }
                .cc-tree {
                    display: flex; flex-wrap: wrap; gap: 4px; align-content: flex-start;
                    border-radius: 10px; overflow: hidden;
                }
                .cc-tile {
                    display: flex; flex-direction: column; justify-content: flex-end;
                    min-width: 0; height: 76px; border: none; border-radius: 8px;
                    padding: 8px 10px; cursor: pointer; text-align: left; color: #fff;
                    font-family: inherit; overflow: hidden;
                    transition: transform 150ms ease, filter 150ms ease, box-shadow 150ms ease;
                }
                .cc-tile:hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 6px 16px rgba(45,23,83,0.18); }
                .cc-tile:focus-visible { outline: 2px solid #2d1753; outline-offset: 2px; }
                .cc-tile-name {
                    font-size: 11px; font-weight: 700; opacity: 0.92; overflow: hidden;
                    text-overflow: ellipsis; white-space: nowrap; margin-bottom: auto;
                }
                .cc-tile-val {
                    font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums;
                    letter-spacing: -0.02em; text-shadow: 0 1px 2px rgba(0,0,0,0.15);
                }
                .cc-tile-share { font-size: 10px; font-weight: 700; opacity: 0.85; font-variant-numeric: tabular-nums; }
                .cc-hint { font-size: 10.5px; color: #94a3b8; margin: 0; }
                @media (prefers-reduced-motion: reduce) {
                    .cc-tile { transition: none; }
                    .cc-tile:hover { transform: none; }
                }
            `}</style>
        </div>
    );
}
