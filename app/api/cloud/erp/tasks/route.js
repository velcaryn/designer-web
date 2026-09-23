import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, paginationFromParams, escapeRegex } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_LINK_TYPES = ['client', 'lead', 'opportunity', 'document', 'order', 'vendor'];

/**
 * GET /api/cloud/erp/tasks
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const assignee = searchParams.get('assignee');
        const linkedType = searchParams.get('linkedType');
        const linkedId = searchParams.get('linkedId');
        const search = searchParams.get('q');
        const { skip, limit, page } = paginationFromParams(searchParams);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };

        if (status && VALID_STATUSES.includes(status)) filter.status = status;
        if (priority && VALID_PRIORITIES.includes(priority)) filter.priority = priority;
        if (assignee === 'me') filter.assigneeEmail = user.email;
        else if (assignee) filter.assigneeEmail = assignee;
        if (linkedType && VALID_LINK_TYPES.includes(linkedType)) filter.linkedType = linkedType;
        if (linkedId) filter.linkedId = linkedId;
        if (search) {
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { taskNumber: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const [tasks, total] = await Promise.all([
            db.collection('erp_tasks')
                .find(filter)
                .sort({ dueDate: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('erp_tasks').countDocuments(filter),
        ]);

        return NextResponse.json({
            tasks: tasks.map(t => ({ ...t, _id: t._id.toString() })),
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/tasks') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/tasks
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const body = await req.json();
        const title = sanitizeStr(body.title, 300);
        if (!title) return NextResponse.json({ error: 'Task title is required.' }, { status: 400 });

        const db = await getCloudDb();
        const taskNumber = await generateErpNumber(user.tenantId, 'task');
        const now = new Date();

        const task = {
            tenantId: user.tenantId,
            taskNumber,
            title,
            description: sanitizeStr(body.description, 5000) || '',
            status: VALID_STATUSES.includes(body.status) ? body.status : 'todo',
            priority: VALID_PRIORITIES.includes(body.priority) ? body.priority : 'medium',
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            completedAt: null,
            linkedType: (body.linkedType && VALID_LINK_TYPES.includes(body.linkedType)) ? body.linkedType : null,
            linkedId: sanitizeStr(body.linkedId, 50) || null,
            linkedLabel: sanitizeStr(body.linkedLabel, 200) || null,
            assigneeEmail: sanitizeStr(body.assigneeEmail, 200) || user.email,
            assigneeName: sanitizeStr(body.assigneeName, 200) || user.businessName || user.email,
            createdByEmail: user.email,
            createdByName: user.businessName || user.email,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('erp_tasks').insertOne(task);

        return NextResponse.json({
            success: true,
            _id: result.insertedId.toString(),
            taskNumber,
        }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/tasks') }, { status: 500 });
    }
}
