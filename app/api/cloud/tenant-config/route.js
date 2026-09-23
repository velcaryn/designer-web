import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'config');
        if (denied) return denied;

        const db = await getCloudDb();
        const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
        if (!tenant) return NextResponse.json({ error: 'Tenant record not found.' }, { status: 404 });

        return NextResponse.json({ tenant });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/tenant-config') }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'config');
        if (denied) return denied;

        const body = await req.json();
        const { businessName, contact = {}, branding = {} } = body;

        if (!businessName || !businessName.trim()) {
            return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
        }

        const db = await getCloudDb();

        const update = {
            businessName: String(businessName).trim().slice(0, 200),
            companyTag1: String(body.companyTag1 || '').trim().slice(0, 200),
            companyTag2: String(body.companyTag2 || '').trim().slice(0, 200),
            companyTag3: String(body.companyTag3 || '').trim().slice(0, 200),
            contact: {
                owner: String(contact.owner || '').trim().slice(0, 100),
                email: String(contact.email || '').trim().toLowerCase().slice(0, 100),
                phone: String(contact.phone || '').trim().slice(0, 30),
                gstin: String(contact.gstin || '').trim().toUpperCase().slice(0, 15),
                address: {
                    line1: String(contact.address?.line1 || '').trim().slice(0, 200),
                    city: String(contact.address?.city || '').trim().slice(0, 100),
                    state: String(contact.address?.state || '').trim().slice(0, 100),
                    pin: String(contact.address?.pin || '').trim().slice(0, 15),
                }
            },
            branding: {
                customHexColor: String(branding.customHexColor || '#4A1088').trim().slice(0, 7),
                docPrefix: String(branding.docPrefix || 'DOC').trim().toUpperCase().slice(0, 10),
                letterheadPage1: String(branding.letterheadPage1 || '').trim(),
                letterheadPage2: String(branding.letterheadPage2 || '').trim(),
                useUploadedLetterhead: !!branding.useUploadedLetterhead,
                signatoryImage: String(branding.signatoryImage || '').trim(),
                brandLogo: String(branding.brandLogo || '').trim(),
            },
            updatedAt: new Date()
        };

        const result = await db.collection('tenants').updateOne(
            { tenantId: user.tenantId },
            { $set: update }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Tenant record not found.' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/tenant-config') }, { status: 500 });
    }
}
