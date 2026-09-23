import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { computeNoteAdjustments, DEFAULT_CRM_STAGES } from '@/lib/erpHelpers';

export const dynamic = 'force-dynamic';

const DEFAULT_TERM_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 5;
const OPTION_CAP = 200;

/* ────────────────────────────────────────────────────────────────────────────
 * Date handling
 *
 * Everything below is UTC-consistent end to end: bucket keys, bucket starts,
 * heatmap days and labels are all derived from the UTC components of a Date.
 * Mixing `getMonth()` (local) with `toISOString()` (UTC) is what caused the
 * off-by-one bug already fixed on the calendar page - do not reintroduce it.
 * ──────────────────────────────────────────────────────────────────────────── */

const GROUP_BYS = ['day', 'week', 'month', 'quarter'];
const COMPARE_MODES = ['prev', 'prevYear', 'none'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const round2 = n => Math.round((Number(n) || 0) * 100) / 100;
const pct = (num, den) => (den ? round2((num / den) * 100) : 0);

function isValidDate(d) {
    return d instanceof Date && !Number.isNaN(d.getTime());
}

/** Start of the UTC day containing `d`. */
function utcDayStart(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Start of the ISO week (Monday) containing `d`, in UTC. */
function utcWeekStart(d) {
    const day = (d.getUTCDay() + 6) % 7; // Mon = 0
    return new Date(utcDayStart(d).getTime() - day * DAY_MS);
}

/** Bucket key for a date at a given granularity - sortable & stable across calls. */
function periodKey(date, groupBy) {
    const d = new Date(date);
    if (!isValidDate(d)) return null;
    if (groupBy === 'day') return utcDayStart(d).toISOString().slice(0, 10);
    if (groupBy === 'week') return utcWeekStart(d).toISOString().slice(0, 10);
    if (groupBy === 'quarter') return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** The canonical Date at which a bucket begins (used for labels + enumeration). */
function bucketStart(d, groupBy) {
    if (groupBy === 'day') return utcDayStart(d);
    if (groupBy === 'week') return utcWeekStart(d);
    if (groupBy === 'quarter') return new Date(Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1));
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function nextBucket(d, groupBy) {
    if (groupBy === 'day') return new Date(d.getTime() + DAY_MS);
    if (groupBy === 'week') return new Date(d.getTime() + 7 * DAY_MS);
    if (groupBy === 'quarter') return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 3, 1));
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

function bucketLabel(d, groupBy) {
    if (groupBy === 'day' || groupBy === 'week') return `${d.getUTCDate()} ${MONTH_ABBR[d.getUTCMonth()]}`;
    if (groupBy === 'quarter') return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
    return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Enumerates every bucket in [from, to] so series are contiguous (no holes the
 * frontend has to interpolate). Hard-capped so a pathological `groupBy=day`
 * over a decade cannot blow up the response.
 */
function enumerateBuckets(from, to, groupBy) {
    const out = [];
    let cursor = bucketStart(from, groupBy);
    const limit = 1200;
    while (cursor.getTime() <= to.getTime() && out.length < limit) {
        out.push({ key: periodKey(cursor, groupBy), start: cursor, label: bucketLabel(cursor, groupBy) });
        cursor = nextBucket(cursor, groupBy);
    }
    return out;
}

/** Resolves range, granularity and comparison window from query params. */
function resolveRange(searchParams) {
    const now = new Date();
    const rawTo = searchParams.get('to');
    const rawFrom = searchParams.get('from');
    let to = rawTo ? new Date(rawTo) : now;
    if (!isValidDate(to)) to = now;
    let from = rawFrom ? new Date(rawFrom) : new Date(to.getTime() - 90 * DAY_MS);
    if (!isValidDate(from)) from = new Date(to.getTime() - 90 * DAY_MS);
    if (from.getTime() > to.getTime()) [from, to] = [to, from];

    const groupBy = GROUP_BYS.includes(searchParams.get('groupBy')) ? searchParams.get('groupBy') : 'day';
    const mode = COMPARE_MODES.includes(searchParams.get('compare')) ? searchParams.get('compare') : 'prev';

    const spanMs = to.getTime() - from.getTime();
    const spanDays = Math.max(1, Math.round(spanMs / DAY_MS));
    let compare = { mode: 'none', from: null, to: null, label: 'No comparison' };
    if (mode === 'prev') {
        compare = {
            mode: 'prev',
            from: new Date(from.getTime() - spanMs - 1),
            to: new Date(from.getTime() - 1),
            label: `vs prev ${spanDays} days`,
        };
    } else if (mode === 'prevYear') {
        compare = {
            mode: 'prevYear',
            from: new Date(from.getTime() - 365 * DAY_MS),
            to: new Date(to.getTime() - 365 * DAY_MS),
            label: 'vs same period last year',
        };
    }
    return { from, to, groupBy, compare, spanDays };
}

/* ────────────────────────────────────────────────────────────────────────── */

function deltaOf(value, prev, goodWhen) {
    const hasPrev = typeof prev === 'number' && Number.isFinite(prev) && prev !== 0;
    const deltaPct = hasPrev ? round2(((value - prev) / Math.abs(prev)) * 100) : null;
    let direction = 'flat';
    if (typeof value === 'number' && typeof prev === 'number') {
        if (value > prev) direction = 'up';
        else if (value < prev) direction = 'down';
    }
    return { prev: typeof prev === 'number' ? round2(prev) : null, deltaPct, direction, goodWhen };
}

const clientNameOf = doc => doc?.customer?.company || doc?.customer?.name || 'Unknown client';

/** Title-cases a raw enum/slug value for display ("cold_call" → "Cold Call"). */
function humanLabel(raw) {
    const s = String(raw ?? '').trim();
    if (!s) return 'Unspecified';
    return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const PAYMENT_METHOD_LABELS = {
    bank: 'Bank Transfer', upi: 'UPI', cash: 'Cash', cheque: 'Cheque',
    card: 'Card', online: 'Online', other: 'Other',
};

/** Compact Indian-currency rendering for insight copy (₹4.0L / ₹1.2Cr). */
function inr(n) {
    const v = Math.abs(Number(n) || 0);
    const sign = (Number(n) || 0) < 0 ? '-' : '';
    if (v >= 1e7) return `${sign}₹${round2(v / 1e7)}Cr`;
    if (v >= 1e5) return `${sign}₹${round2(v / 1e5)}L`;
    if (v >= 1e3) return `${sign}₹${Math.round(v / 1e3)}K`;
    return `${sign}₹${Math.round(v)}`;
}

/**
 * GET /api/cloud/erp/analytics
 *
 * Analytics v2 payload - see ANALYTICS_V2_CONTRACT.md. Keeps the read pattern
 * already established by reports/summary (tenant-scoped find().toArray() then
 * reduce in JS): tenant data volumes are modest and this stays auditable.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'analytics');
        if (denied) return denied;

        const db = await getCloudDb();
        const tenantId = user.tenantId;
        const { searchParams } = new URL(req.url);
        const { from, to, groupBy, compare } = resolveRange(searchParams);
        const now = new Date();

        const applied = {
            clientId: searchParams.get('clientId') || null,
            itemId: searchParams.get('itemId') || null,
            source: searchParams.get('source') || null,
            warehouseId: searchParams.get('warehouseId') || null,
            soStatus: searchParams.get('soStatus') || null,
        };

        const [
            invoices, quotes, salesOrders, leads, pipelineStages,
            stockMoves, products, warehouses, ledgerEntries,
        ] = await Promise.all([
            db.collection('tenant_documents').find({ tenantId, docType: 'Invoice', status: { $ne: 'draft' } }).toArray(),
            db.collection('tenant_documents').find({ tenantId, docType: 'Quote' }).toArray(),
            db.collection('erp_sales_orders').find({ tenantId }).toArray(),
            db.collection('erp_leads').find({ tenantId }).toArray(),
            db.collection('erp_pipeline_stages').findOne({ tenantId }),
            db.collection('erp_stock_moves').find({ tenantId }).toArray(),
            db.collection('tenant_products').find({ tenantId }).toArray(),
            db.collection('erp_warehouses').find({ tenantId }).toArray(),
            db.collection('erp_ledger_entries').find({ tenantId }).toArray(),
        ]);

        const invoiceIds = invoices.map(d => d._id.toString());
        const paidTotals = invoiceIds.length ? await db.collection('erp_payments').aggregate([
            { $match: { tenantId, documentId: { $in: invoiceIds } } },
            { $group: { _id: '$documentId', paid: { $sum: '$amount' } } },
        ]).toArray() : [];
        const paidMap = Object.fromEntries(paidTotals.map(p => [p._id, p.paid]));
        const noteAdjustments = await computeNoteAdjustments(tenantId, invoiceIds);
        const allPayments = invoiceIds.length
            ? await db.collection('erp_payments').find({ tenantId, documentId: { $in: invoiceIds } }).toArray()
            : [];

        // ── Filter predicates ───────────────────────────────────────────────
        // Applied consistently across every section so a filtered view is
        // internally coherent (KPIs, series, breakdowns and insights all agree).
        const productByItemId = new Map(products.map(p => [p.itemId, p]));
        const itemFilterName = applied.itemId ? (productByItemId.get(applied.itemId)?.name || null) : null;

        const lineMatchesItem = li => {
            if (!applied.itemId) return true;
            if (li.itemId) return li.itemId === applied.itemId;
            return itemFilterName ? li.product === itemFilterName : false;
        };
        const docMatchesClient = doc => !applied.clientId || clientNameOf(doc) === applied.clientId;
        const docMatchesItem = doc => !applied.itemId || (doc.lineItems || []).some(lineMatchesItem);
        const docMatches = doc => docMatchesClient(doc) && docMatchesItem(doc);

        /**
         * Revenue attributable to a document under the current filters. With an
         * item filter active this is the matching line items only, so a filtered
         * revenue figure is genuinely that item's revenue, not the whole invoice.
         */
        const revenueOf = doc => {
            if (!applied.itemId) return doc.grandTotal || 0;
            return (doc.lineItems || []).filter(lineMatchesItem).reduce((s, li) => s + (li.totalPrice || 0), 0);
        };

        const fInvoices = invoices.filter(docMatches);
        const fQuotes = quotes.filter(docMatches);
        const fSalesOrders = salesOrders.filter(o => (!applied.clientId || clientNameOf(o) === applied.clientId)
            && (!applied.soStatus || o.status === applied.soStatus)
            && (!applied.itemId || (o.lineItems || []).some(lineMatchesItem)));
        const fLeads = leads.filter(l => !applied.source || (l.source || 'Unspecified') === applied.source);
        const fStockMoves = stockMoves.filter(m => (!applied.warehouseId || m.warehouseId === applied.warehouseId)
            && (!applied.itemId || m.itemId === applied.itemId));

        const invoiceIdSet = new Set(fInvoices.map(i => i._id.toString()));
        const fPayments = allPayments.filter(p => invoiceIdSet.has(p.documentId));

        const inWindow = (d, a, b) => {
            const t = new Date(d).getTime();
            return Number.isFinite(t) && t >= a.getTime() && t <= b.getTime();
        };
        const inRange = d => inWindow(d, from, to);

        // Per-invoice paid/balance, computed once and reused everywhere.
        const paidOf = inv => (paidMap[inv._id.toString()] || 0) + (noteAdjustments.get(inv._id.toString()) || 0);
        const balanceOf = inv => round2((inv.grandTotal || 0) - paidOf(inv));
        const dueDateOf = inv => (inv.dueDate
            ? new Date(inv.dueDate)
            : new Date(new Date(inv.createdAt).getTime() + DEFAULT_TERM_DAYS * DAY_MS));

        /* ── Window metrics ──────────────────────────────────────────────────
         * Computed identically for the current and comparison windows so every
         * KPI delta is an apples-to-apples comparison.
         */
        const firstInvoiceAt = new Map(); // client -> earliest non-draft invoice date
        for (const inv of invoices) {
            const name = clientNameOf(inv);
            const t = new Date(inv.createdAt).getTime();
            if (!Number.isFinite(t)) continue;
            if (!firstInvoiceAt.has(name) || t < firstInvoiceAt.get(name)) firstInvoiceAt.set(name, t);
        }

        const convertedQuoteIds = new Set([
            ...quotes.filter(q => q.status === 'converted' || q.convertedToInvoiceId || q.linkedInvoiceId).map(q => q._id.toString()),
            ...salesOrders.filter(o => o.quoteDocumentId).map(o => o.quoteDocumentId),
        ]);

        const quoteById = new Map(quotes.map(q => [q._id.toString(), q]));
        const cycleSamples = salesOrders
            .filter(o => o.quoteDocumentId && quoteById.has(o.quoteDocumentId))
            .map(o => ({
                at: new Date(o.createdAt),
                days: (new Date(o.createdAt) - new Date(quoteById.get(o.quoteDocumentId).createdAt)) / DAY_MS,
                quote: quoteById.get(o.quoteDocumentId),
            }))
            .filter(s => s.days >= 0 && isValidDate(s.at) && docMatches(s.quote));

        function windowMetrics(a, b) {
            if (!a || !b) return null;
            const inv = fInvoices.filter(i => inWindow(i.createdAt, a, b));
            const revenue = round2(inv.reduce((s, i) => s + revenueOf(i), 0));
            const invoiced = round2(inv.reduce((s, i) => s + (i.grandTotal || 0), 0));
            const collected = round2(inv.reduce((s, i) => s + Math.min(paidOf(i), i.grandTotal || 0), 0));
            const outstanding = round2(inv.reduce((s, i) => s + Math.max(0, balanceOf(i)), 0));
            const qts = fQuotes.filter(q => inWindow(q.createdAt, a, b));
            const converted = qts.filter(q => convertedQuoteIds.has(q._id.toString())).length;
            const cycles = cycleSamples.filter(s => inWindow(s.at, a, b)).map(s => s.days);
            const newCustomers = new Set(
                inv.map(clientNameOf).filter(name => {
                    const t = firstInvoiceAt.get(name);
                    return t != null && t >= a.getTime() && t <= b.getTime();
                }),
            ).size;
            return {
                revenue, invoiced, collected, outstanding,
                invoiceCount: inv.length,
                collectionRate: pct(collected, invoiced),
                avgDealSize: inv.length ? round2(revenue / inv.length) : 0,
                quoteCount: qts.length,
                convertedQuotes: converted,
                conversionRate: pct(converted, qts.length),
                avgSalesCycleDays: cycles.length ? round2(cycles.reduce((s, d) => s + d, 0) / cycles.length) : 0,
                newCustomers,
            };
        }

        const cur = windowMetrics(from, to);
        const prv = compare.mode === 'none' ? null : windowMetrics(compare.from, compare.to);
        const P = key => (prv ? prv[key] : null);

        /* ── Series (index-aligned against the comparison window) ──────────── */
        const curBuckets = enumerateBuckets(from, to, groupBy);
        const prevBuckets = compare.mode === 'none' ? [] : enumerateBuckets(compare.from, compare.to, groupBy);

        const emptyRev = () => ({ revenue: 0, invoiceCount: 0 });
        function revenueByBucket(a, b) {
            const map = new Map();
            if (!a || !b) return map;
            for (const inv of fInvoices) {
                if (!inWindow(inv.createdAt, a, b)) continue;
                const key = periodKey(inv.createdAt, groupBy);
                if (!key) continue;
                const bkt = map.get(key) || emptyRev();
                bkt.revenue = round2(bkt.revenue + revenueOf(inv));
                bkt.invoiceCount += 1;
                map.set(key, bkt);
            }
            return map;
        }
        const curRevMap = revenueByBucket(from, to);
        const prevRevMap = revenueByBucket(compare.from, compare.to);
        const prevRevOrdinal = prevBuckets.map(b => ({ ...(prevRevMap.get(b.key) || emptyRev()), label: b.label }));

        const revenueSeries = curBuckets.map((b, i) => {
            const c = curRevMap.get(b.key) || emptyRev();
            const p = prevRevOrdinal[i] || null;
            return {
                period: b.key,
                label: b.label,
                revenue: round2(c.revenue),
                invoiceCount: c.invoiceCount,
                prevRevenue: p ? round2(p.revenue) : null,
                prevLabel: p ? p.label : null,
            };
        });

        // Cash flow - erp_ledger_entries is the tenant-wide source of truth for
        // in/out (same source reports/summary uses for P&L), so it is reused here.
        const cashMap = new Map();
        for (const e of ledgerEntries) {
            if (!inRange(e.date)) continue;
            const key = periodKey(e.date, groupBy);
            if (!key) continue;
            const bkt = cashMap.get(key) || { cashIn: 0, cashOut: 0 };
            if (e.type === 'income') bkt.cashIn = round2(bkt.cashIn + (e.amount || 0));
            else if (e.type === 'expense') bkt.cashOut = round2(bkt.cashOut + (e.amount || 0));
            cashMap.set(key, bkt);
        }
        const cashFlow = curBuckets.map(b => {
            const c = cashMap.get(b.key) || { cashIn: 0, cashOut: 0 };
            return { period: b.key, label: b.label, cashIn: c.cashIn, cashOut: c.cashOut, net: round2(c.cashIn - c.cashOut) };
        });

        let runCur = 0, runPrev = 0;
        const pace = curBuckets.map((b, i) => {
            runCur = round2(runCur + (curRevMap.get(b.key)?.revenue || 0));
            const p = prevRevOrdinal[i];
            if (p) runPrev = round2(runPrev + p.revenue);
            return {
                period: b.key, label: b.label,
                cumulative: runCur,
                prevCumulative: prevRevOrdinal.length ? runPrev : null,
            };
        });

        /* ── Breakdowns ──────────────────────────────────────────────────── */
        const rangeInvoices = fInvoices.filter(i => inRange(i.createdAt));
        const prevRangeInvoices = compare.mode === 'none'
            ? []
            : fInvoices.filter(i => inWindow(i.createdAt, compare.from, compare.to));

        const clientAgg = new Map();
        for (const inv of rangeInvoices) {
            const name = clientNameOf(inv);
            const e = clientAgg.get(name) || { revenue: 0, invoiceCount: 0, prevRevenue: 0 };
            e.revenue = round2(e.revenue + revenueOf(inv));
            e.invoiceCount += 1;
            clientAgg.set(name, e);
        }
        for (const inv of prevRangeInvoices) {
            const name = clientNameOf(inv);
            const e = clientAgg.get(name) || { revenue: 0, invoiceCount: 0, prevRevenue: 0 };
            e.prevRevenue = round2(e.prevRevenue + revenueOf(inv));
            clientAgg.set(name, e);
        }
        const totalRevenue = cur.revenue;
        const byClient = Array.from(clientAgg.entries())
            .map(([name, e]) => ({
                id: name, name,
                revenue: e.revenue,
                share: pct(e.revenue, totalRevenue),
                prevRevenue: compare.mode === 'none' ? null : e.prevRevenue,
                deltaPct: e.prevRevenue ? round2(((e.revenue - e.prevRevenue) / e.prevRevenue) * 100) : null,
                invoiceCount: e.invoiceCount,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 20);

        const itemAgg = new Map();
        for (const inv of rangeInvoices) {
            for (const li of (inv.lineItems || [])) {
                if (!lineMatchesItem(li)) continue;
                const id = li.itemId || li.product || li.description || 'Unknown item';
                const name = li.product || li.description || productByItemId.get(li.itemId)?.name || 'Unknown item';
                const e = itemAgg.get(id) || { name, revenue: 0, qty: 0 };
                e.revenue = round2(e.revenue + (li.totalPrice || 0));
                e.qty = round2(e.qty + (li.qty || 0));
                itemAgg.set(id, e);
            }
        }
        const itemRevenueTotal = Array.from(itemAgg.values()).reduce((s, e) => s + e.revenue, 0);
        const byItem = Array.from(itemAgg.entries())
            .map(([id, e]) => ({ id, name: e.name, revenue: e.revenue, share: pct(e.revenue, itemRevenueTotal), qty: e.qty }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 20);

        // Receivables aging - a point-in-time view of open balances (as of now),
        // scoped by the client/item filters. Deliberately not range-limited: a
        // 200-day-old unpaid invoice is still money owed today.
        const AGING_BUCKETS = ['0-30', '31-60', '61-90', '90+'];
        const aging = Object.fromEntries(AGING_BUCKETS.map(b => [b, { amount: 0, count: 0 }]));
        let overdue90Amount = 0, overdue90Count = 0;
        for (const inv of fInvoices) {
            const balance = balanceOf(inv);
            if (balance <= 0) continue;
            const daysOverdue = Math.floor((now - dueDateOf(inv)) / DAY_MS);
            if (daysOverdue <= 0) continue;
            const b = daysOverdue <= 30 ? '0-30' : daysOverdue <= 60 ? '31-60' : daysOverdue <= 90 ? '61-90' : '90+';
            aging[b].amount = round2(aging[b].amount + balance);
            aging[b].count += 1;
            if (b === '90+') { overdue90Amount = round2(overdue90Amount + balance); overdue90Count += 1; }
        }
        const receivablesAging = AGING_BUCKETS.map(bucket => ({ bucket, amount: aging[bucket].amount, count: aging[bucket].count }));

        const rangePayments = fPayments.filter(p => inRange(p.createdAt));
        const methodAgg = new Map();
        for (const p of rangePayments) {
            const m = p.method || 'other';
            methodAgg.set(m, round2((methodAgg.get(m) || 0) + (p.amount || 0)));
        }
        const paymentsTotal = Array.from(methodAgg.values()).reduce((s, v) => s + v, 0);
        const paymentsByMethod = Array.from(methodAgg.entries())
            .map(([method, amount]) => ({
                method,
                label: PAYMENT_METHOD_LABELS[method] || humanLabel(method),
                amount, share: pct(amount, paymentsTotal),
            }))
            .sort((a, b) => b.amount - a.amount);

        // Leads funnel - conversionFromPrev/dropOffPct describe how the pipeline
        // narrows from one ordered stage to the next.
        const stages = pipelineStages?.stages?.length ? pipelineStages.stages : DEFAULT_CRM_STAGES;
        const orderedStages = [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const rangeLeads = fLeads.filter(l => inRange(l.createdAt));
        const stageCounts = new Map();
        for (const l of rangeLeads) stageCounts.set(l.stage, (stageCounts.get(l.stage) || 0) + 1);
        const leadsFunnel = orderedStages.map((s, i, arr) => {
            const count = stageCounts.get(s.id) || 0;
            const prevCount = i === 0 ? null : (stageCounts.get(arr[i - 1].id) || 0);
            return {
                stage: s.name || s.id,
                stageId: s.id,
                count,
                color: s.color || null,
                conversionFromPrev: prevCount ? pct(count, prevCount) : null,
                // Stage counts are a live snapshot, not a strict cohort funnel, so a
                // later stage can legitimately hold more leads. Clamp at 0 rather
                // than surfacing a negative "drop-off", which reads as a bug.
                dropOffPct: prevCount ? Math.max(0, round2(100 - pct(count, prevCount))) : null,
            };
        });

        const wonStageIds = new Set(orderedStages.filter(s => /won/i.test(s.id || s.name || '')).map(s => s.id));
        const sourceAgg = new Map();
        for (const l of rangeLeads) {
            const src = l.source || 'Unspecified';
            const e = sourceAgg.get(src) || { count: 0, wonCount: 0 };
            e.count += 1;
            if (wonStageIds.has(l.stage)) e.wonCount += 1;
            sourceAgg.set(src, e);
        }
        const leadsBySource = Array.from(sourceAgg.entries())
            .map(([source, e]) => ({ source, label: humanLabel(source), count: e.count, wonCount: e.wonCount, winRate: pct(e.wonCount, e.count) }))
            .sort((a, b) => b.count - a.count);

        const SO_STATUS_ORDER = ['draft', 'confirmed', 'fulfilled', 'invoiced', 'cancelled'];
        const rangeSO = fSalesOrders.filter(o => inRange(o.createdAt));
        const soCounts = new Map();
        for (const o of rangeSO) soCounts.set(o.status, (soCounts.get(o.status) || 0) + 1);
        const soStatusList = [...new Set([...SO_STATUS_ORDER, ...soCounts.keys()])];
        const salesOrderFunnel = soStatusList.map((status, i) => {
            const count = soCounts.get(status) || 0;
            // Cancelled sits outside the linear progression, so no conversion for it.
            const prevStatus = i > 0 && status !== 'cancelled' ? soStatusList[i - 1] : null;
            const prevCount = prevStatus && prevStatus !== 'cancelled' ? (soCounts.get(prevStatus) || 0) : null;
            return {
                status, label: humanLabel(status), count,
                conversionFromPrev: prevCount ? pct(count, prevCount) : null,
            };
        });

        /* ── Cohort (new vs returning) ────────────────────────────────────── */
        const cohortNew = new Set(), cohortReturning = new Set();
        let newRevenue = 0, returningRevenue = 0;
        for (const inv of rangeInvoices) {
            const name = clientNameOf(inv);
            const firstAt = firstInvoiceAt.get(name);
            const isReturning = firstAt != null && firstAt < from.getTime();
            if (isReturning) { cohortReturning.add(name); returningRevenue += revenueOf(inv); }
            else { cohortNew.add(name); newRevenue += revenueOf(inv); }
        }
        const totalCustomers = cohortNew.size + cohortReturning.size;
        const cohort = {
            newCustomers: cohortNew.size,
            returningCustomers: cohortReturning.size,
            newRevenue: round2(newRevenue),
            returningRevenue: round2(returningRevenue),
            repeatRatePct: pct(cohortReturning.size, totalCustomers),
            avgRevenuePerCustomer: totalCustomers ? round2(totalRevenue / totalCustomers) : 0,
        };

        /* ── Concentration ─────────────────────────────────────────────────── */
        const shares = byClient.map(c => c.share);
        const sumTop = n => round2(shares.slice(0, n).reduce((s, v) => s + v, 0));
        const hhi = Math.round(shares.reduce((s, v) => s + v * v, 0));
        const top1Share = shares[0] ?? 0;
        const concentration = {
            top1Share: round2(top1Share),
            top3Share: sumTop(3),
            top5Share: sumTop(5),
            hhi,
            riskLevel: top1Share > 40 || hhi > 2500 ? 'high' : (top1Share > 25 || hhi > 1500 ? 'moderate' : 'low'),
        };

        /* ── Forecast (honest linear run-rate, current calendar month) ─────── */
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        const daysInMonth = Math.round((nextMonthStart - monthStart) / DAY_MS);
        const daysElapsed = now.getUTCDate();
        const monthToDateRevenue = round2(fInvoices
            .filter(i => inWindow(i.createdAt, monthStart, now))
            .reduce((s, i) => s + revenueOf(i), 0));
        const lastMonthRevenue = round2(fInvoices
            .filter(i => inWindow(i.createdAt, lastMonthStart, new Date(monthStart.getTime() - 1)))
            .reduce((s, i) => s + revenueOf(i), 0));
        const runRatePerDay = daysElapsed ? round2(monthToDateRevenue / daysElapsed) : 0;
        const projectedMonthRevenue = round2(runRatePerDay * daysInMonth);
        const forecast = {
            projectedMonthRevenue,
            monthToDateRevenue,
            runRatePerDay,
            daysElapsed,
            daysInMonth,
            vsLastMonthPct: lastMonthRevenue ? round2(((projectedMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null,
            basis: 'Linear run-rate from month-to-date revenue',
        };

        /* ── Activity heatmap (one entry per day in range, gaps filled) ────── */
        const dayAgg = new Map();
        const bump = (date, revenue = 0) => {
            const key = periodKey(date, 'day');
            if (!key) return;
            const e = dayAgg.get(key) || { count: 0, revenue: 0 };
            e.count += 1;
            e.revenue = round2(e.revenue + revenue);
            dayAgg.set(key, e);
        };
        for (const inv of rangeInvoices) bump(inv.createdAt, revenueOf(inv));
        for (const q of fQuotes) if (inRange(q.createdAt)) bump(q.createdAt);
        for (const p of rangePayments) bump(p.createdAt);
        for (const l of rangeLeads) bump(l.createdAt);
        for (const o of rangeSO) bump(o.createdAt);

        const activityHeatmap = [];
        const heatCap = 400; // ~13 months of days; keeps the payload bounded
        let dayCursor = utcDayStart(from);
        const lastDay = utcDayStart(to);
        while (dayCursor.getTime() <= lastDay.getTime() && activityHeatmap.length < heatCap) {
            const key = dayCursor.toISOString().slice(0, 10);
            const e = dayAgg.get(key) || { count: 0, revenue: 0 };
            // ISO week number, UTC.
            const thursday = new Date(utcWeekStart(dayCursor).getTime() + 3 * DAY_MS);
            const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
            const isoWeek = Math.ceil(((thursday - yearStart) / DAY_MS + 1) / 7);
            activityHeatmap.push({
                date: key,
                weekday: dayCursor.getUTCDay(),
                week: isoWeek,
                count: e.count,
                revenue: e.revenue,
            });
            dayCursor = new Date(dayCursor.getTime() + DAY_MS);
        }

        /* ── Inventory (for the low-stock insight) ─────────────────────────── */
        const qtyByItemId = {};
        for (const m of fStockMoves) {
            const signed = m.type === 'out' ? -Math.abs(m.qty || 0) : Math.abs(m.qty || 0);
            qtyByItemId[m.itemId] = (qtyByItemId[m.itemId] || 0) + signed;
        }
        const lowStockItems = Object.entries(qtyByItemId)
            .filter(([, qty]) => qty <= LOW_STOCK_THRESHOLD)
            .map(([itemId, qty]) => ({ itemId, name: productByItemId.get(itemId)?.name || itemId, qty }));

        /* ── KPIs ──────────────────────────────────────────────────────────── */
        const sparkOf = fn => curBuckets.map(b => fn(b.key));
        const revSpark = sparkOf(k => round2(curRevMap.get(k)?.revenue || 0));
        const countSpark = sparkOf(k => curRevMap.get(k)?.invoiceCount || 0);

        // grossMargin: tenant_products now carries an optional costPrice, but
        // existing products predate the field and default to 0. If nothing in
        // the tenant's catalog actually has cost data, showing "100% margin"
        // (revenue - 0 cost) would be a fabrication, so we only compute and
        // surface this once genuine cost data exists somewhere in the catalog.
        const hasCostData = products.some(p => (parseFloat(p.costPrice) || 0) > 0);
        const unavailable = hasCostData ? [] : ['grossMargin'];

        function cogsOf(doc) {
            return (doc.lineItems || []).reduce((s, li) => {
                if (!lineMatchesItem(li)) return s;
                const product = li.itemId ? productByItemId.get(li.itemId) : null;
                const cost = product ? (parseFloat(product.costPrice) || 0) : 0;
                return s + cost * (li.qty || 0);
            }, 0);
        }
        const grossMarginOf = (a, b) => {
            const inv = fInvoices.filter(i => inWindow(i.createdAt, a, b));
            const revenue = inv.reduce((s, i) => s + revenueOf(i), 0);
            const cogs = inv.reduce((s, i) => s + cogsOf(i), 0);
            return revenue > 0 ? pct(revenue - cogs, revenue) : 0;
        };
        const curGrossMargin = hasCostData ? grossMarginOf(from, to) : null;
        const prevGrossMargin = hasCostData && prv ? grossMarginOf(compare.from, compare.to) : null;
        const grossMarginSpark = hasCostData ? sparkOf(k => {
            const inv = fInvoices.filter(i => inRange(i.createdAt) && periodKey(i.createdAt, groupBy) === k);
            const revenue = inv.reduce((s, i) => s + revenueOf(i), 0);
            const cogs = inv.reduce((s, i) => s + cogsOf(i), 0);
            return revenue > 0 ? pct(revenue - cogs, revenue) : 0;
        }) : [];

        const kpis = [
            {
                key: 'revenue', label: 'Revenue', value: cur.revenue,
                ...deltaOf(cur.revenue, P('revenue'), 'up'),
                format: 'money', spark: revSpark,
                hint: applied.itemId
                    ? 'Sum of matching line items on non-draft invoices created in range'
                    : 'Sum of non-draft invoices created in range',
            },
            {
                key: 'outstanding', label: 'Outstanding', value: cur.outstanding,
                ...deltaOf(cur.outstanding, P('outstanding'), 'down'),
                format: 'money',
                spark: sparkOf(k => round2(fInvoices
                    .filter(i => inRange(i.createdAt) && periodKey(i.createdAt, groupBy) === k)
                    .reduce((s, i) => s + Math.max(0, balanceOf(i)), 0))),
                hint: 'Unpaid balance on invoices raised in range',
            },
            {
                key: 'collectionRate', label: 'Collection Rate', value: cur.collectionRate,
                ...deltaOf(cur.collectionRate, P('collectionRate'), 'up'),
                format: 'percent', spark: sparkOf(k => {
                    const inv = fInvoices.filter(i => inRange(i.createdAt) && periodKey(i.createdAt, groupBy) === k);
                    const billed = inv.reduce((s, i) => s + (i.grandTotal || 0), 0);
                    const got = inv.reduce((s, i) => s + Math.min(paidOf(i), i.grandTotal || 0), 0);
                    return pct(got, billed);
                }),
                hint: 'Collected ÷ invoiced for invoices raised in range',
            },
            {
                key: 'avgDealSize', label: 'Avg Deal Size', value: cur.avgDealSize,
                ...deltaOf(cur.avgDealSize, P('avgDealSize'), 'up'),
                format: 'money', spark: sparkOf(k => {
                    const b = curRevMap.get(k);
                    return b && b.invoiceCount ? round2(b.revenue / b.invoiceCount) : 0;
                }),
                hint: 'Average invoice value in range',
            },
            {
                key: 'conversionRate', label: 'Quote Conversion', value: cur.conversionRate,
                ...deltaOf(cur.conversionRate, P('conversionRate'), 'up'),
                format: 'percent', spark: sparkOf(k => {
                    const qs = fQuotes.filter(q => inRange(q.createdAt) && periodKey(q.createdAt, groupBy) === k);
                    return pct(qs.filter(q => convertedQuoteIds.has(q._id.toString())).length, qs.length);
                }),
                hint: 'Quotes that became a sales order or invoice',
            },
            {
                key: 'avgSalesCycleDays', label: 'Avg Sales Cycle', value: cur.avgSalesCycleDays,
                ...deltaOf(cur.avgSalesCycleDays, P('avgSalesCycleDays'), 'down'),
                format: 'days', spark: sparkOf(k => {
                    const s = cycleSamples.filter(x => inRange(x.at) && periodKey(x.at, groupBy) === k);
                    return s.length ? round2(s.reduce((a, x) => a + x.days, 0) / s.length) : 0;
                }),
                hint: 'Days from quote raised to sales order confirmed',
            },
            {
                key: 'newCustomers', label: 'New Customers', value: cur.newCustomers,
                ...deltaOf(cur.newCustomers, P('newCustomers'), 'up'),
                format: 'number', spark: countSpark,
                hint: 'Customers billed for the first time in range',
            },
            hasCostData ? {
                key: 'grossMargin', label: 'Gross Margin', value: curGrossMargin,
                ...deltaOf(curGrossMargin, prevGrossMargin, 'up'),
                format: 'percent', spark: grossMarginSpark,
                hint: 'Revenue minus cost of goods sold (from product cost price), as a % of revenue',
            } : {
                key: 'grossMargin', label: 'Gross Margin', value: null,
                prev: null, deltaPct: null, direction: 'flat', goodWhen: 'up',
                format: 'percent', spark: [],
                hint: 'Unavailable - no cost or purchase price is recorded on products',
            },
        ];

        /* ── Insights engine ───────────────────────────────────────────────
         * Only emitted when the condition genuinely holds, with real figures
         * substituted in. Sorted most severe first.
         */
        const insights = [];
        const SEVERITY_RANK = { critical: 0, warning: 1, positive: 2, info: 3 };

        if (overdue90Count > 0) {
            insights.push({
                id: 'overdue-90-plus',
                severity: 'critical',
                title: `${inr(overdue90Amount)} is 90+ days overdue`,
                detail: `${overdue90Count} invoice${overdue90Count === 1 ? '' : 's'} totalling ${inr(overdue90Amount)} ${overdue90Count === 1 ? 'has' : 'have'} been unpaid for more than 90 days past due. Debt this old rarely recovers on its own - escalate collection now.`,
                metric: inr(overdue90Amount),
                actionLabel: 'View receivables',
                actionHref: '/cloud/dashboard/documents',
            });
        }

        if (cur.invoiced > 0 && cur.collectionRate < 60) {
            insights.push({
                id: 'low-collection-rate',
                severity: 'critical',
                title: `Only ${cur.collectionRate}% of billed revenue collected`,
                detail: `You invoiced ${inr(cur.invoiced)} this period but have collected just ${inr(cur.collected)}. ${inr(cur.invoiced - cur.collected)} is still sitting with customers.`,
                metric: `${cur.collectionRate}%`,
                actionLabel: 'View payments',
                actionHref: '/cloud/dashboard/payments',
            });
        }

        if (concentration.top1Share > 30 && byClient.length) {
            const top = byClient[0];
            insights.push({
                id: 'concentration-risk',
                severity: 'warning',
                title: `${top.name} is ${Math.round(top.share)}% of revenue`,
                detail: `${top.name} accounts for ${inr(top.revenue)} of ${inr(totalRevenue)} this period across ${top.invoiceCount} invoice${top.invoiceCount === 1 ? '' : 's'}. Losing them would materially hit cash flow.`,
                metric: `${top.share}%`,
                actionLabel: 'View client',
                actionHref: '/cloud/dashboard/clients',
            });
        }

        const revenueKpi = kpis[0];
        if (prv && revenueKpi.deltaPct != null && revenueKpi.deltaPct < -15) {
            insights.push({
                id: 'revenue-decline',
                severity: 'warning',
                title: `Revenue down ${Math.abs(revenueKpi.deltaPct)}% ${compare.label}`,
                detail: `Revenue fell from ${inr(prv.revenue)} to ${inr(cur.revenue)}, a drop of ${inr(prv.revenue - cur.revenue)}. Invoice count went from ${prv.invoiceCount} to ${cur.invoiceCount}.`,
                metric: `${revenueKpi.deltaPct}%`,
            });
        }
        if (prv && revenueKpi.deltaPct != null && revenueKpi.deltaPct > 15) {
            insights.push({
                id: 'revenue-growth',
                severity: 'positive',
                title: `Revenue up ${revenueKpi.deltaPct}% ${compare.label}`,
                detail: `Revenue grew from ${inr(prv.revenue)} to ${inr(cur.revenue)}, an increase of ${inr(cur.revenue - prv.revenue)} on ${cur.invoiceCount} invoices (was ${prv.invoiceCount}).`,
                metric: `+${revenueKpi.deltaPct}%`,
            });
        }

        if (cur.quoteCount >= 5 && cur.conversionRate < 25) {
            insights.push({
                id: 'low-quote-conversion',
                severity: 'warning',
                title: `Only ${cur.convertedQuotes} of ${cur.quoteCount} quotes converted`,
                detail: `A ${cur.conversionRate}% conversion rate means most proposals are going cold. Review pricing or follow-up cadence on the ${cur.quoteCount - cur.convertedQuotes} open quotes.`,
                metric: `${cur.conversionRate}%`,
                actionLabel: 'View quotes',
                actionHref: '/cloud/dashboard/documents',
            });
        }

        if (lowStockItems.length > 0) {
            const names = lowStockItems.slice(0, 3).map(i => i.name).join(', ');
            const outCount = lowStockItems.filter(i => i.qty <= 0).length;
            insights.push({
                id: 'low-stock',
                severity: 'warning',
                title: `${lowStockItems.length} item${lowStockItems.length === 1 ? '' : 's'} low or out of stock`,
                detail: `${names}${lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ''} ${lowStockItems.length === 1 ? 'is' : 'are'} at or below ${LOW_STOCK_THRESHOLD} units${outCount ? `, ${outCount} of them fully out of stock` : ''}. Reorder before it blocks fulfilment.`,
                metric: String(lowStockItems.length),
                actionLabel: 'View inventory',
                actionHref: '/cloud/dashboard/inventory',
            });
        }

        if (cur.invoiced > 0 && cur.collectionRate > 90) {
            insights.push({
                id: 'strong-collection',
                severity: 'positive',
                title: `${cur.collectionRate}% of billed revenue collected`,
                detail: `${inr(cur.collected)} of ${inr(cur.invoiced)} invoiced this period is already in the bank. Receivables discipline is holding up well.`,
                metric: `${cur.collectionRate}%`,
            });
        }

        const cycleKpi = kpis.find(k => k.key === 'avgSalesCycleDays');
        if (prv && cycleKpi.deltaPct != null && Math.abs(cycleKpi.deltaPct) > 20 && cur.avgSalesCycleDays > 0) {
            const faster = cycleKpi.deltaPct < 0;
            insights.push({
                id: 'sales-cycle-shift',
                severity: 'info',
                title: `Sales cycle ${faster ? 'shortened' : 'lengthened'} ${Math.abs(cycleKpi.deltaPct)}%`,
                detail: `Quotes now take ${cur.avgSalesCycleDays} days on average to become a sales order, ${faster ? 'down' : 'up'} from ${prv.avgSalesCycleDays} days ${compare.label}.`,
                metric: `${cur.avgSalesCycleDays} days`,
            });
        }

        insights.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
        const topInsights = insights.slice(0, 6);

        /* ── Filter options (derived from actual tenant data) ─────────────── */
        const uniqueOptions = (values, labeller = humanLabel) => {
            const seen = new Map();
            for (const v of values) {
                if (v == null || v === '') continue;
                if (!seen.has(v)) seen.set(v, { id: String(v), label: labeller(v) });
            }
            return Array.from(seen.values()).slice(0, OPTION_CAP);
        };

        const filters = {
            applied,
            options: {
                clients: uniqueOptions([...invoices, ...quotes].map(clientNameOf).sort(), v => v),
                items: (() => {
                    const seen = new Map();
                    for (const p of products) if (p.itemId && !seen.has(p.itemId)) seen.set(p.itemId, { id: p.itemId, label: p.name || p.itemId });
                    for (const inv of invoices) {
                        for (const li of (inv.lineItems || [])) {
                            const id = li.itemId || li.product;
                            if (id && !seen.has(id)) seen.set(id, { id: String(id), label: li.product || String(id) });
                        }
                    }
                    return Array.from(seen.values()).slice(0, OPTION_CAP);
                })(),
                sources: uniqueOptions(leads.map(l => l.source || 'Unspecified')),
                warehouses: warehouses.slice(0, OPTION_CAP).map(w => ({ id: w._id.toString(), label: w.name || 'Warehouse' })),
                soStatuses: uniqueOptions([...new Set([...SO_STATUS_ORDER, ...salesOrders.map(o => o.status)])]),
            },
        };

        return NextResponse.json({
            range: {
                from: from.toISOString(),
                to: to.toISOString(),
                groupBy,
                compare: {
                    mode: compare.mode,
                    from: compare.from ? compare.from.toISOString() : null,
                    to: compare.to ? compare.to.toISOString() : null,
                    label: compare.label,
                },
            },
            filters,
            kpis,
            series: { revenue: revenueSeries, cashFlow, pace },
            breakdowns: {
                byClient, byItem, receivablesAging, paymentsByMethod,
                leadsFunnel, salesOrderFunnel, leadsBySource,
            },
            cohort,
            concentration,
            forecast,
            activityHeatmap,
            insights: topInsights,
            meta: {
                generatedAt: now.toISOString(),
                unavailable,
                currency: 'INR',
            },
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/analytics') }, { status: 500 });
    }
}
