import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { reverseVoucher } from '@/lib/cloud/accounting/voucherEngine';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/cloud/erp/accounting/payments/[id]
 * Voids a payment (e.g. recorded in error) - simply removes it, which restores the
 * invoice's balance since status/balance are always computed live from remaining rows.
 */
export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { id } = await context.params;
        if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid payment id.' }, { status: 400 });

        const db = await getCloudDb();

        /*
         * REVERSE THE VOUCHER BEFORE REMOVING THE PAYMENT.
         *
         * Deleting a payment used to leave its receipt voucher standing, so the
         * ledger kept showing money received that the payments collection no
         * longer had. The invoice balance recomputed correctly and the books did
         * not - two answers to the same question.
         *
         * The voucher is reversed, never deleted: a contra entry that undoes it,
         * with both remaining visible. That is what makes a ledger auditable, and
         * it is why this is not simply a cascading delete.
         *
         * Done BEFORE the payment row goes, so a failure here leaves both
         * records intact and retryable rather than a payment gone with its
         * voucher still posted.
         */
        const posted = await db.collection('erp_vouchers').findOne({
            tenantId: user.tenantId,
            linkedDocumentType: 'payment',
            linkedDocumentId: id,
        });

        if (posted) {
            try {
                await reverseVoucher(db, user.tenantId, posted._id, 'Payment deleted', user.username || user.email || user.sub);
            } catch (err) {
                console.error('[accounting] could not reverse voucher for payment', id, err);
                return NextResponse.json({
                    error: 'Could not reverse this payment in the ledger, so it was not deleted. Try again.',
                }, { status: 409 });
            }
        }

        const result = await db.collection('erp_payments').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });

        return NextResponse.json({ success: true, reversed: !!posted });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/accounting/payments/[id]') }, { status: 500 });
    }
}
