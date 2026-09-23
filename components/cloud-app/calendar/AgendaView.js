'use client';
import { useMemo } from 'react';
import EventRow from './EventRow';
import { ymd, formatDate, moneyCompact } from './eventMeta';

/**
 * Chronological "what's next" list, grouped by UTC calendar day.
 *
 * Overdue items are pinned to the top under their own heading - they are the
 * answer to "what needs attention" and burying them in date order would repeat
 * the mistake the notification bell used to make.
 */
export default function AgendaView({ events, overdueItems, onAction, onOpen }) {
    const todayKey = ymd(new Date());
    const tomorrowKey = useMemo(() => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() + 1);
        return ymd(d);
    }, []);

    const dayGroups = useMemo(() => {
        const map = new Map();
        for (const e of events) {
            if (e.urgency === 'overdue') continue; // shown in the pinned section
            const key = ymd(e.date);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(e);
        }
        return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    }, [events]);

    const overdueAmount = overdueItems.reduce((s, e) => s + (e.amount || 0), 0);
    const isEmpty = dayGroups.length === 0 && overdueItems.length === 0;

    return (
        <div className="ag-wrap">
            {overdueItems.length > 0 && (
                <section className="ag-section ag-section-overdue">
                    <div className="ag-head ag-head-overdue">
                        <span>⚠️ Overdue</span>
                        <span className="ag-head-stats">
                            {overdueItems.length} item{overdueItems.length === 1 ? '' : 's'}
                            {overdueAmount > 0 ? ` · ${moneyCompact(overdueAmount)}` : ''}
                        </span>
                    </div>
                    <div className="ag-rows">
                        {overdueItems.map(ev => <EventRow key={ev.id} event={ev} onAction={onAction} onOpen={onOpen} />)}
                    </div>
                </section>
            )}

            {dayGroups.map(([key, items]) => {
                let label = formatDate(key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                if (key === todayKey) label = `Today · ${formatDate(key, { day: 'numeric', month: 'long' })}`;
                else if (key === tomorrowKey) label = `Tomorrow · ${formatDate(key, { day: 'numeric', month: 'long' })}`;
                const amount = items.reduce((s, e) => s + (e.amount || 0), 0);
                return (
                    <section key={key} className="ag-section">
                        <div className={`ag-head ${key === todayKey ? 'ag-head-today' : ''}`}>
                            <span>{label}</span>
                            <span className="ag-head-stats">
                                {items.length} item{items.length === 1 ? '' : 's'}
                                {amount > 0 ? ` · ${moneyCompact(amount)}` : ''}
                            </span>
                        </div>
                        <div className="ag-rows">
                            {items.map(ev => <EventRow key={ev.id} event={ev} onAction={onAction} onOpen={onOpen} />)}
                        </div>
                    </section>
                );
            })}

            {isEmpty && (
                <div className="ag-empty">
                    <div className="ag-empty-icon">🗓️</div>
                    <div className="ag-empty-title">Nothing scheduled here</div>
                    <div className="ag-empty-sub">No events in this window for the selected filters. Try another month, or clear a filter.</div>
                </div>
            )}

            <style jsx>{`
                .ag-wrap { display: flex; flex-direction: column; gap: 14px; }
                .ag-section {
                    background: var(--bg-white); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
                }
                .ag-section-overdue { border-color: #fca5a5; }
                .ag-head {
                    display: flex; justify-content: space-between; align-items: center; gap: 10px;
                    padding: 10px 14px; font-size: 12.5px; font-weight: 800; color: var(--secondary-color);
                    background: var(--bg-light); border-bottom: 1px solid #f0edf5; flex-wrap: wrap;
                }
                .ag-head-overdue { background: var(--status-danger-bg); color: #b91c1c; border-bottom-color: #fecaca; }
                .ag-head-today { background: var(--surface-hover); color: var(--primary-color); }
                .ag-head-stats { font-size: 11.5px; font-weight: 700; opacity: 0.85; font-variant-numeric: tabular-nums; }
                .ag-rows { display: flex; flex-direction: column; }
                .ag-empty {
                    background: var(--bg-white); border: 1px dashed #ddd6fe; border-radius: 12px;
                    padding: 44px 20px; text-align: center; color: var(--text-muted);
                }
                .ag-empty-icon { font-size: 28px; }
                .ag-empty-title { font-size: 15px; font-weight: 800; color: var(--secondary-color); margin-top: 8px; }
                .ag-empty-sub { font-size: 12.5px; margin-top: 4px; }
            `}</style>
        </div>
    );
}
