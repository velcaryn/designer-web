import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'items');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const item = await db.collection('tenant_products').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });

        return NextResponse.json({ item: { ...item, _id: item._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/items/[id]') }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'items');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const update = {};
        const unset = {};
        if (body.name !== undefined) update.name = String(body.name).trim().slice(0, 200);
        if (body.sku !== undefined) {
            const cleanSku = String(body.sku).trim().slice(0, 50);
            if (cleanSku) {
                update.sku = cleanSku;
            } else {
                unset.sku = "";
            }
        }
        if (body.hsnCode !== undefined) update.hsnCode = String(body.hsnCode).trim().slice(0, 20);
        if (body.unit !== undefined) update.unit = String(body.unit).trim().slice(0, 20);
        if (body.defaultUnitPrice !== undefined) update.defaultUnitPrice = parseFloat(body.defaultUnitPrice) || 0;
        if (body.taxRate !== undefined) update.taxRate = parseFloat(body.taxRate) || 0;
        if (body.costPrice !== undefined) update.costPrice = parseFloat(body.costPrice) || 0;
        if (body.stockCount !== undefined) update.stockCount = parseInt(body.stockCount) || 0;
        if (body.specifications !== undefined) update.specifications = body.specifications;
        update.updatedAt = new Date();

        const updateObj = { $set: update };
        if (Object.keys(unset).length > 0) {
            updateObj.$unset = unset;
        }

        const result = await db.collection('tenant_products').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            updateObj
        );

        if (result.matchedCount === 0) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/items/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'items');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const result = await db.collection('tenant_products').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });

        if (result.deletedCount === 0) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/items/[id]') }, { status: 500 });
    }
}
