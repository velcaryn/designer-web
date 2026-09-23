import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeEmail, sanitizePhone, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';
import { NOT_DELETED } from '@/lib/userLifecycle';

export const dynamic = 'force-dynamic';

const EMPLOYEE_STATUSES = ['active', 'inactive'];

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;
        const { id } = await context.params;
        const db = await getCloudDb();
        const employee = await db.collection('erp_employees').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!employee) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
        return NextResponse.json({ employee: { ...employee, _id: employee._id.toString() } });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/hr/employees/[id]') }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;
        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('erp_employees').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };
        if (body.name !== undefined) update.name = sanitizeStr(body.name, 200);
        if (body.email !== undefined) update.email = sanitizeEmail(body.email);
        if (body.phone !== undefined) update.phone = sanitizePhone(body.phone);
        if (body.designation !== undefined) update.designation = sanitizeStr(body.designation, 100);
        if (body.salary !== undefined) update.salary = sanitizeNum(body.salary, 0);
        if (body.notes !== undefined) update.notes = sanitizeStr(body.notes, 2000);
        if (body.status !== undefined && EMPLOYEE_STATUSES.includes(body.status)) update.status = body.status;
        if (body.departmentId !== undefined) {
            if (body.departmentId && ObjectId.isValid(body.departmentId)) {
                const dept = await db.collection('erp_departments').findOne({ _id: new ObjectId(body.departmentId), tenantId: user.tenantId });
                update.departmentId = dept ? body.departmentId : null;
                update.departmentName = dept ? dept.name : '';
            } else {
                update.departmentId = null;
                update.departmentName = '';
            }
        }

        await db.collection('erp_employees').updateOne({ _id: new ObjectId(id), tenantId: user.tenantId }, { $set: update });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/hr/employees/[id]') }, { status: 500 });
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

        const linkedAccount = await db.collection('tenant_users').findOne({ tenantId: user.tenantId, employeeId: id, ...NOT_DELETED });
        if (linkedAccount) {
            return NextResponse.json({ error: 'This employee has a login account. Deactivate the account before deleting the employee record.' }, { status: 400 });
        }

        const result = await db.collection('erp_employees').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/hr/employees/[id]') }, { status: 500 });
    }
}
