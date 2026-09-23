import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import { getCloudDb, safeCloudError } from '@/lib/cloudAuth';
import { validatePassword } from '@/lib/passwordPolicy';
import { logAudit } from '@/lib/auditLog';
import { NOT_DELETED, passwordResetUpdate } from '@/lib/userLifecycle';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cloud/tenants/[id]/users/[userId]/password
 * Admin-initiated password reset for any single Cloud user, owner included.
 *
 * The tenant PUT could already set the owner's password as a side effect of
 * saving the whole tenant form, which meant resetting one sub-user's password
 * was impossible and resetting the owner's required submitting every other
 * field alongside it. This does the one thing, for any user, and revokes their
 * existing sessions with it.
 */
export async function POST(req, context) {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, userId } = await context.params;
        if (!ObjectId.isValid(userId)) return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });

        const { password } = await req.json();
        if (!password || typeof password !== 'string') {
            return NextResponse.json({ error: 'A new password is required.' }, { status: 400 });
        }
        if (password.length > 128) {
            return NextResponse.json({ error: 'Password is too long.' }, { status: 400 });
        }

        const policy = await validatePassword(password);
        if (!policy.ok) return NextResponse.json({ error: policy.error }, { status: 400 });

        const db = await getCloudDb();

        const tenant = await db.collection('tenants').findOne({ tenantId: id });
        if (!tenant) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });

        const user = await db.collection('tenant_users').findOne({
            _id: new ObjectId(userId),
            tenantId: tenant.tenantId,
            ...NOT_DELETED,
        });
        if (!user) return NextResponse.json({ error: 'User not found for this client.' }, { status: 404 });

        const passwordHash = await bcrypt.hash(password, 12);
        await db.collection('tenant_users').updateOne(
            { _id: user._id },
            passwordResetUpdate(passwordHash, { actorId: session.user?.email })
        );

        await logAudit(db, {
            tenantId: tenant.tenantId,
            actorType: 'admin',
            actorId: session.user?.email,
            action: 'account.password_reset',
            details: { username: user.username, role: user.role },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/admin/cloud/tenants/[id]/users/[userId]/password') }, { status: 500 });
    }
}
