import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { generateDaybook } from '@/lib/cloud/accounting/reportsEngine';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const voucherType = searchParams.get('voucherType');

        const db = await getCloudDb();
        const report = await generateDaybook(db, user.tenantId, date, voucherType);

        return NextResponse.json(report);
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/reports/daybook') }, { status: 500 });
    }
}
