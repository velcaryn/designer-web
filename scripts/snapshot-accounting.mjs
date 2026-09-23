/**
 * Before/after fingerprint of the Accounting section.
 *
 * WHY
 *
 * Splitting a 1600-line screen into components is a large mechanical edit, and
 * the failure mode is not a crash - it is a dropped prop, a lost filter, a
 * table that renders three columns instead of four. All of that still compiles,
 * still passes eslint, and still looks like a working page. So the refactor is
 * held to a comparison: capture every tab before, capture every tab after, and
 * require them to match.
 *
 * TWO FINGERPRINTS, NOT ONE
 *
 * The first version of this compared screenshots only, and it was worse than
 * useless: it reported a difference on every run (a JS-animated avatar in the
 * shell landed on a different frame each time) and then, once that was clipped
 * out, it failed to notice a tab label changing from "Daybook" to "Day Book".
 * A checker that cries wolf and also misses the wolf is not a checker.
 *
 * So each tab is fingerprinted twice:
 *
 *   text  - the visible text of the section, normalised. Catches content: a
 *           lost column, a renamed label, a row that stopped rendering. This is
 *           the one that actually holds, and it is immune to animation.
 *   image - a clipped screenshot of the section root. Catches layout and style
 *           changes that leave the text identical.
 *
 * Both are reported. A difference in either fails the run.
 *
 * The session is cached to disk and reused, because logging in on every run
 * trips the login rate limiter - which is the protection working correctly, but
 * it makes the tool unusable if it needs a fresh login per capture.
 *
 * Requires `npm run dev` on :4000 and the test-12345 tenant.
 *
 *   node scripts/snapshot-accounting.mjs before
 *   node scripts/snapshot-accounting.mjs after
 *   node scripts/snapshot-accounting.mjs compare
 */

import puppeteer from 'puppeteer';
import { createHash } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const MODE = process.argv[2];
if (!['before', 'after', 'compare'].includes(MODE)) {
    console.error('usage: node scripts/snapshot-accounting.mjs before|after|compare');
    process.exit(1);
}

const OUT = join('scratch', 'accounting-snapshots');
const COOKIES = join(OUT, '.session.json');
const BASE = process.env.BASE_URL || 'http://localhost:4000';
const TABS = ['overview', 'coa', 'khata', 'daybook', 'voucher', 'reports'];

const sha = s => createHash('sha256').update(s).digest('hex').slice(0, 16);

// ── compare ───────────────────────────────────────────────────────────────
if (MODE === 'compare') {
    const load = m => {
        const f = join(OUT, `${m}.json`);
        if (!existsSync(f)) {
            console.error(`missing ${f} - run 'node scripts/snapshot-accounting.mjs ${m}' first`);
            process.exit(1);
        }
        return JSON.parse(readFileSync(f, 'utf8'));
    };
    const before = load('before');
    const after = load('after');
    const problems = [];

    for (const tab of TABS) {
        const b = before[tab];
        const a = after[tab];
        if (!b || !a) { problems.push(`${tab}: missing from one of the captures`); continue; }

        const textSame = b.text === a.text;
        const imgSame = b.image === a.image;

        if (textSame && imgSame) {
            console.log(`  same  ${tab.padEnd(9)} text ${b.textHash}  image ${b.image}`);
            continue;
        }
        if (!textSame) {
            // Show the first line that actually differs - "something changed" is
            // not an actionable report.
            const bl = b.text.split('\n');
            const al = a.text.split('\n');
            const i = bl.findIndex((l, n) => l !== al[n]);
            problems.push(`${tab}: text changed at line ${i + 1}\n        before: ${JSON.stringify(bl[i] ?? '(end)')}\n        after:  ${JSON.stringify(al[i] ?? '(end)')}`);
            console.log(`  DIFF  ${tab.padEnd(9)} text`);
        } else {
            problems.push(`${tab}: renders differently but the text is identical - a layout or style change. Compare ${OUT}/before-${tab}.png and ${OUT}/after-${tab}.png`);
            console.log(`  DIFF  ${tab.padEnd(9)} image only`);
        }
    }

    console.log(`\n${'─'.repeat(56)}`);
    if (problems.length) {
        console.error(`ACCOUNTING SNAPSHOTS: ${problems.length} DIFFERENCE(S)\n`);
        for (const p of problems) console.error('  ' + p);
        process.exit(1);
    }
    console.log('ACCOUNTING SNAPSHOTS: IDENTICAL');
    process.exit(0);
}

// ── capture ───────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

const consoleErrors = [];
page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') consoleErrors.push(msg.text());
});

/*
 * Reuse a cached session if one works. Falling back to a real login when it
 * does not means an expired cookie fixes itself rather than failing the run.
 */
let loggedIn = false;
if (existsSync(COOKIES)) {
    await browser.setCookie(...JSON.parse(readFileSync(COOKIES, 'utf8')));
    await page.goto(`${BASE}/cloud/dashboard/erp/accounting?tab=overview`, { waitUntil: 'networkidle2' });
    loggedIn = await page.$('[role="tablist"]') !== null;
    console.log(loggedIn ? 'reusing cached session' : 'cached session expired, logging in');
}
if (!loggedIn) {
    await page.goto(`${BASE}/cloud/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="text"]', 'test-12345');
    await page.type('input[type="password"]', 'test-12345');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    writeFileSync(COOKIES, JSON.stringify(await browser.cookies(), null, 2));
}

const result = {};

for (const tab of TABS) {
    await page.goto(`${BASE}/cloud/dashboard/erp/accounting?tab=${tab}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[role="tab"]', { timeout: 20000 });
    // Reports and the statement load on demand after the tab paints.
    await new Promise(r => setTimeout(r, 2500));

    // Freeze CSS animation and hide the caret so the image is reproducible.
    await page.addStyleTag({
        content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
    });
    await new Promise(r => setTimeout(r, 300));

    /*
     * Capture the section, not the window. The shell has a JS-animated avatar
     * that CSS cannot freeze, so a full-page image differs on every run for
     * reasons no accounting change could cause.
     *
     * The section root is the element wrapping the tablist, so this follows the
     * layout rather than hardcoding a sidebar width that will move.
     */
    const text = await page.evaluate(() => {
        const root = document.querySelector('[role="tablist"]').parentElement;
        return root.innerText
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .join('\n');
    });

    const root = await page.evaluateHandle(() => document.querySelector('[role="tablist"]').parentElement);
    const box = await root.boundingBox();
    const imgPath = join(OUT, `${MODE}-${tab}.png`);
    await page.screenshot({
        path: imgPath,
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 4000) },
    });

    result[tab] = { text, textHash: sha(text), image: sha(readFileSync(imgPath)), lines: text.split('\n').length };
    console.log(`  ${MODE}  ${tab.padEnd(9)} text ${result[tab].textHash} (${result[tab].lines} lines)  image ${result[tab].image}`);
}

await browser.close();
writeFileSync(join(OUT, `${MODE}.json`), JSON.stringify(result, null, 2));

if (consoleErrors.length) {
    console.log(`\n${consoleErrors.length} console error/warning(s):`);
    for (const e of [...new Set(consoleErrors)].slice(0, 10)) console.log('  ' + e.slice(0, 200));
}
console.log(`\nwrote ${TABS.length} fingerprints to ${OUT}/${MODE}.json`);
