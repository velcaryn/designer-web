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
const TELEGRAM_TIMEOUT_MS = 8000;

/* The message below is sent as plain text, not markdown, so there is
   nothing to escape for Telegram's parser. This only strips control
   characters, which would otherwise let a submitted value inject line
   breaks and forge extra fields in the message. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

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

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Bad request.' }, { status: 400 });
    }

    /* Honeypot: a real person never sees this field, so anything in it
       is a script. Answer 200 so the bot believes it succeeded. */
    if (clean(body.bot_trap)) {
        return Response.json({ ok: true });
    }

    /* Time to fill. `_t` is set on mount in the browser, so this is the
       time the form was actually on screen. */
    const loadedAt = Number(body._t);
    if (Number.isFinite(loadedAt) && loadedAt > 0) {
        if (Date.now() - loadedAt < MIN_FILL_MS) {
            return Response.json({ ok: true });
        }
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
