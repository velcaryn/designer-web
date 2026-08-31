/**
 * Shared intake machinery for every public form on this site.
 *
 * WHY THIS EXISTS
 *
 * app/api/cloud/onboarding/route.js was audited line by line and every
 * finding fixed: a rate limiter, a pre-parse size cap, a honeypot, a
 * timing gate that fails closed, control-character stripping, and an
 * origin allowlist. All of that was written for one route.
 *
 * The moment a second form ships, the choice is to import that posture
 * or to re-derive it from memory. Re-deriving it is how a site ends up
 * with one hardened endpoint and one open one. So it lives here, and
 * both routes call it.
 *
 * The limiter Map is deliberately shared rather than per-route. One
 * client gets one budget across every form on the site, which is what
 * you actually want: an attacker who has exhausted /api/lead should not
 * find /api/cloud/onboarding sitting there with a fresh allowance.
 */

const MIN_FILL_MS = 2500;
/* A `_t` older than this is stale rather than trusted, so a single
   harvested timestamp cannot be replayed indefinitely. */
const MAX_FILL_MS = 24 * 60 * 60 * 1000;
const TELEGRAM_TIMEOUT_MS = 8000;

/* The real forms post well under 1KB. Anything approaching this is not
   a form, and it is rejected before the body is read rather than after:
   `request.json()` buffers the whole thing first. */
export const MAX_BODY_BYTES = 16 * 1024;

/* Rate limit: a fixed window per client IP.
 *
 * THIS IS IN-MEMORY, AND THAT IS A REAL LIMIT, NOT AN OVERSIGHT.
 *
 * The map lives in module scope, so it resets on every redeploy and is
 * not shared between serverless instances. A determined attacker with
 * many source addresses gets through. What it does stop is the actual
 * threat to a public signup form, which is one script in a loop from one
 * address filling the chat until Telegram throttles the bot. If this
 * ever needs to be airtight it wants a shared store (Upstash or
 * similar), which is a dependency and two more env vars.
 */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

/* THE SECOND LIMIT: A CEILING ON EVERYTHING, NOT PER ADDRESS.
 *
 * The per-IP limiter above stops one script in a loop from one address.
 * It does nothing against a botnet or a rented proxy pool, where every
 * request arrives from a fresh address and each one gets its own clean
 * bucket of five.
 *
 * This is the backstop: a hard ceiling on how many submissions this
 * instance will forward in an hour, whoever sends them. Sixty is far
 * above any honest day on a site of this size and far below the volume
 * that makes the Telegram chat unusable, which is the actual damage a
 * flood does here.
 *
 * It is still in-memory and still per-instance, so a redeploy resets it
 * and several instances each get their own sixty. That is a genuine
 * limit and it is the reason this is a backstop rather than a solution:
 * a shared store (Upstash or similar) is what makes it airtight, at the
 * cost of a dependency, two env vars and a round-trip per submission.
 * The trade was considered and this was chosen deliberately.
 */
const GLOBAL_MAX = 60;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
let globalWindowStart = Date.now();
let globalCount = 0;

/**
 * The instance-wide ceiling. True means "stop, whoever this is".
 *
 * Checked alongside the per-IP limiter, not instead of it: they answer
 * different questions. One asks whether this caller is being abusive,
 * the other whether the site as a whole is under a flood.
 */
export function globalLimited() {
    const now = Date.now();

    if (now - globalWindowStart > GLOBAL_WINDOW_MS) {
        globalWindowStart = now;
        globalCount = 0;
    }

    globalCount += 1;

    if (globalCount > GLOBAL_MAX) {
        /* Logged once per breach rather than per request, so a flood
           does not also flood the logs. A real one appearing here means
           either genuine unexpected demand or an attack, and both are
           worth knowing about. */
        if (globalCount === GLOBAL_MAX + 1) {
            console.warn(
                '[intake] global hourly cap reached',
                `${GLOBAL_MAX} in ${GLOBAL_WINDOW_MS / 60000}min`,
            );
        }
        return true;
    }

    return false;
}

export function rateLimited(ip) {
    const now = Date.now();

    /* Sweep expired entries on the way through, so the map cannot grow
       without bound on a long-running instance. */
    for (const [key, entry] of hits) {
        if (now - entry.start > RATE_LIMIT_WINDOW_MS) hits.delete(key);
    }

    const entry = hits.get(ip);
    if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
        hits.set(ip, { start: now, count: 1 });
        return false;
    }

    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX;
}

/* The client address, from the most trustworthy header available.
 *
 * ORDER MATTERS, AND THE FIRST VERSION HAD IT BACKWARDS.
 *
 * It read `x-forwarded-for` first and took entry [0]. On Netlify the
 * edge APPENDS the real client to whatever the caller already sent, so
 * a request carrying its own `X-Forwarded-For: 9.9.9.1` arrives as
 * "9.9.9.1, <real ip>" and entry [0] is the attacker's invention.
 * Verified against the running route: rotating that header through
 * seven values produced seven 200s where a fixed address correctly gave
 * 429 after five. The rate limit was bypassable by anyone who read the
 * source, and this repository is going public.
 *
 * `x-nf-client-connection-ip` is set by Netlify's edge and cannot be
 * spoofed by the caller, so it is consulted first. `x-forwarded-for` is
 * the fallback for other hosts and for local development, and there we
 * take the LAST entry rather than the first: proxies append, so the
 * entry nearest the server is the one the infrastructure added.
 *
 * A value the caller controls is not an identity. Where nothing
 * trustworthy is available the bucket is shared, which throttles more
 * people than it should but never fewer. */
export function clientIp(request) {
    const netlify = request.headers.get('x-nf-client-connection-ip');
    if (netlify) return netlify.trim();

    const real = request.headers.get('x-real-ip');
    if (real) return real.trim();

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length) return parts[parts.length - 1];
    }

    return 'unknown';
}

/* Same-origin only, and only when the browser told us the origin.
 *
 * There is no cookie and no session here, so this is not classic CSRF
 * protection: an attacker gains nothing from a forged cross-site POST
 * that they could not get by calling the endpoint directly. It is one
 * more cheap hurdle, nothing more. It fails OPEN on a missing Origin
 * because non-browser clients legitimately omit the header, and
 * refusing those would break more than it protects. */
export function originAllowed(request) {
    const origin = request.headers.get('origin');
    if (!origin) return true;

    /* `x-forwarded-host` first: behind Netlify's proxy, `host` can be an
       internal hostname while the browser's Origin carries the real
       domain, and comparing those two rejected every genuine
       submission. SITE_HOST covers the custom-domain-vs-*.netlify.app
       case, and accepts a comma-separated list. */
    const allowed = [
        request.headers.get('x-forwarded-host'),
        request.headers.get('host'),
        ...String(process.env.SITE_HOST || '').split(','),
    ]
        .map((h) => String(h || '').trim())
        .filter(Boolean);

    try {
        return allowed.includes(new URL(origin).host);
    } catch {
        return false;
    }
}

/* Messages are sent as plain text, not markdown, so there is nothing to
   escape for Telegram's parser. This strips anything a client might
   render as a line break, which would otherwise let a submitted value
   forge extra fields in the message: a business name of
   "Acme<LS>Phone: +91 ...<LS>Owner: someone" arrives looking like it
   carries a different phone number and owner.
   The first version covered only C0 and DEL. That missed U+2028 LINE
   SEPARATOR and U+2029 PARAGRAPH SEPARATOR, which plenty of clients do
   render as breaks, so the filter was bypassable. C1 is included for
   the same reason. */
const CONTROL_CHARS = new RegExp(
    '[\\u0000-\\u001f\\u007f-\\u009f\\u2028\\u2029]',
    'g',
);

export function clean(value, max = 200) {
    return String(value ?? '')
        .replace(CONTROL_CHARS, ' ')
        .trim()
        .slice(0, max);
}

export function isEmail(v) {
    return /^\S+@\S+\.\S+$/.test(v);
}

export function isPhone(v) {
    return /^(?:\+91)?[0-9]{10}$/.test(String(v).replace(/\s+/g, ''));
}

/**
 * Reads the JSON body with both size gates applied.
 *
 * Returns `{ body }` or `{ error }` where error is a ready Response, so
 * a route can `if (read.error) return read.error;` and move on.
 */
export async function readBounded(request) {
    /* Checked before the body is read, so an oversized payload is never
       buffered into memory at all. */
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
        return {
            error: Response.json({ error: 'Payload too large.' }, { status: 413 }),
        };
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return { error: Response.json({ error: 'Bad request.' }, { status: 400 }) };
    }

    /* A body with no declared length still has to be bounded: chunked
       encoding omits content-length entirely. */
    if (JSON.stringify(body ?? '').length > MAX_BODY_BYTES) {
        return {
            error: Response.json({ error: 'Payload too large.' }, { status: 413 }),
        };
    }

    return { body };
}

/**
 * The two bot signals, together. True means "this was a script".
 *
 * `bot_trap` is a honeypot no human can see, so anything in it is a bot.
 *
 * `_t` is when the form was loaded, so the gap is how long it was
 * actually on screen. A missing or unparseable `_t` is a FAILED check,
 * not an absent one: an earlier version only tested the value when it
 * happened to parse, which meant a bot that simply omitted the field
 * skipped the gate entirely, as did one sending "abc" or a date in the
 * future. Every one of those now fails the same as filling the form
 * impossibly fast.
 *
 * Callers answer 200 on a fail, so a script never learns which check
 * stopped it.
 */
export function botSignalsFail(body, label = 'form') {
    if (clean(body.bot_trap)) return true;

    const loadedAt = Number(body._t);
    const elapsed = Date.now() - loadedAt;
    const plausible = Number.isFinite(loadedAt)
        && loadedAt > 0
        && elapsed >= MIN_FILL_MS
        && elapsed < MAX_FILL_MS;

    if (!plausible) {
        /* Logged, because a genuine visitor tripping this gate is
           indistinguishable from success on the client: they are told
           they are on the list while nothing is sent. If this line
           appears for real people, the timestamp is not reaching the
           route, and the bots are not the problem. */
        console.warn(`[${label}] _t gate rejected a submission`, '_t=', body._t);
        return true;
    }

    return false;
}

/**
 * Sends a plain-text message to the configured chat.
 *
 * Returns `{ ok: true }` or `{ error }` carrying a ready Response. The
 * caller never sees a Telegram status code and neither does the visitor:
 * a transport error is logged server-side and answered generically,
 * because which upstream failed is not the visitor's problem.
 */
export function telegramConfigured() {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/**
 * The 500 a route returns when the environment is not set up.
 *
 * Checked at the TOP of a route, before the origin and rate-limit
 * guards, so a misconfigured deploy says so instead of answering 403 or
 * 429 and leaving you to guess. sendTelegram re-checks it anyway,
 * because a route that forgets this call must still not silently drop a
 * real submission.
 */
export function notConfiguredResponse(label = 'form') {
    console.error(`[${label}] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set`);
    return Response.json(
        { error: 'Submissions are not configured right now.' },
        { status: 500 },
    );
}

export async function sendTelegram(lines, label = 'form') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        /* A misconfigured deploy must not look like a working one: the
           visitor would be told they are on the list while nothing was
           ever sent. */
        return { error: notConfiguredResponse(label) };
    }

    /* An abort controller, because a hung request to Telegram would
       otherwise hold the response open until the platform's own timeout
       and leave the visitor watching a spinner. */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

    try {
        const res = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: lines.join('\n'),
                    disable_web_page_preview: true,
                }),
                signal: controller.signal,
            },
        );

        if (!res.ok) {
            const detail = await res.text().catch(() => '');
            console.error(`[${label}] telegram rejected the message`, res.status, detail);
            return {
                error: Response.json(
                    { error: 'That did not go through. Please try again.' },
                    { status: 502 },
                ),
            };
        }

        return { ok: true };
    } catch (err) {
        console.error(`[${label}] could not reach telegram`, err);
        return {
            error: Response.json(
                { error: 'That did not go through. Please try again.' },
                { status: 502 },
            ),
        };
    } finally {
        clearTimeout(timeout);
    }
}
