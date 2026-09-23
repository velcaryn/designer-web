/**
 * Shared rate-limit counters, backed by MongoDB.
 *
 * NOW IN USE FROM ROUTE HANDLERS. STILL DO NOT IMPORT THIS FROM src/proxy.js.
 *
 * Next 16 documents the `proxy` runtime as nodejs and says it cannot be
 * configured, which is true of Next itself. Netlify's adapter nonetheless
 * bundles that file as an Edge Function
 * (`___netlify-edge-handler-node-middleware`), and the MongoDB driver needs TCP
 * sockets the edge runtime does not provide. Importing this there builds
 * locally and then fails the Netlify build with "Failed to load external module
 * mongodb", taking production down. That happened once; the framework docs are
 * not sufficient here, the deploy target has to be checked too.
 *
 * This code is correct and tested. To use it, enforcement has to move from
 * proxy.js into the route handlers, which do run on Node.
 *
 * WHY THIS EXISTS
 *
 * The limiter in `src/proxy.js` kept its counters in a module-level `Map`. That
 * is per-process, and Netlify runs many concurrent serverless instances, so the
 * advertised "10 login attempts per 15 minutes" was really "10 per instance per
 * 15 minutes". An attacker spreading requests across warm instances multiplied
 * the real budget by however many were running, which is precisely the case a
 * brute-force limiter exists to stop.
 *
 * WHY MONGODB AND NOT REDIS
 *
 * Mongo is already a dependency with a warm pooled connection, so this adds no
 * vendor, no new secret and no new failure domain. Redis would be the better
 * tool for per-second limits, but these budgets are coarse (10 per 15 minutes,
 * 5 per hour), so one indexed upsert per request is comfortably cheap.
 *
 * This is safe here only because `src/proxy.js` runs on the Node.js runtime.
 * Next 16 renamed `middleware` to `proxy` and fixed its runtime to nodejs, so
 * the MongoDB driver's TCP sockets are available. On the old Edge middleware
 * this approach would not have worked at all.
 *
 * FAIL OPEN, DELIBERATELY
 *
 * Every error path allows the request. A rate limiter is a safety net, not an
 * authentication control: if Mongo is briefly unreachable, the correct
 * behaviour is to let real users log in, not to lock the whole business out of
 * the system. Authentication itself is enforced elsewhere and is unaffected.
 */

import clientPromise, { DB_NAME } from '@/lib/mongodb';

const COLLECTION = 'rate_limits';


let indexReady = null;

/**
 * Ensures the TTL index exists. Mongo's background reaper deletes expired
 * documents, so the collection cannot grow without bound and nothing has to
 * sweep it. Runs once per process; the promise is cached so concurrent
 * requests do not each issue a createIndex.
 */
async function ensureIndex(db) {
    if (!indexReady) {
        indexReady = db.collection(COLLECTION).createIndex(
            { expiresAt: 1 },
            { expireAfterSeconds: 0, name: 'rate_limit_ttl' }
        ).catch(err => {
            // Reset so a later request can retry rather than caching the failure.
            indexReady = null;
            throw err;
        });
    }
    return indexReady;
}

/**
 * Records a hit and reports whether the caller is still within budget.
 *
 * @param {string} key       identifies the bucket, e.g. "1.2.3.4::/api/connect/auth"
 * @param {number} maxHits   allowed hits per window
 * @param {number} windowMs  window length in milliseconds
 * @returns {Promise<boolean>} true if the request should proceed
 */
export async function consumeRateLimit(key, maxHits, windowMs) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        await ensureIndex(db);

        const now = new Date();

        /*
         * One atomic round trip. The upsert both starts a window and increments
         * within it, so two concurrent requests cannot each read "0" and both
         * decide they are the first. Read-then-write would have that race, and
         * a brute-force tool is exactly the workload that would hit it.
         */
        const doc = await db.collection(COLLECTION).findOneAndUpdate(
            { _id: key, expiresAt: { $gt: now } },
            {
                $inc: { count: 1 },
                $setOnInsert: { expiresAt: new Date(now.getTime() + windowMs) },
            },
            { upsert: true, returnDocument: 'after' }
        );

        return (doc?.count ?? 1) <= maxHits;
    } catch (err) {
        /*
         * Includes the duplicate-key race where the window expired between the
         * filter and the upsert. Allowing that single request is the right
         * trade: the next one lands in the fresh window and is counted.
         */
        console.error('[rate-limit] store unavailable, allowing request', err?.message || err);
        return true;
    }
}
