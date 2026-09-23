import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum, validateStatusTransition, generateErpNumber } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const order = await db.collection('erp_sales_orders').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!order) return NextResponse.json({ error: 'Sales Order not found.' }, { status: 404 });
        return NextResponse.json({ order: { ...order, _id: order._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/sales/orders/[id]') }, { status: 500 });
    }
}

/**
 * PUT /api/cloud/erp/sales/orders/[id]
 * Handles field edits (draft only) and the status workflow:
 *   confirmed → fulfilled: auto-deducts stock (matched by product name against the
 *     Items catalog, same approach as Phase 7a's PO-receive auto-link, mirrored in reverse).
 *   fulfilled → invoiced: generates the real Invoice document from the SO's line items -
 *     this is the "Sales Order → Invoice" half of the Quote → SO → Invoice chain.
 */
export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_sales_orders').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Sales Order not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        const historyPush = [];

        // Expected/delivery date is editable regardless of status (draft or
        // confirmed) - it's what drives the Calendar's sales_order event source.
        if (body.expectedDate !== undefined) {
            update.expectedDate = body.expectedDate ? new Date(body.expectedDate) : null;
        }

        if (body.status !== undefined && body.status !== existing.status) {
            const transition = validateStatusTransition('salesOrder', existing.status, body.status);
            if (!transition.valid) return NextResponse.json({ error: transition.error }, { status: 400 });
            update.status = body.status;
            historyPush.push({ action: 'status_change', message: `Status: ${existing.status} → ${body.status}`, at: new Date(), by: user.email });

            if (body.status === 'fulfilled') {
                const warehouseId = sanitizeStr(body.warehouseId, 100);
                if (!warehouseId || !ObjectId.isValid(warehouseId)) {
                    return NextResponse.json({ error: 'A warehouse must be selected to fulfill from.' }, { status: 400 });
                }
                const warehouse = await db.collection('erp_warehouses').findOne({ tenantId: user.tenantId, _id: new ObjectId(warehouseId) });
                if (!warehouse) return NextResponse.json({ error: 'Warehouse not found.' }, { status: 404 });

                const catalog = await db.collection('tenant_products').find({ tenantId: user.tenantId }).toArray();
                const byName = new Map(catalog.map(p => [p.name.trim().toLowerCase(), p]));

                const moves = [];
                const unmatched = [];
                for (const line of existing.lineItems || []) {
                    const item = byName.get(String(line.product || '').trim().toLowerCase());
                    if (!item || !line.qty) { if (line.product) unmatched.push(line.product); continue; }
                    moves.push({
                        tenantId: user.tenantId,
                        moveNumber: await generateErpNumber(user.tenantId, 'stockMove'),
                        itemId: item.itemId,
                        warehouseId,
                        type: 'out',
                        qty: Math.abs(line.qty),
                        reference: existing.soNumber,
                        notes: `Auto-fulfilled from Sales Order ${existing.soNumber}`,
                        by: user.email,
                        createdAt: new Date(),
                    });
                }
                if (moves.length) await db.collection('erp_stock_moves').insertMany(moves);

                historyPush.push({
                    action: 'stock_fulfilled',
                    message: moves.length
                        ? `Deducted stock for ${moves.length} line item(s) from ${warehouse.name}${unmatched.length ? ` (${unmatched.length} unmatched: ${unmatched.join(', ')})` : ''}`
                        : `No catalog matches found - nothing auto-deducted${unmatched.length ? ` (${unmatched.join(', ')})` : ''}`,
                    at: new Date(),
                    by: user.email,
                });
            }

            if (body.status === 'invoiced') {
                const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
                const prefix = tenant?.branding?.docPrefix || user.tenantId.split('-')[1] || 'DOC';
                const year = new Date().getFullYear();

                const lastDoc = await db.collection('tenant_documents')
                    .find({ tenantId: user.tenantId, docNumber: { $regex: `^${prefix}-${year}-INV-` } })
                    .sort({ docNumber: -1 }).limit(1).toArray();
                let seq = 1;
                if (lastDoc.length > 0) {
                    const lastSeq = parseInt(lastDoc[0].docNumber.split('-').pop(), 10);
                    if (!isNaN(lastSeq)) seq = lastSeq + 1;
                }
                const docNumber = `${prefix}-${year}-INV-${String(seq).padStart(4, '0')}`;
                const secretKey = crypto.randomBytes(10).toString('hex');

                const invoiceDoc = {
                    tenantId: user.tenantId,
                    businessName: tenant?.businessName,
                    brandColor: tenant?.branding?.customHexColor || '#4A1088',
                    docType: 'Invoice',
                    docNumber,
                    secretKey,
                    status: 'sent',
                    dueDate: null,
                    hideDocumentDetails: false,
                    templateId: null,
                    templateConfig: null,
                    customer: existing.customer,
                    shippingAddress: { sameAsBilling: true, name: '', address: '', gstin: '' },
                    version: 'v1',
                    lineItems: existing.lineItems,
                    orderReferences: { buyersOrderNo: existing.soNumber },
                    termsList: [],
                    currency: existing.currency,
                    validity: '',
                    subtotal: existing.subtotal,
                    taxRate: 0,
                    taxAmount: existing.taxAmount,
                    taxType: 'Tax',
                    discountRate: 0,
                    discountAmount: 0,
                    grandTotal: existing.grandTotal,
                    notes: existing.notes,
                    fullTC: '',
                    sellerCustomFields: [],
                    customerCustomFields: [],
                    brandLogo: tenant?.branding?.brandLogo || '',
                    letterheadPage1: tenant?.branding?.letterheadPage1 || '',
                    letterheadPage2: tenant?.branding?.letterheadPage2 || '',
                    useUploadedLetterhead: tenant?.branding?.useUploadedLetterhead || false,
                    sellerInfo: {
                        name: tenant?.businessName,
                        address: tenant?.contact?.address ? `${tenant.contact.address.line1}, ${tenant.contact.address.city}, ${tenant.contact.address.state} - ${tenant.contact.address.pin}` : '',
                        phone: tenant?.contact?.phone || '',
                        email: tenant?.contact?.email || '',
                        gstin: tenant?.contact?.gstin || '',
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const invResult = await db.collection('tenant_documents').insertOne(invoiceDoc);
                update.invoiceDocumentId = invResult.insertedId.toString();
                update.invoiceDocNumber = docNumber;

                historyPush.push({ action: 'invoiced', message: `Invoice ${docNumber} generated`, at: new Date(), by: user.email });
            }
        }

        if (existing.status === 'draft' && (body.status === undefined || body.status === 'draft')) {
            if (body.lineItems !== undefined) {
                update.lineItems = (body.lineItems || []).slice(0, 50).map(item => ({
                    product: sanitizeStr(item.product, 200),
                    description: sanitizeStr(item.description, 500),
                    hsnCode: sanitizeStr(item.hsnCode, 20),
                    qty: sanitizeNum(item.qty, 1),
                    unit: sanitizeStr(item.unit || 'Nos', 20),
                    unitPrice: sanitizeNum(item.unitPrice),
                    taxRate: sanitizeNum(item.taxRate),
                    totalPrice: sanitizeNum(item.qty, 1) * sanitizeNum(item.unitPrice),
                }));
                update.subtotal = update.lineItems.reduce((s, i) => s + i.totalPrice, 0);
                update.taxAmount = update.lineItems.reduce((s, i) => s + (i.totalPrice * i.taxRate / 100), 0);
                update.grandTotal = update.subtotal + update.taxAmount;
            }
            if (body.notes !== undefined) update.notes = sanitizeStr(body.notes, 2000);
        }

        const ops = { $set: update };
        if (historyPush.length) ops.$push = { history: { $each: historyPush } };

        await db.collection('erp_sales_orders').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, ops);
        return NextResponse.json({ success: true, invoiceDocNumber: update.invoiceDocNumber || existing.invoiceDocNumber });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/sales/orders/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();

        const existing = await db.collection('erp_sales_orders').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Sales Order not found.' }, { status: 404 });
        if (existing.status !== 'draft' && existing.status !== 'cancelled') {
            return NextResponse.json({ error: 'Only draft or cancelled Sales Orders can be deleted.' }, { status: 400 });
        }

        await db.collection('erp_sales_orders').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/sales/orders/[id]') }, { status: 500 });
    }
}
