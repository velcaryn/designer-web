/**
 * Password policy, shared by every place a password is set.
 *
 * WHY THIS EXISTS
 *
 * The rule was an 8-character minimum, duplicated in two routes with two
 * different error strings and no agreement between them. Length alone accepts
 * `password123`, which appears in essentially every credential-stuffing list,
 * and these credentials sign in to a hospital system holding patient records.
 *
 * Two checks, in cost order: a local length check first, then a breach lookup
 * only if the password is otherwise acceptable.
 */

import crypto from 'node:crypto';

/**
 * 12, up from 8. Length is the single strongest lever against offline cracking
 * of a bcrypt hash, and it costs the user nothing that a passphrase does not
 * already give them.
 */
export const MIN_PASSWORD_LENGTH = 12;

const HIBP_ENDPOINT = 'https://api.pwnedpasswords.com/range';
const HIBP_TIMEOUT_MS = 2500;

/**
 * Checks a password against HaveIBeenPwned's breach corpus.
 *
 * Uses the k-anonymity range API: we SHA-1 the password locally and send only
 * the first five hex characters. HIBP returns every suffix sharing that prefix,
 * typically several hundred, and the comparison happens here. The password, and
 * even its full hash, never leaves this process.
 *
 * SHA-1 is not a security choice: it is the digest HIBP's corpus is indexed by.
 * It is a lookup key, not password storage. Storage is bcrypt, elsewhere.
 *
 * @returns {Promise<number>} times seen in breaches, or 0 if clean/unavailable
 */
export async function breachCount(password) {
    try {
        const sha1 = crypto.createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
        const prefix = sha1.slice(0, 5);
        const suffix = sha1.slice(5);

        const res = await fetch(`${HIBP_ENDPOINT}/${prefix}`, {
            headers: { 'Add-Padding': 'true' },
            signal: AbortSignal.timeout(HIBP_TIMEOUT_MS),
        });
        if (!res.ok) return 0;

        for (const line of (await res.text()).split('\n')) {
            const [hashSuffix, count] = line.trim().split(':');
            if (hashSuffix === suffix) return parseInt(count, 10) || 0;
        }
        return 0;
    } catch {
        /*
         * FAIL OPEN, deliberately. If HIBP is slow, rate-limiting us or down,
         * the correct outcome is that a nurse can still change their password.
         * Blocking every credential change in the hospital because a
         * third-party service is unavailable would be a worse outcome than
         * briefly accepting a weak password.
         */
        return 0;
    }
}

/**
 * Validates a candidate password.
 *
 * @returns {Promise<{ok: true} | {ok: false, error: string}>}
 */
export async function validatePassword(password) {
    if (typeof password !== 'string') {
        return { ok: false, error: 'Password is required.' };
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return {
            ok: false,
            error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters. A short phrase you will remember works well.`,
        };
    }

    const seen = await breachCount(password);
    if (seen > 0) {
        /*
         * The count is deliberately included. "Found in a data breach" reads as
         * an accusation about this account; "appears in N breached passwords"
         * makes it clear the password itself is public knowledge, which is the
         * fact that matters and the one that persuades someone to change it.
         */
        return {
            ok: false,
            error: `This password appears in ${seen.toLocaleString('en-IN')} known data breaches and is unsafe. Please choose another.`,
        };
    }

    return { ok: true };
}
