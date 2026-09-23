import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { DEFAULT_CRM_STAGES, sanitizeStr } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/crm/pipeline
 * Returns the tenant's CRM pipeline stages, seeding defaults if none exist.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const db = await getCloudDb();
        let doc = await db.collection('erp_pipeline_stages').findOne({ tenantId: user.tenantId });

        if (!doc) {
            doc = {
                tenantId: user.tenantId,
                stages: DEFAULT_CRM_STAGES,
                createdAt: new Date(),
            };
            await db.collection('erp_pipeline_stages').insertOne(doc);
        }

        return NextResponse.json({ stages: doc.stages });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/crm/pipeline') }, { status: 500 });
    }
}

/**
 * PUT /api/cloud/erp/crm/pipeline
 * Updates the tenant's pipeline stage names, order, and colors.
 */
export async function PUT(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const body = await req.json();
        if (!Array.isArray(body.stages) || body.stages.length < 2) {
            return NextResponse.json({ error: 'At least 2 pipeline stages are required.' }, { status: 400 });
        }

        const stages = body.stages.slice(0, 20).map((s, i) => ({
            id: sanitizeStr(s.id || `stage_${i}`, 60),
            name: sanitizeStr(s.name, 60) || `Stage ${i + 1}`,
            order: i,
            color: sanitizeStr(s.color, 7) || '#6b7280',
        }));

        const db = await getCloudDb();
        await db.collection('erp_pipeline_stages').updateOne(
            { tenantId: user.tenantId },
            { $set: { stages, updatedAt: new Date() } },
            { upsert: true },
        );

        return NextResponse.json({ success: true, stages });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/crm/pipeline') }, { status: 500 });
    }
}
