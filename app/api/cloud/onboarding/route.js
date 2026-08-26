/**
 * Receives a /cloud/onboarding submission and forwards it to Telegram.
 *
 * WHY THIS IS A SERVER ROUTE AND NOT A FETCH FROM THE PAGE
 *
 * The bot token is a bearer credential: anyone holding it can post as
 * the bot. Calling Telegram from the browser would put it in the client
 * bundle where anyone can read it. It is read from the environment here,
 * on the server, and never leaves it. The variables are deliberately not
 * prefixed NEXT_PUBLIC_, which is what keeps Next from inlining them.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * The source repo's route validated against a database, enforced tiers
 * and rate limits, and created a tenant. None of that is in scope here
 * and none of it exists in this repo. This route does one thing: check
 * the submission looks human and well-formed, format it, and send it.
 *
 * The bot signals from the original are honoured: `bot_trap` is a
 * honeypot no human can see, and `_t` is when the form was loaded, so a
 * submission that arrives implausibly fast is a script. Both are
 * answered with a 200 rather than an error, because telling a bot which
 * check it failed just helps it try again.
 */

const MIN_FILL_MS = 2500;
/* A `_t` older than this is treated as stale rather than trusted, so a
   single harvested timestamp cannot be replayed indefinitely. */
const MAX_FILL_MS = 24 * 60 * 60 * 1000;
const TELEGRAM_TIMEOUT_MS = 8000;

/* The real form posts well under 1KB. Anything approaching this is not
   the form, and it is rejected before the body is read rather than
   after: `request.json()` buffers the whole thing first. */
const MAX_BODY_BYTES = 16 * 1024;

/* Rate limit: a fixed window per client IP.
 *
 * THIS IS IN-MEMORY, AND THAT IS A REAL LIMIT, NOT AN OVERSIGHT.
 *
 * The map lives in module scope, so it resets on every redeploy and is
 * not shared between serverless instances. A determined attacker with
 * many source addresses gets through. What it does stop is the actual
 * threat to a public signup form, which is one script in a loop from
 * one address filling the chat until Telegram throttles the bot. If
 * this ever needs to be airtight, it wants a shared store (Upstash or
 * similar), which is a dependency and two more env vars. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

function rateLimited(ip) {
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

/* The client address, taken only from headers the platform sets. Never
   from anything in the body: a value the caller controls is not an
   identity, and keying a limiter on one would let an attacker mint a
   fresh bucket per request. `x-forwarded-for` is a list, and the client
   is the first entry. */
function clientIp(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-nf-client-connection-ip')
        || request.headers.get('x-real-ip')
        || 'unknown';
}

/* Same-origin only, and only when the browser told us the origin.
 *
 * There is no cookie and no session here, so this is not classic CSRF
 * protection: an attacker gains nothing from a forged cross-site POST
 * that they could not get by calling the endpoint directly. It is one
 * more cheap hurdle, nothing more. It fails OPEN on a missing Origin
 * because non-browser clients legitimately omit the header, and
 * refusing those would break more than it protects. */
function originAllowed(request) {
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

/* The message below is sent as plain text, not markdown, so there is
   nothing to escape for Telegram's parser. This strips anything a
   client might render as a line break, which would otherwise let a
   submitted value forge extra fields in the message: a business name of
   "Acme<LS>Phone: +91 ...<LS>Owner: someone" arrives looking like it
   carries a different phone number and owner.

   The first version covered only C0 and DEL. That missed U+2028 LINE
   SEPARATOR and U+2029 PARAGRAPH SEPARATOR, which plenty of clients do
   render as breaks, so the filter was bypassable. C1 (U+0080-U+009F) is
   included for the same reason. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;

function clean(value, max = 200) {
    return String(value ?? '')
        .replace(CONTROL_CHARS, ' ')
        .trim()
        .slice(0, max);
}

function isEmail(v) {
    return /^\S+@\S+\.\S+$/.test(v);
}

function isPhone(v) {
    return /^(?:\+91)?[0-9]{10}$/.test(String(v).replace(/\s+/g, ''));
}

export async function POST(request) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        /* A misconfigured deploy must not look like a working one: the
           visitor would be told they are on the list while nothing was
           ever sent. */
        console.error('[onboarding] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set');
        return Response.json(
            { error: 'Submissions are not configured right now.' },
            { status: 500 },
        );
    }

    if (!originAllowed(request)) {
        /* Logged because this is otherwise indistinguishable from a
           broken form: the visitor sees a generic error and there is no
           way to tell which host pairing was refused. */
        console.error(
            '[onboarding] origin refused',
            'origin=', request.headers.get('origin'),
            'host=', request.headers.get('host'),
            'x-forwarded-host=', request.headers.get('x-forwarded-host'),
        );
        return Response.json({ error: 'Bad request.' }, { status: 403 });
    }

    if (rateLimited(clientIp(request))) {
        return Response.json(
            { error: 'Too many submissions. Please try again later.' },
            { status: 429 },
        );
    }

    /* Checked before the body is read, so an oversized payload is never
       buffered into memory at all. */
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
        return Response.json({ error: 'Payload too large.' }, { status: 413 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Bad request.' }, { status: 400 });
    }

    /* A body with no declared length still has to be bounded: chunked
       encoding omits content-length entirely. */
    if (JSON.stringify(body ?? '').length > MAX_BODY_BYTES) {
        return Response.json({ error: 'Payload too large.' }, { status: 413 });
    }

    /* Honeypot: a real person never sees this field, so anything in it
       is a script. Answer 200 so the bot believes it succeeded. */
    if (clean(body.bot_trap)) {
        return Response.json({ ok: true });
    }

    /* Time to fill. `_t` is set on mount in the browser, so this is how
       long the form was actually on screen.

       A missing or unparseable `_t` is now a FAILED check, not an absent
       one. The first version only tested the value when it happened to
       parse, which meant a bot that simply omitted the field skipped the
       gate entirely, as did one sending "abc" or a date in the future.
       Every one of those is now treated the same as filling the form
       impossibly fast. Still answered 200, so a script learns nothing
       about which check stopped it. */
    const loadedAt = Number(body._t);
    const elapsed = Date.now() - loadedAt;
    const plausible = Number.isFinite(loadedAt)
        && loadedAt > 0
        && elapsed >= MIN_FILL_MS
        && elapsed < MAX_FILL_MS;

    if (!plausible) {
        /* Still 200, so a script learns nothing. But logged, because a
           genuine visitor tripping this gate is indistinguishable from
           success on the client: they are told they are on the list
           while nothing is sent. If this line appears for real people,
           the timestamp is not reaching the route, not the bots. */
        console.warn('[onboarding] _t gate rejected a submission', '_t=', body._t);
        return Response.json({ ok: true });
    }

    const businessName = clean(body.businessName, 120);
    const ownerName = clean(body.ownerName, 120);
    const email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 20);

    if (!businessName || !ownerName) {
        return Response.json(
            { error: 'Business and owner name are required.' },
            { status: 400 },
        );
    }
    if (!isEmail(email)) {
        return Response.json(
            { error: 'That email does not look right.' },
            { status: 400 },
        );
    }
    if (!isPhone(phone)) {
        return Response.json(
            { error: 'That phone number does not look right.' },
            { status: 400 },
        );
    }

    const address = body.address || {};
    const line2 = clean(address.line2, 160);
    const lines = [
        'New VelBiz Cloud signup',
        '',
        `Business:  ${businessName}`,
        `Owner:     ${ownerName}`,
        `Type:      ${clean(body.businessType, 40) || 'Not given'}`,
        `Email:     ${email}`,
        `Phone:     ${phone}`,
        '',
        'Address',
        `  ${clean(address.line1, 160) || 'Not given'}`,
        line2 ? `  ${line2}` : null,
        `  ${clean(address.city, 80)}, ${clean(address.state, 80)} ${clean(address.pin, 10)}`,
        `  GSTIN: ${clean(body.gstin, 20) || 'Not given'}`,
    ].filter((line) => line !== null);

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
            /* Log the reason server-side, tell the visitor nothing about
               the transport: a Telegram error code is not their problem
               and not their business. */
            const detail = await res.text().catch(() => '');
            console.error('[onboarding] telegram rejected the message', res.status, detail);
            return Response.json(
                { error: 'That did not go through. Please try again.' },
                { status: 502 },
            );
        }

        return Response.json({ ok: true });
    } catch (err) {
        console.error('[onboarding] could not reach telegram', err);
        return Response.json(
            { error: 'That did not go through. Please try again.' },
            { status: 502 },
        );
    } finally {
        clearTimeout(timeout);
    }
}
