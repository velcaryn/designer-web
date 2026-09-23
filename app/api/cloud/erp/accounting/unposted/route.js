import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { findUnposted, POSTING_STATUS } from '@/lib/cloud/accounting/postingBridge';

export const dynamic = 'force-dynamic';

/**
 * WHAT NEVER REACHED THE GENERAL LEDGER.
 *
 * Posting to the ledger is a non-fatal side effect of a business write - an
 * invoice must not be refused because the ledger was momentarily unhappy. That
 * trade is only defensible if somebody can find out it happened, and until now
 * nobody could: the two auto-post call sites swallowed every error with an
 * empty catch, so a failed posting left no log, no flag and no trace.
 *
 * This is the other half of that trade. Every document whose voucher failed, or
 * was never attempted, appears here so it can be fixed while it still matters.
 * It is the same treatment the HMS side gives unbilled bed-days, and for the
 * same reason: a silent financial gap is only discovered at year end, when it
 * is expensive.
 *
 * Documents predating the posting bridge have no `ledgerPosting` field at all
 * and are included deliberately - never attempted is as unposted as failed.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const db = await getCloudDb();

        // Only non-draft invoices are expected to post, so a draft sitting
        // unposted is correct rather than a problem worth showing.
        const invoices = await findUnposted(db, user.tenantId, {
            collection: 'tenant_documents',
            match: { docType: 'Invoice', status: { $ne: 'draft' } },
        });

        const payments = await findUnposted(db, user.tenantId, {
            collection: 'erp_payments',
        });

        const shape = (d, kind) => ({
            _id: d._id.toString(),
            kind,
            reference: d.docNumber || d.paymentNumber || null,
            party: d.customer?.name || d.paidBy || null,
            amount: d.grandTotal ?? d.amount ?? 0,
            date: d.createdAt || d.date || null,
            status: d.ledgerPosting?.status || 'never_attempted',
            error: d.ledgerPosting?.error || null,
        });

        const rows = [
            ...invoices.map(d => shape(d, 'invoice')),
            ...payments.map(d => shape(d, 'payment')),
        ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        return NextResponse.json({
            rows,
            total: rows.length,
            failed: rows.filter(r => r.status === POSTING_STATUS.FAILED).length,
            neverAttempted: rows.filter(r => r.status === 'never_attempted').length,
        });
    } catch (err) {
        return NextResponse.json(
            { error: safeCloudError(err, 'GET /api/cloud/erp/accounting/unposted') },
            { status: 500 }
        );
    }
}
