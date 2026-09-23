import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum, validateStatusTransition, generateErpNumber } from '@/lib/erpHelpers';
import { permissionDenied, approvalBlocked } from '@/lib/permissions';
import { postPurchaseVoucher } from '@/lib/cloud/accounting/voucherEngine';
import { postToLedger } from '@/lib/cloud/accounting/postingBridge';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;
        const { id } = await context.params;
        const db = await getCloudDb();
        const order = await db.collection('erp_purchase_orders').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!order) return NextResponse.json({ error: 'Purchase Order not found.' }, { status: 404 });
        return NextResponse.json({ order: { ...order, _id: order._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/purchases/orders/[id]') }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;
        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_purchase_orders').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Purchase Order not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        const historyPush = [];

        // Status transition
        if (body.status !== undefined && body.status !== existing.status) {
            const transition = validateStatusTransition('purchaseOrder', existing.status, body.status);
            if (!transition.valid) return NextResponse.json({ error: transition.error }, { status: 400 });

            if (body.status === 'confirmed') {
                const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
                const blocked = approvalBlocked(user, tenant, 'po', existing.grandTotal);
                if (blocked) return blocked;
            }

            update.status = body.status;
            historyPush.push({
                action: 'status_change',
                message: `Status: ${existing.status} → ${body.status}`,
                at: new Date(),
                by: user.email,
            });

            // PO → Inventory auto-link: receiving a PO auto-generates a stock-in move
            // per line item, matched against the catalog by product name (PO line items
            // are free text, with no itemId reference) - lines that don't match an
            // existing catalog item are simply skipped, noted in the history entry.
            if (body.status === 'received') {
                const warehouseId = sanitizeStr(body.warehouseId, 100);
                if (!warehouseId || !ObjectId.isValid(warehouseId)) {
                    return NextResponse.json({ error: 'A warehouse must be selected to receive stock.' }, { status: 400 });
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
                        type: 'in',
                        qty: Math.abs(line.qty),
                        reference: existing.poNumber,
                        notes: `Auto-received from PO ${existing.poNumber}`,
                        by: user.email,
                        createdAt: new Date(),
                    });
                }
                if (moves.length) await db.collection('erp_stock_moves').insertMany(moves);

                /*
                 * POST THE PURCHASE VOUCHER.
                 *
                 * `received` is the right hook, not `confirmed`: an order that
                 * is merely agreed creates no liability, whereas goods arriving
                 * do. Dr Purchases + Input GST, Cr the vendor.
                 *
                 * Purchases could not post at all before this, and not for want
                 * of trying - there was no vendor-to-creditor sync, so the credit
                 * side of the entry had nowhere to go. syncVendorToCreditor is
                 * the missing mirror of syncClientToDebtor.
                 */
                const vendorDoc = await db.collection('erp_vendors').findOne({
                    tenantId: user.tenantId,
                    _id: ObjectId.isValid(existing.vendorId) ? new ObjectId(existing.vendorId) : null,
                }).catch(() => null);

                await postToLedger(db, {
                    tenantId: user.tenantId,
                    collection: 'erp_purchase_orders',
                    documentId: existing._id,
                    label: 'purchase order',
                }, () => postPurchaseVoucher(
                    db,
                    user.tenantId,
                    { ...existing, receivedAt: new Date() },
                    vendorDoc || { name: existing.vendorName, _id: existing.vendorId },
                    user.username || user.email || user.sub
                ));

                historyPush.push({
                    action: 'stock_received',
                    message: moves.length
                        ? `Stocked ${moves.length} line item(s) into ${warehouse.name}${unmatched.length ? ` (${unmatched.length} unmatched: ${unmatched.join(', ')})` : ''}`
                        : `No catalog matches found - nothing auto-stocked${unmatched.length ? ` (${unmatched.join(', ')})` : ''}`,
                    at: new Date(),
                    by: user.email,
                });
            }
        }

        // Field updates (only allowed on draft orders)
        if (existing.status === 'draft' || body.status === 'draft') {
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
            if (body.expectedDate !== undefined) update.expectedDate = body.expectedDate ? new Date(body.expectedDate) : null;
            if (body.shippingAddress !== undefined) update.shippingAddress = sanitizeStr(body.shippingAddress, 500);
        }

        const ops = { $set: update };
        if (historyPush.length > 0) ops.$push = { history: { $each: historyPush } };

        await db.collection('erp_purchase_orders').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, ops);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/purchases/orders/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;
        const { id } = await context.params;
        const db = await getCloudDb();

        const existing = await db.collection('erp_purchase_orders').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Purchase Order not found.' }, { status: 404 });
        if (existing.status !== 'draft' && existing.status !== 'cancelled') {
            return NextResponse.json({ error: 'Only draft or cancelled POs can be deleted.' }, { status: 400 });
        }

        await db.collection('erp_purchase_orders').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/purchases/orders/[id]') }, { status: 500 });
    }
}
