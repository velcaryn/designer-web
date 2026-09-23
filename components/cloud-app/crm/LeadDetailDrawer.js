'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
    TONES, money, formatDate, formatDateTime, relativeDayLabel,
    sourceLabel, leadHealth, activityStyle,
} from './leadMeta';

/**
 * Full lead record + activity timeline.
 *
 * Previously the only way into a lead was the edit form, so its history was
 * invisible. Delete lives here rather than on the card - it used to sit as a
 * bare 🗑 next to ✏️ on every card, one mis-click from destroying a record -
 * and requires typing confirmation.
 */
export default function LeadDetailDrawer({ lead, stages, onClose, onEdit, onDelete, onStageChange }) {
    const [confirming, setConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // NOTE: the caller keys this component on the lead id, so opening a
    // different lead remounts it and the half-typed confirmation below can
    // never carry over to another record. Don't reset that in an effect.
    if (!lead) return null;

    const health = leadHealth(lead);
    const stage = stages.find(s => s.id === lead.stage);
    const activities = [...(lead.activities || [])]
        .filter(a => a?.at)
        .sort((a, b) => new Date(b.at) - new Date(a.at));

    const facts = [
        ['Company', lead.company],
        ['Email', lead.email],
        ['Phone', lead.phone],
        ['Source', lead.source ? sourceLabel(lead.source) : null],
        ['Owner', lead.assignee],
        ['Expected value', lead.expectedRevenue > 0 ? money(lead.expectedRevenue) : null],
        ['Follow-up', lead.followUpDate ? `${formatDate(lead.followUpDate)} · ${relativeDayLabel(health.followUpIn)}` : null],
        ['Created', formatDate(lead.createdAt)],
    ].filter(([, v]) => v);

    return (
        <div className="ld-overlay" onClick={onClose}>
            <aside
                className="ld-panel"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Lead details: ${lead.name}`}
            >
                <div className="ld-head">
                    <div>
                        <div className="ld-name">{lead.name}</div>
                        <div className="ld-sub">{lead.leadNumber}{lead.company ? ` · ${lead.company}` : ''}</div>
                    </div>
                    <button className="ld-close" onClick={onClose} aria-label="Close"><X size={14} aria-hidden="true" /> </button>
                </div>

                <div className="ld-body">
                    {(health.overdue || health.stale) && (
                        <div
                            className="ld-alert"
                            style={{
                                color: health.overdue ? TONES.critical.fg : TONES.warning.fg,
                                background: health.overdue ? TONES.critical.bg : TONES.warning.bg,
                                borderColor: health.overdue ? TONES.critical.border : TONES.warning.border,
                            }}
                        >
                            {health.overdue
                                ? `Follow-up was due ${relativeDayLabel(health.followUpIn)}.`
                                : `No contact for ${health.idleDays} days.`}
                        </div>
                    )}

                    <div className="ld-stagerow">
                        <span className="ld-label">Stage</span>
                        <select
                            value={lead.stage}
                            onChange={e => onStageChange(lead, e.target.value)}
                            className="ld-select"
                            style={{ borderColor: stage?.color || '#cbd5e1' }}
                        >
                            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <span className="ld-instage">{health.daysInStage}d in stage</span>
                    </div>

                    <dl className="ld-facts">
                        {facts.map(([k, v]) => (
                            <div key={k} className="ld-fact">
                                <dt>{k}</dt><dd>{v}</dd>
                            </div>
                        ))}
                    </dl>

                    {lead.notes && (
                        <div className="ld-notes">
                            <div className="ld-label">Notes</div>
                            <p>{lead.notes}</p>
                        </div>
                    )}

                    <div className="ld-label ld-tl-title">Activity</div>
                    {activities.length === 0 ? (
                        <div className="ld-empty">No activity recorded yet.</div>
                    ) : (
                        <ul className="ld-timeline">
                            {activities.map((a, i) => {
                                const st = activityStyle(a.type);
                                return (
                                    <li key={i} className="ld-tl-item">
                                        <span className="ld-tl-dot" style={{ color: st.color, background: st.bg }}>{st.icon}</span>
                                        <div className="ld-tl-body">
                                            <div className="ld-tl-text">{a.note || a.detail || st.label}</div>
                                            <div className="ld-tl-when">{formatDateTime(a.at)}{a.by ? ` · ${a.by}` : ''}</div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="ld-foot">
                    <button className="ld-btn" onClick={() => onEdit(lead)}>Edit lead</button>
                    {!confirming ? (
                        <button className="ld-btn ld-danger" onClick={() => setConfirming(true)}>Delete</button>
                    ) : (
                        <div className="ld-confirm">
                            <span>Type <strong>DELETE</strong> to confirm</span>
                            <input
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                aria-label="Type DELETE to confirm"
                                autoFocus
                            />
                            <button
                                className="ld-btn ld-danger"
                                disabled={confirmText !== 'DELETE'}
                                onClick={() => onDelete(lead)}
                            >
                                Confirm
                            </button>
                            <button className="ld-btn" onClick={() => { setConfirming(false); setConfirmText(''); }}>Cancel</button>
                        </div>
                    )}
                </div>
            </aside>

            <style jsx>{`
                .ld-overlay {
                    position: fixed; inset: 0; background: rgba(15,23,42,0.45);
                    z-index: 1200; display: flex; justify-content: flex-end;
                }
                .ld-panel {
                    width: min(460px, 100%); background: var(--surface); height: 100%;
                    display: flex; flex-direction: column; box-shadow: -8px 0 30px rgba(15,23,42,0.2);
                    font-variant-numeric: tabular-nums;
                    animation: ld-in 0.22s cubic-bezier(0.4,0,0.2,1);
                }
                @keyframes ld-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
                .ld-head {
                    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
                    padding: 16px 18px; border-bottom: 1px solid var(--border);
                }
                .ld-name { font-size: 16px; font-weight: 800; color: var(--secondary-color); }
                .ld-sub { font-size: 11.5px; color: #94a3b8; margin-top: 2px; }
                .ld-close {
                    background: none; border: none; font-size: 16px; cursor: pointer; color: #64748b;
                    padding: 4px 8px; border-radius: 6px; line-height: 1;
                }
                .ld-close:hover { background: var(--surface-sunken); }
                .ld-close:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
                .ld-body { flex: 1; overflow-y: auto; padding: 16px 18px; }
                .ld-alert { border: 1px solid; border-radius: 8px; padding: 9px 11px; font-size: 12.5px; font-weight: 600; margin-bottom: 14px; }
                .ld-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
                .ld-stagerow { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; flex-wrap: wrap; }
                .ld-select {
                    border: 1.5px solid #cbd5e1; border-radius: 7px; padding: 5px 9px;
                    font-size: 12.5px; font-weight: 600; font-family: inherit; color: #0f172a; background: var(--surface);
                }
                .ld-select:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
                .ld-instage { font-size: 11px; color: #94a3b8; }
                .ld-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 14px; }
                .ld-fact dt { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; font-weight: 700; }
                .ld-fact dd { margin: 2px 0 0; font-size: 12.5px; color: #0f172a; font-weight: 600; word-break: break-word; }
                .ld-notes { margin-bottom: 14px; }
                .ld-notes p { margin: 4px 0 0; font-size: 12.5px; color: #475569; line-height: 1.5; white-space: pre-wrap; }
                .ld-tl-title { display: block; margin-bottom: 8px; }
                .ld-empty { font-size: 12.5px; color: #94a3b8; padding: 10px 0; }
                .ld-timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
                .ld-tl-item { display: flex; gap: 10px; }
                .ld-tl-dot {
                    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
                }
                .ld-tl-text { font-size: 12.5px; color: #0f172a; }
                .ld-tl-when { font-size: 10.5px; color: #94a3b8; margin-top: 2px; }
                .ld-foot {
                    border-top: 1px solid var(--border); padding: 12px 18px;
                    display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
                }
                .ld-btn {
                    border: 1px solid var(--border); background: var(--surface); border-radius: 7px; padding: 7px 13px;
                    font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; color: #334155;
                    transition: all 0.18s ease;
                }
                .ld-btn:hover:not(:disabled) { background: var(--surface-sunken); border-color: #cbd5e1; }
                .ld-btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
                .ld-btn:disabled { opacity: 0.45; cursor: not-allowed; }
                .ld-danger { color: #b91c1c; border-color: #fecaca; }
                .ld-danger:hover:not(:disabled) { background: var(--status-danger-bg); border-color: #fca5a5; }
                .ld-confirm { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; font-size: 11.5px; color: #64748b; }
                .ld-confirm input {
                    border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 8px;
                    font-size: 12px; width: 92px; font-family: inherit;
                }
                .ld-confirm input:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
                @media (max-width: 560px) { .ld-facts { grid-template-columns: 1fr; } }
                @media (prefers-reduced-motion: reduce) {
                    .ld-panel { animation: none; }
                    .ld-btn { transition: none; }
                }
            `}</style>
        </div>
    );
}
