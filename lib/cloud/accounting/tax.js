/**
 * THE ONE PLACE AN INVOICE'S TAX IS SPLIT INTO CGST / SGST / IGST.
 *
 * WHY THIS FILE EXISTS
 *
 * The invoice document persisted `subtotal`, `taxRate`, `taxAmount`, `taxType`.
 * The sales-voucher bridge read `totalTaxable`, `taxTotal`, `cgstTotal`,
 * `sgstTotal`, `igstTotal`. Not one field name overlapped.
 *
 * Nothing errored. `Number(undefined) || 0` is 0, so every GST amount came out
 * zero, and `totalTaxable` fell through to `grandTotal - 0`. The voucher still
 * balanced perfectly - Dr debtor = Cr sales = the full tax-inclusive amount - so
 * every check passed while revenue was overstated by exactly the tax on every
 * invoice ever raised, and the Output GST ledgers stayed empty. A hospital's
 * GSTR-1 built from that ledger would have under-reported its liability.
 *
 * That is the worst shape a money bug can take: silent, balanced, and wrong.
 *
 * It was possible because two modules each held their own idea of what an
 * invoice's tax looks like. So there is one module now, both sides call it, and
 * a field-name drift becomes a failing test rather than a quiet mis-posting.
 *
 * Client-safe: pure functions, no DB imports, so the invoice form can show the
 * same split the ledger will post.
 */

const r2 = n => Math.round((Number(n) || 0) * 100) / 100;

/*
 * THE REAL VOCABULARY, taken from the data rather than invented.
 *
 * tenant_documents.taxType holds exactly three values in production:
 * 'Tax', 'CGST_SGST', 'IGST' - set by the radio group in QuoteForm.js:516 and
 * rendered by the public quote page and the PDF builder. Confirmed with a
 * distinct() over the collection.
 *
 * Matching is case-insensitive and tolerates the snake_case spellings, because
 * getting this wrong is not a cosmetic failure: a value that fails to match
 * 'IGST' falls through to the intra-state branch and splits an inter-state tax
 * into CGST + SGST, which files the same rupees against the wrong government.
 */
export const TAX_TREATMENTS = {
    CGST_SGST: 'CGST_SGST',
    IGST: 'IGST',
    /** The generic "Tax / GST" option - a treatment was never declared. */
    UNSPECIFIED: 'Tax',
    NONE: 'none',
};

function normalizeTreatment(taxType) {
    const t = String(taxType || '').trim().toLowerCase();
    if (t === 'igst') return TAX_TREATMENTS.IGST;
    if (t === 'cgst_sgst' || t === 'cgst+sgst' || t === 'cgst-sgst') return TAX_TREATMENTS.CGST_SGST;
    if (t === 'none' || t === '') return TAX_TREATMENTS.NONE;
    return TAX_TREATMENTS.UNSPECIFIED;
}

/**
 * Splits a single tax amount into its GST components.
 *
 * An UNSPECIFIED treatment ('Tax') is split as INTRA-STATE. That is an
 * inference, and it is the safer one: an intra-state assumption still lands the
 * full amount in GST liability ledgers and totals correctly, so the mistake is
 * recoverable by reclassifying. Assuming inter-state instead would credit the
 * wrong tax account entirely. Where the treatment matters the invoice should
 * declare it, and `isInferred` below lets callers surface that.
 *
 * The halves always re-add to the original to the paise. `taxAmount / 2` on an
 * odd number of paise loses one - 1500.01 gives 750.005 twice, which rounds to
 * 750.01 twice and invents a paisa. CGST takes the odd paise, the same
 * convention the HMS invoice engine uses.
 */
export function splitGst(taxAmount, taxType = TAX_TREATMENTS.UNSPECIFIED) {
    const total = r2(taxAmount);
    if (!(total > 0)) return { cgst: 0, sgst: 0, igst: 0 };

    const treatment = normalizeTreatment(taxType);
    if (treatment === TAX_TREATMENTS.IGST) {
        return { cgst: 0, sgst: 0, igst: total };
    }
    if (treatment === TAX_TREATMENTS.NONE) {
        return { cgst: 0, sgst: 0, igst: 0 };
    }

    const half = Math.floor((total * 100) / 2) / 100;
    const cgst = r2(total - half);
    return { cgst, sgst: half, igst: 0 };
}

/** True when the split was assumed rather than declared - worth showing a user. */
export function isInferredTreatment(taxType, taxAmount) {
    return r2(taxAmount) > 0 && normalizeTreatment(taxType) === TAX_TREATMENTS.UNSPECIFIED;
}

/**
 * The canonical tax block for an invoice document.
 *
 * Persisted onto tenant_documents at write time and read back by the voucher
 * bridge, so the ledger posts what the invoice actually said rather than
 * re-deriving it later from fields that may have moved on.
 *
 * `totalTaxable` is derived as grandTotal - taxTotal rather than taken from
 * `subtotal`, because subtotal is pre-discount and the tax is charged on the
 * discounted value. Using subtotal would leave the voucher's taxable line
 * disagreeing with its own grand total on every discounted invoice.
 */
export function buildTaxBlock({ grandTotal, taxAmount, taxType }) {
    const gross = r2(grandTotal);
    const taxTotal = r2(taxAmount);
    const { cgst, sgst, igst } = splitGst(taxTotal, taxType);

    return {
        taxTotal,
        cgstTotal: cgst,
        sgstTotal: sgst,
        igstTotal: igst,
        totalTaxable: r2(gross - taxTotal),
        // Recorded on the document so a later reclassification can find exactly
        // the invoices whose split was assumed, rather than re-guessing all of them.
        taxTreatmentInferred: isInferredTreatment(taxTotal ? taxType : 0, taxTotal),
    };
}

/**
 * Checks that a tax block can actually be posted, and says why when it cannot.
 *
 * The bridge calls this and THROWS on failure rather than posting a
 * best-effort voucher. That is a deliberate reversal: the previous behaviour
 * was to silently fall back, which is exactly how the original defect stayed
 * invisible for the life of the module. A refused posting appears on the
 * unposted worklist where somebody can see it; a wrong posting does not.
 */
export function validateTaxBlock(block) {
    const taxTotal = r2(block?.taxTotal);
    const parts = r2((Number(block?.cgstTotal) || 0) + (Number(block?.sgstTotal) || 0) + (Number(block?.igstTotal) || 0));

    if (taxTotal > 0 && parts === 0) {
        return { ok: false, error: 'Invoice carries tax but none of it could be attributed to CGST, SGST or IGST.' };
    }
    if (Math.abs(taxTotal - parts) > 0.01) {
        return { ok: false, error: `Tax components (${parts}) do not add up to the tax total (${taxTotal}).` };
    }
    if (r2(block?.totalTaxable) < 0) {
        return { ok: false, error: 'Taxable value is negative - tax exceeds the invoice total.' };
    }
    return { ok: true };
}

/**
 * Reads the tax block off a document, deriving it when absent.
 *
 * Every invoice written before this module existed has `taxAmount` + `taxType`
 * and none of the split fields. Deriving on read means those invoices post
 * correctly without a backfill, and the backfill becomes an optimisation
 * rather than a prerequisite.
 */
export function taxBlockOf(doc) {
    if (doc?.totalTaxable !== undefined && doc?.taxTotal !== undefined) {
        return {
            taxTotal: r2(doc.taxTotal),
            cgstTotal: r2(doc.cgstTotal),
            sgstTotal: r2(doc.sgstTotal),
            igstTotal: r2(doc.igstTotal),
            totalTaxable: r2(doc.totalTaxable),
        };
    }
    return buildTaxBlock({
        grandTotal: doc?.grandTotal,
        taxAmount: doc?.taxAmount,
        taxType: doc?.taxType,
    });
}
