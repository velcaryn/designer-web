import crypto from 'crypto';
import clientPromise, { DB_NAME } from '@/lib/mongodb';
import { DOC_TYPE_CODES, nextRunFrom } from '@/lib/erpHelpers';
import { safeError } from '@/lib/apiError';
import { postSalesVoucherFromInvoice } from '@/lib/cloud/accounting/voucherEngine';
import { postToLedger } from '@/lib/cloud/accounting/postingBridge';
import { buildTaxBlock } from '@/lib/cloud/accounting/tax';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/generate-recurring-invoices
 * Phase 8b - scans every active recurring schedule across all tenants whose nextRunDate
 * has arrived, generates the actual Invoice document (tenant_documents), advances the
 * schedule, and stops it automatically once its endDate has passed. Mirrors the auth
 * pattern of the existing /api/cron/process-emails (Bearer CRON_SECRET), and the database
 * name every other cloud route uses (lib/mongodb.js).
 */
export async function GET(req) {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const now = new Date();

        const due = await db.collection('erp_recurring_invoices').find({
            active: true,
            nextRunDate: { $lte: now },
        }).toArray();

        const results = [];
        for (const schedule of due) {
            try {
                const tenant = await db.collection('tenants').findOne({ tenantId: schedule.tenantId });
                const prefix = tenant?.branding?.docPrefix || schedule.tenantId.split('-')[1] || 'DOC';
                const year = now.getFullYear();
                const typeCode = DOC_TYPE_CODES.Invoice;

                const lastDoc = await db.collection('tenant_documents')
                    .find({ tenantId: schedule.tenantId, docNumber: { $regex: `^${prefix}-${year}-${typeCode}-` } })
                    .sort({ docNumber: -1 }).limit(1).toArray();
                let seq = 1;
                if (lastDoc.length > 0) {
                    const lastSeq = parseInt(lastDoc[0].docNumber.split('-').pop(), 10);
                    if (!isNaN(lastSeq)) seq = lastSeq + 1;
                }
                const docNumber = `${prefix}-${year}-${typeCode}-${String(seq).padStart(4, '0')}`;
                const secretKey = crypto.randomBytes(10).toString('hex');

                const invoiceDoc = {
                    tenantId: schedule.tenantId,
                    businessName: tenant?.businessName,
                    brandColor: tenant?.branding?.customHexColor || '#4A1088',
                    docType: 'Invoice',
                    docNumber,
                    secretKey,
                    status: 'sent',
                    dueDate: null,
                    recurringScheduleId: schedule._id.toString(),
                    customer: schedule.customer,
                    lineItems: schedule.lineItems,
                    subtotal: schedule.subtotal,
                    taxAmount: schedule.taxAmount,
                    taxType: 'Tax',
                    grandTotal: schedule.grandTotal,
                    currency: schedule.currency,
                    notes: schedule.notes,
                    brandLogo: tenant?.branding?.brandLogo || '',
                    letterheadPage1: tenant?.branding?.letterheadPage1 || '',
                    letterheadPage2: tenant?.branding?.letterheadPage2 || '',
                    useUploadedLetterhead: tenant?.branding?.useUploadedLetterhead || false,
                    sellerInfo: {
                        name: tenant?.businessName,
                        address: tenant?.contact?.address ? `${tenant.contact.address.line1}, ${tenant.contact.address.city}, ${tenant.contact.address.state} - ${tenant.contact.address.pin}` : '',
                        phone: tenant?.contact?.phone || '',
                        email: tenant?.contact?.email || '',
                        gstin: tenant?.contact?.gstin || '',
                    },
                    createdAt: now,
                    updatedAt: now,
                    /*
                     * The GST split, same as a manually raised invoice. Without
                     * it the sales voucher credits the whole tax-inclusive
                     * amount to revenue - see lib/cloud/accounting/tax.js.
                     */
                    ...buildTaxBlock({
                        grandTotal: schedule.grandTotal,
                        taxAmount: schedule.taxAmount,
                        taxType: 'Tax',
                    }),
                };

                const inserted = await db.collection('tenant_documents').insertOne(invoiceDoc);

                /*
                 * POST THE SALES VOUCHER. This was the sharpest gap in the whole
                 * module: the cron raised real invoices and never told the
                 * ledger, so a tenant on monthly retainers watched their books
                 * drift further from reality every single month, with nobody
                 * looking. Manual invoices posted; automatic ones did not.
                 *
                 * Idempotent by sourceRef, which matters more here than anywhere
                 * else - a cron that is retried, or that runs twice because two
                 * instances woke up together, must not double-bill the ledger.
                 */
                await postToLedger(db, {
                    tenantId: schedule.tenantId,
                    collection: 'tenant_documents',
                    documentId: inserted.insertedId,
                    label: 'recurring invoice',
                }, () => postSalesVoucherFromInvoice(
                    db,
                    schedule.tenantId,
                    { ...invoiceDoc, _id: inserted.insertedId },
                    'system:recurring-invoice'
                ));

                const nextRunDate = nextRunFrom(schedule.nextRunDate, schedule.frequency);
                const pastEnd = schedule.endDate && nextRunDate > new Date(schedule.endDate);

                await db.collection('erp_recurring_invoices').updateOne(
                    { _id: schedule._id },
                    { $set: { nextRunDate, lastGeneratedAt: now, active: !pastEnd, updatedAt: now }, $inc: { generatedCount: 1 } }
                );

                results.push({ tenantId: schedule.tenantId, docNumber, stopped: pastEnd });
            } catch (err) {
                results.push({ tenantId: schedule.tenantId, error: err.message });
            }
        }

        return Response.json({ success: true, processed: results.length, results });
    } catch (error) {
        console.error('Cron Recurring Invoice Error:', error);
        return Response.json({ success: false, error: safeError(error, '/api/cron/generate-recurring-invoices') }, { status: 500 });
    }
}
