/**
 * The chart of accounts group structure used in Indian accounting practice.
 *
 * All ledgers belong to one of these 28 predefined groups, structured
 * under the 4 primary accounting pillars (Assets, Liabilities, Income, Expenses).
 */

export const ACCOUNT_PILLARS = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    INCOME: 'Income',
    EXPENSE: 'Expenses',
};

/**
 * The 28 standard groups:
 * 15 Primary Groups + 13 Sub-Groups.
 */
export const ACCOUNT_GROUPS = [
    // ── 1. ASSETS ─────────────────────────────────────────────────────────────
    {
        code: 'CURR_ASSETS',
        name: 'Current Assets',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Assets expected to be converted to cash or consumed within a year.',
    },
    {
        code: 'BANK_ACCOUNTS',
        name: 'Bank Accounts',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: false,
        parentCode: 'CURR_ASSETS',
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Current and savings bank accounts with commercial banks.',
    },
    {
        code: 'CASH_IN_HAND',
        name: 'Cash-in-Hand',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: false,
        parentCode: 'CURR_ASSETS',
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Physical cash held in office cash registers and petty cash boxes.',
    },
    {
        code: 'SUNDRY_DEBTORS',
        name: 'Sundry Debtors',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: false,
        parentCode: 'CURR_ASSETS',
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Customers and clients who owe money for goods or services supplied on credit.',
    },
    {
        code: 'STOCK_IN_HAND',
        name: 'Stock-in-Hand',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: false,
        parentCode: 'CURR_ASSETS',
        normalBalance: 'debit',
        affectsGrossProfit: true,
        description: 'Closing inventory valuation across warehouses and stores.',
    },
    {
        code: 'DEPOSITS_ASSET',
        name: 'Deposits (Asset)',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: false,
        parentCode: 'CURR_ASSETS',
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Security deposits, rental deposits, utility deposits, and earnest money.',
    },
    {
        code: 'LOANS_ADV_ASSET',
        name: 'Loans & Advances (Asset)',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: false,
        parentCode: 'CURR_ASSETS',
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Advances given to staff, prepaid expenses, and supplier advances.',
    },
    {
        code: 'FIXED_ASSETS',
        name: 'Fixed Assets',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Long-term tangible assets (equipment, computers, furniture, vehicles, land).',
    },
    {
        code: 'INVESTMENTS',
        name: 'Investments',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Fixed deposits, government bonds, mutual funds, and equity investments.',
    },
    {
        code: 'MISC_EXP_ASSET',
        name: 'Misc. Expenses (Asset)',
        pillar: ACCOUNT_PILLARS.ASSET,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Preliminary company setup costs and deferred revenue expenditure.',
    },

    // ── 2. LIABILITIES ────────────────────────────────────────────────────────
    {
        code: 'CAPITAL_ACCOUNT',
        name: 'Capital Account',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Equity capital, partner capital, proprietor capital, and drawings.',
    },
    {
        code: 'RESERVES_SURPLUS',
        name: 'Reserves & Surplus',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: false,
        parentCode: 'CAPITAL_ACCOUNT',
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Retained earnings, accumulated profits, and statutory reserves.',
    },
    {
        code: 'LOANS_LIABILITY',
        name: 'Loans (Liability)',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Borrowed funds from banks, directors, or financial institutions.',
    },
    {
        code: 'BANK_OD_OCC',
        name: 'Bank OD/OCC A/c',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: false,
        parentCode: 'LOANS_LIABILITY',
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Bank overdraft and open cash credit limits.',
    },
    {
        code: 'SECURED_LOANS',
        name: 'Secured Loans',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: false,
        parentCode: 'LOANS_LIABILITY',
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Term loans secured against assets, equipment mortgages, and working capital lines.',
    },
    {
        code: 'UNSECURED_LOANS',
        name: 'Unsecured Loans',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: false,
        parentCode: 'LOANS_LIABILITY',
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Loans taken from promoters, directors, friends, and inter-corporate deposits.',
    },
    {
        code: 'CURR_LIABILITIES',
        name: 'Current Liabilities',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Obligations due for settlement within one financial year.',
    },
    {
        code: 'SUNDRY_CREDITORS',
        name: 'Sundry Creditors',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: false,
        parentCode: 'CURR_LIABILITIES',
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Vendors and suppliers from whom goods or services were procured on credit.',
    },
    {
        code: 'DUTIES_AND_TAXES',
        name: 'Duties & Taxes',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: false,
        parentCode: 'CURR_LIABILITIES',
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Statutory tax balances (Output CGST, SGST, IGST, Input Tax Credit, TDS, TCS).',
    },
    {
        code: 'PROVISIONS',
        name: 'Provisions',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: false,
        parentCode: 'CURR_LIABILITIES',
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Accrued liabilities (Salaries Payable, Audit Fees Payable, Rent Payable).',
    },
    {
        code: 'BRANCH_DIVISIONS',
        name: 'Branch / Divisions',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Inter-branch and division settlement accounts.',
    },
    {
        code: 'SUSPENSE_ACCOUNT',
        name: 'Suspense Account',
        pillar: ACCOUNT_PILLARS.LIABILITY,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Temporary holding account for unclassified deposits or transfers.',
    },

    // ── 3. INCOME ─────────────────────────────────────────────────────────────
    {
        code: 'SALES_ACCOUNTS',
        name: 'Sales Accounts',
        pillar: ACCOUNT_PILLARS.INCOME,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'credit',
        affectsGrossProfit: true,
        description: 'Revenue from sales of products and core business offerings.',
    },
    {
        code: 'DIRECT_INCOMES',
        name: 'Direct Incomes',
        pillar: ACCOUNT_PILLARS.INCOME,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'credit',
        affectsGrossProfit: true,
        description: 'Direct operational revenue, service fees, and consultation charges.',
    },
    {
        code: 'INDIRECT_INCOMES',
        name: 'Indirect Incomes',
        pillar: ACCOUNT_PILLARS.INCOME,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'credit',
        affectsGrossProfit: false,
        description: 'Secondary revenues (interest on bank deposits, discounts received, forex gains).',
    },

    // ── 4. EXPENSES ───────────────────────────────────────────────────────────
    {
        code: 'PURCHASE_ACCOUNTS',
        name: 'Purchase Accounts',
        pillar: ACCOUNT_PILLARS.EXPENSE,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'debit',
        affectsGrossProfit: true,
        description: 'Purchases of raw materials, traded merchandise, and clinical inventory.',
    },
    {
        code: 'DIRECT_EXPENSES',
        name: 'Direct Expenses',
        pillar: ACCOUNT_PILLARS.EXPENSE,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'debit',
        affectsGrossProfit: true,
        description: 'Direct cost of sales, inward freight, packaging, and manufacturing wages.',
    },
    {
        code: 'INDIRECT_EXPENSES',
        name: 'Indirect Expenses',
        pillar: ACCOUNT_PILLARS.EXPENSE,
        isPrimary: true,
        parentCode: null,
        normalBalance: 'debit',
        affectsGrossProfit: false,
        description: 'Operating overheads: salaries, office rent, electricity, software subscriptions, travel.',
    },
];

export function getGroupByCode(code) {
    return ACCOUNT_GROUPS.find(g => g.code === code) || null;
}

/** Every real group code. Synthetic presentation-only rows are not in here. */
export const GROUP_CODES = ACCOUNT_GROUPS.map(g => g.code);

/** The four pillar display values, for validation. */
export const ACCOUNT_PILLAR_VALUES = Object.values(ACCOUNT_PILLARS);

/**
 * Presentation-only rows that the reports engine synthesises and which
 * deliberately have no entry above - the balancing figure on an untied trial
 * balance is the only one today.
 */
export const SYNTHETIC_GROUP_CODES = ['DIFF_OPENING_BAL'];

export function isKnownGroupCode(code) {
    return GROUP_CODES.includes(code) || SYNTHETIC_GROUP_CODES.includes(code);
}

/**
 * The human name for a group code. Use this ANYWHERE a code would otherwise
 * reach a screen.
 *
 * Ledger documents persist `groupCode` but not the group's `name`, so every
 * consumer holding just a ledger has the raw SCREAMING_SNAKE code and the UI
 * was printing it verbatim - "Group: SUNDRY_DEBTORS". One helper, so fixing it
 * once fixes it everywhere rather than at six call sites.
 *
 * Falls back to Title Case rather than the raw code, so even an unknown value
 * reads as words.
 */
export function groupLabel(code) {
    const g = getGroupByCode(code);
    if (g) return g.name;
    if (code === 'DIFF_OPENING_BAL') return 'Difference in Opening Balances';
    return String(code || '')
        .split('_')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ') || '-';
}

/*
 * DEV-TIME INTEGRITY CHECK.
 *
 * `reportsEngine.js` referenced a parent group code of 'MISC_EXPENSES', which
 * does not exist - the real code is 'MISC_EXP_ASSET'. Nothing failed: the row
 * was simply orphaned from the group tree, so the balancing figure on an
 * unbalanced trial balance became invisible in the one report that exists to
 * show it.
 *
 * A wrong group code has no runtime symptom, which is exactly why it needs a
 * check that shouts. This validates the tree against itself; the repo-wide
 * scan for codes referenced in other files lives in scripts/check-accounting.mjs.
 */
if (process.env.NODE_ENV !== 'production') {
    const bad = [];
    for (const g of ACCOUNT_GROUPS) {
        if (g.parentCode && !GROUP_CODES.includes(g.parentCode)) {
            bad.push(`${g.code} has parentCode "${g.parentCode}", which is not a group`);
        }
        if (!ACCOUNT_PILLAR_VALUES.includes(g.pillar)) {
            bad.push(`${g.code} has pillar "${g.pillar}", which is not a pillar`);
        }
    }
    const dupes = GROUP_CODES.filter((c, i) => GROUP_CODES.indexOf(c) !== i);
    if (dupes.length) bad.push(`duplicate group codes: ${[...new Set(dupes)].join(', ')}`);

    if (bad.length) {
        console.error('[accounting/groups] chart of accounts is inconsistent:\n  - ' + bad.join('\n  - '));
    }
}
