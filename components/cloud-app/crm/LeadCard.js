'use client';
import { TONES, money, relativeDayLabel, sourceLabel, leadHealth, healthTone } from './leadMeta';

/**
 * A pipeline card that actually says something.
 *
 * The previous card showed name / company / value and two icon buttons, so a
 * lead with a follow-up three weeks overdue looked identical to one spoken to
 * this morning. Health (overdue / stale / due-soon) now drives a coloured left
 * rail and an explicit badge, and the footer carries the facts you'd otherwise
 * have to open the record to see.
 */
export default function LeadCard({ lead, dragging, onOpen, onEdit, onDragStart }) {
    const health = leadHealth(lead);
    const tone = TONES[healthTone(health)];

    const badge = health.overdue
        ? { text: `Follow-up ${relativeDayLabel(health.followUpIn)}`, tone: TONES.critical }
        : health.stale
            ? { text: `No contact ${health.idleDays}d`, tone: TONES.warning }
            : health.dueSoon
                ? { text: `Follow-up ${relativeDayLabel(health.followUpIn)}`, tone: TONES.info }
                : null;

    return (
        <div
            className={`lc-card ${dragging ? 'lc-dragging' : ''}`}
            style={{ borderLeftColor: tone.dot }}
            draggable
            onDragStart={onDragStart}
            onClick={() => onOpen(lead)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(lead); } }}
            aria-label={`${lead.name}${lead.company ? `, ${lead.company}` : ''}. Open details.`}
        >
            <div className="lc-top">
                <span className="lc-name">{lead.name}</span>
                <span className="lc-num">{lead.leadNumber}</span>
            </div>

            {lead.company && <div className="lc-company">{lead.company}</div>}

            <div className="lc-midrow">
                {lead.expectedRevenue > 0 && <span className="lc-value">{money(lead.expectedRevenue)}</span>}
                {lead.source && <span className="lc-source">{sourceLabel(lead.source)}</span>}
            </div>

            {badge && (
                <div
                    className="lc-badge"
                    style={{ color: badge.tone.fg, background: badge.tone.bg, borderColor: badge.tone.border }}
                >
                    {badge.text}
                </div>
            )}

            <div className="lc-foot">
                <span title="Days in current stage">{health.daysInStage}d in stage</span>
                {lead.assignee && <span className="lc-owner" title="Owner">{lead.assignee}</span>}
                <button
                    type="button"
                    className="lc-edit"
                    title="Edit lead"
                    aria-label={`Edit ${lead.name}`}
                    onClick={e => { e.stopPropagation(); onEdit(lead); }}
                >
                    Edit
                </button>
            </div>

            <style jsx>{`
                .lc-card {
                    background: var(--surface); border: 1px solid var(--border); border-left: 3px solid #94a3b8;
                    border-radius: 9px; padding: 10px 11px; cursor: grab;
                    box-shadow: 0 1px 2px rgba(15,23,42,0.05);
                    transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
                    font-variant-numeric: tabular-nums;
                }
                .lc-card:hover { box-shadow: 0 4px 14px rgba(15,23,42,0.11); transform: translateY(-1px); }
                .lc-card:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
                .lc-dragging { opacity: 0.45; }
                .lc-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
                .lc-name { font-weight: 700; font-size: 13px; color: #0f172a; }
                .lc-num { font-size: 10px; color: #94a3b8; font-weight: 600; flex-shrink: 0; }
                .lc-company { font-size: 11.5px; color: #64748b; margin-top: 2px; }
                .lc-midrow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 7px; }
                .lc-value {
                    font-size: 12.5px; font-weight: 700; color: #166534;
                    background: var(--status-success-bg); border: 1px solid #bbf7d0; border-radius: 6px; padding: 2px 7px;
                }
                .lc-source { font-size: 10.5px; color: #64748b; background: var(--surface-sunken); border-radius: 5px; padding: 2px 6px; }
                .lc-badge {
                    margin-top: 7px; font-size: 10.5px; font-weight: 700;
                    border: 1px solid; border-radius: 6px; padding: 3px 7px; display: inline-block;
                }
                .lc-foot {
                    display: flex; align-items: center; gap: 8px; margin-top: 9px;
                    padding-top: 7px; border-top: 1px dashed var(--border);
                    font-size: 10.5px; color: #94a3b8;
                }
                .lc-owner {
                    margin-left: auto; max-width: 90px; overflow: hidden;
                    text-overflow: ellipsis; white-space: nowrap;
                }
                .lc-edit {
                    margin-left: auto; background: none; border: 1px solid var(--border); border-radius: 5px;
                    padding: 2px 8px; font-size: 10.5px; font-weight: 600; color: #475569;
                    cursor: pointer; font-family: inherit; transition: all 0.18s ease;
                }
                .lc-owner + .lc-edit { margin-left: 0; }
                .lc-edit:hover { background: var(--surface-sunken); color: var(--primary-color); border-color: #cbd5e1; }
                .lc-edit:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
                @media (prefers-reduced-motion: reduce) {
                    .lc-card, .lc-edit { transition: none; }
                    .lc-card:hover { transform: none; }
                }
            `}</style>
        </div>
    );
}
