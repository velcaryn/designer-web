/**
 * Double-Entry Voucher Engine for VelBiz Cloud.
 *
 * Implements strict double-entry accounting rules (Sum Dr = Sum Cr),
 * voucher number sequences, and posting records across erp_vouchers
 * and erp_ledger_postings collections.
 */

import { ObjectId } from 'mongodb';
import { ensureChartOfAccounts, findLedgerByCodeOrId, syncClientToDebtor, syncVendorToCreditor } from './coa.js';
import { taxBlockOf, validateTaxBlock } from './tax.js';
import { ledgerCodeForCategory, SUSPENSE_LEDGER_CODE } from './cashbook.js';

export const VOUCHER_TYPES = {
    SALES: 'sales',         // F8
    PURCHASE: 'purchase',   // F9
    RECEIPT: 'receipt',     // F6
    PAYMENT: 'payment',     // F5
    JOURNAL: 'journal',     // F7
    CONTRA: 'contra',       // F4
    CREDIT_NOTE: 'credit_note',
    DEBIT_NOTE: 'debit_note',
};

const VOUCHER_PREFIXES = {
    sales: 'SAL',
    purchase: 'PUR',
    receipt: 'RCP',
    payment: 'PMT',
    journal: 'JRN',
    contra: 'CNT',
    credit_note: 'CRN',
    debit_note: 'DBN',
};

/**
 * Generates sequential voucher number per tenant and voucher type.
 */
export async function generateVoucherNumber(db, tenantId, voucherType) {
    const prefix = VOUCHER_PREFIXES[voucherType] || 'VOU';
    const year = new Date().getFullYear();
    const counterModule = `cloud_voucher_${voucherType}`;

    const res = await db.collection('erp_counters').findOneAndUpdate(
        { tenantId, module: counterModule, year },
        { $inc: { seq: 1 }, $set: { updatedAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
    );

    const seq = res?.seq || 1;
    return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

/**
 * Validates and posts a double-entry voucher.
 *
 * payload: {
 *   voucherType: 'sales' | 'purchase' | 'receipt' | 'payment' | 'journal' | 'contra',
 *   date: Date | string,
 *   narration: string,
 *   referenceNo: string,
 *   linkedDocumentId: string | null,
 *   linkedDocumentType: string | null,
 *   entries: [
 *     { ledgerId: string, entryType: 'debit' | 'credit', amount: number, narration?: string }
 *   ]
 * }
 */
export async function postVoucher(db, tenantId, payload, createdBy = null) {
    await ensureChartOfAccounts(db, tenantId);

    const {
        voucherType,
        date = new Date(),
        narration = '',
        referenceNo = '',
        linkedDocumentId = null,
        linkedDocumentType = null,
        entries = [],
        // Idempotency key for automatic postings - see the insert below.
        sourceRef = null,
        // Set by reverseVoucher so a contra can be traced to what it undid.
        reversalOf = null,
    } = payload;

    if (!Object.values(VOUCHER_TYPES).includes(voucherType)) {
        throw new Error(`Invalid voucher type: ${voucherType}`);
    }

    if (!Array.isArray(entries) || entries.length < 2) {
        throw new Error('A voucher must contain at least 2 entries (one debit, one credit).');
    }

    // Validate entries and round to 2 decimals
    let totalDebit = 0;
    let totalCredit = 0;
    const validatedEntries = [];

    for (let i = 0; i < entries.length; i++) {
        const item = entries[i];
        if (!item.ledgerId) {
            throw new Error(`Entry #${i + 1} is missing a ledger selection.`);
        }
        if (!['debit', 'credit'].includes(item.entryType)) {
            throw new Error(`Entry #${i + 1} type must be debit or credit.`);
        }
        const amt = Math.round((Number(item.amount) || 0) * 100) / 100;
        if (amt <= 0) {
            throw new Error(`Entry #${i + 1} amount must be greater than zero.`);
        }

        const ledger = await db.collection('erp_ledgers').findOne({
            tenantId,
            _id: new ObjectId(item.ledgerId),
            active: { $ne: false },
        });

        if (!ledger) {
            throw new Error(`Ledger not found for entry #${i + 1}.`);
        }

        if (item.entryType === 'debit') {
            totalDebit += amt;
        } else {
            totalCredit += amt;
        }

        validatedEntries.push({
            ledgerId: ledger._id,
            ledgerName: ledger.name,
            ledgerCode: ledger.code || null,
            groupCode: ledger.groupCode,
            pillar: ledger.pillar,
            entryType: item.entryType,
            amount: amt,
            narration: (item.narration || '').trim(),
        });
    }

    // Double entry balance check
    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Voucher is unbalanced. Total Debit (₹${totalDebit.toFixed(2)}) must equal Total Credit (₹${totalCredit.toFixed(2)}).`);
    }

    const voucherDate = date ? new Date(date) : new Date();
    const now = new Date();

    /*
     * IDEMPOTENCY, for anything posted automatically.
     *
     * `sourceRef` is `{module}:{documentId}`, carried by every auto-post bridge
     * and backed by a unique partial index. A cron that retries, a double-
     * submitted invoice, or a replayed webhook produces ONE voucher, not one
     * per attempt. Manual vouchers pass no sourceRef and are excluded from the
     * index, so an accountant can still post two identical journals on purpose.
     *
     * Checked before inserting as well as being enforced by the index: the
     * check gives the caller the existing voucher back instead of an error,
     * which is what a retry actually wants.
     */
    if (sourceRef) {
        const existing = await db.collection('erp_vouchers').findOne({ tenantId, sourceRef });
        if (existing) {
            return { ...existing, _id: existing._id.toString(), duplicate: true };
        }
    }

    /*
     * Retry once on a voucher-number collision.
     *
     * The number comes from an atomic counter, so a clash means the counter was
     * reset or restored behind the application - which is exactly what happened
     * when a test script deleted erp_counters and CNT-2026-0001 was issued a
     * second time. With the unique index in place that now throws instead of
     * silently duplicating; retrying advances the counter past the collision, so
     * the damage degrades from a duplicate number to a gap in the sequence.
     * A gap is explainable to an auditor. A duplicate is not.
     */
    let voucherId = null;
    let voucherNumber = null;
    let voucherDoc = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        voucherNumber = await generateVoucherNumber(db, tenantId, voucherType);
        voucherDoc = {
            tenantId,
            voucherNumber,
            voucherType,
            date: voucherDate,
            totalAmount: totalDebit,
            narration: (narration || '').trim(),
            referenceNo: (referenceNo || '').trim(),
            linkedDocumentId: linkedDocumentId ? String(linkedDocumentId) : null,
            linkedDocumentType: linkedDocumentType || null,
            sourceRef: sourceRef || null,
            reversalOf: reversalOf ? String(reversalOf) : null,
            entries: validatedEntries,
            createdBy: createdBy || null,
            createdAt: now,
            updatedAt: now,
        };

        try {
            const vRes = await db.collection('erp_vouchers').insertOne(voucherDoc);
            voucherId = vRes.insertedId;
            break;
        } catch (err) {
            if (err?.code !== 11000) throw err;
            // A sourceRef collision means a concurrent request won the race and
            // already posted this exact voucher - return theirs rather than
            // retrying, which would post a second one.
            if (String(err?.message || '').includes('sourceRef')) {
                const winner = await db.collection('erp_vouchers').findOne({ tenantId, sourceRef });
                if (winner) return { ...winner, _id: winner._id.toString(), duplicate: true };
            }
            if (attempt === 2) {
                throw new Error(`Could not allocate a unique voucher number after 3 attempts (last tried ${voucherNumber}).`);
            }
        }
    }

    // Create individual posting rows for high-performance ledger queries
    const postingDocs = validatedEntries.map(entry => {
        // Find counter ledgers for the particular line
        const counterEntries = validatedEntries.filter(e => e.entryType !== entry.entryType);
        const counterParticulars = counterEntries.map(e => e.ledgerName).join(', ');

        return {
            tenantId,
            voucherId,
            voucherNumber,
            voucherType,
            date: voucherDate,
            ledgerId: entry.ledgerId,
            ledgerName: entry.ledgerName,
            groupCode: entry.groupCode,
            pillar: entry.pillar,
            entryType: entry.entryType,
            amount: entry.amount,
            particulars: counterParticulars || 'Journal Adjustment',
            narration: entry.narration || voucherDoc.narration,
            referenceNo: voucherDoc.referenceNo,
            createdAt: now,
        };
    });

    if (postingDocs.length > 0) {
        await db.collection('erp_ledger_postings').insertMany(postingDocs);
    }

    return {
        ...voucherDoc,
        _id: voucherId.toString(),
    };
}

/**
 * Posts a payment voucher when a business expense is recorded.
 *
 * Dr the expense head, Cr wherever the money left from. Expenses wrote only to
 * `erp_expenses` before this - not even to the legacy cashbook - so they were
 * invisible to the P&L entirely. A business could record a year of rent and
 * salaries and still show its full gross revenue as profit.
 *
 * The expense category maps to a ledger through the same table the cashbook
 * migration uses, so a category means the same thing whichever door it came in
 * by, and an unrecognised one lands in Suspense rather than being guessed at.
 */
export async function postExpenseVoucher(db, tenantId, expenseDoc, createdBy = null) {
    if (!expenseDoc || !(Number(expenseDoc.amount) > 0)) return null;
    await ensureChartOfAccounts(db, tenantId);

    const { code } = ledgerCodeForCategory(expenseDoc.category);
    const expenseLedger = await findLedgerByCodeOrId(db, tenantId, code)
        || await findLedgerByCodeOrId(db, tenantId, SUSPENSE_LEDGER_CODE);

    const paidByCash = String(expenseDoc.paymentMethod || '').toLowerCase() === 'cash';
    const payLedger = await findLedgerByCodeOrId(db, tenantId, paidByCash ? 'LED_CASH' : 'LED_MAIN_BANK');

    if (!expenseLedger || !payLedger) {
        throw new Error('Could not resolve the expense or payment ledger.');
    }

    const amount = Math.round(Number(expenseDoc.amount) * 100) / 100;

    return postVoucher(db, tenantId, {
        voucherType: VOUCHER_TYPES.PAYMENT,
        date: expenseDoc.date || expenseDoc.createdAt || new Date(),
        narration: `Expense: ${expenseDoc.category || ''}${expenseDoc.notes ? ` - ${expenseDoc.notes}` : ''}`.trim(),
        referenceNo: expenseDoc.expenseNumber || '',
        linkedDocumentId: expenseDoc._id ? String(expenseDoc._id) : null,
        linkedDocumentType: 'expense',
        sourceRef: expenseDoc._id ? `expense:${expenseDoc._id}` : null,
        entries: [
            { ledgerId: expenseLedger._id, entryType: 'debit', amount, narration: expenseDoc.category || '' },
            { ledgerId: payLedger._id, entryType: 'credit', amount, narration: paidByCash ? 'Paid in cash' : 'Paid by bank' },
        ],
    }, createdBy);
}

/**
 * Posts a purchase voucher when a purchase order is received.
 *
 * Dr Purchases and Input GST, Cr the vendor. Purchases had no ledger
 * integration at all, and could not have had one: there was no
 * vendor-to-creditor sync, so the credit side had nowhere to go. That is why
 * syncVendorToCreditor exists.
 *
 * Input GST is what a business RECLAIMS, so it is an asset and is debited -
 * the mirror of output GST on a sale. Getting this backwards would overstate
 * both the tax liability and the purchase cost.
 */
export async function postPurchaseVoucher(db, tenantId, purchaseDoc, vendor = null, createdBy = null) {
    if (!purchaseDoc || !(Number(purchaseDoc.grandTotal ?? purchaseDoc.totalAmount) > 0)) return null;
    await ensureChartOfAccounts(db, tenantId);

    const creditorLedger = vendor ? await syncVendorToCreditor(db, tenantId, vendor) : null;
    if (!creditorLedger) {
        throw new Error('A purchase needs a vendor to credit. Attach a vendor to this order first.');
    }

    const purchaseLedger = await findLedgerByCodeOrId(db, tenantId, 'LED_PURCHASES_GENERAL');
    const gross = Math.round(Number(purchaseDoc.grandTotal ?? purchaseDoc.totalAmount) * 100) / 100;

    const tax = taxBlockOf({
        grandTotal: gross,
        taxAmount: purchaseDoc.taxAmount,
        taxType: purchaseDoc.taxType,
    });
    const taxCheck = validateTaxBlock(tax);
    if (!taxCheck.ok) throw new Error(`Cannot post purchase voucher: ${taxCheck.error}`);

    const entries = [
        { ledgerId: purchaseLedger._id, entryType: 'debit', amount: tax.totalTaxable, narration: 'Purchases' },
    ];

    const inputCgst = await findLedgerByCodeOrId(db, tenantId, 'LED_INPUT_CGST');
    const inputSgst = await findLedgerByCodeOrId(db, tenantId, 'LED_INPUT_SGST');
    const inputIgst = await findLedgerByCodeOrId(db, tenantId, 'LED_INPUT_IGST');
    if (tax.cgstTotal > 0 && inputCgst) entries.push({ ledgerId: inputCgst._id, entryType: 'debit', amount: tax.cgstTotal, narration: 'Input CGST' });
    if (tax.sgstTotal > 0 && inputSgst) entries.push({ ledgerId: inputSgst._id, entryType: 'debit', amount: tax.sgstTotal, narration: 'Input SGST' });
    if (tax.igstTotal > 0 && inputIgst) entries.push({ ledgerId: inputIgst._id, entryType: 'debit', amount: tax.igstTotal, narration: 'Input IGST' });

    entries.push({ ledgerId: creditorLedger._id, entryType: 'credit', amount: gross, narration: `Purchase ${purchaseDoc.poNumber || ''}`.trim() });

    return postVoucher(db, tenantId, {
        voucherType: VOUCHER_TYPES.PURCHASE,
        date: purchaseDoc.receivedAt || purchaseDoc.orderDate || purchaseDoc.createdAt || new Date(),
        narration: `Purchase ${purchaseDoc.poNumber || ''} from ${vendor?.name || 'vendor'}`.trim(),
        referenceNo: purchaseDoc.poNumber || '',
        linkedDocumentId: purchaseDoc._id ? String(purchaseDoc._id) : null,
        linkedDocumentType: 'purchase_order',
        sourceRef: purchaseDoc._id ? `purchase:${purchaseDoc._id}` : null,
        entries,
    }, createdBy);
}

/**
 * Posts a credit or debit note.
 *
 * A credit note reduces what a customer owes: Dr Sales (revenue given back),
 * Cr the debtor. A debit note is the mirror. Both voucher types existed in
 * VOUCHER_TYPES from the start and were never once posted, so the notes
 * adjusted the invoice balance in the documents module while the ledger carried
 * on showing the original sale in full.
 *
 * Deliberately NOT modelled as a reversal of the sales voucher: a credit note
 * is its own commercial document with its own number, often for part of an
 * invoice, and squashing it into a reversal would lose that. reverseVoucher is
 * for undoing a mistake; this is for recording a decision.
 */
export async function postNoteVoucher(db, tenantId, noteDoc, createdBy = null) {
    if (!noteDoc || !(Number(noteDoc.grandTotal) > 0)) return null;
    await ensureChartOfAccounts(db, tenantId);

    const isCredit = noteDoc.docType === 'CreditNote';
    const debtorLedger = noteDoc.customer ? await syncClientToDebtor(db, tenantId, noteDoc.customer) : null;
    const salesLedger = await findLedgerByCodeOrId(db, tenantId, 'LED_SALES_DOMESTIC');

    if (!debtorLedger || !salesLedger) {
        throw new Error('Could not resolve the customer or sales ledger for this note.');
    }

    const amount = Math.round(Number(noteDoc.grandTotal) * 100) / 100;

    // Credit note: revenue comes back out, the customer owes less.
    // Debit note:  the customer owes more, revenue goes up.
    const entries = isCredit
        ? [
            { ledgerId: salesLedger._id, entryType: 'debit', amount, narration: 'Credit note - revenue reversed' },
            { ledgerId: debtorLedger._id, entryType: 'credit', amount, narration: `Credit note ${noteDoc.docNumber}` },
        ]
        : [
            { ledgerId: debtorLedger._id, entryType: 'debit', amount, narration: `Debit note ${noteDoc.docNumber}` },
            { ledgerId: salesLedger._id, entryType: 'credit', amount, narration: 'Debit note - additional charge' },
        ];

    return postVoucher(db, tenantId, {
        voucherType: isCredit ? VOUCHER_TYPES.CREDIT_NOTE : VOUCHER_TYPES.DEBIT_NOTE,
        date: noteDoc.createdAt || new Date(),
        narration: `${isCredit ? 'Credit' : 'Debit'} note ${noteDoc.docNumber} against ${noteDoc.linkedInvoiceNumber || 'invoice'}`,
        referenceNo: noteDoc.docNumber,
        linkedDocumentId: noteDoc._id ? String(noteDoc._id) : null,
        linkedDocumentType: isCredit ? 'credit_note' : 'debit_note',
        sourceRef: noteDoc._id ? `note:${noteDoc._id}` : null,
        entries,
    }, createdBy);
}

/**
 * Posts a payroll run, in the two steps payroll actually has.
 *
 * FINALIZING a run creates an obligation: the salaries are earned and owed, but
 * not yet paid. Dr Salaries and Wages (the expense, in the month it was earned),
 * Cr Salaries Payable (the liability).
 *
 * PAYING it settles that obligation: Dr Salaries Payable, Cr Bank.
 *
 * Two vouchers rather than one because they are two different events, often in
 * different months. Collapsing them into a single Dr Salaries / Cr Bank on the
 * payment date would move the expense out of the month the work was done, which
 * is the whole point of accrual accounting - a March salary paid in April
 * belongs to March.
 *
 * LED_SALARIES_WAGES and LED_SALARIES_PAYABLE have both been seeded since the
 * module was written and had never once been posted to.
 */
export async function postPayrollVoucher(db, tenantId, run, stage, createdBy = null) {
    if (!run || !(Number(run.totalNet) > 0)) return null;
    await ensureChartOfAccounts(db, tenantId);

    const expense = await findLedgerByCodeOrId(db, tenantId, 'LED_SALARIES_WAGES');
    const payable = await findLedgerByCodeOrId(db, tenantId, 'LED_SALARIES_PAYABLE');
    const bank = await findLedgerByCodeOrId(db, tenantId, 'LED_MAIN_BANK');

    if (!expense || !payable || !bank) {
        throw new Error('Could not resolve the salary, payable or bank ledger.');
    }

    const amount = Math.round(Number(run.totalNet) * 100) / 100;
    const period = `${String(run.month).padStart(2, '0')}/${run.year}`;
    const accruing = stage === 'finalized';

    return postVoucher(db, tenantId, {
        voucherType: accruing ? VOUCHER_TYPES.JOURNAL : VOUCHER_TYPES.PAYMENT,
        date: new Date(),
        narration: accruing
            ? `Salaries for ${period} (${(run.entries || []).length} employees)`
            : `Salaries paid for ${period}`,
        referenceNo: run.runNumber || '',
        linkedDocumentId: run._id ? String(run._id) : null,
        linkedDocumentType: 'payroll_run',
        // Distinct per stage, so finalizing and paying are separately idempotent
        // and neither can be posted twice.
        sourceRef: run._id ? `payroll:${run._id}:${stage}` : null,
        entries: accruing
            ? [
                { ledgerId: expense._id, entryType: 'debit', amount, narration: `Salaries earned ${period}` },
                { ledgerId: payable._id, entryType: 'credit', amount, narration: 'Owed to staff' },
            ]
            : [
                { ledgerId: payable._id, entryType: 'debit', amount, narration: `Salaries settled ${period}` },
                { ledgerId: bank._id, entryType: 'credit', amount, narration: 'Paid from bank' },
            ],
    }, createdBy);
}

/**
 * Reverses a posted voucher by posting its mirror image.
 *
 * A POSTED VOUCHER IS NEVER EDITED OR DELETED. That is not fastidiousness: a
 * ledger's value is that what was recorded stays recorded, and an entry that
 * can be altered after the fact cannot be relied on by anyone auditing it. So a
 * correction is a new voucher that undoes the old one, and both remain visible.
 *
 * Nothing in Cloud reversed anything before this. Deleting a payment, voiding
 * an invoice or raising a credit note all left the original voucher standing,
 * so the books kept counting money that had been given back.
 *
 * Idempotent by `sourceRef`, so a double-clicked void produces one reversal.
 */
export async function reverseVoucher(db, tenantId, voucherId, reason = '', createdBy = null) {
    const original = await db.collection('erp_vouchers').findOne({
        tenantId,
        _id: typeof voucherId === 'string' ? new ObjectId(voucherId) : voucherId,
    });
    if (!original) throw new Error('Voucher not found.');

    if (original.reversalOf) {
        throw new Error(`${original.voucherNumber} is itself a reversal and cannot be reversed.`);
    }

    const already = await db.collection('erp_vouchers').findOne({
        tenantId,
        reversalOf: String(original._id),
    });
    if (already) return { ...already, _id: already._id.toString(), duplicate: true };

    // Debits become credits and credits become debits, same ledgers, same
    // amounts. Sum Dr = Sum Cr held for the original, so it holds for the
    // mirror by construction.
    const entries = (original.entries || []).map(e => ({
        ledgerId: e.ledgerId,
        entryType: e.entryType === 'debit' ? 'credit' : 'debit',
        amount: e.amount,
        narration: `Reversal: ${e.narration || ''}`.trim(),
    }));

    if (entries.length < 2) {
        throw new Error(`${original.voucherNumber} has no entries to reverse.`);
    }

    return postVoucher(db, tenantId, {
        // A reversal is posted as a journal regardless of what it undoes, so it
        // is never mistaken for a second sale or a second receipt in any report
        // that filters by voucher type.
        voucherType: VOUCHER_TYPES.JOURNAL,
        date: new Date(),
        narration: `Reversal of ${original.voucherNumber}${reason ? ` - ${reason}` : ''}`,
        referenceNo: original.voucherNumber,
        linkedDocumentId: original.linkedDocumentId,
        linkedDocumentType: original.linkedDocumentType,
        sourceRef: `reversal:${original._id}`,
        reversalOf: String(original._id),
        entries,
    }, createdBy);
}

/**
 * Automatically creates a Sales Voucher when an invoice is finalized.
 */
export async function postSalesVoucherFromInvoice(db, tenantId, invoiceDoc, createdBy = null) {
    if (!invoiceDoc || !invoiceDoc.grandTotal) return null;
    await ensureChartOfAccounts(db, tenantId);

    // 1. Find or create debtor ledger for customer
    let debtorLedger = null;
    if (invoiceDoc.customer) {
        debtorLedger = await syncClientToDebtor(db, tenantId, invoiceDoc.customer);
    }
    if (!debtorLedger) {
        debtorLedger = await findLedgerByCodeOrId(db, tenantId, 'LED_SALES_DOMESTIC');
    }

    // 2. Sales Ledger
    const salesLedger = await findLedgerByCodeOrId(db, tenantId, 'LED_SALES_DOMESTIC');

    // 3. Tax Ledgers
    const cgstLedger = await findLedgerByCodeOrId(db, tenantId, 'LED_OUTPUT_CGST');
    const sgstLedger = await findLedgerByCodeOrId(db, tenantId, 'LED_OUTPUT_SGST');
    const igstLedger = await findLedgerByCodeOrId(db, tenantId, 'LED_OUTPUT_IGST');

    /*
     * THE TAX SPLIT COMES FROM ONE SHARED MODULE, NOT FROM READING FIELDS OFF
     * THE DOCUMENT AND HOPING.
     *
     * This block used to read `totalTaxable`, `taxTotal`, `cgstTotal`,
     * `sgstTotal` and `igstTotal` straight off the invoice. The invoice never
     * stored any of them - it stores `taxAmount` and `taxType`. Every one of
     * those reads produced 0, so the whole tax-inclusive amount was credited to
     * Sales and the Output GST ledgers were never touched. The voucher still
     * balanced, so nothing anywhere complained.
     *
     * taxBlockOf() derives the split for legacy documents and uses the persisted
     * one for new documents, so this is correct with or without a backfill.
     */
    const taxBlock = taxBlockOf(invoiceDoc);
    const taxCheck = validateTaxBlock(taxBlock);
    if (!taxCheck.ok) {
        // Refuse rather than post a best-effort voucher. A refusal lands on the
        // unposted worklist where somebody can act on it; a wrong posting sits
        // in the books looking correct.
        throw new Error(`Cannot post sales voucher for ${invoiceDoc.docNumber || 'invoice'}: ${taxCheck.error}`);
    }

    const { totalTaxable, cgstTotal: cgstAmount, sgstTotal: sgstAmount, igstTotal: igstAmount } = taxBlock;
    const grandTotal = Number(invoiceDoc.grandTotal);

    const entries = [
        // Debit Customer (Sundry Debtor) with Grand Total
        {
            ledgerId: debtorLedger._id,
            entryType: 'debit',
            amount: grandTotal,
            narration: `Invoice ${invoiceDoc.docNumber}`,
        },
        // Credit Sales Account with Taxable Value
        {
            ledgerId: salesLedger._id,
            entryType: 'credit',
            amount: totalTaxable,
            narration: `Revenue from Invoice ${invoiceDoc.docNumber}`,
        },
    ];

    if (cgstAmount > 0 && cgstLedger) {
        entries.push({ ledgerId: cgstLedger._id, entryType: 'credit', amount: cgstAmount, narration: 'Output CGST' });
    }
    if (sgstAmount > 0 && sgstLedger) {
        entries.push({ ledgerId: sgstLedger._id, entryType: 'credit', amount: sgstAmount, narration: 'Output SGST' });
    }
    if (igstAmount > 0 && igstLedger) {
        entries.push({ ledgerId: igstLedger._id, entryType: 'credit', amount: igstAmount, narration: 'Output IGST' });
    }

    return postVoucher(db, tenantId, {
        voucherType: VOUCHER_TYPES.SALES,
        date: invoiceDoc.issueDate || invoiceDoc.createdAt || new Date(),
        narration: `Sales Invoice ${invoiceDoc.docNumber} to ${invoiceDoc.customer?.name || 'Customer'}`,
        referenceNo: invoiceDoc.docNumber,
        linkedDocumentId: invoiceDoc._id ? invoiceDoc._id.toString() : null,
        linkedDocumentType: 'invoice',
        // One sales voucher per invoice, forever. A retried cron, a
        // double-submitted form or a replayed request all resolve to the same
        // voucher rather than billing the ledger twice.
        sourceRef: invoiceDoc._id ? `invoice:${invoiceDoc._id}` : null,
        entries,
    }, createdBy);
}

/**
 * Automatically creates a Receipt Voucher when a payment is recorded against an invoice.
 */
export async function postReceiptVoucherFromPayment(db, tenantId, paymentDoc, invoiceDoc = null, createdBy = null) {
    if (!paymentDoc || !paymentDoc.amount) return null;
    await ensureChartOfAccounts(db, tenantId);

    // 1. Bank or Cash Ledger
    const isCash = paymentDoc.method === 'cash';
    const depositLedger = await findLedgerByCodeOrId(db, tenantId, isCash ? 'LED_CASH' : 'LED_MAIN_BANK');

    // 2. Debtor Ledger
    let debtorLedger = null;
    if (invoiceDoc && invoiceDoc.customer) {
        debtorLedger = await syncClientToDebtor(db, tenantId, invoiceDoc.customer);
    }
    if (!debtorLedger) {
        debtorLedger = await findLedgerByCodeOrId(db, tenantId, 'LED_SALES_DOMESTIC');
    }

    const amount = Number(paymentDoc.amount);
    const entries = [
        {
            ledgerId: depositLedger._id,
            entryType: 'debit',
            amount,
            narration: `Receipt via ${paymentDoc.method || 'bank'}`,
        },
        {
            ledgerId: debtorLedger._id,
            entryType: 'credit',
            amount,
            narration: `Payment received against ${paymentDoc.docNumber || 'invoice'}`,
        },
    ];

    return postVoucher(db, tenantId, {
        voucherType: VOUCHER_TYPES.RECEIPT,
        date: paymentDoc.date || paymentDoc.createdAt || new Date(),
        narration: `Payment received of ₹${amount.toFixed(2)} against ${paymentDoc.docNumber || 'Invoice'}`,
        referenceNo: paymentDoc.reference || paymentDoc.docNumber || '',
        linkedDocumentId: paymentDoc._id ? paymentDoc._id.toString() : null,
        linkedDocumentType: 'payment',
        sourceRef: paymentDoc._id ? `payment:${paymentDoc._id}` : null,
        entries,
    }, createdBy);
}
