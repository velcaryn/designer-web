'use client';
import { styleFor, relativeDayLabel, urgencyTone, money, formatDate } from './eventMeta';

/**
 * One richly-described actionable item. Used by the notification panel, the
 * agenda view and the day modal so all three read identically.
 *
 * The user's explicit ask was that these be "very informative" - so every row
 * states what it is, who it's for, how much money is at stake, the actual date,
 * and how late it is, with severity colouring rather than a bare title.
 */
export default function EventRow({ event, onAction, onOpen }) {
    const s = styleFor(event.type);
    const tone = urgencyTone(event.urgency);
    const isOverdue = event.urgency === 'overdue';

    return (
        <div className={`ev-row ${isOverdue ? 'ev-row-overdue' : ''}`}>
            <span className="ev-icon" style={{ background: s.bg, color: s.color }} aria-hidden="true">{s.icon}</span>
            <div className="ev-body">
                <button type="button" className="ev-title" onClick={() => onOpen?.(event)}>
                    {event.title}
                </button>
                <div className="ev-meta">
                    {event.subtitle && <span className="ev-sub">{event.subtitle}</span>}
                    {event.amount ? <span className="ev-amount">{money(event.amount, event.currency)}</span> : null}
                </div>
                <div className="ev-when">
                    <span className="ev-badge" style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}>
                        {relativeDayLabel(event.daysFromToday)}
                    </span>
                    <span className="ev-date">{formatDate(event.date)}</span>
                </div>
                {event.actions?.length > 0 && (
                    <div className="ev-actions">
                        {event.actions.map(a => (a.href ? (
                            <a
                                key={a.key}
                                href={a.href}
                                target={a.href.startsWith('/api/') ? '_blank' : undefined}
                                rel="noreferrer"
                                className="ev-action"
                            >{a.label}</a>
                        ) : (
                            <button key={a.key} type="button" className="ev-action" onClick={() => onAction?.(a.key, event)}>
                                {a.label}
                            </button>
                        )))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .ev-row {
                    display: flex; gap: 10px; align-items: flex-start;
                    padding: 11px 14px; border-bottom: 1px solid #f3f0fa;
                    background: var(--bg-white); transition: background 0.2s ease;
                }
                .ev-row:last-child { border-bottom: none; }
                .ev-row:hover { background: var(--surface-sunken); }
                .ev-row-overdue { border-left: 3px solid #dc2626; padding-left: 11px; }
                .ev-icon {
                    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center; font-size: 14px;
                }
                .ev-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
                .ev-title {
                    background: none; border: none; padding: 0; margin: 0; text-align: left;
                    font-family: inherit; font-size: 13px; font-weight: 700; color: var(--text-main);
                    cursor: pointer; line-height: 1.3;
                }
                .ev-title:hover { color: var(--primary-color); text-decoration: underline; }
                .ev-title:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
                .ev-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; font-size: 11.5px; }
                .ev-sub { color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; }
                .ev-amount { font-weight: 800; color: var(--secondary-color); font-variant-numeric: tabular-nums; font-size: 12.5px; }
                .ev-when { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
                .ev-badge {
                    font-size: 10.5px; font-weight: 800; padding: 2px 7px; border-radius: 20px;
                    border: 1px solid; font-variant-numeric: tabular-nums; white-space: nowrap;
                }
                .ev-date { font-size: 10.5px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
                .ev-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 3px; }
                .ev-action {
                    font-family: inherit; font-size: 11px; font-weight: 700; cursor: pointer;
                    padding: 4px 9px; border-radius: 7px; border: 1px solid #e2e0ea;
                    background: var(--bg-light); color: var(--primary-color); text-decoration: none;
                    transition: background 0.15s ease, border-color 0.15s ease;
                }
                .ev-action:hover { background: var(--accent-subtle); border-color: var(--primary-color); }
                .ev-action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
                @media (prefers-reduced-motion: reduce) {
                    .ev-row, .ev-action { transition: none; }
                }
            `}</style>
        </div>
    );
}
