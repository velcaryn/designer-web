import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { DEFAULT_V2_CONFIG } from '@/lib/templateEngine';
import { sanitizeTemplateConfig, VALID_APPLIES_TO } from '@/lib/cloudTemplates';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'templates');
        if (denied) return denied;

        const db = await getCloudDb();
        const templates = await db.collection('tenant_templates')
            .find({ tenantId: user.tenantId })
            .sort({ isDefault: -1, updatedAt: -1 })
            .toArray();

        return NextResponse.json({
            templates: templates.map(t => ({ ...t, _id: t._id.toString() })),
            platformDefault: { name: 'VelBiz Default', config: DEFAULT_V2_CONFIG },
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/templates') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'templates');
        if (denied) return denied;

        const body = await req.json();
        const { name } = body;
        if (!name || !String(name).trim()) {
            return NextResponse.json({ error: 'Template name is required.' }, { status: 400 });
        }

        const db = await getCloudDb();
        const appliesTo = VALID_APPLIES_TO.includes(body.appliesTo) ? body.appliesTo : 'both';
        const isDefault = !!body.isDefault;

        if (isDefault) {
            await db.collection('tenant_templates').updateMany(
                { tenantId: user.tenantId },
                { $set: { isDefault: false } }
            );
        }

        const doc = {
            tenantId: user.tenantId,
            name: String(name).trim().slice(0, 120),
            appliesTo,
            isDefault,
            config: sanitizeTemplateConfig(body.config),
            source: 'tenant',
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('tenant_templates').insertOne(doc);
        return NextResponse.json({ success: true, _id: result.insertedId.toString() });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/templates') }, { status: 500 });
    }
}
