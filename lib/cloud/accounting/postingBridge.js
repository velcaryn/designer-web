/**
 * THE ONE WAY A CLOUD MODULE POSTS TO THE GENERAL LEDGER.
 *
 * WHY THIS FILE EXISTS
 *
 * Both auto-post call sites looked like this:
 *
 *     postSalesVoucherFromInvoice(db, tenantId, doc, user).catch(() => {});
 *
 * Not awaited, and every error swallowed by an empty catch. Two problems, and
 * the second is worse than it looks:
 *
 *   1. Not awaited means the response returns first. On a serverless host the
 *      lambda can be frozen the moment it responds, so the voucher may simply
 *      never be written. Nothing retries it, because nothing knows.
 *   2. `.catch(() => {})` means a failure leaves NO trace anywhere - no log, no
 *      flag on the document, nothing. The invoice looks posted, the ledger does
 *      not have it, and the divergence is discovered at year end.
 *
 * The rule this module encodes: **billing is a non-fatal side effect of a
 * business write, but a failed posting is never silent.** A clinical or
 * commercial action must not fail because the ledger is unhappy - but somebody
 * has to be able to find out that it did.
 *
 * So every posting goes through postToLedger(), which awaits, logs, and stamps
 * the outcome onto the source document. `GET /accounting/unposted` then lists
 * exactly the documents whose voucher never landed. This is the same
 * surface-it-to-a-human treatment the HMS side gives unbilled bed-days, and it
 * is what makes a non-fatal side effect safe rather than merely quiet.
 */

/** Stamped onto the source document so a failure is findable later. */
export const POSTING_STATUS = {
    POSTED: 'posted',
    FAILED: 'failed',
    SKIPPED: 'skipped',
};

/**
 * Runs a posting, records the outcome, and never throws.
 *
 * @param collection  the source collection, e.g. 'tenant_documents'
 * @param documentId  the source document's _id
 * @param post        async () => voucher
 */
export async function postToLedger(db, { tenantId, collection, documentId, label }, post) {
    const stamp = async (patch) => {
        if (!collection || !documentId) return;
        try {
            await db.collection(collection).updateOne(
                { _id: documentId },
                { $set: { ledgerPosting: { ...patch, at: new Date() } } }
            );
        } catch (err) {
            // Stamping is best-effort. Failing to record the outcome must not
            // turn a successful posting into a failed request.
            console.error(`[accounting] could not stamp posting status on ${collection}/${documentId}`, err);
        }
    };

    try {
        const voucher = await post();

        if (!voucher) {
            await stamp({ status: POSTING_STATUS.SKIPPED, reason: 'Nothing to post.' });
            return { ok: true, skipped: true, voucher: null };
        }

        await stamp({
            status: POSTING_STATUS.POSTED,
            voucherId: String(voucher._id),
            voucherNumber: voucher.voucherNumber,
        });
        return { ok: true, voucher };
    } catch (err) {
        /*
         * LOUD IN THE LOG, RECORDED ON THE DOCUMENT, AND STILL NOT THROWN.
         *
         * The caller's own write has already succeeded and must stand - refusing
         * an invoice because the ledger could not accept it would be the wrong
         * trade. But this is the line that used to be `.catch(() => {})`, and
         * everything below it is the difference between a known gap and an
         * invisible one.
         */
        console.error(`[accounting] failed to post ${label || collection} ${documentId}:`, err);
        await stamp({
            status: POSTING_STATUS.FAILED,
            error: String(err?.message || err).slice(0, 500),
        });
        return { ok: false, error: err };
    }
}

/**
 * Source documents whose voucher never landed.
 *
 * Deliberately includes documents with NO `ledgerPosting` field at all when
 * they predate this module - a document that was never even attempted is as
 * unposted as one that failed, and only counting explicit failures would hide
 * every invoice raised before today.
 */
export async function findUnposted(db, tenantId, { collection = 'tenant_documents', match = {}, limit = 200 } = {}) {
    return db.collection(collection).find({
        tenantId,
        ...match,
        $or: [
            { 'ledgerPosting.status': POSTING_STATUS.FAILED },
            { ledgerPosting: { $exists: false } },
        ],
    }).sort({ createdAt: -1 }).limit(limit).toArray();
}
