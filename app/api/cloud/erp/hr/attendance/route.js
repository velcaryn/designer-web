import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const ATTENDANCE_STATUSES = ['present', 'absent', 'half-day', 'leave'];

function dayBounds(dateStr) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
}

/**
 * GET /api/cloud/erp/hr/attendance?date=YYYY-MM-DD or ?employeeId=...
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const employeeId = searchParams.get('employeeId');

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (date) {
            const { start, end } = dayBounds(date);
            filter.date = { $gte: start, $lt: end };
        }
        if (employeeId) filter.employeeId = employeeId;

        const records = await db.collection('erp_attendance').find(filter).sort({ date: -1 }).toArray();
        return NextResponse.json({ records: records.map(r => ({ ...r, _id: r._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/hr/attendance') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/hr/attendance
 * Marks (or overwrites) one employee's attendance for a given date - upsert on
 * (tenantId, employeeId, date) so re-marking the same day updates instead of duplicating.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const body = await req.json();
        const employeeId = sanitizeStr(body.employeeId, 100);
        const status = ATTENDANCE_STATUSES.includes(body.status) ? body.status : null;
        if (!employeeId) return NextResponse.json({ error: 'Employee is required.' }, { status: 400 });
        if (!body.date) return NextResponse.json({ error: 'Date is required.' }, { status: 400 });
        if (!status) return NextResponse.json({ error: 'Status must be one of: present, absent, half-day, leave.' }, { status: 400 });

        const db = await getCloudDb();

        // employeeId from the client is the employee's Mongo _id string - validate ownership.
        if (!ObjectId.isValid(employeeId)) return NextResponse.json({ error: 'Invalid employee.' }, { status: 400 });
        const emp = await db.collection('erp_employees').findOne({ _id: new ObjectId(employeeId), tenantId: user.tenantId });
        if (!emp) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });

        const { start } = dayBounds(body.date);

        await db.collection('erp_attendance').updateOne(
            { tenantId: user.tenantId, employeeId, date: start },
            {
                $set: {
                    tenantId: user.tenantId,
                    employeeId,
                    employeeName: emp.name,
                    date: start,
                    status,
                    checkIn: sanitizeStr(body.checkIn, 10),
                    checkOut: sanitizeStr(body.checkOut, 10),
                    notes: sanitizeStr(body.notes, 500),
                    updatedAt: new Date(),
                },
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/hr/attendance') }, { status: 500 });
    }
}
