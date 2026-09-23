import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { computeNoteAdjustments } from '@/lib/erpHelpers';

export const dynamic = 'force-dynamic';

const DEFAULT_TERM_DAYS = 30; // used to derive an implied due date when an invoice has none set

/**
 * GET /api/cloud/erp/reports/summary
 * Phase 6b - ERP Home Dashboard KPIs + P&L + Receivables Aging + widgets.
 * One consolidated read so the dashboard home makes a single request instead of
 * fanning out to every module's own list endpoint.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Reads across accounting + CRM + expenses + inventory - require the broadest
        // of those (accounting) since this is a cross-module summary, not a single module.
        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const db = await getCloudDb();
        const tenantId = user.tenantId;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [invoices, ledgerEntries, bankAccounts, leads, pipelineStages, stockMoves, items] = await Promise.all([
            db.collection('tenant_documents').find({ tenantId, docType: 'Invoice', status: { $ne: 'draft' } }).toArray(),
            db.collection('erp_ledger_entries').find({ tenantId }).toArray(),
            db.collection('erp_bank_accounts').find({ tenantId }).toArray(),
            db.collection('erp_leads').find({ tenantId }).toArray(),
            db.collection('erp_pipeline_stages').findOne({ tenantId }),
            db.collection('erp_stock_moves').find({ tenantId }).toArray(),
            db.collection('tenant_products').find({ tenantId }).toArray(),
        ]);

        const invoiceIds = invoices.map(d => d._id.toString());
        const paidTotals = invoiceIds.length ? await db.collection('erp_payments').aggregate([
            { $match: { tenantId, documentId: { $in: invoiceIds } } },
            { $group: { _id: '$documentId', paid: { $sum: '$amount' } } },
        ]).toArray() : [];
        const paidMap = Object.fromEntries(paidTotals.map(p => [p._id, p.paid]));
        const noteAdjustments = await computeNoteAdjustments(tenantId, invoiceIds);

        // ── Revenue / Outstanding / Aging ──────────────────────────────────
        let totalRevenue = 0, outstanding = 0;
        const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        for (const inv of invoices) {
            const paid = (paidMap[inv._id.toString()] || 0) + (noteAdjustments.get(inv._id.toString()) || 0);
            const balance = (inv.grandTotal || 0) - paid;
            totalRevenue += inv.grandTotal || 0;
            outstanding += balance;
            if (balance > 0) {
                const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(new Date(inv.createdAt).getTime() + DEFAULT_TERM_DAYS * 24 * 60 * 60 * 1000);
                const daysOverdue = Math.floor((now - dueDate) / (24 * 60 * 60 * 1000));
                if (daysOverdue <= 0) continue; // not yet overdue, excluded from aging
                if (daysOverdue <= 30) agingBuckets['0-30'] += balance;
                else if (daysOverdue <= 60) agingBuckets['31-60'] += balance;
                else if (daysOverdue <= 90) agingBuckets['61-90'] += balance;
                else agingBuckets['90+'] += balance;
            }
        }

        // ── P&L (all-time, from Phase 3's ledger) + this month's expenses ──
        const income = ledgerEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
        const expense = ledgerEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
        const expensesThisMonth = ledgerEntries
            .filter(e => e.type === 'expense' && new Date(e.date) >= monthStart)
            .reduce((s, e) => s + e.amount, 0);

        // ── Expense breakdown by category (this month) ─────────────────────
        const expenseByCategory = {};
        for (const e of ledgerEntries) {
            if (e.type !== 'expense' || new Date(e.date) < monthStart) continue;
            expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
        }

        // ── Cash in bank ─────────────────────────────────────────────────
        const cashInBank = bankAccounts.reduce((s, b) => s + (b.balance || 0), 0);

        // ── Sales pipeline value (open CRM leads, i.e. not the terminal stages) ─
        const stages = pipelineStages?.stages || [];
        const terminalStages = stages.filter(s => /won|lost|closed/i.test(s.key || s.name || '')).map(s => s.key);
        const salesPipelineValue = leads
            .filter(l => !terminalStages.includes(l.stage))
            .reduce((s, l) => s + (l.expectedRevenue || 0), 0);

        // ── Inventory Valuation (stock-on-hand × item's default unit price, no
        // separate cost field exists on tenant_products today, so this is a selling-
        // price-based valuation, not a true COGS valuation) ─────────────────
        const priceByItemId = Object.fromEntries(items.map(i => [i.itemId, i.defaultUnitPrice || 0]));
        const qtyByItemId = {};
        for (const m of stockMoves) {
            const signedQty = m.type === 'out' ? -Math.abs(m.qty) : m.qty;
            qtyByItemId[m.itemId] = (qtyByItemId[m.itemId] || 0) + signedQty;
        }
        const inventoryValuation = Object.entries(qtyByItemId).reduce((s, [itemId, qty]) => s + qty * (priceByItemId[itemId] || 0), 0);

        return NextResponse.json({
            kpis: {
                totalRevenue,
                outstanding,
                expensesThisMonth,
                cashInBank,
                inventoryValuation,
            },
            profitAndLoss: { income, expense, net: income - expense },
            receivablesAging: agingBuckets,
            expenseBreakdown: Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
            salesPipelineValue,
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/reports/summary') }, { status: 500 });
    }
}
