import { NextResponse } from 'next/server';
import { consumeRateLimit } from '@/lib/rateLimitStore';

/**
 * Route-handler rate limiting.
 *
 * WHY THIS EXISTS ALONGSIDE src/proxy.js
 *
 * proxy.js has a limiter, but its counters live in a module-level Map, which is
 * per-process. Netlify runs many concurrent instances, so "10 login attempts
 * per 15 minutes" is really "10 per instance", and anyone spreading requests
 * across warm instances multiplies the real budget by however many are running.
 * That is precisely the workload a brute-force limiter exists to stop.
 *
 * The store that fixes it (lib/rateLimitStore.js) cannot be imported into
 * proxy.js: Netlify's adapter bundles that file as an Edge Function despite
 * Next 16 documenting the proxy runtime as nodejs, and the MongoDB driver needs
 * TCP sockets the edge runtime does not provide. Importing it there builds
 * locally and then fails the Netlify build with "Failed to load external module
 * mongodb", taking production down. It has happened once.
 *
 * Route handlers DO run on Node, so enforcement belongs here.
 *
 * BOTH LAYERS STAY. This is not a migration that leaves proxy.js dead. The edge
 * Map rejects a naive single-connection flood before it ever reaches a function
 * invocation, which is cheap and worth keeping; this layer catches the
 * distributed case the Map structurally cannot. Defence in depth, with each
 * layer doing the thing it is actually able to do.
 *
 * FAIL OPEN, DELIBERATELY
 *
 * consumeRateLimit returns true on any store error. A rate limiter is a safety
 * net, not an authentication control: if Mongo is briefly unreachable the
 * correct behaviour is to let a hospital log in, not to lock the building out.
 * Authentication is enforced elsewhere and is unaffected.
 */

/**
 * Best-effort client IP.
 *
 * x-forwarded-for is client-controlled in principle, but on Netlify the edge
 * rewrites it and the FIRST entry is the real client. Trusting it is therefore
 * correct behind this proxy and wrong without one - which is why this is a
 * single shared helper rather than something each route re-derives slightly
 * differently.
 *
 * Falls back to a constant, so a request with no discernible IP shares one
 * bucket with every other such request rather than getting an unlimited one
 * each. Stricter on ambiguity, not looser.
 */
export function clientIp(req) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
    }
    return req.headers.get('x-real-ip')
        || req.headers.get('cf-connecting-ip')
        || 'unknown';
}

/**
 * Budgets, in one table so they can be read against each other rather than
 * scattered across route files. Mirrors the RATE_LIMIT_PROFILES table in
 * proxy.js for the endpoints that appear in both.
 */
export const LIMITS = {
    // Credential checks. A password oracle is the highest-value target here.
    login: { max: 10, windowMs: 15 * 60 * 1000 },

    // Unauthenticated writes that create a database row with no session behind
    // them. Generous enough that a real person retrying is never blocked.
    publicWrite: { max: 5, windowMs: 60 * 60 * 1000 },

    // Patient self check-in. Higher than publicWrite on purpose: a family of
    // four arriving together, each registering from the same waiting-room wifi,
    // presents as one IP. Set below the point where a bored person with a
    // photographed QR can meaningfully flood a desk queue.
    selfRegistration: { max: 12, windowMs: 30 * 60 * 1000 },

    // Per-hospital ceiling, independent of source IP. The per-IP limit does
    // nothing against a handful of phones on mobile data, and the thing being
    // protected is a receptionist's screen, not the server.
    selfRegistrationPerFacility: { max: 60, windowMs: 60 * 60 * 1000 },

    // Read-only public lookups. The reference space is what really protects
    // these; this just makes walking it pointless.
    publicRead: { max: 30, windowMs: 60 * 1000 },

    // EMR AI consultation transcript scribe. Per-clinician limit.
    scribe: { max: 5, windowMs: 60 * 1000 },
};

/**
 * Consumes one unit of budget. Returns null to proceed, or a 429 response.
 *
 * Returning the response rather than throwing keeps the call site a plain
 * early return, which is how the existing permission wrappers read:
 *
 *     const limited = await rateLimit(req, 'preregister', LIMITS.selfRegistration);
 *     if (limited) return limited;
 */
export async function rateLimit(req, bucket, limit, { keySuffix = '' } = {}) {
    const ip = clientIp(req);
    const key = `${ip}::${bucket}${keySuffix ? `::${keySuffix}` : ''}`;
    const allowed = await consumeRateLimit(key, limit.max, limit.windowMs);
    if (allowed) return null;

    const retryAfter = Math.ceil(limit.windowMs / 1000);
    return NextResponse.json(
        // No detail about the budget or how much of it is left. A limiter that
        // reports its own parameters tells an attacker exactly how slowly to go.
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
}

/**
 * A bucket keyed on something other than the caller's IP - a tenant, a slug, an
 * account. Used for ceilings that must hold regardless of how many addresses
 * the requests arrive from.
 */
export async function rateLimitBy(identifier, bucket, limit) {
    const allowed = await consumeRateLimit(`id:${identifier}::${bucket}`, limit.max, limit.windowMs);
    if (allowed) return null;

    return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.windowMs / 1000)) } }
    );
}
