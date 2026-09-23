import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, sanitizeNum, paginationFromParams } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';
import { postExpenseVoucher } from '@/lib/cloud/accounting/voucherEngine';
import { postToLedger } from '@/lib/cloud/accounting/postingBridge';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'expenses');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const { skip, limit, page } = paginationFromParams(searchParams);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (status) filter.status = status;

        const [expenses, total] = await Promise.all([
            db.collection('erp_expenses').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            db.collection('erp_expenses').countDocuments(filter),
        ]);

        return NextResponse.json({
            expenses: expenses.map(e => ({ ...e, _id: e._id.toString() })),
            total, page, pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/expenses') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'expenses');
        if (denied) return denied;

        const body = await req.json();
        const employeeName = sanitizeStr(body.employeeName, 200);
        const category = sanitizeStr(body.category, 100);
        const amount = sanitizeNum(body.amount);

        if (!employeeName) return NextResponse.json({ error: 'Employee / claimant name is required.' }, { status: 400 });
        if (!category) return NextResponse.json({ error: 'Category is required.' }, { status: 400 });
        if (amount <= 0) return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });

        const db = await getCloudDb();
        const expenseNumber = await generateErpNumber(user.tenantId, 'expense');

        const expense = {
            tenantId: user.tenantId,
            expenseNumber,
            employeeName,
            category,
            amount,
            currency: sanitizeStr(body.currency || 'INR', 5),
            date: body.date ? new Date(body.date) : new Date(),
            receiptUrl: sanitizeStr(body.receiptUrl, 500),
            notes: sanitizeStr(body.notes, 2000),
            status: 'draft',
            history: [{
                action: 'created',
                message: `Expense claim created by ${user.businessName || user.email}`,
                at: new Date(),
                by: user.email,
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_expenses').insertOne(expense);

        /*
         * Post the expense into the general ledger.
         *
         * Expenses wrote only to erp_expenses - not even to the legacy cashbook -
         * so they were invisible to the P&L entirely. A business could record a
         * year of rent and salaries and still show its full gross revenue as
         * profit. Non-fatal and recorded, like every other posting.
         */
        await postToLedger(db, {
            tenantId: user.tenantId,
            collection: 'erp_expenses',
            documentId: result.insertedId,
            label: 'expense',
        }, () => postExpenseVoucher(
            db,
            user.tenantId,
            { ...expense, _id: result.insertedId, expenseNumber },
            user.username || user.email || user.sub
        ));

        return NextResponse.json({ success: true, _id: result.insertedId.toString(), expenseNumber }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/expenses') }, { status: 500 });
    }
}
