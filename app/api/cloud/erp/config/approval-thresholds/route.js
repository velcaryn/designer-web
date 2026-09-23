import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * Phase 8c - Approval Workflows, generalized from Expenses' approval pattern to
 * Quotes/POs/Invoices. Rather than a separate multi-step approval-request/notification
 * subsystem, thresholds reuse the RBAC role split already in place (Phase 5): a
 * 'custom' sub-user is blocked from confirming/sending a document over the threshold -
 * only an owner/admin can, which *is* the approval. Deferred: async approval requests
 * and notifications for a genuinely multi-level chain.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'config');
        if (denied) return denied;

        const db = await getCloudDb();
        const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
        return NextResponse.json({ thresholds: tenant?.approvalThresholds || { po: null, quote: null, invoice: null } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/config/approval-thresholds') }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'config');
        if (denied) return denied;

        const body = await req.json();
        const parseThreshold = (v) => (v === null || v === undefined || v === '') ? null : sanitizeNum(v);
        const thresholds = {
            po: parseThreshold(body.po),
            quote: parseThreshold(body.quote),
            invoice: parseThreshold(body.invoice),
        };

        const db = await getCloudDb();
        await db.collection('tenants').updateOne({ tenantId: user.tenantId }, { $set: { approvalThresholds: thresholds, updatedAt: new Date() } });

        return NextResponse.json({ success: true, thresholds });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/config/approval-thresholds') }, { status: 500 });
    }
}
