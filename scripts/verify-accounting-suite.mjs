import puppeteer from 'puppeteer';

async function main() {
    console.log('🚀 Starting Cloud General Ledger In-Depth Verification Script...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });

    console.log('1. Logging in via /cloud/login with test-12345...');
    await page.goto('http://localhost:4000/cloud/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="text"]', 'test-12345');
    await page.type('input[type="password"]', 'test-12345');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('   Logged in! Current page:', page.url());

    console.log('2. Navigating to /cloud/dashboard/erp/accounting...');
    await page.goto('http://localhost:4000/cloud/dashboard/erp/accounting', { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1');

    async function clickTabByText(text) {
        await page.evaluate((targetText) => {
            const btns = Array.from(document.querySelectorAll('button'));
            const match = btns.find(b => b.textContent.trim().includes(targetText));
            if (match) match.click();
        }, text);
        await new Promise(r => setTimeout(r, 600));
    }

    // Tab 1: Overview
    console.log('3. Capturing Tab 1: Overview...');
    await clickTabByText('Overview');
    await page.screenshot({ path: 'scratch/tab-1-overview.png', fullPage: true });

    // Tab 2: Chart of Accounts
    console.log('4. Capturing Tab 2: Chart of Accounts...');
    await clickTabByText('Chart of Accounts');
    await page.screenshot({ path: 'scratch/tab-2-coa.png', fullPage: true });

    // Tab 3: Ledger Statement (Khata)
    console.log('5. Capturing Tab 3: Ledger Statement (Khata)...');
    await clickTabByText('Ledger Statement');
    await page.screenshot({ path: 'scratch/tab-3-khata.png', fullPage: true });

    // Tab 4: Daybook
    console.log('6. Capturing Tab 4: Daybook...');
    await clickTabByText('Daybook');
    await page.screenshot({ path: 'scratch/tab-4-daybook.png', fullPage: true });

    // Tab 5: Voucher Entry
    console.log('7. Capturing Tab 5: Voucher Entry...');
    await clickTabByText('Voucher Entry');
    await page.screenshot({ path: 'scratch/tab-5-voucher.png', fullPage: true });

    // Tab 6: Financial Statements (Trial Balance)
    console.log('8. Capturing Tab 6: Trial Balance...');
    await clickTabByText('Financial Statements');
    await page.screenshot({ path: 'scratch/tab-6-tb.png', fullPage: true });

    // Sub-tab: Profit & Loss
    console.log('9. Capturing Tab 6: Profit & Loss...');
    await clickTabByText('Profit & Loss Statement');
    await page.screenshot({ path: 'scratch/tab-6-pl.png', fullPage: true });

    // Sub-tab: Balance Sheet
    console.log('10. Capturing Tab 6: Balance Sheet...');
    await clickTabByText('Balance Sheet');
    await page.screenshot({ path: 'scratch/tab-6-bs.png', fullPage: true });

    await browser.close();
    console.log('🎉 ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
