/**
 * Deep links into the Accounting section must land on the tab they name.
 *
 * WHY THIS EXISTS
 *
 * The six Accounting entries in the Cloud sidebar are all the same href with a
 * different `?tab=`. They were dead for the life of the section: the page's
 * guard read `TABS.some(t => t.key === urlTab)` while every TABS entry is keyed
 * `id`, so the comparison was `undefined === 'reports'` - always false. Every
 * link fell through to the default and opened Overview.
 *
 * Nothing could catch that. It throws nothing, logs nothing, and renders a
 * perfectly good page - just not the one that was asked for. `npm run verify`
 * passed, eslint passed, the accounting checks passed, and a screenshot of the
 * result looks entirely correct unless you know which tab you clicked.
 *
 * So it is checked in a browser, against the real URL, on the accessible state
 * rather than on a colour.
 *
 * Requires `npm run dev` on :4000 and the test-12345 tenant.
 *
 *   node scripts/verify-accounting-tabs.mjs
 */

import puppeteer from 'puppeteer';

const BASE = process.env.BASE_URL || 'http://localhost:4000';

// Must match TABS in app/(erp)/cloud/dashboard/erp/accounting/page.js and the
// `tab:` values in app/(erp)/cloud/dashboard/layout.js. A tab renamed in one
// place and not the other is exactly the failure this catches.
const TABS = [
    ['overview', 'Overview'],
    ['coa', 'Chart of Accounts'],
    ['khata', 'Ledger Statement'],
    ['daybook', 'Daybook'],
    ['voucher', 'Voucher Entry'],
    ['reports', 'Financial Statements'],
];

const failures = [];
const consoleErrors = [];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

page.on('console', msg => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    const text = msg.text();
    // React reports duplicate keys and missing keys as warnings, not errors.
    // A duplicate key in the nav shipped once already, so warnings count.
    if (/key|Warning|Error/i.test(text)) consoleErrors.push(text);
});

console.log('logging in as test-12345');
await page.goto(`${BASE}/cloud/login`, { waitUntil: 'networkidle2' });
await page.type('input[type="text"]', 'test-12345');
await page.type('input[type="password"]', 'test-12345');
await page.click('button[type="submit"]');
await page.waitForNavigation({ waitUntil: 'networkidle2' });

for (const [id, label] of TABS) {
    const url = `${BASE}/cloud/dashboard/erp/accounting?tab=${id}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[role="tab"]', { timeout: 15000 });

    const selected = await page.$eval('[role="tab"][aria-selected="true"]', el => el.dataset.tab)
        .catch(() => null);

    if (selected === id) {
        console.log(`  ok    ?tab=${id.padEnd(9)} -> ${label}`);
    } else {
        failures.push(`?tab=${id} opened '${selected ?? 'nothing'}' instead of '${id}' (${label})`);
        console.log(`  FAIL  ?tab=${id.padEnd(9)} -> ${selected ?? 'no tab selected'}`);
    }
}

// The URL must also follow a click, or the address bar lies about the view.
await page.goto(`${BASE}/cloud/dashboard/erp/accounting?tab=overview`, { waitUntil: 'networkidle2' });
await page.waitForSelector('[role="tab"][data-tab="reports"]');
// Clicked inside the page rather than through an ElementHandle: the handle goes
// stale if the dev server recompiles between the query and the click, which
// fails the run for a reason that has nothing to do with the app.
await new Promise(r => setTimeout(r, 500));
await page.evaluate(() => document.querySelector('[role="tab"][data-tab="reports"]').click());
await new Promise(r => setTimeout(r, 800));
if (!page.url().includes('tab=reports')) {
    failures.push(`clicking Financial Statements left the URL at ${page.url()}`);
}

await browser.close();

console.log(`\n${'─'.repeat(56)}`);
if (consoleErrors.length) {
    console.log(`${consoleErrors.length} console error/warning(s):`);
    for (const e of [...new Set(consoleErrors)].slice(0, 10)) console.log('  ' + e.slice(0, 200));
}
if (failures.length) {
    console.error(`\nTAB DEEP LINKS: ${failures.length} FAILURE(S)`);
    for (const f of failures) console.error('  ' + f);
    process.exit(1);
}
console.log('TAB DEEP LINKS: ALL PASS');
