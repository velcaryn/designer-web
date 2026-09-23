import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const MANUAL_TYPES = ['reminder', 'meeting', 'other'];

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'calendar');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_calendar_events').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

        const update = {};
        if (body.title !== undefined) {
            const title = sanitizeStr(body.title, 200);
            if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
            update.title = title;
        }
        if (body.date !== undefined) update.date = new Date(body.date);
        if (body.eventType !== undefined) update.eventType = MANUAL_TYPES.includes(body.eventType) ? body.eventType : 'reminder';
        if (body.notes !== undefined) update.notes = sanitizeStr(body.notes, 1000);

        await db.collection('erp_calendar_events').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, { $set: update });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/calendar/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'calendar');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();

        const result = await db.collection('erp_calendar_events').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/calendar/[id]') }, { status: 500 });
    }
}
