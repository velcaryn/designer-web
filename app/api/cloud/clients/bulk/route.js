import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'clients');
        if (denied) return denied;

        const body = await req.json();
        const { clients } = body;

        if (!Array.isArray(clients) || clients.length === 0) {
            return NextResponse.json({ error: 'Invalid payload. Clients array required.' }, { status: 400 });
        }

        const db = await getCloudDb();
        const docs = [];

        for (const item of clients) {
            if (!item.name || !item.name.trim()) continue; // skip invalid rows

            const doc = {
                tenantId: user.tenantId,
                name: String(item.name).trim().slice(0, 200),
                contactPerson: String(item.contactPerson || item.contact || '').trim().slice(0, 100),
                phone: String(item.phone || '').trim().slice(0, 20),
                email: String(item.email || '').trim().toLowerCase().slice(0, 200),
                address: String(item.address || '').trim().slice(0, 500),
                gstin: String(item.gstin || '').trim().toUpperCase().slice(0, 15),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            docs.push(doc);
        }

        if (docs.length === 0) {
            return NextResponse.json({ error: 'No valid clients found. Name is mandatory.' }, { status: 400 });
        }

        await db.collection('tenant_clients').insertMany(docs);

        return NextResponse.json({ success: true, count: docs.length });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/clients/bulk') }, { status: 500 });
    }
}
