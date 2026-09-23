import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { CONTACT_ROLES, sanitizeStr, sanitizeBankDetails } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'clients');
        if (denied) return denied;

        const db = await getCloudDb();
        const clients = await db.collection('tenant_clients')
            .find({ tenantId: user.tenantId })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ clients: clients.map(c => ({ ...c, _id: c._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/clients') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'clients');
        if (denied) return denied;

        const body = await req.json();
        const { name, contactPerson, phone, email, address, gstin } = body;

        if (!name) return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });

        const db = await getCloudDb();

        // roles marks whether this contact is a customer, a vendor, or both - the same
        // tenant_clients record is shared by the Clients (Sales) and Vendors (Purchases) UIs.
        const roles = Array.isArray(body.roles)
            ? body.roles.filter(r => CONTACT_ROLES.includes(r))
            : [];
        if (!roles.length) roles.push('customer');

        const doc = {
            tenantId: user.tenantId,
            name: String(name).trim().slice(0, 200),
            contactPerson: String(contactPerson || '').trim().slice(0, 100),
            phone: String(phone || '').trim().slice(0, 20),
            email: String(email || '').trim().toLowerCase().slice(0, 200),
            address: String(address || '').trim().slice(0, 500),
            gstin: String(gstin || '').trim().toUpperCase().slice(0, 15),
            roles,
            company: sanitizeStr(body.company, 200),
            panNumber: sanitizeStr(body.panNumber, 10).toUpperCase(),
            paymentTerms: sanitizeStr(body.paymentTerms, 200),
            notes: sanitizeStr(body.notes, 2000),
            bankDetails: sanitizeBankDetails(body.bankDetails),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('tenant_clients').insertOne(doc);
        return NextResponse.json({ success: true, _id: result.insertedId.toString() });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/clients') }, { status: 500 });
    }
}
