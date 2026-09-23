import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * PUT /api/cloud/erp/tasks/[id]
 */
export async function PUT(req, { params }) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { id } = await params;
        if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 });

        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_tasks').findOne({
            _id: new ObjectId(id),
            tenantId: user.tenantId,
        });
        if (!existing) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });

        const updates = { updatedAt: new Date() };

        if (body.title !== undefined) updates.title = sanitizeStr(body.title, 300) || existing.title;
        if (body.description !== undefined) updates.description = sanitizeStr(body.description, 5000);
        if (body.status && VALID_STATUSES.includes(body.status)) {
            updates.status = body.status;
            if (body.status === 'done') updates.completedAt = new Date();
            else if (existing.status === 'done') updates.completedAt = null;
        }
        if (body.priority && VALID_PRIORITIES.includes(body.priority)) updates.priority = body.priority;
        if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        if (body.assigneeEmail !== undefined) updates.assigneeEmail = sanitizeStr(body.assigneeEmail, 200);
        if (body.assigneeName !== undefined) updates.assigneeName = sanitizeStr(body.assigneeName, 200);

        await db.collection('erp_tasks').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            { $set: updates }
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/tasks/[id]') }, { status: 500 });
    }
}

/**
 * DELETE /api/cloud/erp/tasks/[id]
 */
export async function DELETE(req, { params }) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { id } = await params;
        if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 });

        const db = await getCloudDb();
        const result = await db.collection('erp_tasks').deleteOne({
            _id: new ObjectId(id),
            tenantId: user.tenantId,
        });

        if (result.deletedCount === 0) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/tasks/[id]') }, { status: 500 });
    }
}
