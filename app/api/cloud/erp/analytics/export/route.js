import { NextResponse } from 'next/server';
import { getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { launchPdfBrowser } from '@/lib/pdfBrowser';
import { GET as analyticsGET } from '../route';

export const dynamic = 'force-dynamic';

/**
 * Builds the export from the v2 analytics payload by invoking the analytics
 * route handler directly with the same request. This is deliberate: the export
 * can never drift from what the dashboard shows, and every query param
 * (range, groupBy, compare, filters) is honoured identically for free.
 */
async function loadPayload(req) {
    const res = await analyticsGET(req);
    const body = await res.json();
    if (res.status !== 200) {
        const err = new Error(body?.error || 'Failed to build analytics payload');
        err.status = res.status;
        throw err;
    }
    return body;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function money(n) {
    if (n == null) return '-';
    return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Formats a KPI value according to its declared `format`. */
function kpiValue(k) {
    if (k.value == null) return 'N/A';
    if (k.format === 'money') return money(k.value);
    if (k.format === 'percent') return `${k.value}%`;
    if (k.format === 'days') return `${k.value} days`;
    return Number(k.value).toLocaleString('en-IN');
}

function deltaText(k) {
    if (k.deltaPct == null) return '-';
    const sign = k.deltaPct > 0 ? '+' : '';
    return `${sign}${k.deltaPct}%`;
}

/** True when a KPI's movement is favourable, per its own `goodWhen` semantics. */
function isGood(k) {
    if (k.deltaPct == null || k.direction === 'flat') return null;
    return k.direction === k.goodWhen;
}

function toCsv(rows) {
    return rows.map(row => row.map(cell => {
        const s = String(cell ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
}

/** Multi-section CSV - one workbook-ish file covering the whole v2 payload. */
function buildCsv(data) {
    const rows = [];
    const section = title => { rows.push([]); rows.push([`# ${title}`]); };

    rows.push(['# Analytics Report']);
    rows.push(['From', data.range.from]);
    rows.push(['To', data.range.to]);
    rows.push(['Group By', data.range.groupBy]);
    rows.push(['Comparison', data.range.compare.label]);
    rows.push(['Generated At', data.meta.generatedAt]);
    rows.push(['Currency', data.meta.currency]);

    const f = data.filters.applied;
    const activeFilters = Object.entries(f).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`);
    rows.push(['Filters', activeFilters.length ? activeFilters.join('; ') : 'none']);

    section('KPIs');
    rows.push(['Key', 'Label', 'Value', 'Previous', 'Delta %', 'Direction', 'Format']);
    for (const k of data.kpis) {
        rows.push([k.key, k.label, k.value ?? '', k.prev ?? '', k.deltaPct ?? '', k.direction, k.format]);
    }

    section('Insights');
    rows.push(['Severity', 'Title', 'Metric', 'Detail']);
    for (const i of data.insights) rows.push([i.severity, i.title, i.metric ?? '', i.detail]);
    if (!data.insights.length) rows.push(['-', 'No insights triggered for this period', '', '']);

    section('Revenue by Period');
    rows.push(['Period', 'Label', 'Revenue', 'Invoices', 'Prev Revenue', 'Prev Label']);
    for (const r of data.series.revenue) {
        rows.push([r.period, r.label, r.revenue, r.invoiceCount, r.prevRevenue ?? '', r.prevLabel ?? '']);
    }

    section('Cash Flow');
    rows.push(['Period', 'Label', 'Cash In', 'Cash Out', 'Net']);
    for (const r of data.series.cashFlow) rows.push([r.period, r.label, r.cashIn, r.cashOut, r.net]);

    section('Revenue by Client');
    rows.push(['Client', 'Revenue', 'Share %', 'Prev Revenue', 'Delta %', 'Invoices']);
    for (const c of data.breakdowns.byClient) {
        rows.push([c.name, c.revenue, c.share, c.prevRevenue ?? '', c.deltaPct ?? '', c.invoiceCount]);
    }

    section('Revenue by Item');
    rows.push(['Item ID', 'Item', 'Revenue', 'Share %', 'Qty']);
    for (const i of data.breakdowns.byItem) rows.push([i.id, i.name, i.revenue, i.share, i.qty]);

    section('Receivables Aging');
    rows.push(['Bucket (days overdue)', 'Amount', 'Count']);
    for (const a of data.breakdowns.receivablesAging) rows.push([a.bucket, a.amount, a.count]);

    section('Payments by Method');
    rows.push(['Method', 'Label', 'Amount', 'Share %']);
    for (const p of data.breakdowns.paymentsByMethod) rows.push([p.method, p.label, p.amount, p.share]);

    section('Leads Funnel');
    rows.push(['Stage', 'Stage ID', 'Count', 'Conversion from Prev %', 'Drop-off %']);
    for (const s of data.breakdowns.leadsFunnel) {
        rows.push([s.stage, s.stageId, s.count, s.conversionFromPrev ?? '', s.dropOffPct ?? '']);
    }

    section('Leads by Source');
    rows.push(['Source', 'Label', 'Count', 'Won', 'Win Rate %']);
    for (const s of data.breakdowns.leadsBySource) rows.push([s.source, s.label, s.count, s.wonCount, s.winRate]);

    section('Sales Order Funnel');
    rows.push(['Status', 'Label', 'Count', 'Conversion from Prev %']);
    for (const s of data.breakdowns.salesOrderFunnel) rows.push([s.status, s.label, s.count, s.conversionFromPrev ?? '']);

    section('Customer Cohort');
    rows.push(['New Customers', data.cohort.newCustomers]);
    rows.push(['Returning Customers', data.cohort.returningCustomers]);
    rows.push(['New Revenue', data.cohort.newRevenue]);
    rows.push(['Returning Revenue', data.cohort.returningRevenue]);
    rows.push(['Repeat Rate %', data.cohort.repeatRatePct]);
    rows.push(['Avg Revenue per Customer', data.cohort.avgRevenuePerCustomer]);

    section('Revenue Concentration');
    rows.push(['Top 1 Share %', data.concentration.top1Share]);
    rows.push(['Top 3 Share %', data.concentration.top3Share]);
    rows.push(['Top 5 Share %', data.concentration.top5Share]);
    rows.push(['HHI', data.concentration.hhi]);
    rows.push(['Risk Level', data.concentration.riskLevel]);

    section('Forecast (current month)');
    rows.push(['Projected Month Revenue', data.forecast.projectedMonthRevenue]);
    rows.push(['Month-to-date Revenue', data.forecast.monthToDateRevenue]);
    rows.push(['Run Rate per Day', data.forecast.runRatePerDay]);
    rows.push(['Days Elapsed', data.forecast.daysElapsed]);
    rows.push(['Days in Month', data.forecast.daysInMonth]);
    rows.push(['vs Last Month %', data.forecast.vsLastMonthPct ?? '']);
    rows.push(['Basis', data.forecast.basis]);

    if (data.meta.unavailable?.length) {
        section('Unavailable Metrics');
        rows.push(['Key', 'Reason']);
        for (const key of data.meta.unavailable) {
            const kpi = data.kpis.find(k => k.key === key);
            rows.push([key, kpi?.hint || 'Not computable on the current schema']);
        }
    }

    return toCsv(rows);
}

const SEVERITY_STYLE = {
    critical: { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: 'Critical' },
    warning: { bg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: 'Warning' },
    positive: { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', text: 'Positive' },
    info: { bg: '#f5f3ff', border: '#ddd6fe', dot: '#7c3aed', text: 'Info' },
};

function buildHtml(data, businessName) {
    const kpiCards = data.kpis.map(k => {
        const good = isGood(k);
        const color = good === null ? '#6b7280' : (good ? '#16a34a' : '#dc2626');
        const arrow = k.direction === 'up' ? '▲' : k.direction === 'down' ? '▼' : '■';
        return `<div class="kpi">
            <div class="label">${esc(k.label)}</div>
            <div class="value">${esc(kpiValue(k))}</div>
            <div class="delta" style="color:${color}">${k.deltaPct == null ? '<span style="color:#9ca3af">no comparison</span>' : `${arrow} ${esc(deltaText(k))}`}</div>
            <div class="hint">${esc(k.hint || '')}</div>
        </div>`;
    }).join('');

    const insightCards = data.insights.length ? data.insights.map(i => {
        const s = SEVERITY_STYLE[i.severity] || SEVERITY_STYLE.info;
        return `<div class="insight" style="background:${s.bg};border-color:${s.border}">
            <div class="ins-head">
                <span class="dot" style="background:${s.dot}"></span>
                <span class="ins-sev" style="color:${s.dot}">${s.text}</span>
                ${i.metric ? `<span class="ins-metric">${esc(i.metric)}</span>` : ''}
            </div>
            <div class="ins-title">${esc(i.title)}</div>
            <div class="ins-detail">${esc(i.detail)}</div>
        </div>`;
    }).join('') : '<div class="muted">No insights triggered for this period.</div>';

    const revenueRows = data.series.revenue.length
        ? data.series.revenue.map(r => `<tr>
            <td>${esc(r.label)}</td><td class="num">${money(r.revenue)}</td>
            <td class="num">${r.invoiceCount}</td>
            <td class="num">${r.prevRevenue == null ? '-' : money(r.prevRevenue)}</td></tr>`).join('')
        : '<tr><td colspan="4" class="muted">No data for this period.</td></tr>';

    const clientRows = data.breakdowns.byClient.length
        ? data.breakdowns.byClient.slice(0, 12).map(c => `<tr>
            <td>${esc(c.name)}</td><td class="num">${money(c.revenue)}</td>
            <td class="num">${c.share}%</td><td class="num">${c.invoiceCount}</td>
            <td class="num">${c.deltaPct == null ? '-' : `${c.deltaPct > 0 ? '+' : ''}${c.deltaPct}%`}</td></tr>`).join('')
        : '<tr><td colspan="5" class="muted">No client revenue in range.</td></tr>';

    const itemRows = data.breakdowns.byItem.length
        ? data.breakdowns.byItem.slice(0, 12).map(i => `<tr>
            <td>${esc(i.name)}</td><td class="num">${money(i.revenue)}</td>
            <td class="num">${i.share}%</td><td class="num">${i.qty}</td></tr>`).join('')
        : '<tr><td colspan="4" class="muted">No item revenue in range.</td></tr>';

    const activeFilters = Object.entries(data.filters.applied).filter(([, v]) => v);

    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Analytics Report</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 32px; font-size: 12px; }
  h1 { font-size: 20px; margin: 0 0 2px; color: #482683; }
  h2 { font-size: 13px; color: #482683; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: .05em; }
  .sub { color: #6b7280; font-size: 11px; margin-bottom: 4px; }
  .chips { margin-bottom: 18px; }
  .chip { display: inline-block; background: #f5f3ff; border: 1px solid #ddd6fe; color: #482683; border-radius: 999px; padding: 2px 9px; font-size: 10px; margin-right: 5px; }
  .kpis { display: flex; flex-wrap: wrap; gap: 8px; }
  .kpi { width: calc(25% - 6px); border: 1px solid #ede9fe; border-radius: 9px; padding: 10px 11px; }
  .kpi .label { font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; margin-bottom: 4px; }
  .kpi .value { font-size: 16px; font-weight: 800; color: #482683; line-height: 1.15; }
  .kpi .delta { font-size: 10px; font-weight: 700; margin-top: 3px; }
  .kpi .hint { font-size: 8.5px; color: #9ca3af; margin-top: 4px; line-height: 1.3; }
  .insight { border: 1px solid; border-radius: 9px; padding: 9px 11px; margin-bottom: 7px; page-break-inside: avoid; }
  .ins-head { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .ins-sev { font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
  .ins-metric { margin-left: auto; font-size: 11px; font-weight: 800; color: #1f2937; }
  .ins-title { font-size: 12.5px; font-weight: 700; margin-bottom: 2px; }
  .ins-detail { font-size: 10.5px; color: #4b5563; line-height: 1.45; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #f0edf5; }
  td.num, th.num { text-align: right; }
  th { text-transform: uppercase; font-size: 9px; letter-spacing: .04em; color: #482683; background: #faf9fd; }
  .grid { display: flex; gap: 8px; }
  .grid > div { flex: 1; border: 1px solid #ede9fe; border-radius: 8px; padding: 9px; text-align: center; }
  .b-label { font-size: 9px; color: #6b7280; text-transform: uppercase; }
  .b-val { font-size: 13px; font-weight: 700; color: #482683; margin-top: 2px; }
  .b-sub { font-size: 9px; color: #9ca3af; }
  .muted { color: #9ca3af; font-size: 10.5px; }
  .note { font-size: 9.5px; color: #9ca3af; margin-top: 6px; font-style: italic; }
  footer { margin-top: 26px; font-size: 9px; color: #9ca3af; text-align: center; }
</style></head>
<body>
  <h1>${esc(businessName)} - Analytics Report</h1>
  <div class="sub">${esc(data.range.from.slice(0, 10))} to ${esc(data.range.to.slice(0, 10))} · grouped by ${esc(data.range.groupBy)} · ${esc(data.range.compare.label)}</div>
  <div class="sub">Generated ${esc(data.meta.generatedAt.slice(0, 10))} · amounts in ${esc(data.meta.currency)}</div>
  <div class="chips">${activeFilters.map(([k, v]) => `<span class="chip">${esc(k)}: ${esc(v)}</span>`).join('') || ''}</div>

  <h2>Key Metrics</h2>
  <div class="kpis">${kpiCards}</div>

  <h2>What This Means</h2>
  ${insightCards}

  <h2>Forecast - Current Month</h2>
  <div class="grid">
    <div><div class="b-label">Projected</div><div class="b-val">${money(data.forecast.projectedMonthRevenue)}</div></div>
    <div><div class="b-label">Month to Date</div><div class="b-val">${money(data.forecast.monthToDateRevenue)}</div></div>
    <div><div class="b-label">Run Rate / Day</div><div class="b-val">${money(data.forecast.runRatePerDay)}</div></div>
    <div><div class="b-label">Progress</div><div class="b-val">${data.forecast.daysElapsed}/${data.forecast.daysInMonth}</div><div class="b-sub">days</div></div>
    <div><div class="b-label">vs Last Month</div><div class="b-val">${data.forecast.vsLastMonthPct == null ? '-' : `${data.forecast.vsLastMonthPct}%`}</div></div>
  </div>
  <div class="note">${esc(data.forecast.basis)} - not a statistical model.</div>

  <h2>Receivables Aging</h2>
  <div class="grid">
    ${data.breakdowns.receivablesAging.map(a => `<div><div class="b-label">${esc(a.bucket)} days</div><div class="b-val">${money(a.amount)}</div><div class="b-sub">${a.count} invoice${a.count === 1 ? '' : 's'}</div></div>`).join('')}
  </div>

  <h2>Revenue Concentration</h2>
  <div class="grid">
    <div><div class="b-label">Top 1</div><div class="b-val">${data.concentration.top1Share}%</div></div>
    <div><div class="b-label">Top 3</div><div class="b-val">${data.concentration.top3Share}%</div></div>
    <div><div class="b-label">Top 5</div><div class="b-val">${data.concentration.top5Share}%</div></div>
    <div><div class="b-label">HHI</div><div class="b-val">${data.concentration.hhi}</div></div>
    <div><div class="b-label">Risk</div><div class="b-val">${esc(data.concentration.riskLevel)}</div></div>
  </div>

  <h2>Customers</h2>
  <div class="grid">
    <div><div class="b-label">New</div><div class="b-val">${data.cohort.newCustomers}</div><div class="b-sub">${money(data.cohort.newRevenue)}</div></div>
    <div><div class="b-label">Returning</div><div class="b-val">${data.cohort.returningCustomers}</div><div class="b-sub">${money(data.cohort.returningRevenue)}</div></div>
    <div><div class="b-label">Repeat Rate</div><div class="b-val">${data.cohort.repeatRatePct}%</div></div>
    <div><div class="b-label">Avg / Customer</div><div class="b-val">${money(data.cohort.avgRevenuePerCustomer)}</div></div>
  </div>

  <h2>Revenue by Client</h2>
  <table>
    <thead><tr><th>Client</th><th class="num">Revenue</th><th class="num">Share</th><th class="num">Invoices</th><th class="num">vs Prev</th></tr></thead>
    <tbody>${clientRows}</tbody>
  </table>

  <h2>Revenue by Item</h2>
  <table>
    <thead><tr><th>Item</th><th class="num">Revenue</th><th class="num">Share</th><th class="num">Qty</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <h2>Revenue by Period</h2>
  <table>
    <thead><tr><th>Period</th><th class="num">Revenue</th><th class="num">Invoices</th><th class="num">Prev Window</th></tr></thead>
    <tbody>${revenueRows}</tbody>
  </table>

  ${data.meta.unavailable?.length ? `<div class="note">Not available on this account's data: ${data.meta.unavailable.map(esc).join(', ')}.</div>` : ''}

  <footer>VelBiz Cloud - Analytics &amp; Reports</footer>
</body></html>`;
}

/**
 * GET /api/cloud/erp/analytics/export?format=csv|pdf&<all analytics params>
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'analytics');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const format = searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
        const data = await loadPayload(req);

        const stamp = `${data.range.from.slice(0, 10)}-to-${data.range.to.slice(0, 10)}`;

        if (format === 'csv') {
            // BOM so Excel opens the ₹ / UTF-8 content correctly.
            return new NextResponse(`﻿${buildCsv(data)}`, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="analytics-${stamp}.csv"`,
                },
            });
        }

        const html = buildHtml(data, user.businessName || 'Business');
        const browser = await launchPdfBrowser();
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '14mm', bottom: '14mm', left: '10mm', right: '10mm' },
            });
            return new NextResponse(pdfBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="analytics-report-${stamp}.pdf"`,
                },
            });
        } finally {
            await browser.close();
        }
    } catch (err) {
        return NextResponse.json(
            { error: safeCloudError(err, 'GET /api/cloud/erp/analytics/export') },
            { status: err?.status && err.status !== 200 ? err.status : 500 },
        );
    }
}
