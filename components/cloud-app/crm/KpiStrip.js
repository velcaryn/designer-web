'use client';
import { TONES } from './leadMeta';

/**
 * The decision-driving numbers for a pipeline, in one strip.
 *
 * Each tile is a button when it can filter the board - clicking "Overdue
 * follow-ups" should show you those leads, not just tell you they exist.
 */
export default function KpiStrip({ kpis, activeKey, onSelect }) {
    return (
        <div className="ks-grid">
            {kpis.map(k => {
                const tone = TONES[k.tone || 'neutral'];
                const clickable = !!k.filterKey && !!onSelect;
                const active = clickable && activeKey === k.filterKey;
                const Tag = clickable ? 'button' : 'div';
                return (
                    <Tag
                        key={k.key}
                        type={clickable ? 'button' : undefined}
                        className={`ks-card ${clickable ? 'ks-clickable' : ''} ${active ? 'ks-active' : ''}`}
                        onClick={clickable ? () => onSelect(k.filterKey) : undefined}
                        aria-pressed={clickable ? active : undefined}
                        title={k.hint}
                    >
                        <span className="ks-rail" style={{ background: tone.dot }} aria-hidden="true" />
                        <span className="ks-label">{k.label}</span>
                        <span className="ks-value" style={k.tone && k.tone !== 'neutral' ? { color: tone.fg } : undefined}>
                            {k.value}
                        </span>
                        <span className="ks-sub">{k.sub || ' '}</span>
                    </Tag>
                );
            })}

            <style jsx>{`
                .ks-grid {
                    display: grid; gap: 10px; margin-bottom: 16px;
                    grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
                }
                .ks-card {
                    position: relative; overflow: hidden; text-align: left; width: 100%;
                    font-family: inherit; display: flex; flex-direction: column; gap: 3px;
                    background: var(--bg-white, #fff); border: 1px solid var(--border); border-radius: 12px;
                    padding: 11px 13px 11px 15px;
                    box-shadow: 0 1px 2px rgba(45, 23, 83, 0.04);
                    transition: box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease;
                }
                .ks-rail { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
                .ks-clickable { cursor: pointer; }
                .ks-clickable:hover {
                    transform: translateY(-2px); border-color: #d9cffb;
                    box-shadow: 0 8px 20px rgba(45, 23, 83, 0.10);
                }
                .ks-clickable:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 2px; }
                .ks-active { border-color: var(--primary-color, #4a3aa7); background: var(--surface-sunken); }
                .ks-label {
                    font-size: 10px; font-weight: 800; color: #6c757d;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .ks-value {
                    font-size: 20px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums; letter-spacing: -0.025em; line-height: 1.15;
                }
                .ks-sub {
                    font-size: 10.5px; color: #94a3b8; font-variant-numeric: tabular-nums;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                @media (prefers-reduced-motion: reduce) {
                    .ks-card { transition: none; }
                    .ks-clickable:hover { transform: none; }
                }
            `}</style>
        </div>
    );
}
