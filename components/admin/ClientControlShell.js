'use client';
import { useState, useId } from 'react';
import './control-shell.css';

/**
 * VelBiz Cloud admin - the two-pane client control layout.
 *
 * A sticky section rail on the left, one panel at a time on the right. Shared
 * by the Cloud and Connect client-detail pages so both control surfaces read as
 * one product: an admin who has learned to suspend a Cloud tenant already knows
 * where to find the same lever for a hospital.
 *
 * Deliberately presentational - it owns which section is showing and nothing
 * else. Every panel's data, dirty state and saving belongs to the page that
 * supplies it, because the two products' save semantics differ (Connect diffs
 * entitlements before saving; Cloud writes tenant and login in one PUT) and
 * hoisting that in here would mean one component holding two half-models.
 *
 * `sections` is [{ key, label, group?, badge?, badgeTone?, render() }].
 * `render` is a function rather than a node so a panel's subtree is only built
 * when it is actually shown - these pages carry heavy panels (team rosters,
 * order tables) and mounting all of them per render was measurable.
 */
export default function ClientControlShell({ sections, initialSection, footer }) {
    const usable = (sections || []).filter(Boolean);
    const [active, setActive] = useState(initialSection || usable[0]?.key);
    const panelId = useId();

    const current = usable.find(s => s.key === active) || usable[0];
    if (!current) return null;

    // Group headers render once, before the first item carrying that group.
    // Ungrouped sections never emit one and do not end a run: the header is
    // compared against the nearest grouped section above.
    const headerFor = usable.map((s, i) => {
        const prevGroup = usable.slice(0, i).reverse().find(p => p.group)?.group ?? null;
        return s.group && s.group !== prevGroup ? s.group : null;
    });

    return (
        <div className="ccs">
            <nav className="ccs-rail" aria-label="Client settings sections">
                {usable.map((s, i) => {
                    const header = headerFor[i];
                    const isActive = s.key === current.key;
                    return (
                        <div key={s.key} style={{ display: 'contents' }}>
                            {header && <div className="ccs-rail-group">{header}</div>}
                            <button
                                type="button"
                                className={`ccs-rail-item${isActive ? ' ccs-rail-item--active' : ''}`}
                                onClick={() => setActive(s.key)}
                                aria-current={isActive ? 'page' : undefined}
                                aria-controls={panelId}
                            >
                                <span>{s.label}</span>
                                {s.badge !== undefined && s.badge !== null && (
                                    <span className={`ccs-rail-badge${s.badgeTone === 'warn' ? ' ccs-rail-badge--warn' : ''}`}>
                                        {s.badge}
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </nav>

            <div className="ccs-panel" id={panelId} role="region" aria-label={current.label}>
                <div className="ccs-panel-head">
                    <h2 className="ccs-panel-title">{current.label}</h2>
                    {current.description && <p className="ccs-panel-sub">{current.description}</p>}
                </div>
                {current.render()}
                {footer}
            </div>
        </div>
    );
}

/** Coloured note above a panel's content. Tone is 'info' | 'warn' | 'danger'. */
export function ControlBanner({ tone = 'info', title, children }) {
    return (
        <div className={`ccs-banner ccs-banner--${tone}`}>
            <div>
                {title && <strong className="ccs-banner-title">{title}</strong>}
                {children}
            </div>
        </div>
    );
}

/** Labelled field wrapper. `wide` spans the full grid row. */
export function ControlField({ label, hint, wide, children }) {
    return (
        <div className={`ccs-field${wide ? ' ccs-field--wide' : ''}`}>
            {label && <label className="ccs-label">{label}</label>}
            {children}
            {hint && <span className="ccs-hint">{hint}</span>}
        </div>
    );
}

export function ControlSection({ title, children }) {
    return (
        <div className="ccs-section">
            {title && <h3 className="ccs-section-title">{title}</h3>}
            {children}
        </div>
    );
}
