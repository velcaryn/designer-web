import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { postVoucher } from '@/lib/cloud/accounting/voucherEngine';
import { ensureChartOfAccounts, findLedgerByCodeOrId } from '@/lib/cloud/accounting/coa';

export const dynamic = 'force-dynamic';

/**
 * CLOSING STOCK, entered at period end.
 *
 * WHY THIS IS A TYPED FIGURE RATHER THAN A COMPUTATION
 *
 * Stock was the one module left unposted, and the reason is that posting it
 * automatically requires choosing an inventory valuation method - FIFO,
 * weighted average, standard cost - and that choice changes reported profit.
 * It is an accounting policy, not an implementation detail: two businesses with
 * identical transactions and different methods report different numbers, both
 * correctly.
 *
 * Picking one in code would make that decision silently on behalf of every
 * tenant, and it would be undiscoverable - the number would simply be wrong in
 * a way nobody could see. So Cloud does not choose. The business values its own
 * closing stock, the way it does at every year end, and enters the figure.
 *
 * That is also how it works on paper, which means an accountant needs no
 * explanation of what this screen is doing.
 *
 * THE ENTRY
 *
 *   Dr Closing Stock (asset)      - the stock the business is holding
 *   Cr Closing Stock (P&L)        - reduces cost of goods sold
 *
 * Both legs are the same ledger in the STOCK_IN_HAND group, which is how
 * closing stock is conventionally handled: it sits on the balance sheet as an
 * asset and simultaneously lifts gross profit by removing unsold purchases from
 * the cost of what was sold.
 *
 * Idempotent per period, so re-entering a revised valuation reverses the old
 * one rather than stacking a second entry on top of it.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const db = await getCloudDb();
        const entries = await db.collection('erp_vouchers')
            .find({ tenantId: user.tenantId, sourceRef: { $regex: '^closing-stock:' } })
            .sort({ date: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json({
            entries: entries.map(v => ({
                _id: v._id.toString(),
                voucherNumber: v.voucherNumber,
                period: String(v.sourceRef || '').replace('closing-stock:', ''),
                amount: v.totalAmount,
                date: v.date,
                narration: v.narration,
            })),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/accounting/closing-stock') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const body = await req.json();
        const amount = Math.round((Number(body.amount) || 0) * 100) / 100;
        const asOnDate = body.asOnDate ? new Date(body.asOnDate) : new Date();

        if (!(amount > 0)) {
            return NextResponse.json({ error: 'Enter the value of stock held at the period end.' }, { status: 400 });
        }
        if (Number.isNaN(asOnDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
        }

        const db = await getCloudDb();
        await ensureChartOfAccounts(db, user.tenantId);

        const stockLedger = await findLedgerByCodeOrId(db, user.tenantId, 'LED_CLOSING_STOCK');
        const purchases = await findLedgerByCodeOrId(db, user.tenantId, 'LED_PURCHASES_GENERAL');
        if (!stockLedger || !purchases) {
            return NextResponse.json({ error: 'The closing stock or purchases ledger is missing.' }, { status: 500 });
        }

        // One valuation per period. A revised figure supersedes the old one.
        const period = `${asOnDate.getFullYear()}-${String(asOnDate.getMonth() + 1).padStart(2, '0')}`;
        const sourceRef = `closing-stock:${period}`;

        const voucher = await postVoucher(db, user.tenantId, {
            voucherType: 'journal',
            date: asOnDate,
            narration: `Closing stock valued at period end ${period}`,
            referenceNo: period,
            linkedDocumentType: 'closing_stock',
            sourceRef,
            entries: [
                { ledgerId: stockLedger._id, entryType: 'debit', amount, narration: 'Stock held' },
                { ledgerId: purchases._id, entryType: 'credit', amount, narration: 'Removed from cost of goods sold' },
            ],
        }, user.username || user.email || user.sub);

        return NextResponse.json({
            success: true,
            voucherNumber: voucher.voucherNumber,
            duplicate: !!voucher.duplicate,
            message: voucher.duplicate
                ? `Closing stock for ${period} was already recorded as ${voucher.voucherNumber}.`
                : `Closing stock for ${period} recorded.`,
        }, { status: voucher.duplicate ? 200 : 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/accounting/closing-stock') }, { status: 500 });
    }
}
