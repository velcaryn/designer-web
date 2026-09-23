import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'config');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_tax_profiles').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Tax profile not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        if (body.name !== undefined) update.name = sanitizeStr(body.name, 100);
        if (body.isExempt !== undefined) update.isExempt = !!body.isExempt;
        const effectiveExempt = update.isExempt !== undefined ? update.isExempt : existing.isExempt;
        if (body.rate !== undefined) update.rate = effectiveExempt ? 0 : sanitizeNum(body.rate);
        if (body.hsnCodes !== undefined) {
            update.hsnCodes = Array.isArray(body.hsnCodes) ? body.hsnCodes.slice(0, 50).map(h => sanitizeStr(h, 20)).filter(Boolean) : [];
        }

        await db.collection('erp_tax_profiles').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, { $set: update });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/config/tax-profiles/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'config');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const result = await db.collection('erp_tax_profiles').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Tax profile not found.' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/config/tax-profiles/[id]') }, { status: 500 });
    }
}
