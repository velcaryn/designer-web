import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { isValidTheme, DEFAULT_THEME } from '@/lib/themes';

export const dynamic = 'force-dynamic';

/**
 * GET/PUT /api/cloud/theme
 * Per-tenant UI theme preference (one of the three ready-made themes in
 * src/lib/themes.js). No permission gate beyond authentication - every role
 * sees the tenant's chosen look, but only an admin/owner can change it
 * (enforced in PUT), matching how branding/config already works.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = await getCloudDb();
        const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId }, { projection: { uiTheme: 1 } });
        return NextResponse.json({ theme: (tenant?.uiTheme && isValidTheme(tenant.uiTheme)) ? tenant.uiTheme : DEFAULT_THEME });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/theme') }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role === 'custom') return NextResponse.json({ error: 'Only an Admin can change the workspace theme.' }, { status: 403 });

        const body = await req.json();
        if (!isValidTheme(body.theme)) return NextResponse.json({ error: 'Invalid theme.' }, { status: 400 });

        const db = await getCloudDb();
        await db.collection('tenants').updateOne({ tenantId: user.tenantId }, { $set: { uiTheme: body.theme, updatedAt: new Date() } });
        return NextResponse.json({ success: true, theme: body.theme });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/theme') }, { status: 500 });
    }
}
