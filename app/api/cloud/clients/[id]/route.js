import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { CONTACT_ROLES, sanitizeStr, sanitizeBankDetails } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'clients');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const client = await db.collection('tenant_clients').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });

        return NextResponse.json({ client: { ...client, _id: client._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/clients/[id]') }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'clients');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const update = {};
        if (body.name !== undefined) update.name = String(body.name).trim().slice(0, 200);
        if (body.contactPerson !== undefined) update.contactPerson = String(body.contactPerson).trim().slice(0, 100);
        if (body.phone !== undefined) update.phone = String(body.phone).trim().slice(0, 20);
        if (body.email !== undefined) update.email = String(body.email).trim().toLowerCase().slice(0, 200);
        if (body.address !== undefined) update.address = String(body.address).trim().slice(0, 500);
        if (body.gstin !== undefined) update.gstin = String(body.gstin).trim().toUpperCase().slice(0, 15);
        if (body.roles !== undefined) {
            const roles = Array.isArray(body.roles) ? body.roles.filter(r => CONTACT_ROLES.includes(r)) : [];
            update.roles = roles.length ? roles : ['customer'];
        }
        if (body.company !== undefined) update.company = sanitizeStr(body.company, 200);
        if (body.panNumber !== undefined) update.panNumber = sanitizeStr(body.panNumber, 10).toUpperCase();
        if (body.paymentTerms !== undefined) update.paymentTerms = sanitizeStr(body.paymentTerms, 200);
        if (body.notes !== undefined) update.notes = sanitizeStr(body.notes, 2000);
        if (body.bankDetails !== undefined) update.bankDetails = sanitizeBankDetails(body.bankDetails);
        update.updatedAt = new Date();

        const result = await db.collection('tenant_clients').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            { $set: update }
        );

        if (result.matchedCount === 0) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/clients/[id]') }, { status: 500 });
    }
}

/**
 * DELETE /api/cloud/clients/[id]
 * Removes the 'customer' role only - this is a shared contact record (see erpHelpers'
 * CONTACT_ROLES), so if it's also a vendor it must survive. Only fully deletes the
 * contact once it has no roles left, mirroring the ERP vendor DELETE route.
 */
export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'clients');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();

        const existing = await db.collection('tenant_clients').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });

        const remainingRoles = (existing.roles || []).filter(r => r !== 'customer');
        if (remainingRoles.length === 0) {
            await db.collection('tenant_clients').deleteOne({ _id: existing._id });
        } else {
            await db.collection('tenant_clients').updateOne({ _id: existing._id }, { $set: { roles: remainingRoles, updatedAt: new Date() } });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/clients/[id]') }, { status: 500 });
    }
}
