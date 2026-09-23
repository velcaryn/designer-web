import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum, validateStatusTransition } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'expenses');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const expense = await db.collection('erp_expenses').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!expense) return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });

        return NextResponse.json({ expense: { ...expense, _id: expense._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/expenses/[id]') }, { status: 500 });
    }
}

/**
 * PUT /api/cloud/erp/expenses/[id]
 * Either edits a draft expense's fields, or drives it through the status workflow
 * (draft -> submitted -> approved/rejected -> paid) via { status: '<next>' }.
 */
export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'expenses');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_expenses').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        const historyEntries = [];

        if (body.status !== undefined && body.status !== existing.status) {
            const check = validateStatusTransition('expense', existing.status, body.status);
            if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });
            update.status = body.status;
            historyEntries.push({
                action: 'status_change',
                message: `Status changed from "${existing.status}" to "${body.status}" by ${user.businessName || user.email}`,
                at: new Date(),
                by: user.email,
            });
        }

        if (existing.status === 'draft') {
            if (body.employeeName !== undefined) update.employeeName = sanitizeStr(body.employeeName, 200);
            if (body.category !== undefined) update.category = sanitizeStr(body.category, 100);
            if (body.amount !== undefined) update.amount = sanitizeNum(body.amount);
            if (body.notes !== undefined) update.notes = sanitizeStr(body.notes, 2000);
            if (body.receiptUrl !== undefined) update.receiptUrl = sanitizeStr(body.receiptUrl, 500);
        }

        const mongoUpdate = { $set: update };
        if (historyEntries.length) mongoUpdate.$push = { history: { $each: historyEntries } };

        await db.collection('erp_expenses').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, mongoUpdate);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/expenses/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'expenses');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();

        const existing = await db.collection('erp_expenses').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
        if (existing.status !== 'draft') {
            return NextResponse.json({ error: 'Only draft expenses can be deleted.' }, { status: 400 });
        }

        await db.collection('erp_expenses').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/expenses/[id]') }, { status: 500 });
    }
}
