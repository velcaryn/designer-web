import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import { getCloudDb, safeCloudError } from '@/lib/cloudAuth';
import { logAudit } from '@/lib/auditLog';
import { NOT_DELETED, softDeleteUpdate } from '@/lib/userLifecycle';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/cloud/tenants/[id]/users
 * Soft-deletes EVERY login on one Cloud tenant. The tenant record, its
 * documents and its billing state are untouched: this revokes access, it does
 * not close the account.
 *
 * Mirrors the Connect bulk route deliberately, down to the confirm token, so
 * the two products cannot drift into different meanings of the same button.
 * The owner is spared unless `includeOwner` is explicitly true.
 */
export async function DELETE(req, context) {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const body = await req.json().catch(() => ({}));
        const includeOwner = body.includeOwner === true;

        const db = await getCloudDb();

        const tenant = await db.collection('tenants').findOne({ tenantId: id });
        if (!tenant) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });

        if (body.confirm !== tenant.tenantId) {
            return NextResponse.json(
                { error: 'Confirmation does not match this client. Nothing was deleted.' },
                { status: 400 }
            );
        }

        const filter = {
            tenantId: tenant.tenantId,
            ...NOT_DELETED,
            ...(includeOwner ? {} : { role: { $ne: 'owner' } }),
        };

        const targets = await db.collection('tenant_users').find(filter).toArray();
        for (const user of targets) {
            await db.collection('tenant_users').updateOne(
                { _id: user._id },
                softDeleteUpdate(user, { actorId: session.user?.email })
            );
        }

        await logAudit(db, {
            tenantId: tenant.tenantId,
            actorType: 'admin',
            actorId: session.user?.email,
            action: 'account.delete',
            details: {
                scope: 'all',
                includeOwner,
                count: targets.length,
                usernames: targets.map(u => u.username),
            },
        });

        return NextResponse.json({ success: true, deleted: targets.length });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/admin/cloud/tenants/[id]/users') }, { status: 500 });
    }
}
