import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { validateStatusTransition } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_leave_requests').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Leave request not found.' }, { status: 404 });

        if (body.status === undefined || body.status === existing.status) {
            return NextResponse.json({ error: 'No status change provided.' }, { status: 400 });
        }

        const check = validateStatusTransition('leaveRequest', existing.status, body.status);
        if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });

        await db.collection('erp_leave_requests').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            { $set: { status: body.status, updatedAt: new Date() } }
        );
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/hr/leaves/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const existing = await db.collection('erp_leave_requests').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Leave request not found.' }, { status: 404 });
        if (existing.status !== 'pending') {
            return NextResponse.json({ error: 'Only pending leave requests can be deleted.' }, { status: 400 });
        }

        await db.collection('erp_leave_requests').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/hr/leaves/[id]') }, { status: 500 });
    }
}
