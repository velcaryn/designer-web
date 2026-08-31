/**
 * Receives a /cloud/onboarding submission and forwards it to Telegram.
 *
 * WHY THIS IS A SERVER ROUTE AND NOT A FETCH FROM THE PAGE
 *
 * The bot token is a bearer credential: anyone holding it can post as
 * the bot. Calling Telegram from the browser would put it in the client
 * bundle where anyone can read it. It is read from the environment on
 * the server and never leaves it. The variables are deliberately not
 * prefixed NEXT_PUBLIC_, which is what keeps Next from inlining them.
 *
 * WHERE THE DEFENCES LIVE
 *
 * Every guard this route used to carry inline now lives in
 * lib/leadIntake.js, because a second public form shipped and the
 * alternative was re-deriving the same posture from memory. That module
 * is the audited one; this file is now just the shape of one form.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * The source repo's route validated against a database, enforced tiers,
 * and created a tenant. None of that is in scope here and none of it
 * exists in this repo. This route does one thing: check the submission
 * looks human and well-formed, format it, and send it.
 */
import {
    botSignalsFail,
    clean,
    clientIp,
    isEmail,
    isPhone,
    notConfiguredResponse,
    originAllowed,
    globalLimited,
    rateLimited,
    readBounded,
    sendTelegram,
    telegramConfigured,
} from '@/lib/leadIntake';

const LABEL = 'onboarding';

export async function POST(request) {
    /* First, so a misconfigured deploy reports itself rather than
       answering 403 or 429 and hiding the real reason. */
    if (!telegramConfigured()) return notConfiguredResponse(LABEL);

    if (!originAllowed(request)) {
        /* Logged because this is otherwise indistinguishable from a
           broken form: the visitor sees a generic error and there is no
           way to tell which host pairing was refused. */
        console.error(
            `[${LABEL}] origin refused`,
            'origin=', request.headers.get('origin'),
            'host=', request.headers.get('host'),
            'x-forwarded-host=', request.headers.get('x-forwarded-host'),
        );
        return Response.json({ error: 'Bad request.' }, { status: 403 });
    }

    /* Two limits, both before the body is read. The per-IP one stops a
       single abusive caller; this one stops a distributed flood that
       gives every request a fresh address and therefore a fresh bucket.
       Same 429 either way: which limit was hit is not the caller's
       business. */
    if (globalLimited()) {
        return Response.json(
            { error: 'Too many enquiries. Please message us on WhatsApp instead.' },
            { status: 429 },
        );
    }

    if (rateLimited(clientIp(request))) {
        return Response.json(
            { error: 'Too many submissions. Please try again later.' },
            { status: 429 },
        );
    }

    const read = await readBounded(request);
    if (read.error) return read.error;
    const { body } = read;

    /* Answered 200 so a script believes it succeeded and learns nothing
       about which check stopped it. */
    if (botSignalsFail(body, LABEL)) {
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

    const sent = await sendTelegram(lines, LABEL);
    if (sent.error) return sent.error;

    return Response.json({ ok: true });
}
