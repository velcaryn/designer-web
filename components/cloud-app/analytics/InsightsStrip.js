'use client';
import Link from 'next/link';
import { SEVERITY } from './format';
import { Check } from 'lucide-react';

const ORDER = { critical: 0, warning: 1, positive: 2, info: 3 };

/**
 * Server-computed narrative callouts. Rendered most-severe-first, colour-coded,
 * with the metric given typographic weight so the strip scans in one pass.
 */
export default function InsightsStrip({ insights, loading }) {
    if (loading) {
        return (
            <div className="in-strip">
                {[0, 1, 2].map(i => (
                    <div key={i} className="in-skel">
                        <div className="skeleton-shimmer" style={{ width: '60%', height: 12, borderRadius: 6 }} />
                        <div className="skeleton-shimmer" style={{ width: '90%', height: 10, borderRadius: 6, marginTop: 10 }} />
                        <div className="skeleton-shimmer" style={{ width: '40%', height: 20, borderRadius: 6, marginTop: 12 }} />
                    </div>
                ))}
                <style jsx>{`
                    .in-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 18px; }
                    .in-skel { background: var(--bg-white, #fff); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
                `}</style>
            </div>
        );
    }

    const list = Array.isArray(insights) ? [...insights] : [];
    list.sort((a, b) => (ORDER[a?.severity] ?? 9) - (ORDER[b?.severity] ?? 9));

    if (list.length === 0) {
        return (
            <div className="in-quiet">
                <span className="in-quiet-icon" aria-hidden="true"><Check size={14} aria-hidden="true" /> </span>
                <div>
                    <strong>No issues detected this period</strong>
                    <p>Collections, concentration, conversion and stock levels are all within normal ranges.</p>
                </div>
                <style jsx>{`
                    .in-quiet {
                        display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
                        background: var(--status-success-bg); border: 1px solid #d6f0e2; border-radius: 12px;
                        padding: 14px 18px; color: #166534;
                    }
                    .in-quiet-icon {
                        width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%;
                        background: #16a34a; color: #fff; display: flex; align-items: center;
                        justify-content: center; font-size: 14px; font-weight: 800;
                    }
                    .in-quiet strong { font-size: 13.5px; font-weight: 800; display: block; }
                    .in-quiet p { margin: 2px 0 0; font-size: 12px; color: #3f7a5b; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="in-strip" role="list" aria-label="Key insights">
            {list.map((ins, i) => {
                const sev = SEVERITY[ins?.severity] || SEVERITY.info;
                return (
                    <article
                        key={ins?.id || i}
                        role="listitem"
                        className="in-card"
                        style={{ background: sev.bg, borderColor: sev.border }}
                    >
                        <div className="in-rail" style={{ background: sev.dot }} aria-hidden="true" />
                        <div className="in-body">
                            <div className="in-top">
                                <span className="in-sev" style={{ color: sev.fg }}>
                                    <span aria-hidden="true">{sev.icon}</span> {sev.label}
                                </span>
                                {ins?.metric != null && ins.metric !== '' && (
                                    <span className="in-metric" style={{ color: sev.fg }}>{ins.metric}</span>
                                )}
                            </div>
                            <h3 className="in-title" style={{ color: sev.fg }}>{ins?.title || 'Insight'}</h3>
                            {ins?.detail && <p className="in-detail">{ins.detail}</p>}
                            {ins?.actionHref && ins?.actionLabel && (
                                <Link href={ins.actionHref} className="in-action" style={{ color: sev.fg }}>
                                    {ins.actionLabel} <span aria-hidden="true">→</span>
                                </Link>
                            )}
                        </div>
                    </article>
                );
            })}
            <style jsx>{`
                .in-strip {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(268px, 1fr));
                    gap: 12px; margin-bottom: 18px;
                }
                .in-card {
                    display: flex; border: 1px solid; border-radius: 12px; overflow: hidden;
                    min-width: 0; transition: transform 150ms ease, box-shadow 150ms ease;
                }
                .in-card:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(45, 23, 83, 0.08); }
                .in-rail { width: 4px; flex-shrink: 0; }
                .in-body { padding: 12px 14px 13px; min-width: 0; flex: 1; }
                .in-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
                .in-sev {
                    font-size: 9.5px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.08em; opacity: 0.85;
                }
                .in-metric {
                    font-size: 19px; font-weight: 800; font-variant-numeric: tabular-nums;
                    letter-spacing: -0.02em; line-height: 1; white-space: nowrap;
                }
                .in-title { font-size: 13px; font-weight: 800; margin: 7px 0 0; line-height: 1.35; }
                .in-detail { font-size: 11.5px; color: #475569; margin: 5px 0 0; line-height: 1.5; }
                .in-action {
                    display: inline-block; margin-top: 9px; font-size: 11.5px; font-weight: 800;
                    text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px;
                }
                .in-action:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; border-radius: 2px; }
                @media (prefers-reduced-motion: reduce) {
                    .in-card { transition: none; }
                    .in-card:hover { transform: none; }
                }
            `}</style>
        </div>
    );
}
