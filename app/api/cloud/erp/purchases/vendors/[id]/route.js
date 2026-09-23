import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeEmail, sanitizePhone, sanitizeBankDetails } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;
        const { id } = await context.params;
        const db = await getCloudDb();
        const vendor = await db.collection('tenant_clients').findOne({ _id: new ObjectId(id), tenantId: user.tenantId, roles: 'vendor' });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
        return NextResponse.json({ vendor: { ...vendor, _id: vendor._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/purchases/vendors/[id]') }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;
        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();
        const existing = await db.collection('tenant_clients').findOne({ _id: new ObjectId(id), tenantId: user.tenantId, roles: 'vendor' });
        if (!existing) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        if (body.name !== undefined) update.name = sanitizeStr(body.name, 200);
        if (body.company !== undefined) update.company = sanitizeStr(body.company, 200);
        if (body.email !== undefined) update.email = sanitizeEmail(body.email);
        if (body.phone !== undefined) update.phone = sanitizePhone(body.phone);
        if (body.address !== undefined) update.address = sanitizeStr(body.address, 500);
        if (body.gstin !== undefined) update.gstin = sanitizeStr(body.gstin, 15).toUpperCase();
        if (body.panNumber !== undefined) update.panNumber = sanitizeStr(body.panNumber, 10).toUpperCase();
        if (body.paymentTerms !== undefined) update.paymentTerms = sanitizeStr(body.paymentTerms, 200);
        if (body.notes !== undefined) update.notes = sanitizeStr(body.notes, 2000);
        if (body.bankDetails !== undefined) update.bankDetails = sanitizeBankDetails(body.bankDetails);

        await db.collection('tenant_clients').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, { $set: update });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/purchases/vendors/[id]') }, { status: 500 });
    }
}

/**
 * DELETE /api/cloud/erp/purchases/vendors/[id]
 * Removes the 'vendor' role only - this is a shared contact record, so if it's also a
 * customer it must survive. Only fully deletes the contact once it has no roles left.
 */
export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;
        const { id } = await context.params;
        const db = await getCloudDb();

        const existing = await db.collection('tenant_clients').findOne({ _id: new ObjectId(id), tenantId: user.tenantId, roles: 'vendor' });
        if (!existing) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });

        const remainingRoles = (existing.roles || []).filter(r => r !== 'vendor');
        if (remainingRoles.length === 0) {
            await db.collection('tenant_clients').deleteOne({ _id: existing._id });
        } else {
            await db.collection('tenant_clients').updateOne({ _id: existing._id }, { $set: { roles: remainingRoles, updatedAt: new Date() } });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/purchases/vendors/[id]') }, { status: 500 });
    }
}
