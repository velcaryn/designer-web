import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeEmail } from '@/lib/erpHelpers';
import { sanitizePermissions, permissionDenied } from '@/lib/permissions';
import { seatLimitsForTier } from '@/lib/tiers';
import { logAudit } from '@/lib/auditLog';
import { NOT_DELETED } from '@/lib/userLifecycle';

export const dynamic = 'force-dynamic';

const ACCOUNT_ROLES = ['admin', 'custom'];

function publicAccount(u) {
    if (!u) return null;
    return {
        _id: u._id.toString(),
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        permissions: u.role === 'custom' ? sanitizePermissions(u.permissions) : undefined,
        active: u.active,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
    };
}

/**
 * GET /api/cloud/erp/hr/employees/[id]/account
 * Returns the login account linked to this employee, or { account: null } if none exists yet.
 */
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

        const account = await db.collection('tenant_users').findOne({ tenantId: user.tenantId, employeeId: id, ...NOT_DELETED });
        return NextResponse.json({ account: publicAccount(account) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/hr/employees/[id]/account') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/hr/employees/[id]/account
 * Promotes an Employee to a login-enabled User Account. { username, password, role, permissions? }
 * role: 'admin' (universal rights) or 'custom' (per-module checklist).
 */
export async function POST(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;
        // Only the Primary/Secondary Admin can create accounts - a custom sub-user never can,
        // even if this route were somehow reached (defense in depth beyond nav hiding).
        if (user.role === 'custom') return NextResponse.json({ error: 'Only an Admin can create user accounts.' }, { status: 403 });

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const employee = await db.collection('erp_employees').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!employee) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });

        const existingAccount = await db.collection('tenant_users').findOne({ tenantId: user.tenantId, employeeId: id, ...NOT_DELETED });
        if (existingAccount) return NextResponse.json({ error: 'This employee already has a user account.' }, { status: 400 });

        const username = sanitizeStr(body.username, 100).toLowerCase().replace(/[^a-z0-9-]/g, '');
        const password = String(body.password || '');
        const role = ACCOUNT_ROLES.includes(body.role) ? body.role : null;

        if (!username) return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
        if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        if (!role) return NextResponse.json({ error: 'Role must be admin or custom.' }, { status: 400 });

        // Usernames are unique platform-wide today (login looks up by username alone,
        // with no tenant scoping) - this preserves that invariant for the new sub-user path.
        const usernameTaken = await db.collection('tenant_users').findOne({ username, ...NOT_DELETED });
        if (usernameTaken) return NextResponse.json({ error: 'That username is already taken.' }, { status: 400 });

        // Seat limit check - 'admin' accounts share the admin seat pool with the tenant's
        // owner; 'custom' accounts draw from the sub-user pool. Checked here (not just at
        // onboarding) since tenants can upgrade/downgrade tiers at any time via admin edit.
        const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
        const limits = seatLimitsForTier(tenant?.subscription?.tier);
        const adminSeatLimit = tenant?.subscription?.adminSeatLimit ?? limits.adminSeatLimit;
        const subUserSeatLimit = tenant?.subscription?.subUserSeatLimit ?? limits.subUserSeatLimit;

        if (role === 'admin') {
            const adminCount = await db.collection('tenant_users').countDocuments({ tenantId: user.tenantId, role: { $in: ['owner', 'admin'] }, ...NOT_DELETED });
            if (adminCount >= adminSeatLimit) {
                return NextResponse.json({ error: `Admin seat limit reached (${adminSeatLimit}). Upgrade your plan to add more admins.` }, { status: 403 });
            }
        } else {
            const subUserCount = await db.collection('tenant_users').countDocuments({ tenantId: user.tenantId, role: 'custom', ...NOT_DELETED });
            if (subUserCount >= subUserSeatLimit) {
                return NextResponse.json({ error: `Sub-user seat limit reached (${subUserSeatLimit}). Upgrade your plan to add more users.` }, { status: 403 });
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const permissions = role === 'custom' ? sanitizePermissions(body.permissions) : undefined;

        const doc = {
            tenantId: user.tenantId,
            employeeId: id,
            username,
            name: employee.name,
            email: sanitizeEmail(employee.email) || undefined,
            passwordHash,
            role,
            ...(permissions ? { permissions } : {}),
            active: true,
            createdAt: new Date(),
            lastLoginAt: null,
        };

        const result = await db.collection('tenant_users').insertOne(doc);

        await logAudit(db, {
            tenantId: user.tenantId,
            actorType: 'tenant_user',
            actorId: user.username || user.email,
            action: 'account.create',
            details: { employeeId: id, username, role },
        });

        return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/hr/employees/[id]/account') }, { status: 500 });
    }
}

/**
 * PUT /api/cloud/erp/hr/employees/[id]/account
 * Updates role/permissions/active status, and optionally resets the password.
 * Never touches the Employee record - deactivating an account leaves the employee intact.
 */
export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;
        if (user.role === 'custom') return NextResponse.json({ error: 'Only an Admin can manage user accounts.' }, { status: 403 });

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const account = await db.collection('tenant_users').findOne({ tenantId: user.tenantId, employeeId: id, ...NOT_DELETED });
        if (!account) return NextResponse.json({ error: 'This employee has no user account yet.' }, { status: 404 });
        if (account.role === 'owner') return NextResponse.json({ error: 'The Primary Admin account cannot be managed from here.' }, { status: 400 });

        const update = { updatedAt: new Date() };
        if (body.role !== undefined && ACCOUNT_ROLES.includes(body.role)) update.role = body.role;
        const effectiveRole = update.role || account.role;
        if (effectiveRole === 'custom' && body.permissions !== undefined) {
            update.permissions = sanitizePermissions(body.permissions);
        } else if (effectiveRole === 'admin') {
            update.permissions = undefined;
        }
        if (body.active !== undefined) update.active = !!body.active;
        if (body.password && String(body.password).length >= 8) {
            update.passwordHash = await bcrypt.hash(String(body.password), 12);
        }

        // Seat check: only matters when this update grows a seat pool - promoting to
        // admin, or reactivating a previously-deactivated account. Excludes this account
        // itself from the count since it already occupies (or is re-entering) that pool.
        const willBeActive = update.active !== undefined ? update.active : account.active;
        const promotingToAdmin = effectiveRole === 'admin' && account.role !== 'admin';
        const reactivating = willBeActive && !account.active;
        if (willBeActive && (promotingToAdmin || reactivating)) {
            const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
            const limits = seatLimitsForTier(tenant?.subscription?.tier);
            if (effectiveRole === 'admin') {
                const adminSeatLimit = tenant?.subscription?.adminSeatLimit ?? limits.adminSeatLimit;
                const adminCount = await db.collection('tenant_users').countDocuments({ tenantId: user.tenantId, role: { $in: ['owner', 'admin'] }, active: true, _id: { $ne: account._id }, ...NOT_DELETED });
                if (adminCount >= adminSeatLimit) {
                    return NextResponse.json({ error: `Admin seat limit reached (${adminSeatLimit}). Upgrade your plan to add more admins.` }, { status: 403 });
                }
            } else {
                const subUserSeatLimit = tenant?.subscription?.subUserSeatLimit ?? limits.subUserSeatLimit;
                const subUserCount = await db.collection('tenant_users').countDocuments({ tenantId: user.tenantId, role: 'custom', active: true, _id: { $ne: account._id } });
                if (subUserCount >= subUserSeatLimit) {
                    return NextResponse.json({ error: `Sub-user seat limit reached (${subUserSeatLimit}). Upgrade your plan to add more users.` }, { status: 403 });
                }
            }
        }

        // Mongo can't $set a key to undefined to remove it - split into $set / $unset.
        const setDoc = {};
        const unsetDoc = {};
        for (const [k, v] of Object.entries(update)) {
            if (v === undefined) unsetDoc[k] = ''; else setDoc[k] = v;
        }
        const mongoUpdate = {};
        if (Object.keys(setDoc).length) mongoUpdate.$set = setDoc;
        if (Object.keys(unsetDoc).length) mongoUpdate.$unset = unsetDoc;

        await db.collection('tenant_users').updateOne({ _id: account._id }, mongoUpdate);

        await logAudit(db, {
            tenantId: user.tenantId,
            actorType: 'tenant_user',
            actorId: user.username || user.email,
            action: 'account.update',
            details: { targetAccountId: account._id.toString(), ...setDoc, passwordHash: undefined, passwordChanged: !!update.passwordHash },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/erp/hr/employees/[id]/account') }, { status: 500 });
    }
}
