import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const db = await getCloudDb();

        /*
         * BANK BALANCES COME FROM THE GENERAL LEDGER.
         *
         * They used to be computed from `erp_ledger_entries`, the legacy
         * single-entry cashbook, which no financial statement can see. So
         * "what is in the bank" and "what do the books say is in the bank" were
         * two separately maintained answers that nothing ever compared, and
         * which drifted apart the moment anyone posted a voucher directly.
         *
         * Both are the same question, so there is one answer now, taken from
         * the postings that also feed the trial balance and the balance sheet.
         *
         * A bank account maps to its own ledger when one is linked, and falls
         * back to the house bank ledger otherwise. The cashbook remains in the
         * database untouched - it is simply no longer authoritative.
         */
        const [accounts, ledgers] = await Promise.all([
            db.collection('erp_bank_accounts').find({ tenantId: user.tenantId }).sort({ createdAt: 1 }).toArray(),
            db.collection('erp_ledgers').find({
                tenantId: user.tenantId,
                groupCode: { $in: ['BANK_ACCOUNTS', 'CASH_IN_HAND', 'BANK_OD_OCC'] },
            }).toArray(),
        ]);

        const ledgerIds = ledgers.map(l => l._id);
        const postings = ledgerIds.length
            ? await db.collection('erp_ledger_postings').aggregate([
                { $match: { tenantId: user.tenantId, ledgerId: { $in: ledgerIds } } },
                { $group: { _id: { ledgerId: '$ledgerId', entryType: '$entryType' }, total: { $sum: '$amount' } } },
            ]).toArray()
            : [];

        // A bank ledger is an asset, so debits increase it and credits reduce it.
        const netByLedger = new Map();
        for (const p of postings) {
            const key = String(p._id.ledgerId);
            const signed = p._id.entryType === 'debit' ? p.total : -p.total;
            netByLedger.set(key, (netByLedger.get(key) || 0) + signed);
        }

        const houseBank = ledgers.find(l => l.code === 'LED_MAIN_BANK');

        return NextResponse.json({
            bankAccounts: accounts.map(a => {
                const linked = ledgers.find(l => l.linkedEntityId === a._id.toString()) || houseBank;
                const opening = linked
                    ? (linked.openingBalanceType === 'credit' ? -(linked.openingBalance || 0) : (linked.openingBalance || 0))
                    : (a.openingBalance || 0);
                const net = linked ? (netByLedger.get(String(linked._id)) || 0) : 0;
                return {
                    ...a,
                    _id: a._id.toString(),
                    balance: Math.round((opening + net) * 100) / 100,
                    // Named so the screen can say which ledger the figure came
                    // from - "the balance disagrees with my passbook" is a much
                    // shorter conversation when you can see what was counted.
                    ledgerName: linked?.name || null,
                    ledgerCode: linked?.code || null,
                };
            }),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/bank-accounts') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const body = await req.json();
        const bankName = sanitizeStr(body.bankName, 200);
        if (!bankName) return NextResponse.json({ error: 'Bank name is required.' }, { status: 400 });

        const db = await getCloudDb();
        const doc = {
            tenantId: user.tenantId,
            bankName,
            accountNo: sanitizeStr(body.accountNo, 40),
            ifsc: sanitizeStr(body.ifsc, 15).toUpperCase(),
            openingBalance: sanitizeNum(body.openingBalance, 0),
            createdAt: new Date(),
        };
        const result = await db.collection('erp_bank_accounts').insertOne(doc);
        return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/accounting/bank-accounts') }, { status: 500 });
    }
}
