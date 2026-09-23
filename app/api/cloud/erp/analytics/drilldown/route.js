import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { computeNoteAdjustments } from '@/lib/erpHelpers';

export const dynamic = 'force-dynamic';

const DEFAULT_TERM_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const ROW_CAP = 100;

const DIMENSIONS = ['client', 'item', 'agingBucket', 'soStatus', 'leadStage', 'paymentMethod', 'period'];

const round2 = n => Math.round((Number(n) || 0) * 100) / 100;
const isValidDate = d => d instanceof Date && !Number.isNaN(d.getTime());
const clientNameOf = doc => doc?.customer?.company || doc?.customer?.name || 'Unknown client';

function utcDayStart(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function utcWeekStart(d) {
    const day = (d.getUTCDay() + 6) % 7;
    return new Date(utcDayStart(d).getTime() - day * DAY_MS);
}

/**
 * Matches a date against a `period` drill-down value. Accepts every bucket key
 * shape the main analytics route can emit: YYYY-MM-DD (day or ISO-week start),
 * YYYY-MM (month) and YYYY-Qn (quarter).
 */
function matchesPeriod(date, value) {
    const d = new Date(date);
    if (!isValidDate(d)) return false;
    if (/^\d{4}-Q[1-4]$/.test(value)) {
        const [y, q] = value.split('-Q');
        return d.getUTCFullYear() === Number(y) && Math.floor(d.getUTCMonth() / 3) + 1 === Number(q);
    }
    if (/^\d{4}-\d{2}$/.test(value)) {
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` === value;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // A day key matches exactly; a week key matches the whole ISO week it starts.
        const dayKey = utcDayStart(d).toISOString().slice(0, 10);
        if (dayKey === value) return true;
        return utcWeekStart(d).toISOString().slice(0, 10) === value;
    }
    return false;
}

function resolveRange(searchParams) {
    const now = new Date();
    let to = searchParams.get('to') ? new Date(searchParams.get('to')) : now;
    if (!isValidDate(to)) to = now;
    let from = searchParams.get('from') ? new Date(searchParams.get('from')) : new Date(to.getTime() - 90 * DAY_MS);
    if (!isValidDate(from)) from = new Date(to.getTime() - 90 * DAY_MS);
    if (from > to) [from, to] = [to, from];
    return { from, to };
}

/**
 * GET /api/cloud/erp/analytics/drilldown?dimension=&value=&from=&to=
 *
 * Returns the underlying records behind any chart element so every visual on
 * the analytics dashboard is clickable through to real documents.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'analytics');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const dimension = searchParams.get('dimension');
        const value = searchParams.get('value') || '';

        if (!DIMENSIONS.includes(dimension)) {
            return NextResponse.json({ error: `dimension must be one of: ${DIMENSIONS.join(', ')}` }, { status: 400 });
        }

        const db = await getCloudDb();
        const tenantId = user.tenantId;
        const { from, to } = resolveRange(searchParams);
        const now = new Date();
        const inRange = d => {
            const t = new Date(d).getTime();
            return Number.isFinite(t) && t >= from.getTime() && t <= to.getTime();
        };

        const empty = { dimension, value, totalCount: 0, totalAmount: 0, rows: [] };

        // ── Lead stage drills into erp_leads, not documents ─────────────────
        if (dimension === 'leadStage') {
            const leads = await db.collection('erp_leads')
                .find({ tenantId, stage: value }).toArray();
            const rows = leads
                .filter(l => inRange(l.createdAt))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, ROW_CAP)
                .map(l => ({
                    id: l._id.toString(),
                    type: 'Lead',
                    docNumber: l.leadNumber || '-',
                    date: new Date(l.createdAt).toISOString(),
                    client: l.company || l.name || 'Unknown lead',
                    amount: round2(l.expectedRevenue || 0),
                    status: l.stage || null,
                    balanceDue: 0,
                    href: '/cloud/dashboard/crm',
                    pdfHref: null,
                }));
            return NextResponse.json({
                dimension, value,
                totalCount: rows.length,
                totalAmount: round2(rows.reduce((s, r) => s + r.amount, 0)),
                rows,
            });
        }

        // ── Sales order status drills into erp_sales_orders ──────────────────
        if (dimension === 'soStatus') {
            const orders = await db.collection('erp_sales_orders').find({ tenantId, status: value }).toArray();
            const rows = orders
                .filter(o => inRange(o.createdAt))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, ROW_CAP)
                .map(o => ({
                    id: o._id.toString(),
                    type: 'SalesOrder',
                    docNumber: o.soNumber || '-',
                    date: new Date(o.createdAt).toISOString(),
                    client: clientNameOf(o),
                    amount: round2(o.grandTotal || 0),
                    status: o.status || null,
                    balanceDue: 0,
                    href: '/cloud/dashboard/sales-orders',
                    pdfHref: null,
                }));
            return NextResponse.json({
                dimension, value,
                totalCount: rows.length,
                totalAmount: round2(rows.reduce((s, r) => s + r.amount, 0)),
                rows,
            });
        }

        // ── Everything else is invoice-backed ───────────────────────────────
        const invoices = await db.collection('tenant_documents')
            .find({ tenantId, docType: 'Invoice', status: { $ne: 'draft' } }).toArray();
        if (!invoices.length) return NextResponse.json(empty);

        const invoiceIds = invoices.map(d => d._id.toString());
        const paidTotals = await db.collection('erp_payments').aggregate([
            { $match: { tenantId, documentId: { $in: invoiceIds } } },
            { $group: { _id: '$documentId', paid: { $sum: '$amount' } } },
        ]).toArray();
        const paidMap = Object.fromEntries(paidTotals.map(p => [p._id, p.paid]));
        const noteAdjustments = await computeNoteAdjustments(tenantId, invoiceIds);

        const paidOf = inv => (paidMap[inv._id.toString()] || 0) + (noteAdjustments.get(inv._id.toString()) || 0);
        const balanceOf = inv => round2((inv.grandTotal || 0) - paidOf(inv));
        const dueDateOf = inv => (inv.dueDate
            ? new Date(inv.dueDate)
            : new Date(new Date(inv.createdAt).getTime() + DEFAULT_TERM_DAYS * DAY_MS));

        let matched = [];
        // `amountOf` lets item/paymentMethod report the attributable slice rather
        // than the full invoice total, so drill-down sums reconcile with the chart.
        let amountOf = inv => round2(inv.grandTotal || 0);

        if (dimension === 'client') {
            matched = invoices.filter(inv => clientNameOf(inv) === value && inRange(inv.createdAt));
        } else if (dimension === 'item') {
            const product = await db.collection('tenant_products').findOne({ tenantId, itemId: value });
            const lineMatches = li => (li.itemId ? li.itemId === value : (li.product === (product?.name || value)));
            matched = invoices.filter(inv => inRange(inv.createdAt) && (inv.lineItems || []).some(lineMatches));
            amountOf = inv => round2((inv.lineItems || []).filter(lineMatches).reduce((s, li) => s + (li.totalPrice || 0), 0));
        } else if (dimension === 'agingBucket') {
            // Point-in-time open balances, matching the aging chart (not range-limited).
            matched = invoices.filter(inv => {
                if (balanceOf(inv) <= 0) return false;
                const daysOverdue = Math.floor((now - dueDateOf(inv)) / DAY_MS);
                if (daysOverdue <= 0) return false;
                const bucket = daysOverdue <= 30 ? '0-30' : daysOverdue <= 60 ? '31-60' : daysOverdue <= 90 ? '61-90' : '90+';
                return bucket === value;
            });
            amountOf = inv => Math.max(0, balanceOf(inv));
        } else if (dimension === 'paymentMethod') {
            const payments = await db.collection('erp_payments')
                .find({ tenantId, documentId: { $in: invoiceIds }, method: value }).toArray();
            const byDoc = new Map();
            for (const p of payments) {
                if (!inRange(p.createdAt)) continue;
                byDoc.set(p.documentId, round2((byDoc.get(p.documentId) || 0) + (p.amount || 0)));
            }
            matched = invoices.filter(inv => byDoc.has(inv._id.toString()));
            amountOf = inv => byDoc.get(inv._id.toString()) || 0;
        } else if (dimension === 'period') {
            matched = invoices.filter(inv => matchesPeriod(inv.createdAt, value));
        }

        const rows = matched
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, ROW_CAP)
            .map(inv => ({
                id: inv._id.toString(),
                type: 'Invoice',
                docNumber: inv.docNumber || '-',
                date: new Date(inv.createdAt).toISOString(),
                client: clientNameOf(inv),
                amount: amountOf(inv),
                status: inv.status || null,
                balanceDue: Math.max(0, balanceOf(inv)),
                href: '/cloud/dashboard/documents',
                pdfHref: `/api/cloud/documents/${inv._id.toString()}/pdf`,
            }));

        return NextResponse.json({
            dimension,
            value,
            totalCount: matched.length,
            totalAmount: round2(matched.reduce((s, inv) => s + amountOf(inv), 0)),
            rows,
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/analytics/drilldown') }, { status: 500 });
    }
}
