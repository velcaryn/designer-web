/**
 * TRANSLATES THE LEGACY SINGLE-ENTRY CASHBOOK INTO DOUBLE-ENTRY VOUCHERS.
 *
 * WHY THIS EXISTS
 *
 * Cloud carried two sets of books that never spoke to each other:
 *
 *   erp_ledger_entries  - a single-entry cashbook. {type: income|expense,
 *                         category, amount, bankAccountId}. This is where bank
 *                         account balances were computed from.
 *   erp_ledgers         - the double-entry chart of accounts, and the only
 *                         thing the trial balance, P&L and balance sheet see.
 *
 * A cashbook entry was therefore invisible to every financial statement, and a
 * voucher was invisible to the bank balance. The two could disagree forever and
 * neither would ever notice, because nothing compared them. "What is in the
 * bank" and "what do the books say is in the bank" were separate questions with
 * separately maintained answers.
 *
 * A cashbook entry is not missing information - it is a double entry with one
 * side left implicit. "Income of 10,000 categorised Sales, into bank account X"
 * means Dr Bank, Cr Sales. The category is the other leg, written as a label
 * instead of a ledger. So this module makes the implicit leg explicit.
 *
 * WHAT IT REFUSES TO GUESS
 *
 * An unrecognised category goes to the SUSPENSE account, never to a plausible
 * guess. Suspense is visible, reconcilable and obviously unfinished; a wrong
 * confident mapping is none of those, and it lands in a real expense head where
 * nobody will ever look for it again. A hospital would rather see "3 entries in
 * suspense" than have its rent silently booked as freight.
 */

/**
 * Category label -> ledger code.
 *
 * Keys are lowercased and matched loosely, because these are free text typed by
 * users over time - "Salaries", "salaries", "Salary" all mean the same head.
 * Taken from the categories actually present in the data rather than invented.
 */
const CATEGORY_LEDGERS = {
    // Income
    'sales': 'LED_SALES_DOMESTIC',
    'sales invoice': 'LED_SALES_DOMESTIC',
    'service': 'LED_SERVICE_INCOME',
    'service income': 'LED_SERVICE_INCOME',
    'interest': 'LED_INTEREST_INCOME',
    'discount received': 'LED_DISCOUNT_RECEIVED',

    // Expenses
    'raw material': 'LED_PURCHASES_GENERAL',
    'purchase': 'LED_PURCHASES_GENERAL',
    'purchases': 'LED_PURCHASES_GENERAL',
    'freight': 'LED_FREIGHT_INWARD',
    'salaries': 'LED_SALARIES_WAGES',
    'salary': 'LED_SALARIES_WAGES',
    'wages': 'LED_SALARIES_WAGES',
    'rent': 'LED_OFFICE_RENT',
    'office rent': 'LED_OFFICE_RENT',
    'utilities': 'LED_ELECTRICITY_EXPENSE',
    'electricity': 'LED_ELECTRICITY_EXPENSE',
    'software': 'LED_SOFTWARE_EXPENSE',
    'printing': 'LED_PRINTING_STATIONERY',
    'stationery': 'LED_PRINTING_STATIONERY',
    'bank charges': 'LED_BANK_CHARGES',
    'travel': 'LED_TRAVEL_EXPENSE',
    'marketing': 'LED_MARKETING_EXPENSE',
    'advertising': 'LED_MARKETING_EXPENSE',
};

export const SUSPENSE_LEDGER_CODE = 'LED_SUSPENSE';

/**
 * The ledger a category maps to, and whether that was a real match.
 *
 * `matched: false` is the signal that this entry needs a human. It is returned
 * rather than thrown so a migration can report every unmapped category in one
 * pass instead of stopping at the first.
 */
export function ledgerCodeForCategory(category) {
    const key = String(category || '').trim().toLowerCase();
    const code = CATEGORY_LEDGERS[key];
    if (code) return { code, matched: true };
    return { code: SUSPENSE_LEDGER_CODE, matched: false };
}

/** Every category this module knows, for reporting coverage before a migration. */
export function knownCategories() {
    return Object.keys(CATEGORY_LEDGERS);
}

/**
 * Builds the two-sided voucher payload for one cashbook entry.
 *
 * Income  -> Dr Bank/Cash, Cr the category ledger.
 * Expense -> Dr the category ledger, Cr Bank/Cash.
 *
 * `sourceRef` makes this idempotent: re-running the migration over an entry
 * that already posted returns the existing voucher instead of a second one, so
 * the script is safe to run repeatedly while categories are being corrected.
 */
export function voucherForCashbookEntry(entry, { bankLedgerId, categoryLedgerId }) {
    const amount = Math.round((Number(entry.amount) || 0) * 100) / 100;
    if (!(amount > 0)) return null;

    const isIncome = entry.type === 'income';

    const bankSide = {
        ledgerId: bankLedgerId,
        entryType: isIncome ? 'debit' : 'credit',
        amount,
        narration: entry.description || '',
    };
    const categorySide = {
        ledgerId: categoryLedgerId,
        entryType: isIncome ? 'credit' : 'debit',
        amount,
        narration: entry.category || '',
    };

    return {
        // A cashbook line is a cash or bank movement, which is what a contra
        // voucher is for when both sides are cash-like - but the far side here
        // is an income or expense head, so this is a journal. Typing it as a
        // sale would double-count revenue against the invoices that already
        // post their own sales vouchers.
        voucherType: 'journal',
        date: entry.date || entry.createdAt || new Date(),
        narration: `${entry.entryNumber || 'Cashbook'}: ${entry.category || ''}${entry.description ? ` - ${entry.description}` : ''}`.trim(),
        referenceNo: entry.reference || entry.entryNumber || '',
        sourceRef: `cashbook:${entry._id}`,
        linkedDocumentId: entry.linkedDocumentId || null,
        linkedDocumentType: entry.linkedDocumentId ? 'invoice' : null,
        entries: isIncome ? [bankSide, categorySide] : [categorySide, bankSide],
    };
}
