import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import {
    generateErpNumber, sanitizeStr, sanitizeNum, sanitizeEmail, sanitizePhone,
    DEFAULT_CRM_STAGES, paginationFromParams, escapeRegex } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/crm/leads
 * Lists leads for the authenticated tenant, filterable by stage.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const stage = searchParams.get('stage');
        const search = searchParams.get('q');
        const { skip, limit, page } = paginationFromParams(searchParams);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (stage) filter.stage = stage;
        if (search) {
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { company: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const [leads, total] = await Promise.all([
            db.collection('erp_leads')
                .find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('erp_leads').countDocuments(filter),
        ]);

        return NextResponse.json({
            leads: leads.map(l => ({ ...l, _id: l._id.toString() })),
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/crm/leads') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/crm/leads
 * Creates a new CRM lead for the authenticated tenant.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const body = await req.json();
        const name = sanitizeStr(body.name, 200);
        if (!name) return NextResponse.json({ error: 'Lead name is required.' }, { status: 400 });

        const db = await getCloudDb();

        // Ensure tenant has pipeline stages
        const existingStages = await db.collection('erp_pipeline_stages').findOne({ tenantId: user.tenantId });
        if (!existingStages) {
            await db.collection('erp_pipeline_stages').insertOne({
                tenantId: user.tenantId,
                stages: DEFAULT_CRM_STAGES,
                createdAt: new Date(),
            });
        }

        const leadNumber = await generateErpNumber(user.tenantId, 'lead');

        const lead = {
            tenantId: user.tenantId,
            leadNumber,
            name,
            company: sanitizeStr(body.company, 200),
            email: sanitizeEmail(body.email),
            phone: sanitizePhone(body.phone),
            stage: 'new',
            expectedRevenue: sanitizeNum(body.expectedRevenue),
            probability: sanitizeNum(body.probability) || 0,
            expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
            source: sanitizeStr(body.source, 100),
            assignee: sanitizeStr(body.assignee, 200),
            notes: sanitizeStr(body.notes, 5000),
            tags: Array.isArray(body.tags) ? body.tags.slice(0, 10).map(t => sanitizeStr(t, 50)) : [],
            followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
            activities: [{
                type: 'created',
                message: `Lead created by ${user.businessName || user.email}`,
                at: new Date(),
                by: user.email,
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_leads').insertOne(lead);

        return NextResponse.json({
            success: true,
            _id: result.insertedId.toString(),
            leadNumber,
        }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/crm/leads') }, { status: 500 });
    }
}
