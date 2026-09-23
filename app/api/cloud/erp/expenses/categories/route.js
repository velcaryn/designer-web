import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'expenses');
        if (denied) return denied;

        const db = await getCloudDb();
        const categories = await db.collection('erp_expense_categories')
            .find({ tenantId: user.tenantId })
            .sort({ name: 1 })
            .toArray();

        return NextResponse.json({ categories: categories.map(c => ({ ...c, _id: c._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/expenses/categories') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'expenses');
        if (denied) return denied;

        const body = await req.json();
        const name = sanitizeStr(body.name, 100);
        if (!name) return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });

        const db = await getCloudDb();
        const doc = {
            tenantId: user.tenantId,
            name,
            monthlyLimit: sanitizeNum(body.monthlyLimit, 0),
            createdAt: new Date(),
        };
        const result = await db.collection('erp_expense_categories').insertOne(doc);
        return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/expenses/categories') }, { status: 500 });
    }
}
