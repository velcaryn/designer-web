/**
 * Shared API error handling.
 *
 * WHY THIS EXISTS
 *
 * Route handlers were returning `error: err.message` straight to the client.
 * That hands an attacker a free map of the system: MongoDB errors name the
 * database and collection, filesystem errors leak absolute paths, and driver
 * errors disclose library versions with known CVEs. Three of the routes doing
 * it were unauthenticated, so anyone could farm that detail by sending
 * malformed input.
 *
 * The behaviour here already existed as `safeError` in `lib/connectAuth.js`,
 * but that module is Connect's authentication layer. Public catalogue and SEO
 * routes had no business importing from it, which is part of why they never
 * adopted it. Same function, neutral home.
 *
 * The real error is always logged server-side, so nothing is lost for
 * debugging: it moves from the response body to the server log, which is where
 * it belonged.
 */

/**
 * Logs the real error and returns a message that is safe to send to a client.
 *
 * In development the real message is returned, because a developer staring at
 * a generic string while iterating is a bad trade. `NODE_ENV` is 'production'
 * on Netlify, so live traffic only ever sees the generic form.
 *
 * @param {unknown} err     the caught error
 * @param {string}  context short label identifying the call site, for the log
 * @returns {string}        message safe to place in a response body
 */
export function safeError(err, context = 'API Error') {
    console.error(`[${context}]`, err);
    if (process.env.NODE_ENV === 'production') {
        return 'An internal server error occurred. Please try again.';
    }
    return err?.message || 'Unknown error';
}
