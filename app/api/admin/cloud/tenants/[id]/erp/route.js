import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import { getCloudDb, safeCloudError } from '@/lib/cloudAuth';
import { DEFAULT_CRM_STAGES } from '@/lib/erpHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cloud/tenants/[id]/erp
 * Read-only ERP summary for a single tenant - admin-only. Connects the ERP data
 * a Cloud user builds in their own dashboard to the Admin Dashboard's view of them.
 */
export async function GET(req, context) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: tenantId } = await context.params;
        const db = await getCloudDb();

        const [leads, pipelineDoc, orders, vendors, warehouses, stockMoves, tenantItems, expenses, ledgerEntries, bankAccounts, employees, leaveRequests, payrollRuns] = await Promise.all([
            db.collection('erp_leads').find({ tenantId }).sort({ updatedAt: -1 }).toArray(),
            db.collection('erp_pipeline_stages').findOne({ tenantId }),
            db.collection('erp_purchase_orders').find({ tenantId }).sort({ updatedAt: -1 }).toArray(),
            db.collection('tenant_clients').find({ tenantId, roles: 'vendor' }).toArray(),
            db.collection('erp_warehouses').find({ tenantId }).toArray(),
            db.collection('erp_stock_moves').find({ tenantId }).toArray(),
            db.collection('tenant_products').find({ tenantId }).toArray(),
            db.collection('erp_expenses').find({ tenantId }).sort({ updatedAt: -1 }).toArray(),
            db.collection('erp_ledger_entries').find({ tenantId }).sort({ date: -1 }).toArray(),
            db.collection('erp_bank_accounts').find({ tenantId }).toArray(),
            db.collection('erp_employees').find({ tenantId }).toArray(),
            db.collection('erp_leave_requests').find({ tenantId }).sort({ createdAt: -1 }).toArray(),
            db.collection('erp_payroll_runs').find({ tenantId }).sort({ year: -1, month: -1 }).toArray(),
        ]);

        const stages = pipelineDoc?.stages?.length ? pipelineDoc.stages : DEFAULT_CRM_STAGES;
        const leadsByStage = stages.map(s => {
            const inStage = leads.filter(l => l.stage === s.id);
            return {
                id: s.id,
                name: s.name,
                color: s.color,
                count: inStage.length,
                value: inStage.reduce((sum, l) => sum + (l.expectedRevenue || 0), 0),
            };
        });
        const openPipelineValue = leads
            .filter(l => l.stage !== 'won' && l.stage !== 'lost')
            .reduce((sum, l) => sum + (l.expectedRevenue || 0), 0);
        const wonValue = leads.filter(l => l.stage === 'won').reduce((sum, l) => sum + (l.expectedRevenue || 0), 0);

        const poStatuses = ['draft', 'confirmed', 'received', 'billed', 'paid', 'cancelled'];
        const ordersByStatus = poStatuses.map(status => {
            const inStatus = orders.filter(o => o.status === status);
            return { status, count: inStatus.length, value: inStatus.reduce((sum, o) => sum + (o.grandTotal || 0), 0) };
        });
        const totalPoValue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

        // Inventory: current stock-on-hand per item+warehouse, computed from the moves ledger.
        const itemNames = Object.fromEntries(tenantItems.map(i => [i.itemId, i.name]));
        const warehouseNames = Object.fromEntries(warehouses.map(w => [w._id.toString(), w.name]));
        const levels = new Map();
        for (const m of stockMoves) {
            const key = `${m.itemId}::${m.warehouseId}`;
            const signedQty = m.type === 'out' ? -Math.abs(m.qty) : m.qty;
            levels.set(key, (levels.get(key) || 0) + signedQty);
        }
        const stockLevels = Array.from(levels.entries())
            .map(([key, qty]) => {
                const [itemId, warehouseId] = key.split('::');
                return { itemId, itemName: itemNames[itemId] || 'Unknown item', warehouseName: warehouseNames[warehouseId] || 'Unknown warehouse', qty };
            })
            .filter(l => l.qty !== 0);
        const negativeStockCount = stockLevels.filter(l => l.qty < 0).length;

        const expenseStatuses = ['draft', 'submitted', 'approved', 'rejected', 'paid'];
        const expensesByStatus = expenseStatuses.map(status => {
            const inStatus = expenses.filter(e => e.status === status);
            return { status, count: inStatus.length, value: inStatus.reduce((sum, e) => sum + (e.amount || 0), 0) };
        });
        const pendingApprovalValue = expenses.filter(e => e.status === 'submitted').reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalPaidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);

        // Accounting: simplified ledger totals + per-bank running balance.
        const totalIncome = ledgerEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const totalExpenseLedger = ledgerEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const unreconciledCount = ledgerEntries.filter(e => !e.reconciled).length;
        const netByBank = {};
        for (const e of ledgerEntries) {
            if (!e.bankAccountId) continue;
            netByBank[e.bankAccountId] = (netByBank[e.bankAccountId] || 0) + (e.type === 'income' ? e.amount : -e.amount);
        }

        const activeEmployees = employees.filter(e => e.status === 'active');
        const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');
        const latestRun = payrollRuns[0] || null;

        return NextResponse.json({
            crm: {
                totalLeads: leads.length,
                openPipelineValue,
                wonValue,
                byStage: leadsByStage,
                recentLeads: leads.slice(0, 10).map(l => ({
                    _id: l._id.toString(), leadNumber: l.leadNumber, name: l.name, company: l.company,
                    stage: l.stage, expectedRevenue: l.expectedRevenue, updatedAt: l.updatedAt,
                })),
            },
            purchases: {
                totalOrders: orders.length,
                totalVendors: vendors.length,
                totalPoValue,
                byStatus: ordersByStatus,
                recentOrders: orders.slice(0, 10).map(o => ({
                    _id: o._id.toString(), poNumber: o.poNumber, vendorName: o.vendorName,
                    status: o.status, grandTotal: o.grandTotal, updatedAt: o.updatedAt,
                })),
            },
            inventory: {
                totalWarehouses: warehouses.length,
                totalStockMoves: stockMoves.length,
                negativeStockCount,
                stockLevels: stockLevels.slice(0, 10),
            },
            expenses: {
                totalExpenses: expenses.length,
                pendingApprovalValue,
                totalPaidExpenses,
                byStatus: expensesByStatus,
                recentExpenses: expenses.slice(0, 10).map(e => ({
                    _id: e._id.toString(), expenseNumber: e.expenseNumber, employeeName: e.employeeName,
                    category: e.category, status: e.status, amount: e.amount, updatedAt: e.updatedAt,
                })),
            },
            accounting: {
                totalIncome, totalExpense: totalExpenseLedger, net: totalIncome - totalExpenseLedger,
                unreconciledCount,
                bankAccounts: bankAccounts.map(b => ({
                    _id: b._id.toString(), bankName: b.bankName,
                    balance: (b.openingBalance || 0) + (netByBank[b._id.toString()] || 0),
                })),
                recentEntries: ledgerEntries.slice(0, 10).map(e => ({
                    _id: e._id.toString(), entryNumber: e.entryNumber, type: e.type,
                    category: e.category, amount: e.amount, reconciled: e.reconciled, date: e.date,
                })),
            },
            hr: {
                totalEmployees: employees.length,
                activeEmployees: activeEmployees.length,
                pendingLeaveCount: pendingLeaves.length,
                latestPayrollRun: latestRun ? {
                    runNumber: latestRun.runNumber, month: latestRun.month, year: latestRun.year,
                    status: latestRun.status, totalNet: latestRun.totalNet, employeeCount: latestRun.entries.length,
                } : null,
                recentEmployees: employees.slice(0, 10).map(e => ({
                    _id: e._id.toString(), employeeNumber: e.employeeNumber, name: e.name,
                    designation: e.designation, departmentName: e.departmentName, status: e.status, salary: e.salary,
                })),
            },
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/admin/cloud/tenants/[id]/erp') }, { status: 500 });
    }
}
