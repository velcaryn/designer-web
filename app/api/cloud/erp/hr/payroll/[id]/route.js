import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { validateStatusTransition } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';
import { postPayrollVoucher } from '@/lib/cloud/accounting/voucherEngine';
import { postToLedger } from '@/lib/cloud/accounting/postingBridge';

export const dynamic = 'force-dynamic';

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_payroll_runs').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Payroll run not found.' }, { status: 404 });

        if (body.status === undefined || body.status === existing.status) {
            return NextResponse.json({ error: 'No status change provided.' }, { status: 400 });
        }

        const check = validateStatusTransition('payrollRun', existing.status, body.status);
        if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });

        await db.collection('erp_payroll_runs').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            { $set: { status: body.status, updatedAt: new Date() } }
        );

        /*
         * Payroll has two accounting events, and this route is where both
         * happen. Finalizing accrues the salary expense against a liability;
         * paying settles that liability from the bank. Neither had ever posted -
         * the salary ledgers were seeded from day one and never used, so wages
         * never appeared in the P&L at all.
         */
        if (body.status === 'finalized' || body.status === 'paid') {
            await postToLedger(db, {
                tenantId: user.tenantId,
                collection: 'erp_payroll_runs',
                documentId: existing._id,
                label: `payroll ${body.status}`,
            }, () => postPayrollVoucher(
                db,
                user.tenantId,
                existing,
                body.status,
                user.username || user.email || user.sub
            ));
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/hr/payroll/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const existing = await db.collection('erp_payroll_runs').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Payroll run not found.' }, { status: 404 });
        if (existing.status !== 'draft') {
            return NextResponse.json({ error: 'Only draft payroll runs can be deleted.' }, { status: 400 });
        }

        await db.collection('erp_payroll_runs').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/hr/payroll/[id]') }, { status: 500 });
    }
}
