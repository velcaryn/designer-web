import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'annual'];

// Monthly-normalization factor per frequency, used only for the MRR estimate below -
// generation itself always uses calendar-accurate date math (see advanceDate in [id]/route.js
// and the generate-recurring-invoices cron).
const MRR_FACTOR = { weekly: 4.345, monthly: 1, quarterly: 1 / 3, annual: 1 / 12 };

/**
 * GET /api/cloud/erp/accounting/recurring-invoices
 * Phase 8b - lists recurring invoice schedules for the tenant, plus a simple MRR estimate
 * (active schedules' grandTotal normalized to a monthly figure).
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const db = await getCloudDb();
        const schedules = await db.collection('erp_recurring_invoices')
            .find({ tenantId: user.tenantId })
            .sort({ createdAt: -1 })
            .toArray();

        const mrr = schedules
            .filter(s => s.active)
            .reduce((s, sch) => s + (sch.grandTotal || 0) * (MRR_FACTOR[sch.frequency] || 0), 0);

        return NextResponse.json({
            schedules: schedules.map(s => ({ ...s, _id: s._id.toString() })),
            mrr,
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/recurring-invoices') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/accounting/recurring-invoices
 * Creates a recurring schedule from a freeform customer + line items (mirrors Sales
 * Order's shape rather than referencing a live Invoice, since the whole point is repeat
 * generation, not a one-time snapshot of something that already exists).
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const body = await req.json();
        const customer = body.customer || {};
        const lineItems = body.lineItems || [];
        const frequency = FREQUENCIES.includes(body.frequency) ? body.frequency : null;

        if (!customer?.name) return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
        if (!lineItems.length) return NextResponse.json({ error: 'At least one line item is required.' }, { status: 400 });
        if (!frequency) return NextResponse.json({ error: 'Frequency must be weekly, monthly, quarterly, or annual.' }, { status: 400 });

        const cleanLineItems = lineItems.slice(0, 50).map(item => ({
            product: sanitizeStr(item.product, 200),
            description: sanitizeStr(item.description, 500),
            hsnCode: sanitizeStr(item.hsnCode, 20),
            qty: sanitizeNum(item.qty, 1),
            unit: sanitizeStr(item.unit || 'Nos', 20),
            unitPrice: sanitizeNum(item.unitPrice),
            taxRate: sanitizeNum(item.taxRate),
            totalPrice: sanitizeNum(item.qty, 1) * sanitizeNum(item.unitPrice),
        }));
        const subtotal = cleanLineItems.reduce((s, i) => s + i.totalPrice, 0);
        const taxAmount = cleanLineItems.reduce((s, i) => s + (i.totalPrice * i.taxRate / 100), 0);

        const startDate = body.startDate ? new Date(body.startDate) : new Date();

        const db = await getCloudDb();
        const doc = {
            tenantId: user.tenantId,
            customer: {
                name: sanitizeStr(customer.name, 200),
                company: sanitizeStr(customer.company, 200),
                phone: sanitizeStr(customer.phone, 20),
                email: sanitizeStr(customer.email, 200).toLowerCase(),
                address: sanitizeStr(customer.address, 500),
                gstin: sanitizeStr(customer.gstin, 15).toUpperCase(),
            },
            lineItems: cleanLineItems,
            subtotal,
            taxAmount,
            grandTotal: subtotal + taxAmount,
            currency: sanitizeStr(body.currency || 'INR', 5),
            frequency,
            startDate,
            nextRunDate: startDate,
            endDate: body.endDate ? new Date(body.endDate) : null,
            active: true,
            lastGeneratedAt: null,
            generatedCount: 0,
            notes: sanitizeStr(body.notes, 2000),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_recurring_invoices').insertOne(doc);
        return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/accounting/recurring-invoices') }, { status: 500 });
    }
}
