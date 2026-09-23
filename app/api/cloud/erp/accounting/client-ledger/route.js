import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { computeNoteAdjustments } from '@/lib/erpHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/accounting/client-ledger
 * Per-client outstanding balance: sum of sent/unpaid invoice totals minus payments
 * received, grouped by customer email (matches how Documents stores the billed party -
 * there's no clientId foreign key on tenant_documents today, only a snapshot of the
 * customer's details at document-creation time).
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const db = await getCloudDb();

        const invoices = await db.collection('tenant_documents')
            .find({ tenantId: user.tenantId, docType: 'Invoice', status: { $ne: 'draft' } })
            .toArray();

        const invoiceIds = invoices.map(d => d._id.toString());
        const paidTotals = invoiceIds.length ? await db.collection('erp_payments').aggregate([
            { $match: { tenantId: user.tenantId, documentId: { $in: invoiceIds } } },
            { $group: { _id: '$documentId', paid: { $sum: '$amount' } } },
        ]).toArray() : [];
        const paidMap = Object.fromEntries(paidTotals.map(p => [p._id, p.paid]));
        const noteAdjustments = await computeNoteAdjustments(user.tenantId, invoiceIds);

        const byClient = {};
        for (const inv of invoices) {
            const key = (inv.customer?.email || inv.customer?.name || 'unknown').toLowerCase();
            const paid = (paidMap[inv._id.toString()] || 0) + (noteAdjustments.get(inv._id.toString()) || 0);
            const balance = (inv.grandTotal || 0) - paid;
            if (!byClient[key]) {
                byClient[key] = {
                    clientName: inv.customer?.name || 'Unknown',
                    clientEmail: inv.customer?.email || '',
                    invoicedTotal: 0,
                    paidTotal: 0,
                    outstanding: 0,
                    invoiceCount: 0,
                };
            }
            byClient[key].invoicedTotal += inv.grandTotal || 0;
            byClient[key].paidTotal += paid;
            byClient[key].outstanding += balance;
            byClient[key].invoiceCount += 1;
        }

        const ledger = Object.values(byClient).sort((a, b) => b.outstanding - a.outstanding);

        return NextResponse.json({
            ledger,
            totals: {
                invoiced: ledger.reduce((s, c) => s + c.invoicedTotal, 0),
                paid: ledger.reduce((s, c) => s + c.paidTotal, 0),
                outstanding: ledger.reduce((s, c) => s + c.outstanding, 0),
            },
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/client-ledger') }, { status: 500 });
    }
}
