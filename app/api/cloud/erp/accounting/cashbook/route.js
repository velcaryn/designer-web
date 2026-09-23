import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, sanitizeNum, paginationFromParams } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';
import { postVoucher } from '@/lib/cloud/accounting/voucherEngine';
import { ensureChartOfAccounts, findLedgerByCodeOrId } from '@/lib/cloud/accounting/coa';
import { ledgerCodeForCategory, voucherForCashbookEntry, SUSPENSE_LEDGER_CODE } from '@/lib/cloud/accounting/cashbook';
import { postToLedger } from '@/lib/cloud/accounting/postingBridge';

/**
 * THE LEGACY SINGLE-ENTRY CASHBOOK.
 *
 * Renamed from `ledger/`, which sat directly beside `ledgers/` and meant
 * something completely different. One was a cashbook of transactions, the other
 * the chart of accounts; they shared no collection, no schema and no purpose,
 * and were told apart by a single letter. That is not a naming quibble - it is
 * a live hazard in a module where writing to the wrong one silently produces a
 * second set of books.
 *
 * This route is on its way out. Entries here now also post a double-entry
 * voucher (see the POST handler), so the cashbook can no longer drift from the
 * general ledger, but new work should post vouchers directly rather than
 * through here.
 *
 * The collection keeps its name, `erp_ledger_entries` - renaming it is a live
 * data migration for a cosmetic gain, and the route name was the part causing
 * confusion.
 */

export const dynamic = 'force-dynamic';

const ENTRY_TYPES = ['income', 'expense'];

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const bankAccountId = searchParams.get('bankAccountId');
        const reconciled = searchParams.get('reconciled');
        const { skip, limit, page } = paginationFromParams(searchParams, 100);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };
        if (type && ENTRY_TYPES.includes(type)) filter.type = type;
        if (bankAccountId) filter.bankAccountId = bankAccountId;
        if (reconciled === 'true') filter.reconciled = true;
        if (reconciled === 'false') filter.reconciled = false;

        const [entries, total, allForTotals] = await Promise.all([
            db.collection('erp_ledger_entries').find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
            db.collection('erp_ledger_entries').countDocuments(filter),
            db.collection('erp_ledger_entries').find({ tenantId: user.tenantId }).toArray(),
        ]);

        const totalIncome = allForTotals.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
        const totalExpense = allForTotals.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

        return NextResponse.json({
            entries: entries.map(e => ({ ...e, _id: e._id.toString() })),
            total, page, pages: Math.ceil(total / limit),
            totals: { income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense },
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/cashbook') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const body = await req.json();
        const type = ENTRY_TYPES.includes(body.type) ? body.type : null;
        const category = sanitizeStr(body.category, 100);
        const amount = sanitizeNum(body.amount);

        if (!type) return NextResponse.json({ error: 'Type must be income or expense.' }, { status: 400 });
        if (!category) return NextResponse.json({ error: 'Category is required.' }, { status: 400 });
        if (amount <= 0) return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });

        const db = await getCloudDb();

        let bankAccountId = null;
        if (body.bankAccountId && ObjectId.isValid(body.bankAccountId)) {
            const bankAccount = await db.collection('erp_bank_accounts').findOne({ tenantId: user.tenantId, _id: new ObjectId(body.bankAccountId) });
            if (bankAccount) bankAccountId = body.bankAccountId;
        }

        // Optionally link this entry to a real invoice/quote the tenant created - re-validated
        // server-side (never trusts the client's docNumber/customer snapshot) rather than
        // just accepting free text in the reference field.
        let linkedDocumentId = null;
        let linkedDocNumber = null;
        if (body.linkedDocumentId && ObjectId.isValid(body.linkedDocumentId)) {
            const doc = await db.collection('tenant_documents').findOne({ tenantId: user.tenantId, _id: new ObjectId(body.linkedDocumentId) });
            if (doc) {
                linkedDocumentId = body.linkedDocumentId;
                linkedDocNumber = doc.docNumber;
            }
        }

        const entryNumber = await generateErpNumber(user.tenantId, 'ledgerEntry');

        const entry = {
            tenantId: user.tenantId,
            entryNumber,
            type,
            category,
            description: sanitizeStr(body.description, 500),
            amount,
            date: body.date ? new Date(body.date) : new Date(),
            bankAccountId,
            linkedDocumentId,
            linkedDocNumber,
            reference: sanitizeStr(body.reference, 200),
            reconciled: false,
            by: user.email,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_ledger_entries').insertOne(entry);

        /*
         * POST THE SAME ENTRY INTO THE GENERAL LEDGER.
         *
         * Phase 2 migrated the historical cashbook into double-entry vouchers
         * and moved bank balances onto the general ledger. That fixed the past
         * and left the present open: a NEW entry through this route wrote only
         * to erp_ledger_entries, so the two sets of books would have started
         * drifting apart again from the first cash receipt somebody recorded.
         *
         * A cashbook line is a double entry with one side implicit - the
         * category IS the other leg - so the same mapping the migration used
         * makes it explicit here. Unrecognised categories go to Suspense rather
         * than a guess.
         *
         * This route is on its way out in favour of posting vouchers directly.
         * Until it is gone it must not be a second, quieter way to write to the
         * books.
         */
        await postToLedger(db, {
            tenantId: user.tenantId,
            collection: 'erp_ledger_entries',
            documentId: result.insertedId,
            label: 'cashbook entry',
        }, async () => {
            await ensureChartOfAccounts(db, user.tenantId);
            const { code } = ledgerCodeForCategory(entry.category);
            const [categoryLedger, bankLedger] = await Promise.all([
                findLedgerByCodeOrId(db, user.tenantId, code)
                    .then(l => l || findLedgerByCodeOrId(db, user.tenantId, SUSPENSE_LEDGER_CODE)),
                findLedgerByCodeOrId(db, user.tenantId, entry.bankAccountId ? 'LED_MAIN_BANK' : 'LED_CASH'),
            ]);
            if (!categoryLedger || !bankLedger) throw new Error('Could not resolve the cashbook ledgers.');

            return postVoucher(db, user.tenantId, voucherForCashbookEntry(
                { ...entry, _id: result.insertedId },
                { bankLedgerId: bankLedger._id, categoryLedgerId: categoryLedger._id }
            ), user.username || user.email || user.sub);
        });

        return NextResponse.json({ success: true, _id: result.insertedId.toString(), entryNumber }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/accounting/cashbook') }, { status: 500 });
    }
}
