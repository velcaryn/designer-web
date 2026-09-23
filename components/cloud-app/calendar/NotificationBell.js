'use client';
import { useEffect, useRef, useState } from 'react';
import EventRow from './EventRow';
import { moneyCompact, SEVERITY_COLORS } from './eventMeta';
import { CheckCircle2 } from 'lucide-react';

/**
 * The notification bell.
 *
 * Critically, `alerts` is fetched from GET ?scope=alerts - an ALL-TIME scan -
 * and is never derived from the month grid's events. Deriving it from the grid
 * (the previous behaviour) meant the bell reported 5 overdue invoices while 16
 * were actually overdue, hiding ₹22L+ of debt whenever you weren't looking at
 * the right month. It also must not be affected by the type filter chips:
 * filters change what you're viewing, not what needs attention.
 */
export default function NotificationBell({ alerts, loading, onAction, onOpen }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);
        return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
    }, [open]);

    const summary = alerts?.summary;
    const groups = alerts?.groups || [];
    const total = summary?.totalActionable ?? 0;
    const critical = (summary?.overdueCount ?? 0) > 0;

    return (
        <div className="bell-wrap" ref={wrapRef}>
            <button
                type="button"
                className="bell-btn"
                onClick={() => setOpen(o => !o)}
                aria-label={`Notifications: ${total} item${total === 1 ? '' : 's'} need attention`}
                aria-expanded={open}
            >
                🔔
                {total > 0 && (
                    <span className={`bell-badge ${critical ? 'bell-badge-critical' : ''}`} data-testid="bell-badge">
                        {total > 99 ? '99+' : total}
                    </span>
                )}
            </button>

            {open && (
                <div className="bell-panel" role="dialog" aria-label="Notifications">
                    <div className="bell-panel-top">
                        <div className="bell-panel-title">🔔 Needs attention</div>
                        {summary && (
                            <div className="bell-panel-sum" data-testid="bell-summary">
                                {summary.overdueCount > 0
                                    ? <span className="bell-crit">{summary.overdueCount} overdue · {moneyCompact(summary.overdueAmount, summary.currency)}</span>
                                    : <span>Nothing overdue</span>}
                                <span className="bell-dot">·</span>
                                <span>{summary.todayCount} today</span>
                                <span className="bell-dot">·</span>
                                <span>{summary.next7Count} this week</span>
                            </div>
                        )}
                    </div>

                    <div className="bell-scroll">
                        {loading && !alerts && <div className="bell-empty">Loading alerts…</div>}
                        {!loading && total === 0 && (
                            <div className="bell-empty">
                                <div className="bell-empty-icon"><CheckCircle2 size={14} aria-hidden="true" /> </div>
                                <div className="bell-empty-title">You&apos;re all caught up</div>
                                <div className="bell-empty-sub">No overdue items and nothing due in the next 7 days.</div>
                            </div>
                        )}
                        {groups.map(g => {
                            const tone = SEVERITY_COLORS[g.severity] || SEVERITY_COLORS.info;
                            return (
                                <div key={g.key} className="bell-group">
                                    <div
                                        className="bell-group-head"
                                        style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
                                        data-testid={`bell-group-${g.key}`}
                                    >
                                        <span>{g.label}</span>
                                        <span className="bell-group-stats">
                                            {g.count} item{g.count === 1 ? '' : 's'}
                                            {g.amount > 0 ? ` · ${moneyCompact(g.amount)}` : ''}
                                        </span>
                                    </div>
                                    {g.items.map(ev => (
                                        <EventRow
                                            key={ev.id}
                                            event={ev}
                                            onAction={onAction}
                                            onOpen={(e) => { setOpen(false); onOpen?.(e); }}
                                        />
                                    ))}
                                    {g.count > g.items.length && (
                                        <div className="bell-more">+{g.count - g.items.length} more not shown</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style jsx>{`
                .bell-wrap { position: relative; }
                .bell-btn {
                    width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid #e2e0ea;
                    background: var(--bg-white); cursor: pointer; font-size: 17px; position: relative;
                    display: flex; align-items: center; justify-content: center; transition: background 0.2s ease;
                }
                .bell-btn:hover { background: var(--bg-light); }
                .bell-btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
                .bell-badge {
                    position: absolute; top: -6px; right: -6px; background: #64748b; color: #fff;
                    font-size: 10px; font-weight: 800; min-width: 18px; height: 18px; border-radius: 9px;
                    display: flex; align-items: center; justify-content: center; padding: 0 5px;
                    border: 2px solid var(--bg-white); font-variant-numeric: tabular-nums;
                }
                .bell-badge-critical { background: #dc2626; }

                .bell-panel {
                    position: absolute; top: calc(100% + 8px); right: 0; width: min(380px, calc(100vw - 32px));
                    max-height: 520px; background: var(--bg-white); border: 1px solid var(--border);
                    border-radius: 14px; box-shadow: 0 16px 44px rgba(45,23,82,0.20); z-index: 2600;
                    overflow: hidden; display: flex; flex-direction: column;
                    animation: bellIn 180ms cubic-bezier(0.25,0.8,0.25,1);
                }
                @keyframes bellIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
                .bell-panel-top { padding: 12px 15px; border-bottom: 1px solid #f0edf5; flex: 0 0 auto; }
                .bell-panel-title { font-weight: 800; font-size: 14px; color: var(--secondary-color); }
                .bell-panel-sum {
                    margin-top: 3px; font-size: 11.5px; color: var(--text-muted);
                    display: flex; gap: 5px; flex-wrap: wrap; font-variant-numeric: tabular-nums;
                }
                .bell-crit { color: #b91c1c; font-weight: 800; }
                .bell-dot { opacity: 0.5; }

                .bell-scroll { overflow-y: auto; flex: 1 1 auto; min-height: 0; }
                .bell-group + .bell-group { border-top: 1px solid #f0edf5; }
                .bell-group-head {
                    display: flex; justify-content: space-between; align-items: center; gap: 8px;
                    padding: 7px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.04em; border-bottom: 1px solid; position: sticky; top: 0; z-index: 1;
                }
                .bell-group-stats { text-transform: none; letter-spacing: 0; font-variant-numeric: tabular-nums; }
                .bell-more { padding: 7px 14px; font-size: 11px; color: var(--text-muted); }
                .bell-empty { padding: 32px 18px; text-align: center; color: var(--text-muted); }
                .bell-empty-icon { font-size: 26px; }
                .bell-empty-title { font-size: 14px; font-weight: 800; color: var(--secondary-color); margin-top: 6px; }
                .bell-empty-sub { font-size: 12px; margin-top: 3px; }

                /* On narrow screens the topbar wraps and the bell ends up near the
                   left edge, so a right-anchored panel hangs off-screen. Anchor
                   it left there instead. */
                @media (max-width: 640px) {
                    .bell-panel { left: 0; right: auto; width: calc(100vw - 40px); max-height: 70vh; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .bell-panel { animation: none; }
                    .bell-btn { transition: none; }
                }
            `}</style>
        </div>
    );
}
