import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const db = await getCloudDb();
        const departments = await db.collection('erp_departments')
            .find({ tenantId: user.tenantId })
            .sort({ name: 1 })
            .toArray();

        return NextResponse.json({ departments: departments.map(d => ({ ...d, _id: d._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/hr/departments') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const body = await req.json();
        const name = sanitizeStr(body.name, 100);
        if (!name) return NextResponse.json({ error: 'Department name is required.' }, { status: 400 });

        const db = await getCloudDb();
        const doc = {
            tenantId: user.tenantId,
            name,
            managerName: sanitizeStr(body.managerName, 200),
            createdAt: new Date(),
        };
        const result = await db.collection('erp_departments').insertOne(doc);
        return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/hr/departments') }, { status: 500 });
    }
}
