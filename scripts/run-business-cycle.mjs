import { MongoClient, ObjectId } from 'mongodb';
import { ensureChartOfAccounts, getChartOfAccounts, createLedger } from '../lib/cloud/accounting/coa.js';
import { postVoucher, VOUCHER_TYPES } from '../lib/cloud/accounting/voucherEngine.js';
import { generateTrialBalance, generateProfitAndLoss, generateBalanceSheet, generateLedgerStatement, generateDaybook } from '../lib/cloud/accounting/reportsEngine.js';
import puppeteer from 'puppeteer';

async function runMultiTransactionWorkflow() {
    console.log('💼 Testing Complete Multi-Transaction Accounting Workflow...');

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(process.env.CLOUD_DB_NAME || 'velbiz_dev');
    const tenantId = 'TNT-SIF-5584';

    // Clean slate for deterministic test assertions
    await db.collection('erp_vouchers').deleteMany({ tenantId });
    await db.collection('erp_ledger_postings').deleteMany({ tenantId });
    await db.collection('erp_ledgers').deleteMany({ tenantId, name: 'Apollo Diagnostics' });
    await db.collection('erp_counters').deleteMany({ tenantId });

    await ensureChartOfAccounts(db, tenantId);

    // 1. Create a custom debtor: Apollo Diagnostics
    console.log('\n1. Creating Debtor Ledger: Apollo Diagnostics (Opening Balance: ₹50,000 Dr)...');
    let debtor = await db.collection('erp_ledgers').findOne({ tenantId, name: 'Apollo Diagnostics' });
    if (!debtor) {
        debtor = await createLedger(db, tenantId, {
            name: 'Apollo Diagnostics',
            groupCode: 'SUNDRY_DEBTORS',
            openingBalance: 50000,
            openingBalanceType: 'debit',
            gstin: '33AABCA1234F1Z5',
            pan: 'AABCA1234F',
            description: 'Major Diagnostic Center Client'
        });
    }
    console.log('   Debtor ID:', debtor._id);

    const coa = await getChartOfAccounts(db, tenantId);
    const bank = coa.ledgers.find(l => l.code === 'LED_MAIN_BANK');
    const sales = coa.ledgers.find(l => l.code === 'LED_SALES_DOMESTIC');
    const cgst = coa.ledgers.find(l => l.code === 'LED_OUTPUT_CGST');
    const sgst = coa.ledgers.find(l => l.code === 'LED_OUTPUT_SGST');
    const rent = coa.ledgers.find(l => l.code === 'LED_OFFICE_RENT');

    // 2. Post Sales Voucher: Apollo Diagnostics ₹1,18,000
    console.log('\n2. Posting Sales Voucher (F8): ₹1,18,000 (Base: ₹1,00,000, CGST: ₹9,000, SGST: ₹9,000)...');
    const salesVch = await postVoucher(db, tenantId, {
        voucherType: VOUCHER_TYPES.SALES,
        date: new Date(),
        referenceNo: 'INV-APOLLO-001',
        narration: 'Tax Invoice raised for medical diagnostic services and supplies',
        entries: [
            { ledgerId: debtor._id, entryType: 'debit', amount: 118000, narration: 'Billed to Apollo Diagnostics' },
            { ledgerId: sales._id, entryType: 'credit', amount: 100000, narration: 'Sales of supplies' },
            { ledgerId: cgst._id, entryType: 'credit', amount: 9000, narration: 'Output CGST 9%' },
            { ledgerId: sgst._id, entryType: 'credit', amount: 9000, narration: 'Output SGST 9%' },
        ]
    });
    console.log('   Posted Sales Voucher:', salesVch.voucherNumber, '| Balanced:', salesVch.totalAmount);

    // 3. Post Receipt Voucher: ₹1,20,000 received in Bank
    console.log('\n3. Posting Receipt Voucher (F6): ₹1,20,000 from Apollo Diagnostics into Main Bank...');
    const rcpVch = await postVoucher(db, tenantId, {
        voucherType: VOUCHER_TYPES.RECEIPT,
        date: new Date(),
        referenceNo: 'NEFT-889912',
        narration: 'NEFT received from Apollo Diagnostics against outstanding dues',
        entries: [
            { ledgerId: bank._id, entryType: 'debit', amount: 120000, narration: 'Received into HDFC' },
            { ledgerId: debtor._id, entryType: 'credit', amount: 120000, narration: 'Paid by Apollo Diagnostics' },
        ]
    });
    console.log('   Posted Receipt Voucher:', rcpVch.voucherNumber, '| Total:', rcpVch.totalAmount);

    // 4. Post Payment Voucher: Office Rent ₹25,000 paid from Bank
    console.log('\n4. Posting Payment Voucher (F5): ₹25,000 Rent paid from Main Bank...');
    const rentVch = await postVoucher(db, tenantId, {
        voucherType: VOUCHER_TYPES.PAYMENT,
        date: new Date(),
        referenceNo: 'CHQ-RENT-AUG',
        narration: 'Office premises lease rent for current month',
        entries: [
            { ledgerId: rent._id, entryType: 'debit', amount: 25000, narration: 'August rent expense' },
            { ledgerId: bank._id, entryType: 'credit', amount: 25000, narration: 'Paid via cheque' },
        ]
    });
    console.log('   Posted Payment Voucher:', rentVch.voucherNumber, '| Total:', rentVch.totalAmount);

    // 5. Verify Apollo Diagnostics Khata Statement
    console.log('\n5. Verifying Apollo Diagnostics Khata Statement...');
    const apolloKhata = await generateLedgerStatement(db, tenantId, debtor._id);
    console.log('   Opening Balance: ₹', apolloKhata.openingBalance.balance, apolloKhata.openingBalance.balanceType);
    console.log('   Period Debits: ₹', apolloKhata.totals.debit);
    console.log('   Period Credits: ₹', apolloKhata.totals.credit);
    console.log('   Closing Balance: ₹', apolloKhata.totals.closingBalance, apolloKhata.totals.closingBalanceType);

    // Expected closing: 50,000 + 118,000 - 120,000 = 48,000 Dr
    if (apolloKhata.totals.closingBalance === 48000 && apolloKhata.totals.closingBalanceType === 'debit') {
        console.log('   ✅ Apollo Diagnostics Khata arithmetic is 100% accurate (₹48,000 Dr)!');
    } else {
        throw new Error('Apollo Diagnostics closing balance mismatch!');
    }

    // 6. Verify Trial Balance
    console.log('\n6. Verifying Trial Balance...');
    const tb = await generateTrialBalance(db, tenantId);
    console.log('   Total Dr: ₹', tb.totals.debit, '| Total Cr: ₹', tb.totals.credit, '| Balanced:', tb.totals.isBalanced);
    if (!tb.totals.isBalanced) throw new Error('Trial Balance is unbalanced!');
    console.log('   ✅ Trial Balance is 100% balanced!');

    // 7. Verify Profit & Loss
    console.log('\n7. Verifying Profit & Loss Statement...');
    const pl = await generateProfitAndLoss(db, tenantId);
    console.log('   Gross Profit: ₹', pl.tradingAccount.grossProfit);
    console.log('   Operating Expenses: ₹', pl.operatingAccount.indirectExpenses.total);
    console.log('   Net Profit: ₹', pl.operatingAccount.netProfit);
    // Expected: Gross profit 1,00,000 - Rent 25,000 = Net Profit 75,000
    if (pl.tradingAccount.grossProfit === 100000 && pl.operatingAccount.netProfit === 75000) {
        console.log('   ✅ Profit & Loss calculations are 100% accurate (Gross: ₹1,00,000, Net: ₹75,000)!');
    }

    // 8. Verify Balance Sheet
    console.log('\n8. Verifying Balance Sheet...');
    const bs = await generateBalanceSheet(db, tenantId);
    console.log('   Total Liabilities & Capital: ₹', bs.liabilities.total);
    console.log('   Total Assets: ₹', bs.assets.total);
    console.log('   Balance Sheet Balanced:', bs.isBalanced);
    if (!bs.isBalanced) throw new Error('Balance Sheet is unbalanced!');
    console.log('   ✅ Balance Sheet is 100% balanced!');

    await client.close();

    // 9. Take fresh full UI screenshots
    console.log('\n9. Capturing fresh UI screenshots with live populated business data...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });

    await page.goto('http://localhost:3000/cloud/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="text"]', 'test-12345');
    await page.type('input[type="password"]', 'test-12345');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await page.goto('http://localhost:3000/cloud/dashboard/erp/accounting', { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1');

    async function clickTabByText(text) {
        await page.evaluate((targetText) => {
            const btns = Array.from(document.querySelectorAll('button'));
            const match = btns.find(b => b.textContent.trim().includes(targetText));
            if (match) match.click();
        }, text);
        await new Promise(r => setTimeout(r, 600));
    }

    await page.screenshot({ path: 'scratch/populated-1-overview.png', fullPage: true });

    await clickTabByText('Ledger Statement');
    // Select Apollo Diagnostics in dropdown
    await page.evaluate((debId) => {
        const sel = document.querySelector('select');
        if (sel) {
            sel.value = debId;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, debtor._id.toString());
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'scratch/populated-3-apollo-khata.png', fullPage: true });

    await clickTabByText('Daybook');
    await page.screenshot({ path: 'scratch/populated-4-daybook.png', fullPage: true });

    await clickTabByText('Financial Statements');
    await page.screenshot({ path: 'scratch/populated-6-tb.png', fullPage: true });

    await clickTabByText('Profit & Loss Statement');
    await page.screenshot({ path: 'scratch/populated-6-pl.png', fullPage: true });

    await clickTabByText('Balance Sheet');
    await page.screenshot({ path: 'scratch/populated-6-bs.png', fullPage: true });

    await browser.close();
    console.log('\n🌟 ALL POPULATED BUSINESS DATA VERIFIED & SCREENSHOTS CAPTURED!');
}

runMultiTransactionWorkflow().catch(err => {
    console.error('❌ Error in workflow:', err);
    process.exit(1);
});
