import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';
import { postReceiptVoucherFromPayment } from '@/lib/cloud/accounting/voucherEngine';
import { postToLedger } from '@/lib/cloud/accounting/postingBridge';

export const dynamic = 'force-dynamic';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'];

/**
 * GET /api/cloud/erp/accounting/payments?documentId=...
 * Lists payments for the tenant, optionally scoped to one invoice.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get('documentId');

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (documentId && ObjectId.isValid(documentId)) filter.documentId = documentId;

        const payments = await db.collection('erp_payments')
            .find(filter)
            .sort({ date: -1, createdAt: -1 })
            .toArray();

        return NextResponse.json({ payments: payments.map(p => ({ ...p, _id: p._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/payments') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/accounting/payments
 * Records a payment against an existing Invoice. Re-validates the invoice server-side
 * (never trusts the client's total/balance) and caps the amount at the remaining balance
 * so an invoice can never be recorded as more than fully paid.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const body = await req.json();
        const { documentId } = body;
        const amount = sanitizeNum(body.amount);
        const method = PAYMENT_METHODS.includes(body.method) ? body.method : 'other';

        if (!documentId || !ObjectId.isValid(documentId)) {
            return NextResponse.json({ error: 'A valid invoice must be selected.' }, { status: 400 });
        }
        if (amount <= 0) return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });

        const db = await getCloudDb();

        const invoice = await db.collection('tenant_documents').findOne({ _id: new ObjectId(documentId), tenantId: user.tenantId });
        if (!invoice) return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
        if (invoice.docType !== 'Invoice') return NextResponse.json({ error: 'Payments can only be recorded against invoices.' }, { status: 400 });
        if (invoice.status === 'draft') return NextResponse.json({ error: 'Invoice must be sent before recording a payment.' }, { status: 400 });

        const existingPayments = await db.collection('erp_payments').find({ tenantId: user.tenantId, documentId }).toArray();
        const alreadyPaid = existingPayments.reduce((s, p) => s + p.amount, 0);
        const balanceDue = (invoice.grandTotal || 0) - alreadyPaid;

        if (balanceDue <= 0) return NextResponse.json({ error: 'This invoice is already fully paid.' }, { status: 400 });
        if (amount > balanceDue) {
            return NextResponse.json({ error: `Amount exceeds the remaining balance of ${balanceDue.toFixed(2)}.` }, { status: 400 });
        }

        const paymentNumber = await generateErpNumber(user.tenantId, 'payment');

        const payment = {
            tenantId: user.tenantId,
            paymentNumber,
            documentId,
            docNumber: invoice.docNumber,
            clientName: invoice.customer?.name || '',
            clientEmail: invoice.customer?.email || '',
            amount,
            method,
            date: body.date ? new Date(body.date) : new Date(),
            reference: sanitizeStr(body.reference, 200),
            notes: sanitizeStr(body.notes, 1000),
            by: user.email,
            createdAt: new Date(),
        };

        const result = await db.collection('erp_payments').insertOne(payment);

        /*
         * Post the receipt voucher. Awaited and recorded rather than
         * fire-and-forget - see postingBridge.js. A payment that reaches the
         * payments collection but never reaches the ledger overstates
         * receivables for as long as nobody notices.
         */
        await postToLedger(db, {
            tenantId: user.tenantId,
            collection: 'erp_payments',
            documentId: result.insertedId,
            label: 'payment',
        }, () => postReceiptVoucherFromPayment(
            db,
            user.tenantId,
            { ...payment, _id: result.insertedId },
            invoice,
            user.username || user.email || user.sub
        ));

        return NextResponse.json({
            success: true,
            _id: result.insertedId.toString(),
            paymentNumber,
            balanceDue: balanceDue - amount,
        }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/accounting/payments') }, { status: 500 });
    }
}
