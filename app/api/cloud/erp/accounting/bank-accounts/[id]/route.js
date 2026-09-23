import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();

        const hasEntries = await db.collection('erp_ledger_entries').countDocuments({ tenantId: user.tenantId, bankAccountId: id });
        if (hasEntries > 0) {
            return NextResponse.json({ error: 'Cannot delete a bank account that has ledger entries linked to it.' }, { status: 400 });
        }

        const result = await db.collection('erp_bank_accounts').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Bank account not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/accounting/bank-accounts/[id]') }, { status: 500 });
    }
}
