'use client';
import { useMemo, useState } from 'react';
import { compactMoney, money } from './format';
import { EmptyState } from './ChartCard';

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
// Sequential ramp on the app's primary hue - light → dark = low → high.
const RAMP = ['#f1eefb', '#d9d0f5', '#b6a5ea', '#8e77dc', '#6549c4', '#4a3aa7'];

/**
 * GitHub-style calendar heatmap, hand-built with CSS grid (no new dependency).
 * Columns are ISO weeks, rows are weekdays (Mon…Sun).
 */
export default function ActivityHeatmap({ data, metric = 'count', onSelectDay }) {
    const [hover, setHover] = useState(null);

    const { columns, max, total, totalRevenue } = useMemo(() => {
        const days = (Array.isArray(data) ? data : []).filter(d => d && d.date);
        if (days.length === 0) return { columns: [], max: 0, total: 0, totalRevenue: 0 };

        const sorted = [...days].sort((a, b) => String(a.date).localeCompare(String(b.date)));
        const cols = [];
        let current = null;
        let currentKey = null;

        for (const d of sorted) {
            const dt = new Date(`${String(d.date).slice(0, 10)}T00:00:00`);
            // Mon=0 … Sun=6
            const row = (dt.getDay() + 6) % 7;
            // Group into columns by the Monday that starts that day's week.
            const monday = new Date(dt);
            monday.setDate(dt.getDate() - row);
            const key = monday.toISOString().slice(0, 10);
            if (key !== currentKey) {
                currentKey = key;
                current = { key, monthLabel: monday.toLocaleDateString('en-IN', { month: 'short' }), cells: Array(7).fill(null) };
                cols.push(current);
            }
            current.cells[row] = { ...d, row, dateObj: dt };
        }

        // Label a month the first column it appears in, but only if there is
        // room since the last label - otherwise short months collide ("AprMay").
        let seen = '';
        let sinceLabel = 99;
        for (const col of cols) {
            const isNew = col.monthLabel !== seen;
            col.showMonth = isNew && sinceLabel >= 3;
            if (isNew) seen = col.monthLabel;
            sinceLabel = col.showMonth ? 0 : sinceLabel + 1;
        }

        const vals = sorted.map(d => Number(d[metric] || 0));
        return {
            columns: cols,
            max: Math.max(...vals, 0),
            total: sorted.reduce((s, d) => s + Number(d.count || 0), 0),
            totalRevenue: sorted.reduce((s, d) => s + Number(d.revenue || 0), 0),
        };
    }, [data, metric]);

    if (columns.length === 0) return <EmptyState label="No activity recorded for this period" />;

    function level(v) {
        const n = Number(v || 0);
        if (n <= 0 || max <= 0) return -1;
        const idx = Math.min(RAMP.length - 1, Math.floor((n / max) * RAMP.length));
        return idx;
    }

    return (
        <div className="hm">
            <div className="hm-scroll">
                <div className="hm-inner">
                    <div className="hm-months">
                        {columns.map(col => (
                            <span key={col.key} className="hm-month">{col.showMonth ? col.monthLabel : ''}</span>
                        ))}
                    </div>
                    <div className="hm-body">
                        <div className="hm-daylabels">
                            {DAY_LABELS.map((l, i) => <span key={i} className="hm-daylabel">{l}</span>)}
                        </div>
                        <div className="hm-grid">
                            {columns.map(col => (
                                <div key={col.key} className="hm-col">
                                    {col.cells.map((cell, r) => {
                                        if (!cell) return <span key={r} className="hm-cell hm-cell-void" />;
                                        const lv = level(cell[metric]);
                                        return (
                                            <button
                                                key={r}
                                                type="button"
                                                className={`hm-cell ${onSelectDay ? 'hm-cell-click' : ''}`}
                                                style={{ background: lv < 0 ? '#f6f5fa' : RAMP[lv] }}
                                                onMouseEnter={() => setHover(cell)}
                                                onMouseLeave={() => setHover(h => (h === cell ? null : h))}
                                                onFocus={() => setHover(cell)}
                                                onBlur={() => setHover(null)}
                                                onClick={() => onSelectDay?.(cell)}
                                                aria-label={`${cell.date}: ${cell.count || 0} documents, ${money(cell.revenue)}`}
                                                title={`${cell.date} - ${cell.count || 0} docs · ${compactMoney(cell.revenue)}`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="hm-foot">
                <span className="hm-summary">
                    <strong>{total.toLocaleString('en-IN')}</strong> documents · <strong>{compactMoney(totalRevenue)}</strong> in range
                </span>
                <span className="hm-legend">
                    Less
                    <span className="hm-swatch" style={{ background: 'var(--surface-sunken)' }} />
                    {RAMP.map(c => <span key={c} className="hm-swatch" style={{ background: c }} />)}
                    More
                </span>
            </div>

            <div className="hm-tip" aria-live="polite">
                {hover
                    ? <>
                        <strong>{new Date(`${String(hover.date).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        {' - '}{hover.count || 0} document{(hover.count || 0) === 1 ? '' : 's'} · {money(hover.revenue)}
                    </>
                    : <span className="hm-tip-idle">Hover a day for its document count and revenue.</span>}
            </div>

            <style jsx>{`
                .hm { min-width: 0; }
                .hm-scroll { overflow-x: auto; padding-bottom: 4px; }
                /* Fixed 13px cells rarely fill a wide card - centre the block so
                   it doesn't hug the left edge, while still scrolling if narrow. */
                .hm-inner { display: table; margin: 0 auto; }
                .hm-months { display: flex; gap: 3px; margin-left: 30px; margin-bottom: 4px; }
                .hm-month {
                    width: 13px; flex-shrink: 0; font-size: 9px; font-weight: 700; color: #94a3b8;
                    white-space: nowrap; overflow: visible;
                }
                .hm-body { display: flex; gap: 4px; }
                .hm-daylabels { display: flex; flex-direction: column; gap: 3px; width: 26px; flex-shrink: 0; }
                .hm-daylabel {
                    height: 13px; font-size: 8.5px; font-weight: 700; color: #94a3b8;
                    line-height: 13px; text-align: right;
                }
                .hm-grid { display: flex; gap: 3px; }
                .hm-col { display: flex; flex-direction: column; gap: 3px; }
                .hm-cell {
                    width: 13px; height: 13px; border-radius: 3px; border: none; padding: 0;
                    display: block; transition: transform 120ms ease, outline-color 120ms ease;
                    outline: 1px solid rgba(45, 23, 83, 0.05); outline-offset: -1px;
                }
                .hm-cell-void { background: transparent !important; outline: none; }
                .hm-cell-click { cursor: pointer; }
                .hm-cell-click:hover { transform: scale(1.35); outline: 1.5px solid #2d1753; }
                .hm-cell:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 1px; }
                .hm-foot {
                    display: flex; justify-content: space-between; align-items: center; gap: 12px;
                    flex-wrap: wrap; margin-top: 12px;
                }
                .hm-summary { font-size: 11.5px; color: #6c757d; font-variant-numeric: tabular-nums; }
                .hm-summary strong { color: var(--secondary-color, #2d1753); font-weight: 800; }
                .hm-legend { display: flex; align-items: center; gap: 3px; font-size: 10px; color: #94a3b8; font-weight: 700; }
                .hm-swatch { width: 11px; height: 11px; border-radius: 3px; display: inline-block; margin: 0 1px; }
                .hm-tip {
                    margin-top: 10px; padding: 8px 12px; background: var(--surface-sunken); border-radius: 8px;
                    font-size: 11.5px; color: #475569; min-height: 32px;
                    font-variant-numeric: tabular-nums;
                }
                .hm-tip strong { color: var(--secondary-color, #2d1753); font-weight: 800; }
                .hm-tip-idle { color: #94a3b8; }
                @media (prefers-reduced-motion: reduce) {
                    .hm-cell { transition: none; }
                    .hm-cell-click:hover { transform: none; }
                }
            `}</style>
        </div>
    );
}
