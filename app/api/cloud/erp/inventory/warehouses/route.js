import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'inventory');
        if (denied) return denied;

        const db = await getCloudDb();
        const warehouses = await db.collection('erp_warehouses')
            .find({ tenantId: user.tenantId })
            .sort({ isDefault: -1, createdAt: 1 })
            .toArray();

        return NextResponse.json({ warehouses: warehouses.map(w => ({ ...w, _id: w._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/inventory/warehouses') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'inventory');
        if (denied) return denied;

        const body = await req.json();
        const name = sanitizeStr(body.name, 200);
        if (!name) return NextResponse.json({ error: 'Warehouse name is required.' }, { status: 400 });

        const db = await getCloudDb();
        const isDefault = !!body.isDefault;

        if (isDefault) {
            await db.collection('erp_warehouses').updateMany({ tenantId: user.tenantId }, { $set: { isDefault: false } });
        }

        const existingCount = await db.collection('erp_warehouses').countDocuments({ tenantId: user.tenantId });

        const doc = {
            tenantId: user.tenantId,
            name,
            address: sanitizeStr(body.address, 500),
            isDefault: isDefault || existingCount === 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_warehouses').insertOne(doc);
        return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/inventory/warehouses') }, { status: 500 });
    }
}
