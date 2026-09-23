import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, paginationFromParams } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const VALID_TARGET_TYPES = ['client', 'lead', 'opportunity', 'document', 'order', 'vendor'];
const VALID_ACTIVITY_TYPES = [
    'note', 'email_sent', 'email_received', 'call', 'meeting',
    'stage_change', 'document_created', 'order_placed', 'status_change',
    'payment_received', 'task_completed', 'system',
];

/**
 * GET /api/cloud/erp/timeline
 * Returns activity timeline entries for a specific record (targetType + targetId)
 * or all activities for the tenant.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const clientName = searchParams.get('clientName');
        const activityType = searchParams.get('type');
        const { skip, limit, page } = paginationFromParams(searchParams);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };

        if (clientName) filter.clientName = clientName;
        if (activityType && VALID_ACTIVITY_TYPES.includes(activityType)) filter.type = activityType;

        const [entries, total] = await Promise.all([
            db.collection('activity_timeline')
                .find(filter)
                .sort({ occurredAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('activity_timeline').countDocuments(filter),
        ]);

        return NextResponse.json({
            entries: entries.map(e => ({ ...e, _id: e._id.toString() })),
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/timeline') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/timeline
 * Creates a manual timeline entry (note, call, meeting).
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const body = await req.json();
        const clientName = sanitizeStr(body.clientName, 200);
        const type = sanitizeStr(body.type, 30);
        const title = sanitizeStr(body.title, 300);
        const actBody = sanitizeStr(body.body, 10000);

        if (!clientName) return NextResponse.json({ error: 'Client Name is required.' }, { status: 400 });
        if (!type || !VALID_ACTIVITY_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Invalid activity type.' }, { status: 400 });
        }
        if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });

        const db = await getCloudDb();
        const now = new Date();

        const entry = {
            tenantId: user.tenantId,
            clientName,
            type,
            title,
            body: actBody || '',
            metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
            actorEmail: user.email,
            actorName: user.businessName || user.email,
            occurredAt: body.occurredAt ? new Date(body.occurredAt) : now,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('activity_timeline').insertOne(entry);

        return NextResponse.json({
            success: true,
            _id: result.insertedId.toString(),
        }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/timeline') }, { status: 500 });
    }
}
