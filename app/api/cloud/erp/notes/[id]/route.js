import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/cloud/erp/notes/[id]
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

        const existing = await db.collection('erp_notes').findOne({
            _id: new ObjectId(id),
            tenantId: user.tenantId,
        });
        if (!existing) return NextResponse.json({ error: 'Note not found.' }, { status: 404 });

        const updates = {
            updatedAt: new Date(),
            lastEditedByEmail: user.email,
        };

        if (body.title !== undefined) updates.title = sanitizeStr(body.title, 300) || existing.title;
        if (body.body !== undefined) updates.body = sanitizeStr(body.body, 50000);
        if (body.isPinned !== undefined) updates.isPinned = !!body.isPinned;

        await db.collection('erp_notes').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            { $set: updates }
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/notes/[id]') }, { status: 500 });
    }
}

/**
 * DELETE /api/cloud/erp/notes/[id]
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
        const result = await db.collection('erp_notes').deleteOne({
            _id: new ObjectId(id),
            tenantId: user.tenantId,
        });

        if (result.deletedCount === 0) return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/notes/[id]') }, { status: 500 });
    }
}
