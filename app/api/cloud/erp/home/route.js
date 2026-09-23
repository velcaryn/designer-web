import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { hasPermission } from '@/lib/permissions';
import { computeInvoiceStatus, computeNoteAdjustments } from '@/lib/erpHelpers';

export const dynamic = 'force-dynamic';

const RECENT_LIMIT = 6;

/**
 * GET /api/cloud/erp/home
 *
 * The Cloud home dashboard's own consolidated read.
 *
 * Replaces the previous fan-out, which fetched the ENTIRE items, clients and
 * documents collections purely to call `.length` on them - three integers paid
 * for with three full-collection payloads. Everything here is a countDocuments
 * or a bounded find().limit().
 *
 * Deliberately does NOT recompute alerts or insights: those live in
 * ?scope=alerts on the calendar route and in the analytics route, and the page
 * calls those directly rather than duplicating that logic here.
 *
 * Permission model: authentication is required, but a missing module permission
 * degrades that one section to `null` instead of failing the whole request -
 * a sub-user with no `accounting` right still gets a working home page. The
 * `permissions` block tells the client which of the *other* endpoints
 * (analytics, calendar) are worth calling at all.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = await getCloudDb();
        const tenantId = user.tenantId;

        const can = {
            items: hasPermission(user, 'items'),
            clients: hasPermission(user, 'clients'),
            documents: hasPermission(user, 'documents'),
            accounting: hasPermission(user, 'accounting'),
            analytics: hasPermission(user, 'analytics'),
            calendar: hasPermission(user, 'calendar'),
        };

        const [products, clients, documents, invoices] = await Promise.all([
            can.items ? db.collection('tenant_products').countDocuments({ tenantId }) : null,
            can.clients ? db.collection('tenant_clients').countDocuments({ tenantId }) : null,
            can.documents ? db.collection('tenant_documents').countDocuments({ tenantId }) : null,
            can.documents ? db.collection('tenant_documents').countDocuments({ tenantId, docType: 'Invoice' }) : null,
        ]);

        // ── Recent documents (bounded) ────────────────────────────────────
        let recentDocs = [];
        if (can.documents) {
            const docs = await db.collection('tenant_documents')
                .find({ tenantId })
                .project({ docNumber: 1, docType: 1, status: 1, grandTotal: 1, currency: 1, createdAt: 1, dueDate: 1, 'customer.name': 1, 'customer.company': 1 })
                .sort({ createdAt: -1 })
                .limit(RECENT_LIMIT)
                .toArray();

            // Balance due is only meaningful for invoices, so only those need a
            // payments/notes lookup - and only for the handful on screen.
            const invoiceIds = docs.filter(d => d.docType === 'Invoice').map(d => d._id.toString());
            let paidMap = {};
            let noteAdjustments = new Map();
            if (invoiceIds.length) {
                const paidTotals = await db.collection('erp_payments').aggregate([
                    { $match: { tenantId, documentId: { $in: invoiceIds } } },
                    { $group: { _id: '$documentId', paid: { $sum: '$amount' } } },
                ]).toArray();
                paidMap = Object.fromEntries(paidTotals.map(p => [p._id, p.paid]));
                noteAdjustments = await computeNoteAdjustments(tenantId, invoiceIds);
            }

            recentDocs = docs.map(d => {
                const id = d._id.toString();
                const isInvoice = d.docType === 'Invoice';
                const paid = isInvoice ? (paidMap[id] || 0) + (noteAdjustments.get(id) || 0) : 0;
                return {
                    id,
                    docNumber: d.docNumber || null,
                    docType: d.docType,
                    createdAt: d.createdAt,
                    dueDate: d.dueDate || null,
                    customerName: d.customer?.name || d.customer?.company || null,
                    grandTotal: d.grandTotal || 0,
                    currency: d.currency || 'INR',
                    status: isInvoice ? computeInvoiceStatus(d, paid) : (d.status || 'draft'),
                    balanceDue: isInvoice ? Math.max(0, (d.grandTotal || 0) - paid) : null,
                };
            });
        }

        // ── Bank setup state ──────────────────────────────────────────────
        // "₹0.00 cash in bank" and "no bank account configured yet" are two
        // completely different situations; the old page rendered both as a
        // confident zero. `configured` is what lets the UI tell them apart.
        let bank = null;
        if (can.accounting) {
            const accounts = await db.collection('erp_bank_accounts')
                .find({ tenantId })
                .project({ balance: 1 })
                .toArray();
            bank = {
                configured: accounts.length > 0,
                accountCount: accounts.length,
                balance: accounts.reduce((s, a) => s + (a.balance || 0), 0),
            };
        }

        // ── Collected-to-date (all recorded payments) ─────────────────────
        let collected = null;
        if (can.accounting) {
            const agg = await db.collection('erp_payments').aggregate([
                { $match: { tenantId } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]).toArray();
            collected = agg[0]?.total || 0;
        }

        return NextResponse.json({
            generatedAt: new Date().toISOString(),
            permissions: can,
            counts: { products, clients, documents, invoices },
            recentDocs,
            bank,
            collected,
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/home') }, { status: 500 });
    }
}
