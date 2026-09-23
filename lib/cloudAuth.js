/**
 * VelBiz Cloud tenant authentication.
 *
 * Completely isolated from the admin area (Google sign-in through NextAuth,
 * getServerSession): its own JWT cookie ('cloud_session') and its own secret
 * (CLOUD_JWT_SECRET), so neither session can be used in place of the other.
 */
import { jwtVerify } from 'jose';
import { ObjectId } from 'mongodb';
import { isSessionRevoked } from './userLifecycle';
import clientPromise, { DB_NAME as CLOUD_DB_NAME } from './mongodb';

/*
 * The tenant session secret. Fails closed: a running production server
 * without CLOUD_JWT_SECRET refuses to authenticate anyone, because the only
 * alternative is signing sessions with a key anyone can read in this file.
 * The placeholder exists solely so `next build` can import this module while
 * collecting page data, which never signs or verifies a real token.
 *
 * Deliberately NOT the admin's NEXTAUTH_SECRET as a fallback: the two sign-ins
 * are separate boundaries, and sharing a secret would let one forge the other.
 */
const rawSecret = process.env.CLOUD_JWT_SECRET;
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';
if (!rawSecret && process.env.NODE_ENV === 'production' && !IS_BUILD) {
    throw new Error('CLOUD_JWT_SECRET is not set. VelBiz Cloud cannot authenticate tenants without it.');
}

export const CLOUD_JWT_SECRET = new TextEncoder().encode(
    rawSecret || 'local-development-only-cloud-jwt-secret'
);

export const CLOUD_COOKIE_NAME = 'cloud_session';

/** The database name is decided once, in lib/mongodb.js. */
export const IS_PROD = process.env.NODE_ENV === 'production';
export { CLOUD_DB_NAME };

if (!IS_PROD) {
    console.log(`[CloudAuth] ☁️ DEV mode - using database: ${CLOUD_DB_NAME}`);
}

/**
 * Verifies the cloud_session cookie and returns the JWT payload, augmented with
 * the tenant's LIVE entitlements read fresh from the database on every call.
 *
 * WHY THE DB READ LIVES HERE, in the auth helper rather than in each route:
 * every one of the ~140 Cloud route handlers already begins with exactly this
 * call and then hands the result to permissionDenied(). Attaching entitlements
 * at this single choke point makes all of them plan-aware at once, with no
 * per-route edit to forget. hasPermission() (lib/permissions.js) checks the
 * tenant ceiling BEFORE the owner/admin bypass, so this is what stops a
 * tenant's own owner login from reaching modules their plan never included.
 *
 * It is re-read per request, never cached and never taken from the JWT, so a
 * tier change, a module override or a billing hold applied in the VelBiz
 * admin dashboard takes effect on the tenant's very next click - not at their
 * next login. That immediacy is the point of the control surface.
 *
 * Cost is one indexed findOne on `tenants` per API call, with a tight
 * projection - the same trade Connect already makes in
 * connectPermissionsServer.js for the same reason.
 *
 * Returns null if unauthenticated or the token is invalid/expired.
 */
export async function getCloudUser(req) {
    if (!process.env.CLOUD_JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
        throw new Error('Neither CLOUD_JWT_SECRET nor NEXTAUTH_SECRET is set at runtime.');
    }
    const cookie = req.cookies.get(CLOUD_COOKIE_NAME);
    if (!cookie?.value) return null;
    let payload;
    try {
        ({ payload } = await jwtVerify(cookie.value, CLOUD_JWT_SECRET));
    } catch {
        return null;
    }

    // Authentication has already succeeded above. This second step only ever
    // NARROWS what the caller may reach, so a failure here must fail CLOSED for
    // the plan gate rather than throw and turn a 403 into a 500. An unreadable
    // tenant doc yields `undefined` entitlements, which moduleAllowedForTenant()
    // treats as unrestricted - matching the pre-entitlement behaviour for the
    // legacy tenants that genuinely have no plan doc.
    // Account state is checked BEFORE entitlements, and unlike them it fails
    // CLOSED. A deleted, deactivated or password-reset user must lose access on
    // their very next request, not when their 7 day token happens to expire -
    // otherwise "delete user" is a button that does nothing for a week.
    try {
        const db = await getCloudDb();
        const account = await db.collection('tenant_users').findOne(
            { _id: new ObjectId(String(payload.sub)) },
            { projection: { active: 1, deletedAt: 1, sessionsRevokedAt: 1 } }
        );
        if (isSessionRevoked(payload, account)) return null;
    } catch (err) {
        // A DB outage must not become a free pass. Authentication itself has
        // already succeeded cryptographically, but we cannot confirm the
        // account still exists, so we refuse.
        console.error('[CloudAuth] account state read failed, refusing session', err);
        return null;
    }

    try {
        const entitlements = await fetchTenantEntitlements(payload.tenantId);
        return { ...payload, entitlements };
    } catch (err) {
        console.error('[CloudAuth] entitlement read failed, falling back to unrestricted', err);
        return payload;
    }
}

/**
 * `tenants.modules` plus the live billing state for one tenant - the plan-level
 * ceiling every account at that tenant sits under.
 *
 * `subscription.status`/`trialEndsAt` are folded in alongside `modules` rather
 * than read separately, because moduleAllowedForTenant() needs all of them to
 * answer one question; splitting the read would let a tenant sit half-suspended
 * for the width of a request.
 */
async function fetchTenantEntitlements(tenantId) {
    if (!tenantId) return null;
    const db = await getCloudDb();
    const tenant = await db.collection('tenants').findOne(
        { tenantId },
        { projection: { modules: 1, 'subscription.status': 1, 'subscription.trialEndsAt': 1, 'subscription.tier': 1 } }
    );
    if (!tenant) return null;

    const modules = tenant.modules || null;
    const status = tenant.subscription?.status;

    // A tenant with no `modules.tier` predates entitlements and stays
    // UNRESTRICTED - synthesising a tier here would silently constrain every
    // legacy tenant the day this shipped. Status is the exception: it has
    // always been meaningful, so a non-active legacy tenant still gets gated.
    if (!modules || !modules.tier) {
        if (status && status !== 'active') {
            return { tier: tenant.subscription?.tier || 'free_trial', profile: 'general', status, moduleOverrides: {} };
        }
        return null;
    }

    return {
        ...modules,
        // The live billing state always wins over a stale copy inside `modules`.
        status: status || modules.status || 'active',
        trialEndsAt: tenant.subscription?.trialEndsAt ?? modules.trialEndsAt ?? null,
    };
}

/**
 * Returns a connected MongoDB db instance using the shared connection pool.
 */
export async function getCloudDb() {
    const client = await clientPromise;
    return client.db(CLOUD_DB_NAME);
}

/**
 * Returns a safe error message for API responses.
 * In production, hides internal details. Always logs the full error server-side.
 */
export function safeCloudError(err, context = 'Cloud API Error') {
    console.error(`[${context}]`, err);
    if (process.env.NODE_ENV === 'production') {
        return 'An internal server error occurred. Please try again.';
    }
    return err?.message || 'Unknown error';
}
