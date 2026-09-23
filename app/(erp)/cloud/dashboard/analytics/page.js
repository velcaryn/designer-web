'use client';
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import {
    ResponsiveContainer, ComposedChart, LineChart, Line, AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Bone } from '@/components/ui/skeleton';

import {
    SERIES, money, compactMoney, compactNumber, ymd, parseYmd,
    TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, AXIS_TICK, GRID_STROKE,
} from '@/components/cloud-app/analytics/format';
import ChartCard, { EmptyState } from '@/components/cloud-app/analytics/ChartCard';
import InsightsStrip from '@/components/cloud-app/analytics/InsightsStrip';
import KpiCard from '@/components/cloud-app/analytics/KpiCard';
import FilterBar, { DIMENSIONS } from '@/components/cloud-app/analytics/FilterBar';
import DrilldownModal from '@/components/cloud-app/analytics/DrilldownModal';
import ActivityHeatmap from '@/components/cloud-app/analytics/ActivityHeatmap';
import FunnelChart from '@/components/cloud-app/analytics/FunnelChart';
import ForecastCard from '@/components/cloud-app/analytics/ForecastCard';
import ConcentrationCard from '@/components/cloud-app/analytics/ConcentrationCard';
import CohortCard from '@/components/cloud-app/analytics/CohortCard';

// The 3D hero uses react-three-fiber, which touches WebGL/DOM APIs that don't
// exist during SSR - load it client-only.
const RevenueHero3D = dynamic(() => import('./RevenueHero3D'), {
    ssr: false,
    loading: () => <div className="an-hero-loading">Loading 3D view…</div>,
});

const SAVED_VIEWS_KEY = 'velbiz.analytics.savedViews.v2';

const TABS = [
    ['overview', 'Overview'],
    ['revenue', 'Revenue'],
    ['pipeline', 'Pipeline'],
    ['operations', 'Operations'],
];

function presetRange(key) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    switch (key) {
        case 'thisMonth': return { from: new Date(y, m, 1), to: now };
        case 'lastMonth': return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
        case 'last30': return { from: new Date(now.getTime() - 30 * 864e5), to: now };
        case 'thisYear': return { from: new Date(y, 0, 1), to: now };
        case 'last12m': return { from: new Date(y, m - 11, 1), to: now };
        case 'last90':
        default: return { from: new Date(now.getTime() - 90 * 864e5), to: now };
    }
}

const EMPTY_FILTERS = { clientId: null, itemId: null, source: null, warehouseId: null, soStatus: null };

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);       // first paint only
    const [refreshing, setRefreshing] = useState(false); // subsequent fetches
    const [data, setData] = useState(null);
    const [groupBy, setGroupBy] = useState('week');
    const [compare, setCompare] = useState('prev');
    const [range, setRange] = useState(() => presetRange('last90'));
    const [preset, setPreset] = useState('last90');
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [exporting, setExporting] = useState('');
    const [heroView, setHeroView] = useState('2d');
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [tab, setTab] = useState('overview');
    const [drilldown, setDrilldown] = useState(null);
    const [savedViews, setSavedViews] = useState([]);
    const firstLoad = useRef(true);

    // ---- saved views (localStorage) -------------------------------------
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(SAVED_VIEWS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setSavedViews(parsed);
            }
        } catch { /* corrupt or unavailable storage - start clean */ }
    }, []);

    const persistViews = useCallback((views) => {
        setSavedViews(views);
        try { window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views)); }
        catch { toast.error('Could not save the view locally.'); }
    }, []);

    // ---- fetch ----------------------------------------------------------
    const queryString = useMemo(() => {
        const p = new URLSearchParams({
            from: range.from.toISOString(),
            to: range.to.toISOString(),
            groupBy,
            compare,
        });
        for (const d of DIMENSIONS) {
            if (filters[d.key]) p.set(d.key, filters[d.key]);
        }
        return p.toString();
    }, [range, groupBy, compare, filters]);

    const load = useCallback(async () => {
        if (firstLoad.current) setLoading(true); else setRefreshing(true);
        try {
            const res = await fetch(`/api/cloud/erp/analytics?${queryString}`);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || 'Failed to load analytics');
            setData(json);
        } catch (err) {
            toast.error(err.message || 'Failed to load analytics.');
        } finally {
            firstLoad.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    }, [queryString]);

    useEffect(() => { load(); }, [load]);

    // ---- control handlers ------------------------------------------------
    const applyPreset = useCallback((key) => { setPreset(key); setRange(presetRange(key)); }, []);
    const changeRange = useCallback((which, value) => {
        if (!value) return;
        setPreset('');
        setRange(r => ({ ...r, [which]: parseYmd(value) }));
    }, []);
    const changeFilter = useCallback((key, value) => {
        setFilters(f => (f[key] === value ? f : { ...f, [key]: value || null }));
    }, []);
    const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

    /** Cross-filter: clicking a chart element narrows the whole dashboard. */
    const crossFilter = useCallback((key, value, label) => {
        if (!value) return;
        // Toast outside the state updater - updaters must stay pure, or React
        // warns about updating another component while rendering this one.
        const next = filters[key] === value ? null : value;
        setFilters(f => ({ ...f, [key]: next }));
        toast.success(next ? `Filtered to ${label || value}` : `Cleared ${label || value} filter`);
    }, [filters]);

    function saveView(name) {
        const view = { name, range: { from: range.from.toISOString(), to: range.to.toISOString() }, preset, groupBy, compare, filters };
        persistViews([...savedViews.filter(v => v.name !== name), view]);
        toast.success(`Saved view “${name}”`);
    }
    function applyView(v) {
        if (!v) return;
        setRange({ from: new Date(v.range.from), to: new Date(v.range.to) });
        setPreset(v.preset || '');
        setGroupBy(v.groupBy || 'week');
        setCompare(v.compare || 'prev');
        setFilters({ ...EMPTY_FILTERS, ...(v.filters || {}) });
        toast.success(`Applied “${v.name}”`);
    }
    function deleteView(name) { persistViews(savedViews.filter(v => v.name !== name)); }

    async function handleExport(format) {
        setExporting(format);
        try {
            const res = await fetch(`/api/cloud/erp/analytics/export?${queryString}&format=${format}`);
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = format === 'pdf' ? 'analytics-report.pdf' : 'analytics-revenue.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            toast.error(err.message || 'Export failed.');
        } finally {
            setExporting('');
        }
    }

    // ---- normalise the payload (v2 shape, tolerant of the v1 shape) ------
    const d = data || {};
    const kpis = Array.isArray(d.kpis) ? d.kpis : [];
    const compareLabel = d.range?.compare?.label || '';
    const options = d.filters?.options || {};
    const series = d.series || {};
    const revSeries = Array.isArray(series.revenue) ? series.revenue : (Array.isArray(d.revenueSeries) ? d.revenueSeries : []);
    const paceSeries = Array.isArray(series.pace) ? series.pace : [];
    const cashFlow = Array.isArray(series.cashFlow) ? series.cashFlow : (Array.isArray(d.cashFlow) ? d.cashFlow : []);
    const bk = d.breakdowns || {};
    const byClient = Array.isArray(bk.byClient) ? bk.byClient : (Array.isArray(d.revenueByClient) ? d.revenueByClient : []);
    const byItem = Array.isArray(bk.byItem) ? bk.byItem : (Array.isArray(d.revenueByItem) ? d.revenueByItem : []);
    const aging = Array.isArray(bk.receivablesAging)
        ? bk.receivablesAging
        : Object.entries(d.receivablesAging || {}).map(([bucket, amount]) => ({ bucket, amount, count: null }));
    const payments = Array.isArray(bk.paymentsByMethod) ? bk.paymentsByMethod : (Array.isArray(d.paymentsBreakdown) ? d.paymentsBreakdown : []);
    const leadsFunnel = Array.isArray(bk.leadsFunnel) ? bk.leadsFunnel : (d.leadsFunnel?.stages || []);
    const soFunnel = Array.isArray(bk.salesOrderFunnel) ? bk.salesOrderFunnel : (d.salesOrderFunnel?.byStatus || []);
    const leadsBySource = Array.isArray(bk.leadsBySource) ? bk.leadsBySource : [];
    const heatmap = Array.isArray(d.activityHeatmap) ? d.activityHeatmap : [];
    const inv = d.inventorySnapshot || {};

    const hasCompare = compare !== 'none' && revSeries.some(r => r?.prevRevenue != null);
    const hasAging = aging.some(a => Number(a.amount) > 0);
    const hasCashFlow = cashFlow.some(c => c?.cashIn || c?.cashOut);
    const revTotal = revSeries.reduce((s, r) => s + Number(r?.revenue || 0), 0);

    const fromISO = range.from.toISOString();
    const toISO = range.to.toISOString();

    const openDrilldown = useCallback((dimension, value, label) => {
        if (!value) return;
        setDrilldown({ dimension, value, label: label || value });
    }, []);

    // Wire a drill-down's "filter dashboard to this" back into the filter state.
    const filterFromDrilldown = useCallback((target) => {
        const map = { client: 'clientId', item: 'itemId', soStatus: 'soStatus', paymentMethod: null, leadStage: null, agingBucket: null, period: null };
        const key = map[target.dimension];
        if (key) crossFilter(key, target.value, target.label);
    }, [crossFilter]);

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="an-page">
            <div className="an-header">
                <div>
                    <h1 className="an-title">Analytics</h1>
                    <p className="an-subtitle">
                        {d.range?.from ? `${new Date(d.range.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(d.range.to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Revenue, pipeline and operations performance'}
                        {compareLabel && <span className="an-cmp"> · {compareLabel}</span>}
                    </p>
                </div>
                <div className="an-total">
                    <span className="an-total-label">Revenue in range</span>
                    <strong title={money(revTotal)}>{compactMoney(revTotal)}</strong>
                </div>
            </div>

            <InsightsStrip insights={d.insights} loading={refreshing && !d.insights} />

            <FilterBar
                range={range} onRangeChange={changeRange}
                preset={preset} onPreset={applyPreset}
                groupBy={groupBy} onGroupBy={setGroupBy}
                compare={compare} onCompare={setCompare}
                filters={filters} onFilterChange={changeFilter} onClearFilters={clearFilters}
                options={options}
                savedViews={savedViews} onSaveView={saveView} onApplyView={applyView} onDeleteView={deleteView}
                exporting={exporting} onExport={handleExport}
                refreshing={refreshing}
            />

            {/* KPI row - always visible above the tabs */}
            {kpis.length > 0 ? (
                <div className="an-kpis">
                    {kpis.map(k => (
                        <KpiCard
                            key={k.key}
                            kpi={k}
                            compareLabel={compareLabel}
                        />
                    ))}
                </div>
            ) : (
                <div className="an-kpis-empty"><EmptyState label="No KPIs returned for this range" compact /></div>
            )}

            <nav className="an-tabs" role="tablist" aria-label="Analytics sections">
                {TABS.map(([key, label]) => (
                    <button
                        key={key} type="button" role="tab" id={`an-tab-${key}`}
                        aria-selected={tab === key} aria-controls={`an-panel-${key}`}
                        className={`an-tab ${tab === key ? 'an-tab-on' : ''}`}
                        onClick={() => setTab(key)}
                    >{label}</button>
                ))}
            </nav>

            <div className="an-panel" role="tabpanel" id={`an-panel-${tab}`} aria-labelledby={`an-tab-${tab}`}>

                {/* ---------------- OVERVIEW ---------------- */}
                {tab === 'overview' && (
                    <div className="an-grid">
                        <ChartCard
                            span
                            title="Revenue by period"
                            subtitle="Bars are revenue; the line is invoice count on the right axis."
                            actions={
                                <div className="an-seg" role="group" aria-label="Chart view">
                                    {['2d', '3d'].map(v => (
                                        <button key={v} type="button" className={`an-seg-btn ${heroView === v ? 'an-seg-on' : ''}`}
                                            aria-pressed={heroView === v} onClick={() => setHeroView(v)}>
                                            {v.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            }
                        >
                            {revSeries.length === 0 ? <EmptyState /> : heroView === '3d' ? (
                                <>
                                    <div className="an-hero-wrap">
                                        <Suspense fallback={<div className="an-hero-loading">Loading 3D view…</div>}>
                                            <RevenueHero3D series={revSeries} selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
                                        </Suspense>
                                    </div>
                                    <p className="an-hint">Drag to rotate, scroll to zoom, click a bar to select a period.</p>
                                </>
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <ComposedChart
                                        data={revSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                        onClick={e => { if (e?.activeLabel) setSelectedPeriod(p => (p === e.activeLabel ? null : e.activeLabel)); }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                                        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} minTickGap={16} />
                                        <YAxis yAxisId="rev" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={compactMoney} width={62} />
                                        <YAxis yAxisId="cnt" orientation="right" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} width={34} />
                                        <Tooltip
                                            contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} cursor={{ fill: 'rgba(74,58,167,0.05)' }}
                                            formatter={(v, name) => (name === 'Invoices' ? [v, name] : [money(v), name])}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 11.5 }} />
                                        {/* fill also drives the legend swatch - per-bar Cells alone leave it black */}
                                        <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill={SERIES[0]} radius={[4, 4, 0, 0]} cursor="pointer" maxBarSize={54}>
                                            {revSeries.map(e => (
                                                <Cell key={e.period} fill={e.period === selectedPeriod ? SERIES[1] : SERIES[0]} />
                                            ))}
                                        </Bar>
                                        {hasCompare && (
                                            <Line yAxisId="rev" type="monotone" dataKey="prevRevenue" name={compareLabel || 'Previous'}
                                                stroke="#94a3b8" strokeWidth={1.8} strokeDasharray="5 4" dot={false} />
                                        )}
                                        {/* Linear, not monotone: invoice count is a small discrete
                                            integer per bucket, and curve-smoothing it implies
                                            fractional invoices between periods that never existed. */}
                                        <Line yAxisId="cnt" type="linear" dataKey="invoiceCount" name="Invoices"
                                            stroke={SERIES[2]} strokeWidth={2} dot={{ r: 2 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                            {selectedPeriod && (() => {
                                const sel = revSeries.find(r => r.period === selectedPeriod);
                                if (!sel) return null;
                                return (
                                    <div className="an-selbar">
                                        <span><em>Period</em><strong>{sel.label || sel.period}</strong></span>
                                        <span><em>Revenue</em><strong>{money(sel.revenue)}</strong></span>
                                        <span><em>Invoices</em><strong>{sel.invoiceCount ?? '-'}</strong></span>
                                        <button type="button" className="an-minibtn" onClick={() => openDrilldown('period', sel.period, sel.label || sel.period)}>View documents</button>
                                        <button type="button" className="an-minibtn" onClick={() => setSelectedPeriod(null)}>Clear</button>
                                    </div>
                                );
                            })()}
                        </ChartCard>

                        <ChartCard title="Pace" subtitle="Cumulative revenue vs the comparison window" hint="Above the dashed line means you are ahead of the prior period at the same point.">
                            {paceSeries.length === 0 ? <EmptyState label="No pace data for this period" /> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <ComposedChart data={paceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="paceFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.26} />
                                                <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                                        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} minTickGap={20} />
                                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={compactMoney} width={62} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} formatter={v => money(v)} />
                                        <Legend wrapperStyle={{ fontSize: 11.5 }} />
                                        <Area type="monotone" dataKey="cumulative" name="This period" stroke={SERIES[0]} strokeWidth={2.2} fill="url(#paceFill)" />
                                        <Line type="monotone" dataKey="prevCumulative" name="Comparison" stroke="#94a3b8" strokeWidth={1.8} strokeDasharray="5 4" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Month-end forecast" subtitle="Current calendar month">
                            <ForecastCard forecast={d.forecast} />
                        </ChartCard>

                        <ChartCard span title="Activity" subtitle="Documents created per day">
                            <ActivityHeatmap
                                data={heatmap}
                                onSelectDay={cell => openDrilldown('period', String(cell.date).slice(0, 10), String(cell.date).slice(0, 10))}
                            />
                        </ChartCard>
                    </div>
                )}

                {/* ---------------- REVENUE ---------------- */}
                {tab === 'revenue' && (
                    <div className="an-grid">
                        <ChartCard
                            span
                            title="Revenue concentration"
                            subtitle="Share of revenue by client - click a tile to drill in"
                            badge={d.concentration?.riskLevel ? `${String(d.concentration.riskLevel).toUpperCase()} DEPENDENCY` : undefined}
                        >
                            <ConcentrationCard
                                byClient={byClient}
                                concentration={d.concentration}
                                onSelect={c => openDrilldown('client', c.id || c.name, c.name)}
                            />
                        </ChartCard>

                        <ChartCard title="Revenue by client" subtitle="Click a bar to filter the dashboard">
                            {byClient.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={Math.max(220, Math.min(byClient.length, 10) * 32)}>
                                    <BarChart data={byClient.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 46, left: 4, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                                        <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={compactMoney} />
                                        <YAxis type="category" dataKey="name" width={104} tick={{ fontSize: 11, fill: '#2d1753' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} cursor={{ fill: 'rgba(74,58,167,0.05)' }} formatter={v => money(v)} />
                                        <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} cursor="pointer" maxBarSize={22}
                                            onClick={e => crossFilter('clientId', e?.id || e?.name, e?.name)}>
                                            {byClient.slice(0, 10).map(c => (
                                                <Cell key={c.id || c.name} fill={filters.clientId && String(filters.clientId) === String(c.id || c.name) ? SERIES[1] : SERIES[0]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Revenue by item" subtitle="Click a bar to filter the dashboard">
                            {byItem.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={Math.max(220, Math.min(byItem.length, 10) * 32)}>
                                    <BarChart data={byItem.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 46, left: 4, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                                        <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={compactMoney} />
                                        <YAxis type="category" dataKey="name" width={104} tick={{ fontSize: 11, fill: '#2d1753' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} cursor={{ fill: 'rgba(74,58,167,0.05)' }} formatter={v => money(v)} />
                                        <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} cursor="pointer" maxBarSize={22}
                                            onClick={e => crossFilter('itemId', e?.id || e?.name, e?.name)}>
                                            {byItem.slice(0, 10).map(c => (
                                                <Cell key={c.id || c.name} fill={filters.itemId && String(filters.itemId) === String(c.id || c.name) ? SERIES[1] : SERIES[2]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="New vs returning customers">
                            <CohortCard cohort={d.cohort} />
                        </ChartCard>

                        <ChartCard title="Cash flow" subtitle="Money in vs money out">
                            {!hasCashFlow ? <EmptyState label="No cash movement in this period" /> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={cashFlow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                                        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} minTickGap={20} />
                                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={compactMoney} width={62} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} formatter={v => money(v)} />
                                        <Legend wrapperStyle={{ fontSize: 11.5 }} />
                                        <Area type="monotone" dataKey="cashIn" name="Cash in" stroke={SERIES[2]} fill={SERIES[2]} fillOpacity={0.16} strokeWidth={2} />
                                        <Area type="monotone" dataKey="cashOut" name="Cash out" stroke={SERIES[7]} fill={SERIES[7]} fillOpacity={0.16} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>
                )}

                {/* ---------------- PIPELINE ---------------- */}
                {tab === 'pipeline' && (
                    <div className="an-grid">
                        <ChartCard title="Leads funnel" subtitle="Conversion between stages">
                            <FunnelChart
                                stages={leadsFunnel}
                                onSelect={s => openDrilldown('leadStage', s.id, s.label)}
                                emptyLabel="No leads in this period"
                            />
                        </ChartCard>

                        <ChartCard title="Sales order funnel" subtitle="Click a stage to filter by status">
                            <FunnelChart
                                stages={soFunnel}
                                onSelect={s => crossFilter('soStatus', s.id, s.label)}
                                emptyLabel="No sales orders in this period"
                            />
                        </ChartCard>

                        <ChartCard span title="Leads by source" subtitle="Volume and win rate - click a bar to filter">
                            {leadsBySource.length === 0 ? <EmptyState label="No lead sources recorded" /> : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <ComposedChart data={leadsBySource} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                                        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                                        <YAxis yAxisId="c" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
                                        <YAxis yAxisId="w" orientation="right" tick={AXIS_TICK} axisLine={false} tickLine={false} width={42} tickFormatter={v => `${v}%`} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} cursor={{ fill: 'rgba(74,58,167,0.05)' }}
                                            formatter={(v, n) => (n === 'Win rate' ? [`${Number(v).toFixed(1)}%`, n] : [v, n])} />
                                        <Legend wrapperStyle={{ fontSize: 11.5 }} />
                                        <Bar yAxisId="c" dataKey="count" name="Leads" fill={SERIES[0]} radius={[4, 4, 0, 0]} cursor="pointer" maxBarSize={48}
                                            onClick={e => crossFilter('source', e?.source, e?.label)}>
                                            {leadsBySource.map(s => (
                                                <Cell key={s.source} fill={filters.source === s.source ? SERIES[1] : SERIES[0]} />
                                            ))}
                                        </Bar>
                                        <Bar yAxisId="c" dataKey="wonCount" name="Won" radius={[4, 4, 0, 0]} fill={SERIES[2]} maxBarSize={48} />
                                        <Line yAxisId="w" type="monotone" dataKey="winRate" name="Win rate" stroke={SERIES[3]} strokeWidth={2} dot={{ r: 2.5 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>
                )}

                {/* ---------------- OPERATIONS ---------------- */}
                {tab === 'operations' && (
                    <div className="an-grid">
                        <ChartCard title="Receivables aging" subtitle="Click a bucket to see the invoices">
                            {!hasAging ? <EmptyState label="Nothing outstanding - all invoices settled" /> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={aging} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                                        <XAxis dataKey="bucket" tick={AXIS_TICK} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={compactMoney} width={62} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} cursor={{ fill: 'rgba(74,58,167,0.05)' }}
                                            formatter={(v, n, p) => [`${money(v)}${p?.payload?.count != null ? ` · ${p.payload.count} invoice(s)` : ''}`, 'Outstanding']} />
                                        <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]} cursor="pointer" maxBarSize={64}
                                            onClick={e => openDrilldown('agingBucket', e?.bucket, `${e?.bucket} days`)}>
                                            {aging.map((a, i) => (
                                                <Cell key={a.bucket} fill={['#1baf7a', '#eda100', '#eb6834', '#e34948'][i] || SERIES[i % SERIES.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Payments by method" subtitle="Click a slice to see the payments">
                            {payments.length === 0 ? <EmptyState label="No payments recorded in this period" /> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={payments} dataKey="amount" nameKey="label" innerRadius={54} outerRadius={90} paddingAngle={2} cursor="pointer"
                                            onClick={e => openDrilldown('paymentMethod', e?.method, e?.label || e?.method)}>
                                            {payments.map((p, i) => <Cell key={p.method || i} fill={SERIES[i % SERIES.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n, p) => [`${money(v)}${p?.payload?.share != null ? ` · ${Number(p.payload.share).toFixed(1)}%` : ''}`, p?.payload?.label || n]} />
                                        <Legend wrapperStyle={{ fontSize: 11.5 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard span title="Inventory snapshot">
                            <div className="an-inv">
                                <div className="an-invstats">
                                    <div className="an-invstat">
                                        <span>Total stock value</span>
                                        <strong title={money(inv.totalStockValue)}>{compactMoney(inv.totalStockValue)}</strong>
                                    </div>
                                    <div className="an-invstat">
                                        <span>Low stock items</span>
                                        <strong style={{ color: inv.lowStockCount > 0 ? '#991b1b' : undefined }}>{compactNumber(inv.lowStockCount)}</strong>
                                    </div>
                                </div>
                                <div className="an-movers">
                                    <div>
                                        <h3 className="an-minititle">Fast movers</h3>
                                        {inv.fastMovers?.length > 0
                                            ? <ul className="an-list">{inv.fastMovers.map(m => <li key={m.itemId}><span>{m.name}</span><strong>{m.moves} moves</strong></li>)}</ul>
                                            : <EmptyState compact label="No movement recorded" />}
                                    </div>
                                    <div>
                                        <h3 className="an-minititle">Slow / dead movers</h3>
                                        {inv.slowMovers?.length > 0
                                            ? <ul className="an-list">{inv.slowMovers.map(m => <li key={m.itemId}><span>{m.name}</span><strong>{m.moves} moves</strong></li>)}</ul>
                                            : <EmptyState compact label="No stagnant stock" />}
                                    </div>
                                </div>
                            </div>
                        </ChartCard>
                    </div>
                )}
            </div>

            {d.meta?.generatedAt && (
                <p className="an-meta">
                    Generated {new Date(d.meta.generatedAt).toLocaleString('en-IN')}
                    {d.meta.unavailable?.length > 0 && ` · Unavailable on this data: ${d.meta.unavailable.join(', ')}`}
                </p>
            )}

            {drilldown && (
                <DrilldownModal
                    target={drilldown}
                    from={fromISO}
                    to={toISO}
                    onClose={() => setDrilldown(null)}
                    onFilterHere={filterFromDrilldown}
                />
            )}

            <style jsx>{`
                .an-page { padding-bottom: 28px; max-width: 100%; overflow-x: hidden; }
                .an-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
                }
                .an-title {
                    font-size: clamp(1.25rem, 2.6vw, 1.5rem); font-weight: 800;
                    color: var(--secondary-color, #2d1753); margin: 0; letter-spacing: -0.02em;
                }
                .an-subtitle { font-size: 12.5px; color: #6c757d; margin: 4px 0 0; }
                .an-cmp { color: #94a3b8; }
                .an-total { text-align: right; }
                .an-total-label {
                    display: block; font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .an-total strong {
                    font-size: 24px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums; letter-spacing: -0.03em;
                }

                .an-kpis {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(186px, 1fr));
                    gap: 10px; margin-bottom: 18px;
                }
                /* Eight KPIs read best as two even rows of four rather than a
                   ragged 5 + 3 wrap. */
                @media (min-width: 1120px) {
                    .an-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                }
                .an-kpis-empty { margin-bottom: 18px; }

                .an-tabs {
                    display: flex; gap: 4px; border-bottom: 2px solid #f0ecfb;
                    margin-bottom: 16px; overflow-x: auto; scrollbar-width: none;
                }
                .an-tabs::-webkit-scrollbar { display: none; }
                .an-tab {
                    border: none; background: none; font-family: inherit; cursor: pointer;
                    padding: 9px 14px; font-size: 13px; font-weight: 800; color: #94a3b8;
                    border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap;
                    transition: color 150ms ease, border-color 150ms ease;
                }
                .an-tab:hover { color: var(--primary-color, #4a3aa7); }
                .an-tab-on { color: var(--primary-color, #4a3aa7); border-bottom-color: var(--primary-color, #4a3aa7); }
                .an-tab:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: -2px; border-radius: 6px; }

                .an-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }

                .an-seg { display: flex; border: 1.5px solid #e2e0ea; border-radius: 8px; overflow: hidden; height: 30px; }
                .an-seg-btn {
                    border: none; background: var(--surface); padding: 0 13px; font-size: 11.5px; font-weight: 800;
                    cursor: pointer; color: #475569; font-family: inherit; transition: background 150ms ease;
                }
                .an-seg-btn:hover { background: var(--surface-hover); }
                .an-seg-on { background: var(--primary-color, #4a3aa7); color: #fff; }
                .an-seg-on:hover { background: var(--primary-color, #4a3aa7); }
                .an-seg-btn:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: -2px; }

                .an-hero-wrap {
                    height: 340px; border-radius: 12px; overflow: hidden;
                    background: linear-gradient(180deg, #faf9fd 0%, #f3f0ff 100%); position: relative;
                }
                .an-hero-loading {
                    height: 340px; display: flex; align-items: center; justify-content: center;
                    color: #6c757d; font-size: 13px; border-radius: 12px; background: var(--surface-sunken);
                }
                .an-hint { font-size: 11px; color: #94a3b8; margin: 9px 0 0; text-align: center; }

                .an-selbar {
                    display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-top: 12px;
                    padding: 10px 14px; background: var(--surface-sunken); border: 1px solid var(--border); border-radius: 10px;
                }
                .an-selbar em {
                    display: block; font-style: normal; font-size: 9.5px; font-weight: 800;
                    color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
                }
                .an-selbar strong {
                    font-size: 13px; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums; font-weight: 800;
                }
                .an-minibtn {
                    border: 1.5px solid #e2e0ea; background: var(--surface); border-radius: 7px; padding: 5px 11px;
                    font-size: 11.5px; font-weight: 800; color: #4a3aa7; cursor: pointer;
                    font-family: inherit; transition: background 150ms ease;
                }
                .an-minibtn:hover { background: var(--surface-hover); }
                .an-minibtn:first-of-type { margin-left: auto; }
                .an-minibtn:focus-visible { outline: 2px solid var(--primary-color, #4a3aa7); outline-offset: 2px; }

                .an-inv { display: flex; flex-direction: column; gap: 14px; }
                .an-invstats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
                .an-invstat { background: var(--surface-sunken); border-radius: 10px; padding: 11px 13px; }
                .an-invstat span {
                    display: block; font-size: 9.5px; font-weight: 800; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;
                }
                .an-invstat strong {
                    font-size: 18px; font-weight: 800; color: var(--secondary-color, #2d1753);
                    font-variant-numeric: tabular-nums;
                }
                .an-movers { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .an-minititle {
                    font-size: 10px; font-weight: 800; color: var(--primary-color, #4a3aa7);
                    text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px;
                }
                .an-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
                .an-list li {
                    display: flex; justify-content: space-between; align-items: center; gap: 10px;
                    padding: 8px 11px; background: var(--surface-sunken); border-radius: 8px; font-size: 12.5px;
                    transition: background 120ms ease;
                }
                .an-list li:hover { background: var(--surface-hover); }
                .an-list li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .an-list li strong {
                    color: var(--primary-color, #4a3aa7); font-size: 11.5px;
                    font-variant-numeric: tabular-nums; white-space: nowrap;
                }

                .an-meta { font-size: 10.5px; color: #b6b0c9; text-align: center; margin: 18px 0 0; }

                @media (max-width: 900px) {
                    .an-grid { grid-template-columns: minmax(0, 1fr); }
                    .an-movers { grid-template-columns: 1fr; }
                }
                @media (max-width: 560px) {
                    .an-header { flex-direction: column; }
                    .an-total { text-align: left; }
                    .an-selbar { gap: 12px; }
                    .an-minibtn:first-of-type { margin-left: 0; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .an-tab, .an-seg-btn, .an-minibtn, .an-list li { transition: none; }
                }
            `}</style>
        </div>
    );
}

/** First-paint skeleton, shaped like the real layout so nothing jumps. */
function LoadingSkeleton() {
    return (
        <div className="sk">
            <div className="sk-head">
                <div>
                    <Bone w="150px" h="22px" style={{ marginBottom: 8 }} />
                    <Bone w="260px" h="12px" />
                </div>
                <Bone w="120px" h="34px" r="8px" />
            </div>
            <div className="sk-insights">
                {[0, 1, 2].map(i => <div key={i} className="sk-card"><Bone w="50%" h="11px" /><Bone w="90%" h="10px" style={{ marginTop: 10 }} /><Bone w="35%" h="20px" style={{ marginTop: 12 }} /></div>)}
            </div>
            <div className="sk-card sk-filter"><Bone w="100%" h="30px" r="8px" /><Bone w="100%" h="34px" r="8px" style={{ marginTop: 12 }} /></div>
            <div className="sk-kpis">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="sk-card"><Bone w="60%" h="9px" /><Bone w="70%" h="21px" style={{ marginTop: 9 }} /><Bone w="100%" h="30px" style={{ marginTop: 10 }} r="4px" /></div>
                ))}
            </div>
            <Bone w="320px" h="30px" r="8px" style={{ marginBottom: 16 }} />
            <div className="sk-grid">
                <div className="sk-card sk-span"><Bone w="140px" h="13px" /><Bone w="100%" h="300px" r="10px" style={{ marginTop: 14 }} /></div>
                <div className="sk-card"><Bone w="120px" h="13px" /><Bone w="100%" h="240px" r="10px" style={{ marginTop: 14 }} /></div>
                <div className="sk-card"><Bone w="120px" h="13px" /><Bone w="100%" h="240px" r="10px" style={{ marginTop: 14 }} /></div>
            </div>
            <style jsx>{`
                .sk { padding-bottom: 28px; }
                .sk-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
                .sk-card { background: var(--bg-white, #fff); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
                .sk-insights { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 18px; }
                .sk-filter { margin-bottom: 18px; }
                .sk-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(186px, 1fr)); gap: 10px; margin-bottom: 18px; }
                .sk-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
                .sk-span { grid-column: 1 / -1; }
                @media (max-width: 900px) { .sk-grid { grid-template-columns: minmax(0, 1fr); } }
            `}</style>
        </div>
    );
}
