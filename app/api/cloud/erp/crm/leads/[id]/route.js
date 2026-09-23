import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum, sanitizeEmail, sanitizePhone } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/crm/leads/[id]
 */
export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const lead = await db.collection('erp_leads').findOne({
            _id: new ObjectId(id),
            tenantId: user.tenantId,
        });
        if (!lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

        return NextResponse.json({ lead: { ...lead, _id: lead._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/crm/leads/[id]') }, { status: 500 });
    }
}

/**
 * PUT /api/cloud/erp/crm/leads/[id]
 * Updates lead fields and/or transitions stage with audit trail.
 */
export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_leads').findOne({
            _id: new ObjectId(id),
            tenantId: user.tenantId,
        });
        if (!existing) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        const activityPush = [];

        // Field updates
        if (body.name !== undefined) update.name = sanitizeStr(body.name, 200);
        if (body.company !== undefined) update.company = sanitizeStr(body.company, 200);
        if (body.email !== undefined) update.email = sanitizeEmail(body.email);
        if (body.phone !== undefined) update.phone = sanitizePhone(body.phone);
        if (body.expectedRevenue !== undefined) update.expectedRevenue = sanitizeNum(body.expectedRevenue);
        if (body.probability !== undefined) update.probability = sanitizeNum(body.probability);
        if (body.expectedCloseDate !== undefined) update.expectedCloseDate = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null;
        if (body.source !== undefined) update.source = sanitizeStr(body.source, 100);
        if (body.assignee !== undefined) update.assignee = sanitizeStr(body.assignee, 200);
        if (body.notes !== undefined) update.notes = sanitizeStr(body.notes, 5000);
        if (body.tags !== undefined) update.tags = Array.isArray(body.tags) ? body.tags.slice(0, 10).map(t => sanitizeStr(t, 50)) : [];
        if (body.followUpDate !== undefined) update.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;

        // Stage moves are a free-form Kanban, not a rigid sequential workflow (unlike
        // purchase orders/expenses) - the tenant configures their own stages via
        // Configure in the CRM UI, so any stage can move to any other stage.
        if (body.stage !== undefined && body.stage !== existing.stage) {
            update.stage = body.stage;
            activityPush.push({
                type: 'stage_change',
                message: `Stage changed: ${existing.stage} → ${body.stage}`,
                at: new Date(),
                by: user.email,
            });
        }

        // Add manual note activity
        if (body.activityNote) {
            activityPush.push({
                type: 'note',
                message: sanitizeStr(body.activityNote, 2000),
                at: new Date(),
                by: user.email,
            });
        }

        const ops = { $set: update };
        if (activityPush.length > 0) {
            ops.$push = { activities: { $each: activityPush } };
        }

        await db.collection('erp_leads').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            ops,
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/crm/leads/[id]') }, { status: 500 });
    }
}

/**
 * DELETE /api/cloud/erp/crm/leads/[id]
 */
export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const result = await db.collection('erp_leads').deleteOne({
            _id: new ObjectId(id),
            tenantId: user.tenantId,
        });

        if (result.deletedCount === 0) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/crm/leads/[id]') }, { status: 500 });
    }
}
