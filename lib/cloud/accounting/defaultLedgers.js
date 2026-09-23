/**
 * Default System Ledgers for Indian Standard Chart of Accounts.
 *
 * Seeded automatically for every Cloud tenant workspace upon COA initialization.
 */

export const DEFAULT_SYSTEM_LEDGERS = [
    // ── Cash & Bank ───────────────────────────────────────────────────────────
    {
        name: 'Cash Account',
        code: 'LED_CASH',
        groupCode: 'CASH_IN_HAND',
        isSystem: true,
        description: 'Main physical cash balance in office register.',
    },
    {
        name: 'Petty Cash Account',
        code: 'LED_PETTY_CASH',
        groupCode: 'CASH_IN_HAND',
        isSystem: true,
        description: 'Small imprest cash fund for daily office operational expenses.',
    },
    {
        name: 'Main Bank Account',
        code: 'LED_MAIN_BANK',
        groupCode: 'BANK_ACCOUNTS',
        isSystem: true,
        description: 'Primary current account for operational collections and payouts.',
    },

    // ── Sales & Direct Incomes ────────────────────────────────────────────────
    {
        name: 'Sales Account (Domestic)',
        code: 'LED_SALES_DOMESTIC',
        groupCode: 'SALES_ACCOUNTS',
        isSystem: true,
        description: 'General revenue from domestic sale of goods and products.',
    },
    {
        name: 'Services and Consultation Income',
        code: 'LED_SERVICE_INCOME',
        groupCode: 'DIRECT_INCOMES',
        isSystem: true,
        description: 'Revenue from professional services, consultation, and delivery.',
    },
    {
        name: 'Interest Received',
        code: 'LED_INTEREST_INCOME',
        groupCode: 'INDIRECT_INCOMES',
        isSystem: true,
        description: 'Interest earned on bank deposits and investments.',
    },
    {
        name: 'Discounts Received',
        code: 'LED_DISCOUNT_RECEIVED',
        groupCode: 'INDIRECT_INCOMES',
        isSystem: true,
        description: 'Discounts granted by suppliers and vendors upon settlement.',
    },

    // ── Purchases & Direct Expenses ───────────────────────────────────────────
    {
        name: 'Purchases (Traded Goods & Inventory)',
        code: 'LED_PURCHASES_GENERAL',
        groupCode: 'PURCHASE_ACCOUNTS',
        isSystem: true,
        description: 'Cost of inventory procured for trading or manufacturing.',
    },
    {
        name: 'Freight Inward and Delivery Charges',
        code: 'LED_FREIGHT_INWARD',
        groupCode: 'DIRECT_EXPENSES',
        isSystem: true,
        description: 'Transportation and logistics costs incurred to bring goods into warehouse.',
    },

    // ── Indirect Operating Expenses ───────────────────────────────────────────
    {
        name: 'Salaries and Staff Wages',
        code: 'LED_SALARIES_WAGES',
        groupCode: 'INDIRECT_EXPENSES',
        isSystem: true,
        description: 'Monthly payroll, employee salaries, and staff remuneration.',
    },
    {
        name: 'Office Rent and Facility Lease',
        code: 'LED_OFFICE_RENT',
        groupCode: 'INDIRECT_EXPENSES',
        isSystem: true,
        description: 'Monthly commercial rental and warehouse lease payments.',
    },
    {
        name: 'Electricity and Power Utilities',
        code: 'LED_ELECTRICITY_EXPENSE',
        groupCode: 'INDIRECT_EXPENSES',
        isSystem: true,
        description: 'Electricity, water, and municipal power charges.',
    },
    {
        name: 'Cloud Infrastructure and Software Subscriptions',
        code: 'LED_SOFTWARE_EXPENSE',
        groupCode: 'INDIRECT_EXPENSES',
        isSystem: true,
        description: 'SaaS licenses, server hosting, and digital tools.',
    },
    {
        name: 'Printing, Stationery and Supplies',
        code: 'LED_PRINTING_STATIONERY',
        groupCode: 'INDIRECT_EXPENSES',
        isSystem: true,
        description: 'Paper, packaging, postage, and day-to-day office consumables.',
    },
    {
        name: 'Bank Charges and Payment Gateway Fees',
        code: 'LED_BANK_CHARGES',
        groupCode: 'INDIRECT_EXPENSES',
        isSystem: true,
        description: 'Bank processing fees, NEFT/RTGS charges, and payment gateway commissions.',
    },
    {
        name: 'Travel and Conveyance Expenses',
        code: 'LED_TRAVEL_EXPENSE',
        groupCode: 'INDIRECT_EXPENSES',
        isSystem: true,
        description: 'Local business travel, fuel, lodging, and client visitation costs.',
    },
    {
        /*
         * Closing stock. Both legs of the period-end entry hit this ledger:
         * it stands on the balance sheet as an asset and, being in
         * STOCK_IN_HAND, is treated as affecting gross profit - which is what
         * lifts unsold purchases back out of cost of goods sold.
         */
        name: 'Closing Stock',
        code: 'LED_CLOSING_STOCK',
        groupCode: 'STOCK_IN_HAND',
        isSystem: true,
        description: 'Value of stock held at a period end, entered by the business. Cloud does not choose an inventory valuation method on your behalf.',
    },
    {
        name: 'Marketing and Advertising',
        code: 'LED_MARKETING_EXPENSE',
        groupCode: 'INDIRECT_EXPENSES',
        isSystem: true,
        description: 'Advertising, campaigns, promotional material and agency fees.',
    },
    {
        // Reachable by existing tenants only because ensureChartOfAccounts now
        // seeds per ledger code rather than skipping any tenant that already has
        // one - before that fix, a ledger added here never appeared again.
        name: 'Suspense Account',
        code: 'LED_SUSPENSE',
        groupCode: 'SUSPENSE_ACCOUNT',
        isSystem: true,
        description: 'Holds entries that could not be classified. Everything here needs reassigning to a real ledger - it is a queue, not a destination.',
    },

    // ── Duties & Taxes (GST) ──────────────────────────────────────────────────
    {
        name: 'Output CGST',
        code: 'LED_OUTPUT_CGST',
        groupCode: 'DUTIES_AND_TAXES',
        isSystem: true,
        description: 'Central GST collected on intra-state sales (liability payable to govt).',
    },
    {
        name: 'Output SGST',
        code: 'LED_OUTPUT_SGST',
        groupCode: 'DUTIES_AND_TAXES',
        isSystem: true,
        description: 'State GST collected on intra-state sales (liability payable to govt).',
    },
    {
        name: 'Output IGST',
        code: 'LED_OUTPUT_IGST',
        groupCode: 'DUTIES_AND_TAXES',
        isSystem: true,
        description: 'Integrated GST collected on inter-state sales (liability payable to govt).',
    },
    {
        name: 'Input CGST (ITC)',
        code: 'LED_INPUT_CGST',
        groupCode: 'DUTIES_AND_TAXES',
        isSystem: true,
        description: 'Central GST Input Tax Credit paid on purchases and expenses.',
    },
    {
        name: 'Input SGST (ITC)',
        code: 'LED_INPUT_SGST',
        groupCode: 'DUTIES_AND_TAXES',
        isSystem: true,
        description: 'State GST Input Tax Credit paid on purchases and expenses.',
    },
    {
        name: 'Input IGST (ITC)',
        code: 'LED_INPUT_IGST',
        groupCode: 'DUTIES_AND_TAXES',
        isSystem: true,
        description: 'Integrated GST Input Tax Credit paid on inter-state purchases.',
    },
    {
        name: 'TDS Payable',
        code: 'LED_TDS_PAYABLE',
        groupCode: 'DUTIES_AND_TAXES',
        isSystem: true,
        description: 'Tax Deducted at Source on vendor bills, rent, or professional fees.',
    },

    // ── Capital & Provisions ──────────────────────────────────────────────────
    {
        name: 'Proprietor / Partner Capital Account',
        code: 'LED_CAPITAL_MAIN',
        groupCode: 'CAPITAL_ACCOUNT',
        isSystem: true,
        description: 'Owner equity and initial capital introduced into the business.',
    },
    {
        name: 'Salaries Payable',
        code: 'LED_SALARIES_PAYABLE',
        groupCode: 'PROVISIONS',
        isSystem: true,
        description: 'Accrued unpaid staff salaries at month-end.',
    },
];
