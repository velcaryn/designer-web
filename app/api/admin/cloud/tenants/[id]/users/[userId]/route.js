import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import { getCloudDb, safeCloudError } from '@/lib/cloudAuth';
import { logAudit } from '@/lib/auditLog';
import { NOT_DELETED, softDeleteUpdate } from '@/lib/userLifecycle';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/cloud/tenants/[id]/users/[userId]
 * Soft-deletes one Cloud user. The owner is refused: it is the tenant's only
 * guaranteed way in, and the bulk route is where removing it is an explicit,
 * separately confirmed decision.
 */
export async function DELETE(req, context) {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, userId } = await context.params;
        if (!ObjectId.isValid(userId)) return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });

        const db = await getCloudDb();

        const tenant = await db.collection('tenants').findOne({ tenantId: id });
        if (!tenant) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });

        // Scoped by tenantId as well as _id so a mismatched pair cannot reach
        // another tenant's user.
        const user = await db.collection('tenant_users').findOne({
            _id: new ObjectId(userId),
            tenantId: tenant.tenantId,
            ...NOT_DELETED,
        });
        if (!user) return NextResponse.json({ error: 'User not found for this client.' }, { status: 404 });

        if (user.role === 'owner') {
            return NextResponse.json({ error: 'The primary admin account cannot be deleted from here.' }, { status: 400 });
        }

        await db.collection('tenant_users').updateOne(
            { _id: user._id },
            softDeleteUpdate(user, { actorId: session.user?.email })
        );

        await logAudit(db, {
            tenantId: tenant.tenantId,
            actorType: 'admin',
            actorId: session.user?.email,
            action: 'account.delete',
            details: { username: user.username, role: user.role, scope: 'single' },
        });

        return NextResponse.json({ success: true, deleted: 1 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/admin/cloud/tenants/[id]/users/[userId]') }, { status: 500 });
    }
}
