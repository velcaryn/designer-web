import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/config/tax-profiles
 * Named tax profiles (Phase 7c) replace hardcoded per-line tax rates - e.g. "GST 18%",
 * "IGST 18%", "Exempt" - each optionally mapped to a list of HSN codes so line items can
 * auto-apply the right rate instead of the user typing a number every time.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'config');
        if (denied) return denied;

        const db = await getCloudDb();
        const profiles = await db.collection('erp_tax_profiles')
            .find({ tenantId: user.tenantId })
            .sort({ createdAt: 1 })
            .toArray();

        return NextResponse.json({ profiles: profiles.map(p => ({ ...p, _id: p._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/config/tax-profiles') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'config');
        if (denied) return denied;

        const body = await req.json();
        const name = sanitizeStr(body.name, 100);
        if (!name) return NextResponse.json({ error: 'Profile name is required.' }, { status: 400 });

        const isExempt = !!body.isExempt;
        const rate = isExempt ? 0 : sanitizeNum(body.rate);
        if (!isExempt && rate <= 0) return NextResponse.json({ error: 'Rate must be greater than zero (or mark as exempt).' }, { status: 400 });

        const hsnCodes = Array.isArray(body.hsnCodes)
            ? body.hsnCodes.slice(0, 50).map(h => sanitizeStr(h, 20)).filter(Boolean)
            : [];

        const db = await getCloudDb();
        const doc = {
            tenantId: user.tenantId,
            name,
            rate,
            isExempt,
            hsnCodes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await db.collection('erp_tax_profiles').insertOne(doc);

        return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/config/tax-profiles') }, { status: 500 });
    }
}
