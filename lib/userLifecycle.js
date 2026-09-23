/**
 * Soft delete, password reset and session revocation for VelBiz Cloud's
 * tenant users (`tenant_users`).
 *
 * One module for the lifecycle rule - what "deleted" means, and how a live
 * session is cut off - so the tenant's own team screen and the admin area
 * apply it the same way. The failure it exists to prevent: a delete that
 * blocks the login page while leaving an already-issued 7 day token working.
 *
 * SOFT DELETE, NOT HARD DELETE. Rows are retained so an audit entry that names
 * a user id still resolves. Three things happen together, and all three are
 * required for the delete to be real:
 *
 *   1. `active: false`         - the login route already queries `active: true`,
 *                                so this is what blocks the next sign-in.
 *   2. `deletedAt: <Date>`     - the tombstone. Everything that lists users
 *                                filters on it, so a deleted user disappears
 *                                from admin UIs and seat counts.
 *   3. `sessionsRevokedAt`     - cuts off tokens ALREADY ISSUED. Without this a
 *                                deleted user keeps full access for up to seven
 *                                days, which is the whole point of the button.
 *
 * The username is also released (moved to `username_deleted`) so the business
 * can re-create a login under the same name, which they expect to be able to
 * do the moment they have removed someone.
 */

/** Collection names, so a typo cannot silently target a non-existent collection. */
export const CLOUD_USERS = 'tenant_users';

/**
 * Excludes soft-deleted users from a query. Spread into every find/count that
 * lists or tallies accounts.
 *
 * `{ $in: [null, false] }` rather than `{ $exists: false }` deliberately: every
 * user document written before this feature has no `deletedAt` key at all, and
 * both spellings must keep reading as "not deleted" forever.
 */
export const NOT_DELETED = { deletedAt: { $in: [null, false] } };

/**
 * The `$set` document that soft-deletes a user.
 *
 * `username` is freed by moving it aside rather than clearing it, so the old
 * value stays legible in support and audit contexts ("who was pharm-2 before?").
 */
export function softDeleteUpdate(user, { actorId }) {
    const at = new Date();
    return {
        $set: {
            active: false,
            deletedAt: at,
            deletedBy: actorId || null,
            // Any token issued before this instant is refused on its next request.
            sessionsRevokedAt: at,
            // Free the name for reuse while keeping the original readable.
            username: `deleted:${user._id.toString()}`,
            username_deleted: user.username,
        },
    };
}

/**
 * The `$set` document for an admin-initiated password reset.
 *
 * Resetting a password revokes existing sessions too. An admin resets a
 * password either because it leaked or because the account changed hands, and
 * in both cases leaving the old session alive defeats the reset.
 */
export function passwordResetUpdate(passwordHash, { actorId }) {
    const at = new Date();
    return {
        $set: {
            passwordHash,
            passwordChangedAt: at,
            passwordChangedBy: actorId || null,
            sessionsRevokedAt: at,
            // A reset is also the intended way back in for a locked-out user, so
            // it clears any `mustChangePassword` style flag being false already.
            active: true,
        },
    };
}

/**
 * True when a JWT payload has been outlived by a revocation stamp on its user
 * document, i.e. the session must be rejected.
 *
 * `iat` is in SECONDS (JWT spec); `sessionsRevokedAt` is a JS Date in
 * milliseconds. Comparing them without the conversion makes every token look
 * ancient and logs the entire estate out, so the units are converted explicitly
 * here rather than at each call site.
 *
 * Fails CLOSED: a token with no `iat` cannot be shown to predate the
 * revocation, and is treated as revoked.
 */
export function isSessionRevoked(payload, userDoc) {
    if (!userDoc) return true;
    if (userDoc.deletedAt) return true;
    if (userDoc.active === false) return true;

    const revokedAt = userDoc.sessionsRevokedAt;
    if (!revokedAt) return false;

    const iat = payload?.iat;
    if (typeof iat !== 'number') return true;

    // One second of slack absorbs the rounding in `iat` (floor to the second),
    // which would otherwise revoke a token issued in the same second as the
    // stamp - the exact case of an admin resetting a password and the user
    // signing straight back in.
    return iat * 1000 < new Date(revokedAt).getTime() - 1000;
}
