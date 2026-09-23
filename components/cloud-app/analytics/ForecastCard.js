'use client';
import { compactMoney, money } from './format';
import { EmptyState } from './ChartCard';

/**
 * Month-end run-rate projection. Deliberately transparent - `basis` is printed
 * verbatim so nobody mistakes linear extrapolation for a model.
 */
export default function ForecastCard({ forecast }) {
    if (!forecast || forecast.projectedMonthRevenue == null) {
        return <EmptyState label="Not enough data this month to project" />;
    }

    const {
        projectedMonthRevenue = 0, monthToDateRevenue = 0, runRatePerDay = 0,
        daysElapsed = 0, daysInMonth = 30, vsLastMonthPct, basis,
    } = forecast;

    const pctElapsed = daysInMonth > 0 ? Math.min(100, (daysElapsed / daysInMonth) * 100) : 0;
    const pctAchieved = projectedMonthRevenue > 0
        ? Math.min(100, (monthToDateRevenue / projectedMonthRevenue) * 100) : 0;
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
    const up = (vsLastMonthPct ?? 0) >= 0;

    return (
        <div className="fc">
            <div className="fc-hero">
                <div>
                    <span className="fc-label">Projected month-end revenue</span>
                    <span className="fc-value" title={money(projectedMonthRevenue)}>{compactMoney(projectedMonthRevenue)}</span>
                </div>
                {vsLastMonthPct != null && (
                    <span className="fc-delta" style={{
                        color: up ? 'var(--status-success-fg)' : 'var(--status-danger-fg)',
                        background: up ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                        borderColor: up ? 'var(--status-success-border)' : 'var(--status-danger-border)',
                    }}>
                        <span aria-hidden="true">{up ? '↑' : '↓'}</span> {Math.abs(vsLastMonthPct).toFixed(1)}% vs last month
                    </span>
                )}
            </div>

            <div className="fc-bar" role="img" aria-label={`${pctAchieved.toFixed(0)}% of projection booked, ${pctElapsed.toFixed(0)}% of month elapsed`}>
                <div className="fc-bar-fill" style={{ width: `${pctAchieved}%` }} />
                <div className="fc-bar-marker" style={{ left: `${pctElapsed}%` }} title={`${daysElapsed} of ${daysInMonth} days elapsed`} />
            </div>
            <div className="fc-barlabels">
                <span>{compactMoney(monthToDateRevenue)} booked ({pctAchieved.toFixed(0)}%)</span>
                <span>Day {daysElapsed} of {daysInMonth}</span>
            </div>

            <div className="fc-stats">
                <div className="fc-stat">
                    <span className="fc-stat-label">Month to date</span>
                    <strong title={money(monthToDateRevenue)}>{compactMoney(monthToDateRevenue)}</strong>
                </div>
                <div className="fc-stat">
                    <span className="fc-stat-label">Run rate / day</span>
                    <strong title={money(runRatePerDay)}>{compactMoney(runRatePerDay)}</strong>
                </div>
                <div className="fc-stat">
                    <span className="fc-stat-label">Days remaining</span>
                    <strong>{daysRemaining}</strong>
                </div>
            </div>

            <p className="fc-basis"><span aria-hidden="true">ⓘ</span> {basis || 'Linear run-rate from month-to-date revenue'}</p>

            <style jsx>{`
                .fc { display: flex; flex-direction: column; gap: 12px; }
                .fc-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
                .fc-label {
                    display: block; font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;
                }
                .fc-value {
                    font-size: 30px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums; letter-spacing: -0.03em; line-height: 1;
                }
                .fc-delta {
                    font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px;
                    border: 1px solid; font-variant-numeric: tabular-nums; white-space: nowrap;
                }
                .fc-bar {
                    position: relative; height: 12px; background: var(--surface-hover);
                    border-radius: 20px; overflow: visible;
                }
                .fc-bar-fill {
                    height: 100%; border-radius: 20px;
                    background: linear-gradient(90deg, #6549c4, #2a78d6);
                    transition: width 400ms cubic-bezier(0.2, 0.8, 0.3, 1);
                }
                .fc-bar-marker {
                    position: absolute; top: -4px; width: 2px; height: 20px;
                    background: #2d1753; border-radius: 2px;
                }
                .fc-bar-marker::after {
                    content: ''; position: absolute; top: -3px; left: -2px;
                    width: 6px; height: 6px; border-radius: 50%; background: #2d1753;
                }
                .fc-barlabels {
                    display: flex; justify-content: space-between; font-size: 10.5px;
                    color: #6c757d; font-variant-numeric: tabular-nums; margin-top: -6px;
                }
                .fc-stats {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
                    padding: 12px; background: var(--surface-sunken); border-radius: 10px;
                }
                .fc-stat { min-width: 0; }
                .fc-stat-label {
                    display: block; font-size: 9px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;
                }
                .fc-stat strong {
                    font-size: 14px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums;
                }
                .fc-basis { font-size: 10.5px; color: #94a3b8; margin: 0; line-height: 1.5; }
                @media (prefers-reduced-motion: reduce) { .fc-bar-fill { transition: none; } }
            `}</style>
        </div>
    );
}
