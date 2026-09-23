/**
 * Soft delete, password reset and session revocation for the two tenant-facing
 * user collections: `connect_users` (Connect) and `tenant_users` (Cloud).
 *
 * WHY A SHARED MODULE, given the two auth boundaries are deliberately isolated:
 * the isolation that matters is the *secret* and the *cookie*, and neither is
 * touched here. What is shared is the lifecycle rule - what "deleted" means,
 * and how a live session is cut off - and duplicating that produced the exact
 * drift this file exists to prevent: a delete that blocks the login page while
 * leaving an already-issued 7 day token working.
 *
 * SOFT DELETE, NOT HARD DELETE. Rows are retained so an audit entry that names
 * a user id still resolves. Three things happen together, and all three are
 * required for the delete to be real:
 *
 *   1. `active: false`         - both login routes already query `active: true`,
 *                                so this is what blocks the next sign-in.
 *   2. `deletedAt: <Date>`     - the tombstone. Everything that lists users
 *                                filters on it, so a deleted user disappears
 *                                from admin UIs and seat counts.
 *   3. `sessionsRevokedAt`     - cuts off tokens ALREADY ISSUED. Without this a
 *                                deleted user keeps full access for up to seven
 *                                days, which is the whole point of the button.
 *
 * The username is also released (moved to `username_deleted`) so the hospital
 * can re-create a login under the same name, which they expect to be able to
 * do the moment they have removed someone.
 */

/** Collection names, so a typo cannot silently target a non-existent collection. */
export const CONNECT_USERS = 'connect_users';
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
 * Restricts a connect_users query to STAFF, excluding patients.
 *
 * Patients share the connect_users collection (see src/lib/hms/db.js) with
 * role: 'patient' and no credentials. Two separate defects have come from
 * querying that collection without this predicate:
 *
 * 1. Patients appeared in a staff roster. On the tenant-facing team page that
 *    was cosmetic until someone used the row's role dropdown, which rewrote the
 *    patient to role:'custom' and removed them from every `role: 'patient'`
 *    query - the Patient Directory, patient search, and appointment-to-patient
 *    resolution all lost the person. On the internal admin page the same rows
 *    also carried a Delete button whose bulk filter matched every patient in
 *    the hospital.
 * 2. Tallies counted patients as seats, so a clinic with 100 patients read as
 *    103 users on the internal clients table.
 *
 * BOTH terms are required. `role: { $ne: 'patient' }` alone misses legacy rows
 * written before the role was set; `username: { $exists: true }` alone would
 * admit any future credential-less staff record. Staff always have a username,
 * patients never do - that is the discriminator, and check-staff-queries.mjs
 * enforces that both terms travel together.
 */
export const STAFF_ONLY = { role: { $ne: 'patient' }, username: { $exists: true } };

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
