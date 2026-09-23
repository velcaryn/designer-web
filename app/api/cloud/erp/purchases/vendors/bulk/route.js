import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cloud/erp/purchases/vendors/bulk
 * Vendors are tenant_clients tagged with the 'vendor' role (see the GET handler
 * in ../route.js) - bulk-imported rows become brand-new vendor-only contacts,
 * mirroring how /api/cloud/clients/bulk creates customer-only contacts.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;

        const body = await req.json();
        const { vendors } = body;

        if (!Array.isArray(vendors) || vendors.length === 0) {
            return NextResponse.json({ error: 'Invalid payload. Vendors array required.' }, { status: 400 });
        }

        const db = await getCloudDb();
        const docs = [];

        for (const item of vendors) {
            if (!item.name || !item.name.trim()) continue; // skip invalid rows

            docs.push({
                tenantId: user.tenantId,
                roles: ['vendor'],
                name: String(item.name).trim().slice(0, 200),
                company: String(item.company || '').trim().slice(0, 200),
                email: String(item.email || '').trim().toLowerCase().slice(0, 200),
                phone: String(item.phone || '').trim().slice(0, 20),
                address: String(item.address || '').trim().slice(0, 500),
                gstin: String(item.gstin || '').trim().toUpperCase().slice(0, 15),
                panNumber: String(item.panNumber || '').trim().toUpperCase().slice(0, 10),
                paymentTerms: String(item.paymentTerms || '').trim().slice(0, 100),
                bankDetails: { bankName: '', accountNo: '', ifscCode: '', branch: '' },
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        if (docs.length === 0) {
            return NextResponse.json({ error: 'No valid vendors found. Name is mandatory.' }, { status: 400 });
        }

        await db.collection('tenant_clients').insertMany(docs);

        return NextResponse.json({ success: true, count: docs.length });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/purchases/vendors/bulk') }, { status: 500 });
    }
}
