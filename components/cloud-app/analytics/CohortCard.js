'use client';
import { compactMoney, money } from './format';
import { EmptyState } from './ChartCard';

const NEW_COLOR = '#2a78d6';
const RET_COLOR = '#1baf7a';

/** New vs returning customer economics for the selected range. */
export default function CohortCard({ cohort }) {
    if (!cohort) return <EmptyState label="No customer data for this period" />;

    const newC = Number(cohort.newCustomers || 0);
    const retC = Number(cohort.returningCustomers || 0);
    const newR = Number(cohort.newRevenue || 0);
    const retR = Number(cohort.returningRevenue || 0);
    const totalC = newC + retC;
    const totalR = newR + retR;

    if (totalC === 0 && totalR === 0) return <EmptyState label="No invoiced customers in this period" />;

    const newRShare = totalR > 0 ? (newR / totalR) * 100 : 0;
    const repeat = cohort.repeatRatePct;
    const arpc = cohort.avgRevenuePerCustomer;

    return (
        <div className="ch">
            <div className="ch-counts">
                <div className="ch-count">
                    <span className="ch-dot" style={{ background: NEW_COLOR }} aria-hidden="true" />
                    <div>
                        <strong>{newC.toLocaleString('en-IN')}</strong>
                        <span className="ch-count-label">New customers</span>
                    </div>
                </div>
                <div className="ch-count">
                    <span className="ch-dot" style={{ background: RET_COLOR }} aria-hidden="true" />
                    <div>
                        <strong>{retC.toLocaleString('en-IN')}</strong>
                        <span className="ch-count-label">Returning customers</span>
                    </div>
                </div>
            </div>

            <div className="ch-splitwrap">
                <span className="ch-splitlabel">Revenue split</span>
                <div className="ch-split" role="img" aria-label={`New customers ${newRShare.toFixed(1)} percent of revenue, returning ${(100 - newRShare).toFixed(1)} percent`}>
                    {newR > 0 && (
                        <div className="ch-seg" style={{ width: `${newRShare}%`, background: NEW_COLOR }} title={`New: ${money(newR)}`}>
                            {newRShare >= 14 && <span>{newRShare.toFixed(0)}%</span>}
                        </div>
                    )}
                    {retR > 0 && (
                        <div className="ch-seg" style={{ width: `${100 - newRShare}%`, background: RET_COLOR }} title={`Returning: ${money(retR)}`}>
                            {(100 - newRShare) >= 14 && <span>{(100 - newRShare).toFixed(0)}%</span>}
                        </div>
                    )}
                </div>
                <div className="ch-splitlegend">
                    <span><span className="ch-dot ch-dot-sm" style={{ background: NEW_COLOR }} />New {compactMoney(newR)}</span>
                    <span><span className="ch-dot ch-dot-sm" style={{ background: RET_COLOR }} />Returning {compactMoney(retR)}</span>
                </div>
            </div>

            <div className="ch-stats">
                <div className="ch-stat">
                    <span className="ch-stat-label">Repeat rate</span>
                    <strong>{repeat == null ? '-' : `${Number(repeat).toFixed(1)}%`}</strong>
                </div>
                <div className="ch-stat">
                    <span className="ch-stat-label">Avg revenue / customer</span>
                    <strong title={money(arpc)}>{arpc == null ? '-' : compactMoney(arpc)}</strong>
                </div>
                <div className="ch-stat">
                    <span className="ch-stat-label">Customers billed</span>
                    <strong>{totalC.toLocaleString('en-IN')}</strong>
                </div>
            </div>

            <style jsx>{`
                .ch { display: flex; flex-direction: column; gap: 14px; }
                .ch-counts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .ch-count { display: flex; align-items: center; gap: 9px; min-width: 0; }
                .ch-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
                .ch-dot-sm { width: 7px; height: 7px; margin-right: 5px; }
                .ch-count strong {
                    display: block; font-size: 22px; font-weight: 800; line-height: 1.05;
                    color: var(--secondary-color, #2d1753); font-variant-numeric: tabular-nums;
                    letter-spacing: -0.02em;
                }
                .ch-count-label { font-size: 10.5px; color: #6c757d; font-weight: 700; }
                .ch-splitlabel {
                    display: block; font-size: 9px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;
                }
                .ch-split { display: flex; height: 26px; border-radius: 6px; overflow: hidden; background: var(--surface-sunken); }
                .ch-seg {
                    display: flex; align-items: center; justify-content: center;
                    transition: width 300ms cubic-bezier(0.2, 0.8, 0.3, 1); min-width: 2px;
                }
                .ch-seg span {
                    font-size: 11px; font-weight: 800; color: #fff;
                    font-variant-numeric: tabular-nums; text-shadow: 0 1px 2px rgba(0,0,0,0.18);
                }
                .ch-splitlegend {
                    display: flex; gap: 16px; margin-top: 7px; font-size: 11px;
                    color: #475569; font-weight: 700; font-variant-numeric: tabular-nums; flex-wrap: wrap;
                }
                .ch-stats {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
                    padding: 11px 12px; background: var(--surface-sunken); border-radius: 10px;
                }
                .ch-stat { min-width: 0; }
                .ch-stat-label {
                    display: block; font-size: 9px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;
                }
                .ch-stat strong {
                    font-size: 14px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums;
                }
                @media (max-width: 420px) {
                    .ch-stats { grid-template-columns: 1fr 1fr; }
                }
                @media (prefers-reduced-motion: reduce) { .ch-seg { transition: none; } }
            `}</style>
        </div>
    );
}
