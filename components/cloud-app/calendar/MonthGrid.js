'use client';
import { styleFor, ymd } from './eventMeta';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS = 3;

/**
 * Month grid. All day maths is UTC (setUTCDate/getUTCDate + an ISO yyyy-mm-dd
 * key), so clicking "the 15th" always opens the 15th - round-tripping a
 * local-midnight Date through toISOString() shifts the day back for any
 * timezone ahead of UTC (IST is +5:30), which was a real bug here before.
 */
export default function MonthGrid({ monthStart, eventsByDay, onSelectDay, onSelectEvent }) {
    const days = [];
    const firstWeekday = monthStart.getUTCDay();
    const start = new Date(monthStart);
    start.setUTCDate(start.getUTCDate() - firstWeekday);
    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        days.push(d);
    }
    const todayKey = ymd(new Date());
    const viewMonth = monthStart.getUTCMonth();

    return (
        <div className="mg-grid">
            {DOW.map((d, i) => (
                <div key={d} className={`mg-dow ${i === 0 || i === 6 ? 'mg-dow-weekend' : ''}`}>{d}</div>
            ))}
            {days.map((d, i) => {
                const key = ymd(d);
                const dayEvents = eventsByDay[key] || [];
                const inMonth = d.getUTCMonth() === viewMonth;
                const isToday = key === todayKey;
                const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                const hidden = dayEvents.length - MAX_CHIPS;
                return (
                    <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        aria-label={`${key}, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`}
                        className={`mg-cell${inMonth ? '' : ' mg-out'}${isToday ? ' mg-today' : ''}${isWeekend ? ' mg-weekend' : ''}`}
                        onClick={() => onSelectDay(key)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDay(key); } }}
                    >
                        <div className="mg-date">
                            <span className={isToday ? 'mg-date-today' : ''}>{d.getUTCDate()}</span>
                        </div>
                        <div className="mg-events">
                            {dayEvents.slice(0, MAX_CHIPS).map(ev => {
                                const s = styleFor(ev.type);
                                const overdue = ev.urgency === 'overdue';
                                return (
                                    <button
                                        type="button"
                                        key={ev.id}
                                        className={`mg-chip${overdue ? ' mg-chip-overdue' : ''}`}
                                        style={overdue ? undefined : { background: s.bg, color: s.color }}
                                        title={`${ev.title}${ev.subtitle ? ` - ${ev.subtitle}` : ''}`}
                                        onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                                    >
                                        {overdue ? '⚠️' : s.icon} {ev.title}
                                    </button>
                                );
                            })}
                            {hidden > 0 && (
                                <button
                                    type="button"
                                    className="mg-more"
                                    onClick={(e) => { e.stopPropagation(); onSelectDay(key); }}
                                >+{hidden} more</button>
                            )}
                        </div>
                    </div>
                );
            })}

            <style jsx>{`
                .mg-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
                .mg-dow {
                    text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.04em; color: var(--text-muted); padding: 6px 0;
                }
                .mg-dow-weekend { opacity: 0.6; }
                .mg-cell {
                    background: var(--bg-white); border: 1px solid var(--border); border-radius: 10px;
                    min-height: 96px; padding: 6px; cursor: pointer; min-width: 0;
                    display: flex; flex-direction: column; gap: 4px;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .mg-cell:hover { border-color: var(--primary-color); box-shadow: 0 4px 12px rgba(72,38,131,0.08); }
                .mg-cell:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
                .mg-out { opacity: 0.42; }
                .mg-weekend { background: var(--surface-sunken); }
                .mg-today { border-color: var(--primary-color); border-width: 2px; background: var(--surface-hover); }
                .mg-date { font-size: 12px; font-weight: 700; color: var(--secondary-color); font-variant-numeric: tabular-nums; }
                .mg-date-today {
                    display: inline-flex; align-items: center; justify-content: center;
                    min-width: 21px; height: 21px; border-radius: 50%; padding: 0 5px;
                    background: var(--primary-color); color: #fff; font-weight: 800;
                }
                .mg-events { display: flex; flex-direction: column; gap: 3px; overflow: hidden; min-width: 0; }
                .mg-chip {
                    font-family: inherit; font-size: 10.5px; font-weight: 600; padding: 3px 6px;
                    border-radius: 5px; border: none; text-align: left; cursor: pointer;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;
                    transition: filter 0.15s ease;
                }
                .mg-chip:hover { filter: brightness(0.94); }
                .mg-chip:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
                .mg-chip-overdue {
                    background: var(--status-danger-bg); color: #b91c1c; font-weight: 800;
                    border-left: 3px solid #dc2626; border-radius: 4px;
                }
                .mg-more {
                    font-family: inherit; font-size: 10px; font-weight: 700; color: var(--primary-color);
                    background: none; border: none; padding: 1px 4px; cursor: pointer; text-align: left;
                }
                .mg-more:hover { text-decoration: underline; }

                @media (max-width: 768px) {
                    .mg-grid { gap: 3px; }
                    .mg-cell { min-height: 66px; padding: 3px; }
                    .mg-chip { font-size: 9px; padding: 2px 4px; }
                    .mg-dow { font-size: 9px; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .mg-cell, .mg-chip { transition: none; }
                }
            `}</style>
        </div>
    );
}
