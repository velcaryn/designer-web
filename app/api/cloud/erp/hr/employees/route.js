import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateEmployeeNumber, sanitizeStr, sanitizeEmail, sanitizePhone, sanitizeNum, paginationFromParams } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';
import { NOT_DELETED } from '@/lib/userLifecycle';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const departmentId = searchParams.get('departmentId');
        const { skip, limit, page } = paginationFromParams(searchParams, 100);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (status) filter.status = status;
        if (departmentId) filter.departmentId = departmentId;

        const [employees, total, accounts] = await Promise.all([
            db.collection('erp_employees').find(filter).sort({ name: 1 }).skip(skip).limit(limit).toArray(),
            db.collection('erp_employees').countDocuments(filter),
            db.collection('tenant_users').find({ tenantId: user.tenantId, employeeId: { $exists: true, $ne: null }, ...NOT_DELETED }).toArray(),
        ]);

        // Attach a lightweight account summary per employee so the UI can show
        // "Create Account" vs "Manage Account" without an extra request per card.
        const accountByEmployee = Object.fromEntries(accounts.map(a => [a.employeeId, {
            role: a.role, active: a.active,
        }]));

        return NextResponse.json({
            employees: employees.map(e => ({ ...e, _id: e._id.toString(), account: accountByEmployee[e._id.toString()] || null })),
            total, page, pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/hr/employees') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const body = await req.json();
        const name = sanitizeStr(body.name, 200);
        if (!name) return NextResponse.json({ error: 'Employee name is required.' }, { status: 400 });

        const db = await getCloudDb();

        // Resolve department by id if provided (stored as id + a name snapshot, same
        // pattern as vendorName on purchase orders - avoids a join on every read).
        let departmentId = null;
        let departmentName = '';
        if (body.departmentId && ObjectId.isValid(body.departmentId)) {
            const dept = await db.collection('erp_departments').findOne({ _id: new ObjectId(body.departmentId), tenantId: user.tenantId });
            if (dept) { departmentId = body.departmentId; departmentName = dept.name; }
        }

        const employeeNumber = await generateEmployeeNumber(user.tenantId);

        const employee = {
            tenantId: user.tenantId,
            employeeNumber,
            name,
            email: sanitizeEmail(body.email),
            phone: sanitizePhone(body.phone),
            designation: sanitizeStr(body.designation, 100),
            departmentId,
            departmentName,
            salary: sanitizeNum(body.salary, 0),
            dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : new Date(),
            status: 'active',
            notes: sanitizeStr(body.notes, 2000),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_employees').insertOne(employee);
        return NextResponse.json({ success: true, _id: result.insertedId.toString(), employeeNumber }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/hr/employees') }, { status: 500 });
    }
}
