import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';
import { reverseVoucher } from '@/lib/cloud/accounting/voucherEngine';

export const dynamic = 'force-dynamic';

const ENTRY_TYPES = ['income', 'expense'];

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_ledger_entries').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Ledger entry not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        if (body.reconciled !== undefined) update.reconciled = !!body.reconciled;
        if (body.type !== undefined && ENTRY_TYPES.includes(body.type)) update.type = body.type;
        if (body.category !== undefined) update.category = sanitizeStr(body.category, 100);
        if (body.description !== undefined) update.description = sanitizeStr(body.description, 500);
        if (body.amount !== undefined) {
            const amount = sanitizeNum(body.amount);
            if (amount > 0) update.amount = amount;
        }
        if (body.date !== undefined) update.date = new Date(body.date);
        if (body.reference !== undefined) update.reference = sanitizeStr(body.reference, 200);
        if (body.bankAccountId !== undefined) {
            update.bankAccountId = body.bankAccountId && ObjectId.isValid(body.bankAccountId) ? body.bankAccountId : null;
        }

        await db.collection('erp_ledger_entries').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, { $set: update });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/accounting/cashbook/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        /*
         * Reverse the voucher before removing the entry.
         *
         * Cashbook writes post to the general ledger now, so deleting one here
         * without reversing would leave the ledger showing money that the
         * cashbook no longer has - the same divergence deleting a payment used
         * to cause. Reversed rather than deleted, so both entries stay visible.
         */
        const posted = await db.collection('erp_vouchers').findOne({
            tenantId: user.tenantId,
            sourceRef: `cashbook:${id}`,
        });
        if (posted) {
            try {
                await reverseVoucher(db, user.tenantId, posted._id, 'Cashbook entry deleted', user.username || user.email || user.sub);
            } catch (err) {
                console.error('[accounting] could not reverse cashbook voucher', id, err);
                return NextResponse.json({
                    error: 'Could not reverse this entry in the ledger, so it was not deleted. Try again.',
                }, { status: 409 });
            }
        }

        const result = await db.collection('erp_ledger_entries').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Ledger entry not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/accounting/cashbook/[id]') }, { status: 500 });
    }
}
