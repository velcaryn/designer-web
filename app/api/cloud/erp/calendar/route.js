import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, computeNoteAdjustments } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const MANUAL_TYPES = ['reminder', 'meeting', 'other'];
const CLOSED_LEAD_STAGES = ['won', 'lost'];
const OPEN_PO_STATUSES = ['draft', 'sent', 'confirmed', 'partially_received', 'pending'];
const OPEN_SO_STATUSES = ['draft', 'confirmed'];
const ITEMS_PER_GROUP_CAP = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

/* ────────────────────────────────────────────────────────────────────────────
 * Date handling - UTC-consistent end to end.
 *
 * Every comparison below reduces a Date to its UTC calendar day before doing
 * any arithmetic. Mixing local getters (getMonth/getDate) with toISOString()
 * (UTC) is exactly what caused the off-by-one day-click bug already fixed on
 * the calendar page - do not reintroduce it here.
 * ──────────────────────────────────────────────────────────────────────────── */
function utcDayStart(d) {
    const x = new Date(d);
    return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
}
function daysFrom(todayMs, date) {
    return Math.round((utcDayStart(date) - todayMs) / DAY_MS);
}
function urgencyFor(days) {
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days <= 7) return 'soon';
    return 'upcoming';
}

/**
 * Builds the unified event list.
 *
 * `range` is `{ from, to }` for the month grid, or `null` for scope=alerts -
 * alerts deliberately scan ALL time so the notification bell reports what
 * actually needs attention rather than whatever month happens to be on screen.
 */
async function buildEvents(db, tenantId, range) {
    const inRange = field => (range ? { [field]: { $gte: range.from, $lte: range.to } } : { [field]: { $ne: null } });

    const [leads, invoices, manualEvents, purchaseOrders, recurring, salesOrders, tasks] = await Promise.all([
        db.collection('erp_leads')
            .find({ tenantId, stage: { $nin: CLOSED_LEAD_STAGES }, ...inRange('followUpDate') })
            .project({ name: 1, company: 1, stage: 1, leadNumber: 1, followUpDate: 1, expectedRevenue: 1 })
            .toArray(),
        db.collection('tenant_documents')
            .find({ tenantId, docType: 'Invoice', status: { $nin: ['draft', 'cancelled'] }, ...inRange('dueDate') })
            .project({ docNumber: 1, dueDate: 1, grandTotal: 1, currency: 1, 'customer.name': 1, status: 1 })
            .toArray(),
        db.collection('erp_calendar_events')
            .find({ tenantId, ...inRange('date') })
            .project({ title: 1, eventType: 1, date: 1, notes: 1 })
            .toArray(),
        db.collection('erp_purchase_orders')
            .find({ tenantId, status: { $in: OPEN_PO_STATUSES }, ...inRange('expectedDate') })
            .project({ poNumber: 1, expectedDate: 1, status: 1, grandTotal: 1, currency: 1, 'vendor.name': 1 })
            .toArray(),
        db.collection('erp_recurring_invoices')
            .find({ tenantId, active: true, ...inRange('nextRunDate') })
            .project({ nextRunDate: 1, frequency: 1, grandTotal: 1, currency: 1, 'customer.name': 1 })
            .toArray(),
        db.collection('erp_sales_orders')
            .find({ tenantId, status: { $in: OPEN_SO_STATUSES }, ...inRange('expectedDate') })
            .project({ soNumber: 1, expectedDate: 1, status: 1, grandTotal: 1, currency: 1, 'customer.name': 1 })
            .toArray(),
        db.collection('erp_tasks')
            .find({ tenantId, status: { $ne: 'done' }, ...inRange('dueDate') })
            .project({ title: 1, dueDate: 1, priority: 1, status: 1 })
            .toArray(),
    ]);

    // Payment + credit/debit-note netting. Aggregated server-side rather than
    // pulling every payment doc for the tenant (the old code did the latter).
    const invoiceIds = invoices.map(d => d._id.toString());
    const paidTotals = invoiceIds.length
        ? await db.collection('erp_payments').aggregate([
            { $match: { tenantId, documentId: { $in: invoiceIds } } },
            { $group: { _id: '$documentId', paid: { $sum: '$amount' } } },
        ]).toArray()
        : [];
    const paidMap = new Map(paidTotals.map(p => [p._id, p.paid]));
    // Credit notes reduce what is actually collectable; without this the
    // calendar overstates debt on any invoice that has been credited.
    const noteAdjustments = await computeNoteAdjustments(tenantId, invoiceIds);

    const todayMs = utcDayStart(new Date());
    const events = [];
    const push = (ev) => {
        const days = daysFrom(todayMs, ev.date);
        events.push({ ...ev, date: new Date(ev.date).toISOString(), daysFromToday: days, urgency: urgencyFor(days) });
    };

    for (const inv of invoices) {
        const id = inv._id.toString();
        const balanceDue = (inv.grandTotal || 0) - (paidMap.get(id) || 0) - (noteAdjustments.get(id) || 0);
        if (balanceDue <= 0) continue; // nothing left to collect
        const currency = inv.currency || 'INR';
        push({
            id: `invoice-${id}`,
            type: 'invoice_due',
            date: inv.dueDate,
            title: `Payment due: ${inv.docNumber}`,
            subtitle: inv.customer?.name || 'Unknown customer',
            linkedId: id,
            amount: balanceDue,
            currency,
            meta: { balanceDue, currency, grandTotal: inv.grandTotal || 0, paid: paidMap.get(id) || 0, noteAdjustment: noteAdjustments.get(id) || 0, status: inv.status },
            actions: [
                { key: 'markPaid', label: 'Mark as Paid' },
                { key: 'viewPdf', label: 'View Invoice', href: `/api/cloud/documents/${id}/pdf` },
                { key: 'openDoc', label: 'Open', href: '/cloud/dashboard/documents' },
            ],
        });
    }

    for (const l of leads) {
        push({
            id: `lead-${l._id}`,
            type: 'lead_followup',
            date: l.followUpDate,
            title: `Follow up: ${l.name}`,
            subtitle: l.company || '',
            linkedId: l._id.toString(),
            amount: l.expectedRevenue || null,
            currency: 'INR',
            meta: { leadNumber: l.leadNumber, stage: l.stage, expectedRevenue: l.expectedRevenue || 0 },
            actions: [
                { key: 'openCrm', label: 'Open in CRM', href: '/cloud/dashboard/erp/crm' },
                { key: 'changeStage', label: 'Move stage' },
            ],
        });
    }

    for (const ev of manualEvents) {
        push({
            id: `manual-${ev._id}`,
            type: MANUAL_TYPES.includes(ev.eventType) ? ev.eventType : 'reminder',
            date: ev.date,
            title: ev.title,
            subtitle: ev.notes || '',
            linkedId: ev._id.toString(),
            amount: null,
            currency: 'INR',
            meta: { notes: ev.notes || '' },
            actions: [{ key: 'deleteEntry', label: 'Delete Entry' }],
        });
    }

    for (const t of tasks) {
        push({
            id: `task-${t._id}`,
            type: 'task',
            date: t.dueDate,
            title: `Task: ${t.title}`,
            subtitle: `Priority: ${t.priority || 'Normal'}`,
            linkedId: t._id.toString(),
            amount: null,
            meta: { status: t.status, priority: t.priority },
            actions: [
                { key: 'openTask', label: 'View Tasks', href: '/cloud/dashboard/erp/tasks' }
            ],
        });
    }

    for (const po of purchaseOrders) {
        push({
            id: `po-${po._id}`,
            type: 'purchase_order',
            date: po.expectedDate,
            title: `PO expected: ${po.poNumber || po._id}`,
            subtitle: po.vendor?.name || '',
            linkedId: po._id.toString(),
            amount: po.grandTotal || null,
            currency: po.currency || 'INR',
            meta: { poNumber: po.poNumber, status: po.status, grandTotal: po.grandTotal || 0 },
            actions: [{ key: 'openPurchase', label: 'Open Purchase Order', href: '/cloud/dashboard/erp/purchases' }],
        });
    }

    for (const so of salesOrders) {
        push({
            id: `so-${so._id}`,
            type: 'sales_order',
            date: so.expectedDate,
            title: `SO expected: ${so.soNumber || so._id}`,
            subtitle: so.customer?.name || '',
            linkedId: so._id.toString(),
            amount: so.grandTotal || null,
            currency: so.currency || 'INR',
            meta: { soNumber: so.soNumber, status: so.status, grandTotal: so.grandTotal || 0 },
            actions: [{ key: 'openSalesOrder', label: 'Open Sales Order', href: '/cloud/dashboard/erp/sales-orders' }],
        });
    }

    for (const r of recurring) {
        push({
            id: `recurring-${r._id}`,
            type: 'recurring_invoice',
            date: r.nextRunDate,
            title: `Recurring invoice runs${r.customer?.name ? `: ${r.customer.name}` : ''}`,
            subtitle: r.frequency ? `${r.frequency} schedule` : '',
            linkedId: r._id.toString(),
            amount: r.grandTotal || null,
            currency: r.currency || 'INR',
            meta: { frequency: r.frequency, grandTotal: r.grandTotal || 0 },
            actions: [{ key: 'openRecurring', label: 'Open Schedule', href: '/cloud/dashboard/erp/accounting' }],
        });
    }

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    return events;
}

const GROUP_DEFS = [
    { key: 'overdue', label: 'Overdue', severity: 'critical', match: e => e.daysFromToday < 0 },
    { key: 'today', label: 'Due today', severity: 'warning', match: e => e.daysFromToday === 0 },
    { key: 'tomorrow', label: 'Due tomorrow', severity: 'info', match: e => e.daysFromToday === 1 },
    { key: 'week', label: 'Next 7 days', severity: 'info', match: e => e.daysFromToday >= 2 && e.daysFromToday <= 7 },
];

function buildAlerts(events) {
    const buckets = new Map(GROUP_DEFS.map(g => [g.key, []]));
    for (const e of events) {
        const g = GROUP_DEFS.find(def => def.match(e));
        if (g) buckets.get(g.key).push(e);
    }

    const groups = [];
    for (const def of GROUP_DEFS) {
        const items = buckets.get(def.key);
        if (!items.length) continue;
        // Overdue reads most-urgent-first (oldest date); everything else soonest-first.
        items.sort((a, b) => (def.key === 'overdue' ? a.daysFromToday - b.daysFromToday : a.daysFromToday - b.daysFromToday));
        groups.push({
            key: def.key,
            label: def.label,
            severity: def.severity,
            count: items.length,
            amount: items.reduce((s, e) => s + (e.amount || 0), 0),
            items: items.slice(0, ITEMS_PER_GROUP_CAP),
        });
    }

    const count = k => (buckets.get(k) || []).length;
    const overdue = buckets.get('overdue');
    const totalActionable = GROUP_DEFS.reduce((s, d) => s + count(d.key), 0);

    return {
        generatedAt: new Date().toISOString(),
        summary: {
            overdueCount: overdue.length,
            overdueAmount: overdue.reduce((s, e) => s + (e.amount || 0), 0),
            todayCount: count('today'),
            tomorrowCount: count('tomorrow'),
            next7Count: count('week'),
            totalActionable,
            currency: 'INR',
        },
        groups,
    };
}

/**
 * GET /api/cloud/erp/calendar
 *
 *   ?scope=month&from=&to=  → grid events for the visible window (default scope)
 *   ?scope=alerts           → actionable items across ALL time, from/to ignored.
 *
 * The alerts scope exists because deriving the notification bell from the month
 * grid made "what needs attention" a function of what you happened to be looking
 * at - viewing July hid 11 of 16 overdue invoices worth ₹22L+.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'calendar');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const scope = searchParams.get('scope') === 'alerts' ? 'alerts' : 'month';
        const db = await getCloudDb();

        if (scope === 'alerts') {
            const events = await buildEvents(db, user.tenantId, null);
            return NextResponse.json(buildAlerts(events));
        }

        const from = searchParams.get('from');
        const to = searchParams.get('to');
        if (!from || !to) return NextResponse.json({ error: 'from and to date params are required.' }, { status: 400 });
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            return NextResponse.json({ error: 'from and to must be valid dates.' }, { status: 400 });
        }

        const events = await buildEvents(db, user.tenantId, { from: fromDate, to: toDate });
        return NextResponse.json({ events });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/calendar') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/calendar
 * Creates a manual calendar entry (reminder/meeting/other) - not linked to a lead or invoice.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'calendar');
        if (denied) return denied;

        const body = await req.json();
        const title = sanitizeStr(body.title, 200);
        if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
        if (!body.date) return NextResponse.json({ error: 'Date is required.' }, { status: 400 });

        const eventType = MANUAL_TYPES.includes(body.eventType) ? body.eventType : 'reminder';

        const doc = {
            tenantId: user.tenantId,
            title,
            eventType,
            date: new Date(body.date),
            notes: sanitizeStr(body.notes, 1000),
            by: user.email,
            createdAt: new Date(),
        };

        const db = await getCloudDb();
        const result = await db.collection('erp_calendar_events').insertOne(doc);
        return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/calendar') }, { status: 500 });
    }
}
