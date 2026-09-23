'use client';
import { useState } from 'react';
import { ymd } from './format';
import { X } from 'lucide-react';

const PRESETS = [
    ['thisMonth', 'This Month'],
    ['lastMonth', 'Last Month'],
    ['last30', 'Last 30 Days'],
    ['last90', 'Last 90 Days'],
    ['thisYear', 'This Year'],
    ['last12m', 'Last 12 Months'],
];

const GROUPS = ['day', 'week', 'month', 'quarter'];

const COMPARES = [
    ['prev', 'vs previous period'],
    ['prevYear', 'vs same period last year'],
    ['none', 'No comparison'],
];

/** Dimension filters, in render order. `key` matches the API query param. */
export const DIMENSIONS = [
    { key: 'clientId', optionsKey: 'clients', label: 'Client', all: 'All clients' },
    { key: 'itemId', optionsKey: 'items', label: 'Item', all: 'All items' },
    { key: 'source', optionsKey: 'sources', label: 'Lead source', all: 'All sources' },
    { key: 'warehouseId', optionsKey: 'warehouses', label: 'Warehouse', all: 'All warehouses' },
    { key: 'soStatus', optionsKey: 'soStatuses', label: 'SO status', all: 'All statuses' },
];

export default function FilterBar({
    range, onRangeChange,
    preset, onPreset,
    groupBy, onGroupBy,
    compare, onCompare,
    filters, onFilterChange, onClearFilters,
    options = {},
    savedViews = [], onSaveView, onApplyView, onDeleteView,
    exporting, onExport,
    refreshing,
}) {
    const [saveOpen, setSaveOpen] = useState(false);
    const [viewName, setViewName] = useState('');

    const activeChips = DIMENSIONS
        .filter(d => filters?.[d.key])
        .map(d => {
            const opt = (options?.[d.optionsKey] || []).find(o => String(o.id) === String(filters[d.key]));
            return { ...d, value: filters[d.key], label: opt?.label || filters[d.key] };
        });

    function submitSave(e) {
        e.preventDefault();
        const name = viewName.trim();
        if (!name) return;
        onSaveView?.(name);
        setViewName('');
        setSaveOpen(false);
    }

    return (
        <div className="fb">
            <div className="fb-row fb-row-top">
                <div className="fb-presets" role="group" aria-label="Date presets">
                    {PRESETS.map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            className={`fb-pill ${preset === key ? 'fb-pill-on' : ''}`}
                            aria-pressed={preset === key}
                            onClick={() => onPreset(key)}
                        >{label}</button>
                    ))}
                </div>
                <div className="fb-right">
                    {savedViews.length > 0 && (
                        <select
                            className="fb-select fb-select-view"
                            value=""
                            aria-label="Apply a saved view"
                            onChange={e => {
                                if (e.target.value === '__delete') return;
                                const v = savedViews.find(s => s.name === e.target.value);
                                if (v) onApplyView?.(v);
                            }}
                        >
                            <option value="">★ Saved views…</option>
                            {savedViews.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                        </select>
                    )}
                    <button type="button" className="fb-btn" onClick={() => setSaveOpen(o => !o)} aria-expanded={saveOpen}>
                        ★ Save view
                    </button>
                    <button type="button" className="fb-btn" disabled={!!exporting} onClick={() => onExport('csv')}>
                        {exporting === 'csv' ? 'Exporting…' : '⬇ CSV'}
                    </button>
                    <button type="button" className="fb-btn fb-btn-primary" disabled={!!exporting} onClick={() => onExport('pdf')}>
                        {exporting === 'pdf' ? 'Exporting…' : '⬇ PDF'}
                    </button>
                </div>
            </div>

            {saveOpen && (
                <form className="fb-saverow" onSubmit={submitSave}>
                    <input
                        className="fb-input" autoFocus placeholder="Name this view (e.g. Q3 - Acme)"
                        value={viewName} onChange={e => setViewName(e.target.value)} aria-label="Saved view name"
                    />
                    <button type="submit" className="fb-btn fb-btn-primary">Save</button>
                    <button type="button" className="fb-btn" onClick={() => setSaveOpen(false)}>Cancel</button>
                    {savedViews.length > 0 && (
                        <div className="fb-savedlist">
                            {savedViews.map(v => (
                                <span key={v.name} className="fb-savedchip">
                                    <button type="button" className="fb-savedchip-apply" onClick={() => onApplyView?.(v)}>{v.name}</button>
                                    <button type="button" className="fb-x" aria-label={`Delete view ${v.name}`} onClick={() => onDeleteView?.(v.name)}><X size={14} aria-hidden="true" /> </button>
                                </span>
                            ))}
                        </div>
                    )}
                </form>
            )}

            <div className="fb-row fb-row-fields">
                <label className="fb-field">
                    <span>From</span>
                    <input type="date" value={ymd(range.from)} max={ymd(range.to)} onChange={e => onRangeChange('from', e.target.value)} />
                </label>
                <label className="fb-field">
                    <span>To</span>
                    <input type="date" value={ymd(range.to)} min={ymd(range.from)} onChange={e => onRangeChange('to', e.target.value)} />
                </label>

                <div className="fb-field">
                    <span>Group by</span>
                    <div className="fb-seg" role="group" aria-label="Group by">
                        {GROUPS.map(g => (
                            <button
                                key={g} type="button"
                                className={`fb-seg-btn ${groupBy === g ? 'fb-seg-on' : ''}`}
                                aria-pressed={groupBy === g}
                                onClick={() => onGroupBy(g)}
                            >{g[0].toUpperCase() + g.slice(1)}</button>
                        ))}
                    </div>
                </div>

                <label className="fb-field">
                    <span>Compare</span>
                    <select className="fb-select" value={compare} onChange={e => onCompare(e.target.value)}>
                        {COMPARES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </label>

                {DIMENSIONS.map(d => {
                    const opts = options?.[d.optionsKey] || [];
                    return (
                        <label className="fb-field" key={d.key}>
                            <span>{d.label}</span>
                            <select
                                className="fb-select"
                                value={filters?.[d.key] || ''}
                                disabled={opts.length === 0}
                                onChange={e => onFilterChange(d.key, e.target.value || null)}
                            >
                                <option value="">{opts.length === 0 ? 'None available' : d.all}</option>
                                {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                        </label>
                    );
                })}

                {refreshing && <span className="fb-refresh" role="status">Updating…</span>}
            </div>

            {activeChips.length > 0 && (
                <div className="fb-chips">
                    <span className="fb-chips-label">Filtered by</span>
                    {activeChips.map(c => (
                        <span key={c.key} className="fb-chip">
                            <span className="fb-chip-dim">{c.dimLabel ?? DIMENSIONS.find(d => d.key === c.key)?.label}:</span>
                            <span className="fb-chip-name">{c.label}</span>
                            <button
                                type="button" className="fb-x" aria-label={`Remove ${c.label} filter`}
                                onClick={() => onFilterChange(c.key, null)}
                            ><X size={14} aria-hidden="true" /> </button>
                        </span>
                    ))}
                    <button type="button" className="fb-clear" onClick={onClearFilters}>Clear all</button>
                </div>
            )}

            <style jsx>{`
                .fb {
                    background: var(--bg-white, #fff); border: 1px solid var(--border); border-radius: 14px;
                    padding: 12px 14px; margin-bottom: 18px;
                    box-shadow: 0 1px 2px rgba(45,23,83,0.04);
                }
                .fb-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
                .fb-row-top { justify-content: space-between; align-items: center; }
                .fb-row-fields { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #f0ecfb; }
                .fb-presets { display: flex; gap: 5px; flex-wrap: wrap; }
                .fb-right { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
                .fb-pill {
                    padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
                    cursor: pointer; border: 1.5px solid #e2e0ea; background: var(--surface); color: #475569;
                    font-family: inherit; transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
                }
                .fb-pill:hover { background: var(--surface-hover); border-color: #d9cffb; }
                .fb-pill-on { border-color: var(--primary-color, #4a3aa7); background: var(--primary-color, #4a3aa7); color: #fff; }
                .fb-pill-on:hover { background: var(--primary-color, #4a3aa7); }
                .fb-btn {
                    padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 12px;
                    cursor: pointer; border: 1.5px solid #e2e0ea; background: var(--surface); color: #475569;
                    font-family: inherit; min-height: 32px;
                    transition: background 150ms ease, box-shadow 150ms ease, transform 150ms ease;
                }
                .fb-btn:hover:not(:disabled) { background: var(--surface-hover); }
                .fb-btn:disabled { opacity: 0.55; cursor: default; }
                .fb-btn-primary { background: var(--primary-color, #4a3aa7); color: #fff; border-color: var(--primary-color, #4a3aa7); }
                .fb-btn-primary:hover:not(:disabled) { background: var(--primary-color, #4a3aa7); box-shadow: 0 4px 10px rgba(74,58,167,0.25); }
                .fb-saverow {
                    display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
                    margin-top: 10px; padding: 10px; background: var(--surface-sunken); border-radius: 10px;
                }
                .fb-input {
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 6px 10px;
                    font-size: 12.5px; font-family: inherit; min-height: 32px; min-width: 200px;
                }
                .fb-savedlist { display: flex; gap: 6px; flex-wrap: wrap; width: 100%; }
                .fb-savedchip {
                    display: inline-flex; align-items: center; gap: 2px; background: var(--surface);
                    border: 1px solid #e2e0ea; border-radius: 20px; padding: 2px 4px 2px 2px;
                }
                .fb-savedchip-apply {
                    border: none; background: none; font-family: inherit; font-size: 11.5px;
                    font-weight: 700; color: #4a3aa7; cursor: pointer; padding: 3px 8px; border-radius: 20px;
                }
                .fb-savedchip-apply:hover { background: var(--surface-hover); }
                .fb-field {
                    display: flex; flex-direction: column; gap: 4px; min-width: 0;
                    font-size: 9.5px; font-weight: 800; color: #6c757d;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .fb-field input[type="date"], .fb-select {
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 6px 8px;
                    font-size: 12.5px; font-family: inherit; min-height: 32px; color: #2d1753;
                    background: var(--surface); text-transform: none; font-weight: 600; letter-spacing: 0;
                    max-width: 170px;
                }
                .fb-select:disabled { opacity: 0.5; }
                .fb-select-view { max-width: 150px; margin-right: 2px; }
                .fb-seg { display: flex; border: 1.5px solid #e2e0ea; border-radius: 8px; overflow: hidden; height: 32px; }
                .fb-seg-btn {
                    border: none; background: var(--surface); padding: 0 10px; font-size: 11.5px; font-weight: 700;
                    cursor: pointer; color: #475569; font-family: inherit; transition: background 150ms ease;
                }
                .fb-seg-btn:hover { background: var(--surface-hover); }
                .fb-seg-on { background: var(--primary-color, #4a3aa7); color: #fff; }
                .fb-seg-on:hover { background: var(--primary-color, #4a3aa7); }
                .fb-refresh { font-size: 11px; color: #94a3b8; font-weight: 700; padding-bottom: 8px; }
                .fb-chips {
                    display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
                    margin-top: 12px; padding-top: 10px; border-top: 1px dashed #f0ecfb;
                }
                .fb-chips-label {
                    font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .fb-chip {
                    display: inline-flex; align-items: center; gap: 4px;
                    background: var(--surface-hover); border: 1px solid #ddd3fb; border-radius: 20px;
                    padding: 3px 4px 3px 10px; font-size: 11.5px; color: #4a3aa7; font-weight: 700;
                    max-width: 260px;
                }
                .fb-chip-dim { color: #8b7fc4; font-weight: 700; }
                .fb-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .fb-x {
                    border: none; background: none; cursor: pointer; color: inherit;
                    font-size: 14px; line-height: 1; padding: 0 4px; border-radius: 50%; font-family: inherit;
                    opacity: 0.6;
                }
                .fb-x:hover { opacity: 1; background: rgba(74,58,167,0.12); }
                .fb-clear {
                    border: none; background: none; font-family: inherit; font-size: 11.5px;
                    font-weight: 800; color: #e34948; cursor: pointer; text-decoration: underline;
                    padding: 3px 6px; border-radius: 6px;
                }
                .fb-clear:hover { background: var(--status-danger-bg); }
                .fb-pill:focus-visible, .fb-btn:focus-visible, .fb-select:focus-visible,
                .fb-seg-btn:focus-visible, .fb-x:focus-visible, .fb-clear:focus-visible,
                .fb-input:focus-visible, .fb-savedchip-apply:focus-visible,
                .fb-field input[type="date"]:focus-visible {
                    outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 2px;
                }
                @media (max-width: 640px) {
                    .fb-row-top { align-items: stretch; flex-direction: column; }
                    .fb-field, .fb-select, .fb-field input[type="date"] { max-width: none; width: 100%; }
                    .fb-row-fields > :global(*) { flex: 1 1 100%; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .fb-pill, .fb-btn, .fb-seg-btn { transition: none; }
                }
            `}</style>
        </div>
    );
}
