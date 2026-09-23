import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'inventory');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_warehouses').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Warehouse not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        if (body.name !== undefined) {
            const name = sanitizeStr(body.name, 200);
            if (!name) return NextResponse.json({ error: 'Warehouse name is required.' }, { status: 400 });
            update.name = name;
        }
        if (body.address !== undefined) update.address = sanitizeStr(body.address, 500);
        if (body.isDefault !== undefined) {
            update.isDefault = !!body.isDefault;
            if (update.isDefault) {
                await db.collection('erp_warehouses').updateMany(
                    { tenantId: user.tenantId, _id: { $ne: new ObjectId(id) } },
                    { $set: { isDefault: false } }
                );
            } else if (existing.isDefault) {
                // Unchecking the current default must not leave the tenant with zero
                // default warehouses - promote the next-oldest one automatically.
                const next = await db.collection('erp_warehouses').findOne(
                    { tenantId: user.tenantId, _id: { $ne: new ObjectId(id) } },
                    { sort: { createdAt: 1 } }
                );
                if (next) {
                    await db.collection('erp_warehouses').updateOne({ _id: next._id }, { $set: { isDefault: true } });
                } else {
                    // This is the only warehouse - it must stay the default.
                    update.isDefault = true;
                }
            }
        }

        await db.collection('erp_warehouses').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, { $set: update });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/inventory/warehouses/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'inventory');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();

        const hasMoves = await db.collection('erp_stock_moves').countDocuments({ tenantId: user.tenantId, warehouseId: id });
        if (hasMoves > 0) {
            return NextResponse.json({ error: 'Cannot delete a warehouse that has recorded stock moves.' }, { status: 400 });
        }

        const result = await db.collection('erp_warehouses').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Warehouse not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/inventory/warehouses/[id]') }, { status: 500 });
    }
}
