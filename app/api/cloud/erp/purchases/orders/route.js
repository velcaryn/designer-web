import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, sanitizeNum, paginationFromParams, validateStatusTransition } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/purchases/orders
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const vendorId = searchParams.get('vendorId');
        const { skip, limit, page } = paginationFromParams(searchParams);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (status) filter.status = status;
        if (vendorId) filter.vendorId = vendorId;

        const [orders, total] = await Promise.all([
            db.collection('erp_purchase_orders')
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('erp_purchase_orders').countDocuments(filter),
        ]);

        return NextResponse.json({
            orders: orders.map(o => ({ ...o, _id: o._id.toString() })),
            total, page, pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/purchases/orders') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/purchases/orders
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;

        const body = await req.json();
        if (!body.vendorId) return NextResponse.json({ error: 'Vendor is required.' }, { status: 400 });

        const db = await getCloudDb();

        // Validate vendor exists (vendors are tenant_clients tagged with the 'vendor' role)
        const vendor = await db.collection('tenant_clients').findOne({
            _id: new ObjectId(body.vendorId),
            tenantId: user.tenantId,
            roles: 'vendor',
        });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });

        const lineItems = (body.lineItems || []).slice(0, 50).map(item => ({
            product: sanitizeStr(item.product, 200),
            description: sanitizeStr(item.description, 500),
            hsnCode: sanitizeStr(item.hsnCode, 20),
            qty: sanitizeNum(item.qty, 1),
            unit: sanitizeStr(item.unit || 'Nos', 20),
            unitPrice: sanitizeNum(item.unitPrice),
            taxRate: sanitizeNum(item.taxRate),
            totalPrice: sanitizeNum(item.qty, 1) * sanitizeNum(item.unitPrice),
        }));

        const subtotal = lineItems.reduce((s, i) => s + i.totalPrice, 0);
        const taxAmount = lineItems.reduce((s, i) => s + (i.totalPrice * i.taxRate / 100), 0);

        const poNumber = await generateErpNumber(user.tenantId, 'purchaseOrder');

        const order = {
            tenantId: user.tenantId,
            poNumber,
            vendorId: body.vendorId,
            vendorName: vendor.name,
            status: 'draft',
            lineItems,
            subtotal,
            taxAmount,
            grandTotal: subtotal + taxAmount,
            currency: sanitizeStr(body.currency || 'INR', 5),
            expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
            notes: sanitizeStr(body.notes, 2000),
            shippingAddress: sanitizeStr(body.shippingAddress, 500),
            history: [{
                action: 'created',
                message: `PO created by ${user.businessName || user.email}`,
                at: new Date(),
                by: user.email,
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_purchase_orders').insertOne(order);

        return NextResponse.json({
            success: true,
            _id: result.insertedId.toString(),
            poNumber,
        }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/purchases/orders') }, { status: 500 });
    }
}
