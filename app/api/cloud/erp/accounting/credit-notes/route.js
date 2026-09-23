import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum, DOC_TYPE_CODES } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';
import { postNoteVoucher } from '@/lib/cloud/accounting/voucherEngine';
import { postToLedger } from '@/lib/cloud/accounting/postingBridge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/accounting/credit-notes?invoiceId=...
 * Credit/Debit Notes (Phase 8a) are stored as tenant_documents (docType CreditNote/
 * DebitNote) so they get the exact same numbering, PDF rendering, and public share-link
 * pipeline as Invoices/Quotes for free, instead of a parallel system.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const invoiceId = searchParams.get('invoiceId');

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId, docType: { $in: ['CreditNote', 'DebitNote'] } };
        if (invoiceId && ObjectId.isValid(invoiceId)) filter.linkedInvoiceId = invoiceId;

        const notes = await db.collection('tenant_documents').find(filter).sort({ createdAt: -1 }).toArray();
        return NextResponse.json({ notes: notes.map(n => ({ ...n, _id: n._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/credit-notes') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/accounting/credit-notes
 * Issues a Credit Note (reduces what the customer owes) or Debit Note (increases it)
 * against an existing Invoice. Re-validates the invoice server-side; a credit note is
 * capped at the invoice's current outstanding balance so it can never push balance negative.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const body = await req.json();
        const { invoiceId } = body;
        const noteType = ['CreditNote', 'DebitNote'].includes(body.noteType) ? body.noteType : null;
        const amount = sanitizeNum(body.amount);
        const reason = sanitizeStr(body.reason, 500);

        if (!invoiceId || !ObjectId.isValid(invoiceId)) return NextResponse.json({ error: 'A valid invoice must be selected.' }, { status: 400 });
        if (!noteType) return NextResponse.json({ error: 'Note type must be CreditNote or DebitNote.' }, { status: 400 });
        if (amount <= 0) return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });
        if (!reason) return NextResponse.json({ error: 'A reason is required.' }, { status: 400 });

        const db = await getCloudDb();

        const invoice = await db.collection('tenant_documents').findOne({ _id: new ObjectId(invoiceId), tenantId: user.tenantId, docType: 'Invoice' });
        if (!invoice) return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
        if (invoice.status === 'draft') return NextResponse.json({ error: 'Invoice must be sent before issuing a note against it.' }, { status: 400 });

        if (noteType === 'CreditNote') {
            const [payments, existingNotes] = await Promise.all([
                db.collection('erp_payments').find({ tenantId: user.tenantId, documentId: invoiceId }).toArray(),
                db.collection('tenant_documents').find({ tenantId: user.tenantId, linkedInvoiceId: invoiceId, docType: { $in: ['CreditNote', 'DebitNote'] } }).toArray(),
            ]);
            const paid = payments.reduce((s, p) => s + p.amount, 0);
            const netAdjustment = existingNotes.reduce((s, n) => s + (n.docType === 'CreditNote' ? -n.grandTotal : n.grandTotal), 0);
            const currentBalance = (invoice.grandTotal || 0) - paid + netAdjustment;
            if (amount > currentBalance) {
                return NextResponse.json({ error: `Credit note exceeds the invoice's current balance of ${currentBalance.toFixed(2)}.` }, { status: 400 });
            }
        }

        const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
        const prefix = tenant?.branding?.docPrefix || user.tenantId.split('-')[1] || 'DOC';
        const year = new Date().getFullYear();
        const typeCode = DOC_TYPE_CODES[noteType];

        const lastDoc = await db.collection('tenant_documents')
            .find({ tenantId: user.tenantId, docNumber: { $regex: `^${prefix}-${year}-${typeCode}-` } })
            .sort({ docNumber: -1 }).limit(1).toArray();
        let seq = 1;
        if (lastDoc.length > 0) {
            const lastSeq = parseInt(lastDoc[0].docNumber.split('-').pop(), 10);
            if (!isNaN(lastSeq)) seq = lastSeq + 1;
        }
        const docNumber = `${prefix}-${year}-${typeCode}-${String(seq).padStart(4, '0')}`;
        const secretKey = crypto.randomBytes(10).toString('hex');

        const note = {
            tenantId: user.tenantId,
            businessName: tenant?.businessName,
            brandColor: tenant?.branding?.customHexColor || '#4A1088',
            docType: noteType,
            docNumber,
            secretKey,
            status: 'sent',
            linkedInvoiceId: invoiceId,
            linkedInvoiceNumber: invoice.docNumber,
            customer: invoice.customer,
            lineItems: [{
                product: reason,
                description: reason,
                hsnCode: '',
                qty: 1,
                unit: 'Nos',
                unitPrice: amount,
                totalPrice: amount,
                taxRate: 0,
            }],
            subtotal: amount,
            taxAmount: 0,
            grandTotal: amount,
            currency: invoice.currency || 'INR',
            notes: reason,
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
            by: user.email,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('tenant_documents').insertOne(note);

        /*
         * Post the note into the ledger. The credit_note and debit_note voucher
         * types existed from the start and had never once been used, so a note
         * adjusted the invoice balance while the ledger went on showing the
         * original sale in full.
         */
        await postToLedger(db, {
            tenantId: user.tenantId,
            collection: 'tenant_documents',
            documentId: result.insertedId,
            label: noteType,
        }, () => postNoteVoucher(
            db,
            user.tenantId,
            { ...note, _id: result.insertedId },
            user.username || user.email || user.sub
        ));
        return NextResponse.json({ success: true, _id: result.insertedId.toString(), docNumber }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/accounting/credit-notes') }, { status: 500 });
    }
}
