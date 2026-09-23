import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();

        const hasEmployees = await db.collection('erp_employees').countDocuments({ tenantId: user.tenantId, departmentId: id });
        if (hasEmployees > 0) {
            return NextResponse.json({ error: 'Cannot delete a department that still has employees assigned to it.' }, { status: 400 });
        }

        const result = await db.collection('erp_departments').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/erp/hr/departments/[id]') }, { status: 500 });
    }
}
