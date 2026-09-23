import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { paginationFromParams } from '@/lib/erpHelpers';
import { postVoucher } from '@/lib/cloud/accounting/voucherEngine';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const voucherType = searchParams.get('voucherType');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const search = searchParams.get('search');
        const { skip, limit, page } = paginationFromParams(searchParams, 50);

        const filter = { tenantId: user.tenantId };
        if (voucherType) filter.voucherType = voucherType;

        if (fromDate || toDate) {
            filter.date = {};
            if (fromDate) filter.date.$gte = new Date(fromDate);
            if (toDate) filter.date.$lte = new Date(toDate);
        }

        if (search) {
            filter.$or = [
                { voucherNumber: { $regex: search, $options: 'i' } },
                { narration: { $regex: search, $options: 'i' } },
                { referenceNo: { $regex: search, $options: 'i' } },
            ];
        }

        const db = await getCloudDb();
        const [vouchers, total] = await Promise.all([
            db.collection('erp_vouchers').find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
            db.collection('erp_vouchers').countDocuments(filter),
        ]);

        return NextResponse.json({
            vouchers: vouchers.map(v => ({ ...v, _id: v._id.toString() })),
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/vouchers') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const body = await req.json();
        const db = await getCloudDb();

        const posted = await postVoucher(db, user.tenantId, body, user.username || user.sub);
        return NextResponse.json({ voucher: posted }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/accounting/vouchers') }, { status: 400 });
    }
}
