'use client';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatValue, money, deltaTone, TONE_COLORS } from './format';

const ARROW = { up: '↑', down: '↓', flat: '→' };

/**
 * One self-contained KPI: big value, semantic delta pill, comparison label and
 * an axis-less sparkline of the current window.
 */
export default function KpiCard({ kpi, compareLabel, onClick }) {
    if (!kpi) return null;
    const unavailable = kpi.value === null || kpi.value === undefined;
    const tone = deltaTone(kpi.direction, kpi.goodWhen);
    const c = TONE_COLORS[tone];
    const spark = Array.isArray(kpi.spark) ? kpi.spark.filter(v => typeof v === 'number') : [];
    const sparkData = spark.map((v, i) => ({ i, v }));
    const hasSpark = sparkData.length >= 2 && sparkData.some(p => p.v !== 0);
    // The sparkline is history, not a verdict - keep it neutral and let the
    // delta pill carry the good/bad semantics. A wall of red sparklines reads
    // as breakage rather than information.
    const sparkColor = '#8e77dc';
    const gid = `kspark-${kpi.key || 'k'}`;

    const fullValue = kpi.format === 'money' && !unavailable ? money(kpi.value) : undefined;
    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            className={`kc-card ${unavailable ? 'kc-na' : ''} ${onClick ? 'kc-clickable' : ''}`}
            onClick={onClick}
            type={onClick ? 'button' : undefined}
        >
            <div className="kc-label">
                <span>{kpi.label || kpi.key}</span>
                {kpi.hint && (
                    <span className="kc-info" title={kpi.hint} aria-label={kpi.hint} role="note" tabIndex={0}>ⓘ</span>
                )}
            </div>

            <div className="kc-valrow">
                <span className="kc-value" title={fullValue}>
                    {unavailable ? '-' : formatValue(kpi.value, kpi.format)}
                </span>
                {!unavailable && kpi.deltaPct != null && (
                    <span
                        className="kc-delta"
                        style={{ color: c.fg, background: c.bg, borderColor: c.border }}
                    >
                        <span aria-hidden="true">{ARROW[kpi.direction] || '→'}</span>
                        {Math.abs(kpi.deltaPct).toFixed(1)}%
                    </span>
                )}
            </div>

            <div className="kc-foot">
                {unavailable
                    ? <span className="kc-na-reason">{kpi.hint || 'Not available on this data'}</span>
                    : <span className="kc-cmp">{kpi.deltaPct == null ? 'No comparison data' : (compareLabel || 'vs previous period')}</span>}
            </div>

            <div className="kc-spark" aria-hidden="true">
                {hasSpark ? (
                    <ResponsiveContainer width="100%" height={32}>
                        <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.30} />
                                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.6}
                                fill={`url(#${gid})`} isAnimationActive={false} dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : <div className="kc-spark-flat" />}
            </div>

            <style jsx>{`
                .kc-card {
                    position: relative; text-align: left; width: 100%; font-family: inherit;
                    background: var(--bg-white, #fff); border: 1px solid var(--border); border-radius: 12px;
                    padding: 12px 14px 0; overflow: hidden; min-width: 0;
                    box-shadow: 0 1px 2px rgba(45, 23, 83, 0.04);
                    transition: box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease;
                }
                .kc-clickable { cursor: pointer; }
                .kc-clickable:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45,23,83,0.10); border-color: #d9cffb; }
                .kc-clickable:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 2px; }
                .kc-na { opacity: 0.72; }
                .kc-label {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 10px; font-weight: 800; color: #6c757d;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .kc-info { color: #b6b0c9; cursor: help; font-size: 10px; }
                .kc-info:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 2px; border-radius: 50%; }
                .kc-valrow { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-top: 7px; }
                .kc-value {
                    font-size: 21px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums; letter-spacing: -0.025em; line-height: 1.1;
                }
                .kc-delta {
                    font-size: 10.5px; font-weight: 800; padding: 2px 7px; border-radius: 20px;
                    border: 1px solid; font-variant-numeric: tabular-nums; white-space: nowrap;
                    display: inline-flex; align-items: center; gap: 2px;
                }
                .kc-foot { margin-top: 5px; min-height: 14px; }
                .kc-cmp, .kc-na-reason {
                    font-size: 10.5px; color: #94a3b8; display: block;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .kc-spark { margin: 6px -14px 0; height: 32px; }
                .kc-spark-flat { height: 32px; border-bottom: 1px dashed var(--border); }
                @media (prefers-reduced-motion: reduce) {
                    .kc-card { transition: none; }
                    .kc-clickable:hover { transform: none; }
                }
            `}</style>
        </Tag>
    );
}
