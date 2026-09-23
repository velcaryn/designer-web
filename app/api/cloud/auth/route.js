import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { getCloudDb, getCloudUser, CLOUD_JWT_SECRET, CLOUD_COOKIE_NAME, safeCloudError } from '@/lib/cloudAuth';
import { sanitizePermissions } from '@/lib/permissions';
import { rateLimit, rateLimitBy, LIMITS } from '@/lib/rateLimit';
import { NOT_DELETED } from '@/lib/userLifecycle';

export const dynamic = 'force-dynamic';

const COOKIE_TTL = 60 * 60 * 24 * 7; // 7 days

// ── POST /api/cloud/auth → Login ─────────────────────────────────────────────
export async function POST(req) {
    try {
        // Durable, cross-instance limit. proxy.js's Map is per Edge isolate, so
        // its budget multiplies by the number of warm instances - on a
        // password endpoint that is the difference between a limit and the
        // appearance of one. See src/lib/rateLimit.js.
        const limited = await rateLimit(req, 'cloud-login', LIMITS.login);
        if (limited) return limited;

        const body = await req.json();
        const { username, password } = body;

        if (!username || !password || typeof username !== 'string' || typeof password !== 'string')
            return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });

        if (username.length > 100 || password.length > 200)
            return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });

        const db = await getCloudDb();

        const user = await db.collection('tenant_users').findOne({
            username: username.toLowerCase().trim(),
            active: true,
            ...NOT_DELETED,
        });

        // Constant-time comparison even when user not found (prevents timing attacks)
        const dummyHash = '$2b$12$invalidhashfortimingnormalization000000000000000000000';
        const passwordOk = user
            ? await bcrypt.compare(password, user.passwordHash)
            : await bcrypt.compare(password, dummyHash).then(() => false);

        if (!user || !passwordOk) {
            return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
        }

        // Fetch tenant record.
        //
        // Only 'suspended' (and a missing tenant) refuses login outright.
        // 'restricted' - the billing hold - deliberately still signs a session:
        // the whole point of the graded state is that a tenant behind on an
        // invoice can still reach and export their own records and fix their
        // own billing details, while the modules that generate new billable
        // work are withheld per-request by moduleAllowedForTenant(). Refusing
        // the login here would collapse it back into a full lockout.
        //
        // Note this is intentionally NOT `!== 'active'`: any unrecognised or
        // legacy status value falls through to a normal login and is then
        // constrained (or not) by the per-request plan gate, so a typo in the
        // status field can never lock a paying tenant out of their workspace.
        const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
        if (!tenant) {
            return NextResponse.json({ error: 'Your workspace is not active. Please contact support.' }, { status: 403 });
        }
        if (tenant.subscription?.status === 'suspended') {
            return NextResponse.json({ error: 'This workspace is suspended. Please contact VelBiz support.' }, { status: 403 });
        }

        // Update lastLoginAt (non-blocking)
        db.collection('tenant_users').updateOne(
            { _id: user._id },
            { $set: { lastLoginAt: new Date() } }
        ).catch(() => {});

        // A doc created before sub-users existed has no role at all - treat as owner
        // (the original single full-rights login), not as an unprivileged custom user.
        const role = user.role || 'owner';
        const permissions = role === 'custom' ? sanitizePermissions(user.permissions) : undefined;

        // Sign JWT
        const token = await new SignJWT({
            sub: user._id.toString(),
            username: user.username,
            name: user.name || '',
            tenantId: user.tenantId,
            businessName: tenant.businessName || user.tenantId,
            role,
            employeeId: user.employeeId || null,
            ...(permissions ? { permissions } : {}),
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(CLOUD_JWT_SECRET);

        const res = NextResponse.json({
            ok: true,
            user: {
                username: user.username,
                name: user.name || '',
                tenantId: user.tenantId,
                businessName: tenant.businessName || user.tenantId,
                role,
                employeeId: user.employeeId || null,
                ...(permissions ? { permissions } : {}),
            },
        });

        res.cookies.set(CLOUD_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_TTL,
            path: '/',
        });

        return res;
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/auth') }, { status: 500 });
    }
}

// ── DELETE /api/cloud/auth → Logout ──────────────────────────────────────────
export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(CLOUD_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
    });
    return res;
}

// ── GET /api/cloud/auth → Validate session ───────────────────────────────────
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });

        const db = await getCloudDb();
        const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });

        return NextResponse.json({
            authenticated: true,
            user: {
                ...user,
                businessName: tenant?.businessName || user.businessName,
                companyTag1: tenant?.companyTag1 || '',
                companyTag2: tenant?.companyTag2 || '',
                companyTag3: tenant?.companyTag3 || '',
                contact: tenant?.contact || { owner: user.name, email: user.email || '', phone: '', gstin: '', address: null },
                branding: tenant?.branding || { customHexColor: '#4A1088', docPrefix: 'DOC' }
            }
        });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
