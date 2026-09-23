'use client';

/**
 * Standard card shell for every analytics panel - one padding scale, one
 * elevation, one header treatment, so the page reads as a single system.
 */
export function ChartCard({ title, subtitle, badge, actions, hint, children, span, className = '' }) {
    return (
        <section className={`ac-card ${span ? 'ac-card-span' : ''} ${className}`}>
            {(title || actions) && (
                <div className="ac-card-head">
                    <div className="ac-card-headtext">
                        <h2 className="ac-card-title">
                            {title}
                            {badge && <span className="ac-card-badge">{badge}</span>}
                            {hint && <span className="ac-info" title={hint} tabIndex={0} role="note" aria-label={hint}>ⓘ</span>}
                        </h2>
                        {subtitle && <p className="ac-card-sub">{subtitle}</p>}
                    </div>
                    {actions && <div className="ac-card-actions">{actions}</div>}
                </div>
            )}
            <div className="ac-card-body">{children}</div>
            <style jsx>{`
                .ac-card {
                    background: var(--bg-white, #fff);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    padding: 16px 18px 18px;
                    box-shadow: 0 1px 2px rgba(45, 23, 83, 0.04);
                    min-width: 0;
                }
                .ac-card-span { grid-column: 1 / -1; }
                .ac-card-head {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
                }
                .ac-card-headtext { min-width: 0; }
                .ac-card-title {
                    font-size: 14px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    margin: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
                    letter-spacing: -0.01em;
                }
                .ac-card-badge {
                    font-size: 10.5px; font-weight: 800; color: #4a3aa7; background: var(--surface-hover);
                    padding: 2px 8px; border-radius: 20px; letter-spacing: 0.02em;
                    font-variant-numeric: tabular-nums;
                }
                .ac-info {
                    font-size: 11px; color: #94a3b8; cursor: help; line-height: 1;
                    border-radius: 50%;
                }
                .ac-info:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 2px; }
                .ac-card-sub { font-size: 11.5px; color: #94a3b8; margin: 3px 0 0; }
                .ac-card-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
                .ac-card-body { min-width: 0; }
            `}</style>
        </section>
    );
}

export function EmptyState({ label = 'No data for this period', compact, icon = '◌' }) {
    return (
        <div className="ac-empty" style={{ padding: compact ? '16px 12px' : '34px 20px' }}>
            <span className="ac-empty-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
            <style jsx>{`
                .ac-empty {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 6px; text-align: center; color: #94a3b8; background: var(--surface-sunken);
                    border: 1px dashed #e9e4f7; border-radius: 10px; font-size: 12.5px;
                }
                .ac-empty-icon { font-size: 18px; opacity: 0.5; }
            `}</style>
        </div>
    );
}

export default ChartCard;
