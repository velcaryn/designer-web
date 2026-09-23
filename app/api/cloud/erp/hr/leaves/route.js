import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, LEAVE_TYPES, paginationFromParams } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

function daysBetween(from, to) {
    const ms = new Date(to).setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
    return Math.max(1, Math.round(ms / 86400000) + 1);
}

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const employeeId = searchParams.get('employeeId');
        const { skip, limit, page } = paginationFromParams(searchParams, 100);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (status) filter.status = status;
        if (employeeId) filter.employeeId = employeeId;

        const [leaves, total] = await Promise.all([
            db.collection('erp_leave_requests').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            db.collection('erp_leave_requests').countDocuments(filter),
        ]);

        return NextResponse.json({
            leaves: leaves.map(l => ({ ...l, _id: l._id.toString() })),
            total, page, pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/hr/leaves') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const body = await req.json();
        const employeeId = sanitizeStr(body.employeeId, 100);
        const type = LEAVE_TYPES.includes(body.type) ? body.type : null;

        if (!employeeId || !ObjectId.isValid(employeeId)) return NextResponse.json({ error: 'Employee is required.' }, { status: 400 });
        if (!type) return NextResponse.json({ error: `Type must be one of: ${LEAVE_TYPES.join(', ')}.` }, { status: 400 });
        if (!body.from || !body.to) return NextResponse.json({ error: 'From and To dates are required.' }, { status: 400 });

        const db = await getCloudDb();
        const employee = await db.collection('erp_employees').findOne({ _id: new ObjectId(employeeId), tenantId: user.tenantId });
        if (!employee) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });

        const leaveNumber = await generateErpNumber(user.tenantId, 'leaveRequest');
        const from = new Date(body.from);
        const to = new Date(body.to);

        const leave = {
            tenantId: user.tenantId,
            leaveNumber,
            employeeId,
            employeeName: employee.name,
            type,
            from,
            to,
            days: daysBetween(from, to),
            reason: sanitizeStr(body.reason, 1000),
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_leave_requests').insertOne(leave);
        return NextResponse.json({ success: true, _id: result.insertedId.toString(), leaveNumber }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/hr/leaves') }, { status: 500 });
    }
}
