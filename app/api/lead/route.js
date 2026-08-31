/**
 * Receives an enquiry and forwards it to Telegram.
 *
 * TWO FORMS, ONE ROUTE
 *
 * The setup card near the top of the home page and the callback form at
 * #talk both post here. They ask for different things, because they
 * catch people at different moments: the card already knows the business
 * name and the sector, so it asks for one number and nothing else; the
 * form at the bottom is for someone who arrived without touching the
 * card and needs to say who they are from scratch.
 *
 * `source` distinguishes them in the message, so it is possible to tell
 * which half of the page is actually generating conversations. That is
 * the whole reason the field exists.
 *
 * WHAT IS REQUIRED
 *
 * A phone number and nothing else. Every other field is optional and
 * falls back to "Not given", because the point of this route is to be
 * the lowest-friction path on the site. A form that rejects a real
 * person for leaving out their email has cost more than it saved.
 *
 * The defences are all in lib/leadIntake.js, shared with the onboarding
 * route: honeypot, timing gate, per-IP rate limit, pre-parse size cap,
 * control-character stripping and an origin allowlist.
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

const LABEL = 'lead';

/* Where the submission came from, mapped to a heading. An unrecognised
   value is not echoed back into the message: `source` arrives from the
   client like everything else, and a free-text heading would let a
   caller title their own Telegram message. */
const SOURCES = {
    setup: 'New enquiry (setup card)',
    talk: 'New enquiry (callback form)',
};

export async function POST(request) {
    /* First, so a misconfigured deploy reports itself rather than
       answering 403 or 429 and hiding the real reason. */
    if (!telegramConfigured()) return notConfiguredResponse(LABEL);

    if (!originAllowed(request)) {
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
            { error: 'Too many enquiries. Please message us on WhatsApp instead.' },
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

    const phone = clean(body.phone, 20);
    if (!isPhone(phone)) {
        return Response.json(
            { error: 'That number does not look right. Ten digits, or +91 then ten.' },
            { status: 400 },
        );
    }

    const businessName = clean(body.businessName, 120);
    const personName = clean(body.personName, 120);
    const sector = clean(body.sector, 60);
    const note = clean(body.note, 400);
    const email = clean(body.email, 160).toLowerCase();

    /* Optional, but if it was given it has to be plausible: a typo in an
       email we will actually try to reply to is worth catching here
       rather than discovering when the reply bounces. */
    if (email && !isEmail(email)) {
        return Response.json(
            { error: 'That email does not look right.' },
            { status: 400 },
        );
    }

    const heading = SOURCES[clean(body.source, 20)] || 'New enquiry';

    const lines = [
        heading,
        '',
        `Phone:     ${phone}`,
        `Business:  ${businessName || 'Not given'}`,
        `Name:      ${personName || 'Not given'}`,
        `Sector:    ${sector || 'Not given'}`,
        `Email:     ${email || 'Not given'}`,
        note ? '' : null,
        note ? `Note: ${note}` : null,
    ].filter((line) => line !== null);

    const sent = await sendTelegram(lines, LABEL);
    if (sent.error) return sent.error;

    return Response.json({ ok: true });
}
