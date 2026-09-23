import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { getChartOfAccounts, createLedger } from '@/lib/cloud/accounting/coa';

/**
 * THE CHART OF ACCOUNTS - the ledgers themselves, not transactions.
 *
 * Renamed from `ledgers/`, which was one character away from `ledger/`, the
 * legacy cashbook. Two unrelated systems, adjacent in the directory listing,
 * distinguished by a plural. This one owns `erp_ledgers`: the accounts a
 * business keeps. The other owned a list of cash movements.
 */

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const db = await getCloudDb();
        const coa = await getChartOfAccounts(db, user.tenantId);

        return NextResponse.json(coa);
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/accounts') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const body = await req.json();
        const db = await getCloudDb();

        const created = await createLedger(db, user.tenantId, body);
        return NextResponse.json({ ledger: created }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/accounting/accounts') }, { status: 400 });
    }
}
