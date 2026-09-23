'use client';
import { VALUE_BANDS, sourceLabel } from './leadMeta';
import { X } from 'lucide-react';

const HEALTH_PILLS = [
    ['all', 'All leads'],
    ['overdue', 'Overdue follow-up'],
    ['dueSoon', 'Due in 2 days'],
    ['stale', 'Stale'],
    ['open', 'Open only'],
];

const SORTS = [
    ['value', 'Highest value'],
    ['stale', 'Most stale'],
    ['followUp', 'Follow-up date'],
    ['recent', 'Recently updated'],
];

/**
 * Search + dimension filters + sort for the pipeline, in the same visual
 * language as the analytics FilterBar (pill row, labelled selects, an active
 * chip summary that can be cleared).
 */
export default function CrmFilterBar({
    search, onSearch,
    health, onHealth,
    source, onSource, sources = [],
    owner, onOwner, owners = [],
    band, onBand,
    stage, onStage, stages = [],
    sort, onSort,
    view, onView,
    refreshing,
    resultCount, totalCount,
    onClear,
}) {
    const chips = [];
    if (search) chips.push({ key: 'search', dim: 'Search', label: search, clear: () => onSearch('') });
    if (health !== 'all') chips.push({ key: 'health', dim: 'Health', label: HEALTH_PILLS.find(p => p[0] === health)?.[1] || health, clear: () => onHealth('all') });
    if (source) chips.push({ key: 'source', dim: 'Source', label: sourceLabel(source), clear: () => onSource('') });
    if (owner) chips.push({ key: 'owner', dim: 'Owner', label: owner, clear: () => onOwner('') });
    if (band) chips.push({ key: 'band', dim: 'Value', label: VALUE_BANDS.find(b => b.key === band)?.label || band, clear: () => onBand('') });
    if (stage) chips.push({ key: 'stage', dim: 'Stage', label: stages.find(s => s.id === stage)?.name || stage, clear: () => onStage('') });

    return (
        <div className="cfb">
            <div className="cfb-row cfb-row-top">
                <div className="cfb-pills" role="group" aria-label="Lead health filter">
                    {HEALTH_PILLS.map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            className={`cfb-pill ${health === key ? 'cfb-pill-on' : ''}`}
                            aria-pressed={health === key}
                            onClick={() => onHealth(key)}
                        >{label}</button>
                    ))}
                </div>
                <div className="cfb-right">
                    <div className="cfb-seg" role="group" aria-label="Board layout">
                        <button
                            type="button" className={`cfb-seg-btn ${view === 'board' ? 'cfb-seg-on' : ''}`}
                            aria-pressed={view === 'board'} onClick={() => onView('board')}
                        >Board</button>
                        <button
                            type="button" className={`cfb-seg-btn ${view === 'list' ? 'cfb-seg-on' : ''}`}
                            aria-pressed={view === 'list'} onClick={() => onView('list')}
                        >List</button>
                    </div>
                </div>
            </div>

            <div className="cfb-row cfb-row-fields">
                <label className="cfb-field cfb-field-search">
                    <span>Search</span>
                    <input
                        type="search"
                        className="cfb-input"
                        placeholder="Name, company, email, lead no…"
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                    />
                </label>

                <label className="cfb-field">
                    <span>Source</span>
                    <select className="cfb-select" value={source} onChange={e => onSource(e.target.value)}>
                        <option value="">All sources</option>
                        {sources.map(s => <option key={s} value={s}>{sourceLabel(s)}</option>)}
                    </select>
                </label>

                <label className="cfb-field">
                    <span>Owner</span>
                    <select className="cfb-select" value={owner} onChange={e => onOwner(e.target.value)} disabled={owners.length === 0}>
                        <option value="">{owners.length === 0 ? 'None assigned' : 'All owners'}</option>
                        {owners.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </label>

                <label className="cfb-field">
                    <span>Deal size</span>
                    <select className="cfb-select" value={band} onChange={e => onBand(e.target.value)}>
                        <option value="">Any value</option>
                        {VALUE_BANDS.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
                    </select>
                </label>

                <label className="cfb-field">
                    <span>Stage</span>
                    <select className="cfb-select" value={stage} onChange={e => onStage(e.target.value)}>
                        <option value="">All stages</option>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </label>

                <label className="cfb-field">
                    <span>Sort within stage</span>
                    <select className="cfb-select" value={sort} onChange={e => onSort(e.target.value)}>
                        {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </label>

                {refreshing && <span className="cfb-refresh" role="status">Updating…</span>}
            </div>

            {chips.length > 0 && (
                <div className="cfb-chips">
                    <span className="cfb-chips-label">Filtered by</span>
                    {chips.map(c => (
                        <span key={c.key} className="cfb-chip">
                            <span className="cfb-chip-dim">{c.dim}:</span>
                            <span className="cfb-chip-name">{c.label}</span>
                            <button type="button" className="cfb-x" aria-label={`Remove ${c.dim} filter`} onClick={c.clear}><X size={14} aria-hidden="true" /> </button>
                        </span>
                    ))}
                    <span className="cfb-count">
                        {resultCount} of {totalCount} leads
                    </span>
                    <button type="button" className="cfb-clear" onClick={onClear}>Clear all</button>
                </div>
            )}

            <style jsx>{`
                .cfb {
                    background: var(--bg-white, #fff); border: 1px solid var(--border); border-radius: 14px;
                    padding: 12px 14px; margin-bottom: 16px;
                    box-shadow: 0 1px 2px rgba(45, 23, 83, 0.04);
                }
                .cfb-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
                .cfb-row-top { justify-content: space-between; align-items: center; }
                .cfb-row-fields { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #f0ecfb; }
                .cfb-pills { display: flex; gap: 5px; flex-wrap: wrap; }
                .cfb-right { display: flex; gap: 6px; align-items: center; }
                .cfb-pill {
                    padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
                    cursor: pointer; border: 1.5px solid #e2e0ea; background: var(--surface); color: #475569;
                    font-family: inherit;
                    transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
                }
                .cfb-pill:hover { background: var(--surface-hover); border-color: #d9cffb; }
                .cfb-pill-on {
                    border-color: var(--primary-color, #4a3aa7);
                    background: var(--primary-color, #4a3aa7); color: #fff;
                }
                .cfb-seg { display: flex; border: 1.5px solid #e2e0ea; border-radius: 8px; overflow: hidden; height: 32px; }
                .cfb-seg-btn {
                    border: none; background: var(--surface); padding: 0 14px; font-size: 11.5px; font-weight: 700;
                    cursor: pointer; color: #475569; font-family: inherit; transition: background 150ms ease;
                }
                .cfb-seg-btn:hover { background: var(--surface-hover); }
                .cfb-seg-on { background: var(--primary-color, #4a3aa7); color: #fff; }
                .cfb-seg-on:hover { background: var(--primary-color, #4a3aa7); }
                .cfb-field {
                    display: flex; flex-direction: column; gap: 4px; min-width: 0;
                    font-size: 9.5px; font-weight: 800; color: #6c757d;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .cfb-field-search { flex: 1 1 220px; max-width: 280px; }
                .cfb-input, .cfb-select {
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 6px 8px;
                    font-size: 12.5px; font-family: inherit; min-height: 32px; color: #2d1753;
                    background: var(--surface); text-transform: none; font-weight: 600; letter-spacing: 0;
                    outline: none; width: 100%;
                }
                .cfb-select { max-width: 170px; }
                .cfb-select:disabled { opacity: 0.5; }
                .cfb-input:focus, .cfb-select:focus { border-color: var(--primary-color, #4a3aa7); }
                .cfb-refresh { font-size: 11px; color: #94a3b8; font-weight: 700; padding-bottom: 8px; }
                .cfb-chips {
                    display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
                    margin-top: 12px; padding-top: 10px; border-top: 1px dashed #f0ecfb;
                }
                .cfb-chips-label {
                    font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .cfb-chip {
                    display: inline-flex; align-items: center; gap: 4px;
                    background: var(--surface-hover); border: 1px solid #ddd3fb; border-radius: 20px;
                    padding: 3px 4px 3px 10px; font-size: 11.5px; color: #4a3aa7; font-weight: 700;
                    max-width: 260px;
                }
                .cfb-chip-dim { color: #8b7fc4; }
                .cfb-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .cfb-count {
                    font-size: 11px; font-weight: 700; color: #6c757d;
                    font-variant-numeric: tabular-nums; margin-left: 2px;
                }
                .cfb-x {
                    border: none; background: none; cursor: pointer; color: inherit;
                    font-size: 14px; line-height: 1; padding: 0 4px; border-radius: 50%;
                    font-family: inherit; opacity: 0.6;
                }
                .cfb-x:hover { opacity: 1; background: rgba(74, 58, 167, 0.12); }
                .cfb-clear {
                    border: none; background: none; font-family: inherit; font-size: 11.5px;
                    font-weight: 800; color: #e34948; cursor: pointer; text-decoration: underline;
                    padding: 3px 6px; border-radius: 6px; margin-left: auto;
                }
                .cfb-clear:hover { background: var(--status-danger-bg); }
                .cfb-pill:focus-visible, .cfb-seg-btn:focus-visible, .cfb-x:focus-visible,
                .cfb-clear:focus-visible, .cfb-input:focus-visible, .cfb-select:focus-visible {
                    outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 2px;
                }
                @media (max-width: 640px) {
                    .cfb-row-top { flex-direction: column; align-items: stretch; }
                    .cfb-field, .cfb-select, .cfb-field-search { max-width: none; width: 100%; }
                    .cfb-row-fields > :global(*) { flex: 1 1 100%; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .cfb-pill, .cfb-seg-btn { transition: none; }
                }
            `}</style>
        </div>
    );
}
