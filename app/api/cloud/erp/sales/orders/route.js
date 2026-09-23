import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, sanitizeNum, paginationFromParams } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/sales/orders
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const { skip, limit, page } = paginationFromParams(searchParams);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (status) filter.status = status;

        const [orders, total] = await Promise.all([
            db.collection('erp_sales_orders').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            db.collection('erp_sales_orders').countDocuments(filter),
        ]);

        return NextResponse.json({
            orders: orders.map(o => ({ ...o, _id: o._id.toString() })),
            total, page, pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/sales/orders') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/sales/orders
 * Creates a Sales Order, either from scratch or by converting an existing Quote
 * (Quote → Sales Order → Invoice - matches the Odoo/ERPNext flow). Converting a Quote
 * snapshots its customer/line items rather than referencing them live, mirroring how
 * Documents already snapshot tenant branding at creation time.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const body = await req.json();
        const db = await getCloudDb();

        let customer = body.customer || {};
        let lineItems = body.lineItems || [];
        let quoteDocumentId = null;
        let quoteDocNumber = null;

        if (body.quoteDocumentId && ObjectId.isValid(body.quoteDocumentId)) {
            const quote = await db.collection('tenant_documents').findOne({ _id: new ObjectId(body.quoteDocumentId), tenantId: user.tenantId, docType: 'Quote' });
            if (!quote) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
            customer = quote.customer;
            lineItems = quote.lineItems;
            quoteDocumentId = quote._id.toString();
            quoteDocNumber = quote.docNumber;
        }

        if (!customer?.name) return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
        if (!lineItems.length) return NextResponse.json({ error: 'At least one line item is required.' }, { status: 400 });

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

        const soNumber = await generateErpNumber(user.tenantId, 'salesOrder');

        const order = {
            tenantId: user.tenantId,
            soNumber,
            quoteDocumentId,
            quoteDocNumber,
            invoiceDocumentId: null,
            invoiceDocNumber: null,
            customer: {
                name: sanitizeStr(customer.name, 200),
                company: sanitizeStr(customer.company, 200),
                phone: sanitizeStr(customer.phone, 20),
                email: sanitizeStr(customer.email, 200).toLowerCase(),
                address: sanitizeStr(customer.address, 500),
                gstin: sanitizeStr(customer.gstin, 15).toUpperCase(),
            },
            status: 'draft',
            expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
            lineItems: cleanLineItems,
            subtotal,
            taxAmount,
            grandTotal: subtotal + taxAmount,
            currency: sanitizeStr(body.currency || 'INR', 5),
            notes: sanitizeStr(body.notes, 2000),
            history: [{
                action: 'created',
                message: quoteDocNumber ? `Sales Order created from Quote ${quoteDocNumber}` : `Sales Order created by ${user.email}`,
                at: new Date(),
                by: user.email,
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_sales_orders').insertOne(order);

        return NextResponse.json({ success: true, _id: result.insertedId.toString(), soNumber }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/sales/orders') }, { status: 500 });
    }
}
