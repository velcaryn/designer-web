import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeTemplateConfig, VALID_APPLIES_TO } from '@/lib/cloudTemplates';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'templates');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const template = await db.collection('tenant_templates').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!template) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });

        return NextResponse.json({ template: { ...template, _id: template._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/templates/[id]') }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'templates');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('tenant_templates').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        if (body.name !== undefined) {
            if (!String(body.name).trim()) return NextResponse.json({ error: 'Template name is required.' }, { status: 400 });
            update.name = String(body.name).trim().slice(0, 120);
        }
        if (body.appliesTo !== undefined) {
            update.appliesTo = VALID_APPLIES_TO.includes(body.appliesTo) ? body.appliesTo : 'both';
        }
        if (body.config !== undefined) {
            update.config = sanitizeTemplateConfig(body.config);
        }
        if (body.isDefault !== undefined) {
            update.isDefault = !!body.isDefault;
            if (update.isDefault) {
                await db.collection('tenant_templates').updateMany(
                    { tenantId: user.tenantId, _id: { $ne: new ObjectId(id) } },
                    { $set: { isDefault: false } }
                );
            }
        }

        await db.collection('tenant_templates').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            { $set: update, $inc: { version: 1 } }
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/templates/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'templates');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const result = await db.collection('tenant_templates').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });

        if (result.deletedCount === 0) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/templates/[id]') }, { status: 500 });
    }
}
