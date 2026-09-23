/**
 * Financial Reports Engine for VelBiz Cloud.
 *
 * Generates the standard financial statements:
 *   1. Trial Balance (Group & Ledger breakdown, Dr = Cr validation)
 *   2. Profit and Loss Statement (Trading Account -> Gross Profit -> Net Profit)
 *   3. Balance Sheet (Liabilities & Capital = Assets verification)
 *   4. General Ledger Statement (Khata with running balance)
 *   5. Daybook (Chronological transaction register)
 */

import { ObjectId } from 'mongodb';
import { ACCOUNT_GROUPS, getGroupByCode } from './groups.js';
import { ensureChartOfAccounts } from './coa.js';

/**
 * Generates the Trial Balance for a tenant within a date range.
 */
export async function generateTrialBalance(db, tenantId, fromDate = null, toDate = null) {
    await ensureChartOfAccounts(db, tenantId);

    const ledgers = await db.collection('erp_ledgers').find({ tenantId, active: { $ne: false } }).toArray();

    const matchQuery = { tenantId };
    if (fromDate || toDate) {
        matchQuery.date = {};
        if (fromDate) matchQuery.date.$gte = new Date(fromDate);
        if (toDate) matchQuery.date.$lte = new Date(toDate);
    }

    // Aggregate postings in date range
    const periodPostings = await db.collection('erp_ledger_postings').aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$ledgerId',
                totalDebit: { $sum: { $cond: [{ $eq: ['$entryType', 'debit'] }, '$amount', 0] } },
                totalCredit: { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
            },
        },
    ]).toArray();

    // Aggregate pre-period postings for opening balance if fromDate is set
    let prePostingsMap = new Map();
    if (fromDate) {
        const prePostings = await db.collection('erp_ledger_postings').aggregate([
            { $match: { tenantId, date: { $lt: new Date(fromDate) } } },
            {
                $group: {
                    _id: '$ledgerId',
                    totalDebit: { $sum: { $cond: [{ $eq: ['$entryType', 'debit'] }, '$amount', 0] } },
                    totalCredit: { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
                },
            },
        ]).toArray();
        for (const p of prePostings) {
            if (p._id) prePostingsMap.set(p._id.toString(), p);
        }
    }

    const periodMap = new Map();
    for (const p of periodPostings) {
        if (p._id) periodMap.set(p._id.toString(), p);
    }

    let grandDebit = 0;
    let grandCredit = 0;

    const enrichedLedgers = ledgers.map(l => {
        const lId = l._id.toString();
        const pre = prePostingsMap.get(lId) || { totalDebit: 0, totalCredit: 0 };
        const per = periodMap.get(lId) || { totalDebit: 0, totalCredit: 0 };

        // Calculate opening balance as of fromDate
        const initialDr = l.openingBalanceType === 'debit' ? (l.openingBalance || 0) : 0;
        const initialCr = l.openingBalanceType === 'credit' ? (l.openingBalance || 0) : 0;
        const preNetDr = initialDr + pre.totalDebit;
        const preNetCr = initialCr + pre.totalCredit;

        let openingBal = 0;
        let openingType = l.normalBalance || 'debit';
        if (preNetDr >= preNetCr) {
            openingBal = preNetDr - preNetCr;
            openingType = 'debit';
        } else {
            openingBal = preNetCr - preNetDr;
            openingType = 'credit';
        }

        const debitAmount = Math.round(per.totalDebit * 100) / 100;
        const creditAmount = Math.round(per.totalCredit * 100) / 100;

        const totalDr = (openingType === 'debit' ? openingBal : 0) + debitAmount;
        const totalCr = (openingType === 'credit' ? openingBal : 0) + creditAmount;

        let closingBal = 0;
        let closingType = l.normalBalance || 'debit';
        if (totalDr >= totalCr) {
            closingBal = totalDr - totalCr;
            closingType = 'debit';
        } else {
            closingBal = totalCr - totalDr;
            closingType = 'credit';
        }

        if (closingType === 'debit') {
            grandDebit += closingBal;
        } else {
            grandCredit += closingBal;
        }

        return {
            _id: lId,
            name: l.name,
            code: l.code || null,
            groupCode: l.groupCode,
            pillar: l.pillar,
            openingBalance: openingBal,
            openingBalanceType: openingType,
            debit: debitAmount,
            credit: creditAmount,
            closingBalance: closingBal,
            closingBalanceType: closingType,
        };
    });

    grandDebit = Math.round(grandDebit * 100) / 100;
    grandCredit = Math.round(grandCredit * 100) / 100;
    const diff = Math.round(Math.abs(grandDebit - grandCredit) * 100) / 100;
    const isBalanced = diff < 0.05;

    // Group into the 28 account groups
    const groupRows = ACCOUNT_GROUPS.map(group => {
        const groupLedgers = enrichedLedgers.filter(l => l.groupCode === group.code);
        const groupDr = groupLedgers.reduce((s, l) => s + (l.closingBalanceType === 'debit' ? l.closingBalance : 0), 0);
        const groupCr = groupLedgers.reduce((s, l) => s + (l.closingBalanceType === 'credit' ? l.closingBalance : 0), 0);

        return {
            code: group.code,
            name: group.name,
            pillar: group.pillar,
            parentCode: group.parentCode,
            isPrimary: group.isPrimary,
            debit: Math.round(groupDr * 100) / 100,
            credit: Math.round(groupCr * 100) / 100,
            ledgers: groupLedgers,
        };
    }).filter(g => g.debit > 0 || g.credit > 0 || g.ledgers.length > 0);

    /*
     * The "Difference in Opening Balances" row.
     *
     * This is a real and correct convention: when the books do not tie, a
     * trial balance is presented with a balancing figure so the two columns
     * agree, and the figure itself names the problem. Keeping it.
     *
     * `parentCode` was 'MISC_EXPENSES', which is not a group code that exists -
     * the real one is 'MISC_EXP_ASSET' (groups.js). A wrong parent silently
     * orphans the row from the group tree, so the balancing figure would be
     * invisible in exactly the report that needs it most.
     */
    if (!isBalanced) {
        const diffRow = {
            code: 'DIFF_OPENING_BAL',
            name: 'Difference in Opening Balances',
            isPrimary: false,
            ledgers: [],
        };
        if (grandDebit > grandCredit) {
            groupRows.push({ ...diffRow, pillar: 'Liabilities', parentCode: 'CAPITAL_ACCOUNT', debit: 0, credit: diff });
        } else {
            groupRows.push({ ...diffRow, pillar: 'Assets', parentCode: 'MISC_EXP_ASSET', debit: diff, credit: 0 });
        }
    }

    /*
     * WHAT `isBalanced` MEANS, AND WHY IT IS NOT ALWAYS TRUE.
     *
     * This was a hardcoded `true`. The intent was reasonable - after the
     * balancing figure above, the presented columns really do tie - but the
     * effect was that the field could never be false, so nothing could ever
     * detect a broken ledger by asking. run-business-cycle.mjs asserted on it
     * and therefore asserted nothing at all.
     *
     * Two separate questions now have two separate answers:
     *   isBalanced  - do the underlying books actually tie? Computed, can be false.
     *   presented   - the tied columns, including the balancing figure, for display.
     *
     * `debit`/`credit` report the TRUE sums. A caller that wants the presented
     * view asks for it by name, which means no caller gets a forced number
     * without having chosen to.
     */
    return {
        groups: groupRows,
        ledgers: enrichedLedgers,
        totals: {
            debit: grandDebit,
            credit: grandCredit,
            rawDebit: grandDebit,
            rawCredit: grandCredit,
            difference: diff,
            isBalanced,
            hasOpeningDiscrepancy: !isBalanced,
            presented: {
                debit: Math.max(grandDebit, grandCredit),
                credit: Math.max(grandDebit, grandCredit),
            },
        },
    };
}

/**
 * Generates the Trading and Profit and Loss statement.
 */
export async function generateProfitAndLoss(db, tenantId, fromDate = null, toDate = null) {
    const tb = await generateTrialBalance(db, tenantId, fromDate, toDate);

    // 1. Trading Account components
    const salesGroupCodes = ['SALES_ACCOUNTS', 'DIRECT_INCOMES'];
    const directExpenseGroupCodes = ['PURCHASE_ACCOUNTS', 'DIRECT_EXPENSES'];

    // Direct Income (Credit balance normal)
    const directIncomeLedgers = tb.ledgers.filter(l => salesGroupCodes.includes(l.groupCode));
    const totalDirectIncome = directIncomeLedgers.reduce((s, l) => s + (l.closingBalanceType === 'credit' ? l.closingBalance : -l.closingBalance), 0);

    // Direct Expenses (Debit balance normal)
    const directExpenseLedgers = tb.ledgers.filter(l => directExpenseGroupCodes.includes(l.groupCode));
    const totalDirectExpense = directExpenseLedgers.reduce((s, l) => s + (l.closingBalanceType === 'debit' ? l.closingBalance : -l.closingBalance), 0);

    const grossProfit = totalDirectIncome - totalDirectExpense;

    // 2. Operating P&L components
    const indirectIncomeLedgers = tb.ledgers.filter(l => l.groupCode === 'INDIRECT_INCOMES');
    const totalIndirectIncome = indirectIncomeLedgers.reduce((s, l) => s + (l.closingBalanceType === 'credit' ? l.closingBalance : -l.closingBalance), 0);

    const indirectExpenseLedgers = tb.ledgers.filter(l => l.groupCode === 'INDIRECT_EXPENSES');
    const totalIndirectExpense = indirectExpenseLedgers.reduce((s, l) => s + (l.closingBalanceType === 'debit' ? l.closingBalance : -l.closingBalance), 0);

    const netProfit = grossProfit + totalIndirectIncome - totalIndirectExpense;

    return {
        tradingAccount: {
            directIncomes: {
                ledgers: directIncomeLedgers,
                total: Math.max(0, Math.round(totalDirectIncome * 100) / 100),
            },
            directExpenses: {
                ledgers: directExpenseLedgers,
                total: Math.max(0, Math.round(totalDirectExpense * 100) / 100),
            },
            grossProfit: Math.round(grossProfit * 100) / 100,
            isGrossLoss: grossProfit < 0,
        },
        operatingAccount: {
            indirectIncomes: {
                ledgers: indirectIncomeLedgers,
                total: Math.max(0, Math.round(totalIndirectIncome * 100) / 100),
            },
            indirectExpenses: {
                ledgers: indirectExpenseLedgers,
                total: Math.max(0, Math.round(totalIndirectExpense * 100) / 100),
            },
            netProfit: Math.round(netProfit * 100) / 100,
            isNetLoss: netProfit < 0,
        },
    };
}

/**
 * Generates the Balance Sheet as of a specified date.
 */
export async function generateBalanceSheet(db, tenantId, asOnDate = null) {
    const tb = await generateTrialBalance(db, tenantId, null, asOnDate);
    const pl = await generateProfitAndLoss(db, tenantId, null, asOnDate);

    /*
     * WHICH GROUPS BELONG ON WHICH SIDE.
     *
     * These two lists existed and NOTHING READ THEM. Every filter below wrote
     * out its own group codes inline, so the lists looked like the authority on
     * balance sheet composition while being pure decoration - and they
     * disagreed with the filters. SUSPENSE_ACCOUNT and BRANCH_DIVISIONS were
     * listed here as liabilities and omitted from the filter that builds them,
     * so anything in those groups landed on neither side and silently
     * unbalanced the statement.
     *
     * They are used now, by the coverage check at the bottom of this function.
     * A declaration that nothing reads is worse than no declaration: it invites
     * exactly this, where somebody updates the list, believes they have changed
     * the report, and has not.
     */
    const assetGroupCodes = [
        'CURR_ASSETS', 'BANK_ACCOUNTS', 'CASH_IN_HAND', 'SUNDRY_DEBTORS',
        'STOCK_IN_HAND', 'DEPOSITS_ASSET', 'LOANS_ADV_ASSET', 'FIXED_ASSETS',
        'INVESTMENTS', 'MISC_EXP_ASSET'
    ];

    const liabilityGroupCodes = [
        'CAPITAL_ACCOUNT', 'RESERVES_SURPLUS', 'LOANS_LIABILITY', 'BANK_OD_OCC',
        'SECURED_LOANS', 'UNSECURED_LOANS', 'CURR_LIABILITIES', 'SUNDRY_CREDITORS',
        'DUTIES_AND_TAXES', 'PROVISIONS', 'BRANCH_DIVISIONS', 'SUSPENSE_ACCOUNT'
    ];

    // Income and expense groups close into the P&L and reach the balance sheet
    // through retained earnings, so they are correctly absent from both lists.
    const plGroupCodes = ACCOUNT_GROUPS
        .filter(g => g.pillar === 'Income' || g.pillar === 'Expenses')
        .map(g => g.code);

    // Group assets
    const assetSections = [
        {
            title: 'Fixed Assets',
            groupCodes: ['FIXED_ASSETS'],
            ledgers: tb.ledgers.filter(l => l.groupCode === 'FIXED_ASSETS' && l.closingBalance > 0),
        },
        {
            title: 'Investments',
            groupCodes: ['INVESTMENTS'],
            ledgers: tb.ledgers.filter(l => l.groupCode === 'INVESTMENTS' && l.closingBalance > 0),
        },
        {
            title: 'Current Assets',
            groupCodes: ['CURR_ASSETS', 'BANK_ACCOUNTS', 'CASH_IN_HAND', 'SUNDRY_DEBTORS', 'STOCK_IN_HAND', 'DEPOSITS_ASSET', 'LOANS_ADV_ASSET'],
            ledgers: tb.ledgers.filter(l => ['CURR_ASSETS', 'BANK_ACCOUNTS', 'CASH_IN_HAND', 'SUNDRY_DEBTORS', 'STOCK_IN_HAND', 'DEPOSITS_ASSET', 'LOANS_ADV_ASSET'].includes(l.groupCode) && l.closingBalance > 0),
        },
        {
            /*
             * Found by the coverage check below on its first run: MISC_EXP_ASSET
             * was declared an asset group and gathered by no section, so a
             * balance there would vanish from the statement exactly as the
             * Suspense balances did. Same bug, second instance, and it had been
             * sitting next to the first one the whole time.
             *
             * Preliminary and deferred revenue expenditure - costs capitalised
             * and written off over several years - which is why it is an asset
             * rather than an expense despite the name.
             */
            title: 'Miscellaneous Expenditure',
            groupCodes: ['MISC_EXP_ASSET'],
            ledgers: tb.ledgers.filter(l => l.groupCode === 'MISC_EXP_ASSET' && l.closingBalance > 0),
        },
    ];

    let totalAssets = 0;
    for (const sec of assetSections) {
        sec.total = sec.ledgers.reduce((s, l) => s + (l.closingBalanceType === 'debit' ? l.closingBalance : -l.closingBalance), 0);
        totalAssets += sec.total;
    }

    // Group liabilities
    const capitalLedgers = tb.ledgers.filter(l => ['CAPITAL_ACCOUNT', 'RESERVES_SURPLUS'].includes(l.groupCode));
    const capitalTotal = capitalLedgers.reduce((s, l) => s + (l.closingBalanceType === 'credit' ? l.closingBalance : -l.closingBalance), 0);

    const loanLedgers = tb.ledgers.filter(l => ['LOANS_LIABILITY', 'BANK_OD_OCC', 'SECURED_LOANS', 'UNSECURED_LOANS'].includes(l.groupCode));
    const loansTotal = loanLedgers.reduce((s, l) => s + (l.closingBalanceType === 'credit' ? l.closingBalance : -l.closingBalance), 0);

    /*
     * SUSPENSE_ACCOUNT and BRANCH_DIVISIONS belong here.
     *
     * They were declared in liabilityGroupCodes above and then left out of every
     * filter that actually builds the statement, so a ledger in either group
     * appeared on NEITHER side of the balance sheet and silently unbalanced it
     * by exactly its own balance. A single 999 rupee expense in Suspense was
     * enough to make Assets and Liabilities disagree with no explanation
     * anywhere on the page.
     *
     * That was always wrong, and Phase 3 made it dangerous: unmapped expense
     * categories now route to Suspense on purpose, so the mechanism built to
     * make a problem visible would have quietly broken the balance sheet
     * instead. Suspense is a real balance the business is carrying until
     * somebody reclassifies it, and a statement that omits it is not a balance
     * sheet.
     */
    const currentLiabLedgers = tb.ledgers.filter(l => ['CURR_LIABILITIES', 'SUNDRY_CREDITORS', 'DUTIES_AND_TAXES', 'PROVISIONS', 'SUSPENSE_ACCOUNT', 'BRANCH_DIVISIONS'].includes(l.groupCode));
    const currentLiabTotal = currentLiabLedgers.reduce((s, l) => s + (l.closingBalanceType === 'credit' ? l.closingBalance : -l.closingBalance), 0);

    /*
     * COVERAGE CHECK: every group must land somewhere.
     *
     * A balance sheet that silently drops a group does not fail - it just
     * disagrees with itself by however much was in that group, with nothing on
     * the page to say why. That is precisely what happened with Suspense, and
     * it took a 999 rupee expense and a deliberate hunt to notice.
     *
     * Dev-only, because in production a loud console error on every report is
     * worse than the drift it warns about - the guard that belongs in CI is
     * scripts/check-accounting.mjs.
     */
    if (process.env.NODE_ENV !== 'production') {
        const covered = new Set([...assetGroupCodes, ...liabilityGroupCodes, ...plGroupCodes]);
        const orphans = ACCOUNT_GROUPS.map(g => g.code).filter(c => !covered.has(c));
        if (orphans.length) {
            console.error(`[accounting/balance-sheet] groups on no statement: ${orphans.join(', ')} - their balances will vanish and unbalance the sheet.`);
        }
        // The lists must also match what the filters below actually gather.
        const gathered = new Set([
            ...assetSections.flatMap(s => s.groupCodes || []),
            'CAPITAL_ACCOUNT', 'RESERVES_SURPLUS',
            'LOANS_LIABILITY', 'BANK_OD_OCC', 'SECURED_LOANS', 'UNSECURED_LOANS',
            'CURR_LIABILITIES', 'SUNDRY_CREDITORS', 'DUTIES_AND_TAXES', 'PROVISIONS',
            'SUSPENSE_ACCOUNT', 'BRANCH_DIVISIONS',
        ]);
        const declaredNotGathered = [...assetGroupCodes, ...liabilityGroupCodes].filter(c => !gathered.has(c));
        if (declaredNotGathered.length) {
            console.error(`[accounting/balance-sheet] declared but never gathered: ${declaredNotGathered.join(', ')}`);
        }
    }

    let openingDiffLiab = 0;
    let openingDiffAsset = 0;
    if (tb.totals?.hasOpeningDiscrepancy) {
        if (tb.totals.rawDebit > tb.totals.rawCredit) {
            openingDiffLiab = tb.totals.difference;
        } else {
            openingDiffAsset = tb.totals.difference;
        }
    }

    const netProfitForBS = pl.operatingAccount.netProfit;
    const finalAssets = Math.round((totalAssets + openingDiffAsset) * 100) / 100;
    const finalLiabilities = Math.round((capitalTotal + netProfitForBS + loansTotal + currentLiabTotal + openingDiffLiab) * 100) / 100;

    return {
        assets: {
            sections: assetSections,
            openingDiff: openingDiffAsset,
            total: finalAssets,
        },
        liabilities: {
            capital: {
                ledgers: capitalLedgers,
                retainedEarnings: netProfitForBS,
                openingDiff: openingDiffLiab,
                total: Math.round((capitalTotal + netProfitForBS + openingDiffLiab) * 100) / 100,
            },
            loans: {
                ledgers: loanLedgers,
                total: Math.round(loansTotal * 100) / 100,
            },
            currentLiabilities: {
                ledgers: currentLiabLedgers,
                total: Math.round(currentLiabTotal * 100) / 100,
            },
            total: finalLiabilities,
        },
        isBalanced: Math.abs(finalAssets - finalLiabilities) < 0.05,
    };
}

/**
 * Generates an Account Ledger Statement (Khata) for a selected ledger.
 */
export async function generateLedgerStatement(db, tenantId, ledgerId, fromDate = null, toDate = null) {
    await ensureChartOfAccounts(db, tenantId);

    const ledger = await db.collection('erp_ledgers').findOne({
        tenantId,
        _id: new ObjectId(ledgerId),
        active: { $ne: false },
    });

    if (!ledger) {
        throw new Error('Ledger not found.');
    }

    // 1. Calculate Opening Balance before fromDate
    const initialDr = ledger.openingBalanceType === 'debit' ? (ledger.openingBalance || 0) : 0;
    const initialCr = ledger.openingBalanceType === 'credit' ? (ledger.openingBalance || 0) : 0;

    let preDr = 0;
    let preCr = 0;
    if (fromDate) {
        const preAgg = await db.collection('erp_ledger_postings').aggregate([
            { $match: { tenantId, ledgerId: ledger._id, date: { $lt: new Date(fromDate) } } },
            {
                $group: {
                    _id: null,
                    totalDebit: { $sum: { $cond: [{ $eq: ['$entryType', 'debit'] }, '$amount', 0] } },
                    totalCredit: { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
                },
            },
        ]).toArray();
        if (preAgg[0]) {
            preDr = preAgg[0].totalDebit;
            preCr = preAgg[0].totalCredit;
        }
    }

    const netPreDr = initialDr + preDr;
    const netPreCr = initialCr + preCr;
    let runningBalance = 0;
    let runningType = ledger.normalBalance || 'debit';

    if (netPreDr >= netPreCr) {
        runningBalance = netPreDr - netPreCr;
        runningType = 'debit';
    } else {
        runningBalance = netPreCr - netPreDr;
        runningType = 'credit';
    }

    const openingBalanceRow = {
        date: fromDate || ledger.createdAt,
        particulars: 'Opening Balance',
        voucherType: 'Opening',
        voucherNumber: '-',
        debit: runningType === 'debit' ? runningBalance : 0,
        credit: runningType === 'credit' ? runningBalance : 0,
        balance: runningBalance,
        balanceType: runningType,
    };

    // 2. Fetch period postings
    const matchQuery = { tenantId, ledgerId: ledger._id };
    if (fromDate || toDate) {
        matchQuery.date = {};
        if (fromDate) matchQuery.date.$gte = new Date(fromDate);
        if (toDate) matchQuery.date.$lte = new Date(toDate);
    }

    const postings = await db.collection('erp_ledger_postings')
        .find(matchQuery)
        .sort({ date: 1, createdAt: 1 })
        .toArray();

    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    const rows = postings.map(p => {
        const debit = p.entryType === 'debit' ? p.amount : 0;
        const credit = p.entryType === 'credit' ? p.amount : 0;

        totalPeriodDebit += debit;
        totalPeriodCredit += credit;

        // Update running balance based on Dr vs Cr
        let netDebitVal = (runningType === 'debit' ? runningBalance : -runningBalance) + (debit - credit);

        if (netDebitVal >= 0) {
            runningBalance = netDebitVal;
            runningType = 'debit';
        } else {
            runningBalance = Math.abs(netDebitVal);
            runningType = 'credit';
        }

        return {
            _id: p._id.toString(),
            voucherId: p.voucherId ? p.voucherId.toString() : null,
            date: p.date,
            voucherType: p.voucherType,
            voucherNumber: p.voucherNumber,
            particulars: p.particulars || 'Transaction',
            narration: p.narration || '',
            referenceNo: p.referenceNo || '',
            debit,
            credit,
            balance: Math.round(runningBalance * 100) / 100,
            balanceType: runningType,
        };
    });

    return {
        ledger: {
            _id: ledger._id.toString(),
            name: ledger.name,
            code: ledger.code || null,
            groupCode: ledger.groupCode,
            pillar: ledger.pillar,
            normalBalance: ledger.normalBalance,
        },
        openingBalance: openingBalanceRow,
        transactions: rows,
        totals: {
            debit: Math.round(totalPeriodDebit * 100) / 100,
            credit: Math.round(totalPeriodCredit * 100) / 100,
            closingBalance: Math.round(runningBalance * 100) / 100,
            closingBalanceType: runningType,
        },
    };
}

/**
 * Generates the Daybook register.
 */
export async function generateDaybook(db, tenantId, dateStr = null, voucherType = null) {
    await ensureChartOfAccounts(db, tenantId);

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filter = {
        tenantId,
        date: { $gte: startOfDay, $lte: endOfDay },
    };

    if (voucherType) {
        filter.voucherType = voucherType;
    }

    const vouchers = await db.collection('erp_vouchers')
        .find(filter)
        .sort({ date: -1, createdAt: -1 })
        .toArray();

    const totalAmount = vouchers.reduce((s, v) => s + (v.totalAmount || 0), 0);

    return {
        date: dateStr || targetDate.toISOString().slice(0, 10),
        vouchers: vouchers.map(v => ({ ...v, _id: v._id.toString() })),
        totalCount: vouchers.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
    };
}
