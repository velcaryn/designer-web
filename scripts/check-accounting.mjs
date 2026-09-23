#!/usr/bin/env node
/**
 * Mechanical guards for the Cloud general ledger.
 *
 * WHY THIS EXISTS
 *
 * Every rule below is a defect that actually shipped, and every one of them was
 * invisible at runtime. That is the common thread: a ledger fails quietly. It
 * balances, it renders, nothing throws, and the numbers are wrong for months.
 * A code review will not reliably catch any of these, so they are checked.
 *
 *   1. A group code that does not exist    - 'MISC_EXPENSES' vs 'MISC_EXP_ASSET'
 *      orphaned the balancing figure from the group tree, hiding it in the one
 *      report that exists to show it.
 *   2. A hardcoded `isBalanced: true`      - the trial balance could not report
 *      itself unbalanced, and a test asserting on it asserted nothing.
 *   3. A swallowed posting failure         - `.catch(() => {})` meant an invoice
 *      could miss the ledger with no log, no flag and no trace.
 *   4. A ledger code that does not exist   - resolves to null, and the posting
 *      silently falls back or throws into a swallowed catch.
 *   5. Tally branding in user-facing copy  - this is Cloud's product.
 *
 * Run: node scripts/check-accounting.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = ['lib/cloud/accounting', 'app/api/cloud/erp/accounting', 'app/(erp)/cloud/dashboard/erp/accounting'];
const problems = [];

function walk(dir, out = []) {
    let entries;
    try { entries = readdirSync(dir); } catch { return out; }
    for (const e of entries) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (/\.(js|jsx|mjs)$/.test(e)) out.push(full);
    }
    return out;
}

const read = f => readFileSync(f, 'utf8');

/*
 * Two scopes.
 *
 * `files` is the accounting module itself - where group and ledger codes live.
 *
 * `ledgerCallers` is every file anywhere that imports from it. The swallowed
 * `.catch(() => {})` that hid failed postings for the life of this module was
 * in app/api/cloud/documents/route.js, which is not an accounting directory
 * at all - scoping the check to the module would have missed the exact bug it
 * exists to prevent. A swallowed error elsewhere in the codebase is not this
 * script's business; one in a file that writes to the general ledger is.
 */
const files = ROOTS.flatMap(r => walk(r));
const ledgerCallers = walk('app')
    .filter(f => /from\s+'@\/lib\/cloud\/accounting\//.test(read(f)));

// ── The vocabulary, taken from the source of truth ────────────────────────
const groupsSrc = read('lib/cloud/accounting/groups.js');
const validGroups = new Set([...groupsSrc.matchAll(/code:\s*'([A-Z_]+)'/g)].map(m => m[1]));
const syntheticGroups = new Set([...groupsSrc.matchAll(/SYNTHETIC_GROUP_CODES\s*=\s*\[([^\]]*)\]/g)]
    .flatMap(m => [...m[1].matchAll(/'([A-Z_]+)'/g)].map(x => x[1])));

const ledgersSrc = read('lib/cloud/accounting/defaultLedgers.js');
const validLedgers = new Set([...ledgersSrc.matchAll(/code:\s*'(LED_[A-Z_]+)'/g)].map(m => m[1]));

for (const file of files) {
    const src = read(file);
    const lines = src.split('\n');

    lines.forEach((line, i) => {
        const at = `${file}:${i + 1}`;
        // Comments explain the rules; they are not violations of them.
        const isComment = /^\s*(\/\/|\*|\/\*)/.test(line);

        // 1. Group codes.
        for (const m of line.matchAll(/'([A-Z][A-Z_]{4,})'/g)) {
            const code = m[1];
            if (!/_/.test(code)) continue;
            if (code.startsWith('LED_')) continue;
            if (validGroups.has(code) || syntheticGroups.has(code)) continue;
            // Not every SCREAMING_SNAKE string is a group code.
            if (/^(CGST_SGST|TAX_TREATMENTS|POSTING_STATUS|VOUCHER_TYPES|DEFAULT_SYSTEM_LEDGERS|ACCOUNT_GROUPS|ACCOUNT_PILLARS|GROUP_CODES|SYNTHETIC_GROUP_CODES|SUSPENSE_LEDGER_CODE|CATEGORY_LEDGERS|VOUCHER_TYPE_LABELS|MONGODB_URI|CLOUD_DB_NAME|NODE_ENV)$/.test(code)) continue;
            if (isComment) continue;
            problems.push(`${at}  unknown group code '${code}' - not in ACCOUNT_GROUPS`);
        }

        // 4. Ledger codes.
        for (const m of line.matchAll(/'(LED_[A-Z_]+)'/g)) {
            if (validLedgers.has(m[1])) continue;
            if (isComment) continue;
            problems.push(`${at}  unknown ledger code '${m[1]}' - not in DEFAULT_SYSTEM_LEDGERS`);
        }

        // 2. A balance flag that cannot be false.
        if (/isBalanced:\s*true\b/.test(line) && !isComment) {
            problems.push(`${at}  isBalanced is hardcoded true - it must be computed, or nothing can detect an unbalanced ledger`);
        }

        // 5. Someone else's brand, in our product.
        if (/Tally/i.test(line) && !isComment) {
            problems.push(`${at}  "Tally" in accounting code - this is Cloud's ledger`);
        }
    });
}

/*
 * Rules for anything that writes to the ledger.
 *
 *   - A failure must never be swallowed. `.catch(() => {})` is how a missed
 *     posting left no log, no flag and no trace for the life of this module.
 *   - The posting must be awaited. Not awaiting means a serverless host can
 *     freeze the moment it responds, so the voucher is simply never written.
 */
for (const file of ledgerCallers) {
    const src = read(file);
    src.split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return;
        if (/\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(line)) {
            problems.push(`${file}:${i + 1}  swallowed failure in a file that posts to the ledger - use postToLedger() so it is logged and recorded`);
        }
    });
    for (const m of src.matchAll(/^(?!\s*(?:\/\/|\*)).*?(?<!await\s)(post(?:Sales|Receipt|Expense|Purchase|Note)Voucher\w*)\s*\(/gm)) {
        const line = src.slice(0, m.index).split('\n').length;
        const stmt = src.split('\n')[line - 1];
        if (/await|=>\s*post|import|export|function/.test(stmt)) continue;
        problems.push(`${file}:${line}  ${m[1]} is not awaited - a serverless host may freeze before it writes`);
    }
}

/*
 * 6. Every Accounting sidebar link must name a tab that exists.
 *
 * The six sub-items are one href with a different `?tab=`, so a tab id that is
 * renamed or removed leaves a link that still works, still renders and quietly
 * opens the wrong view. That is not hypothetical - all six were dead from the
 * day they shipped, because the page compared `t.key` against a list keyed by
 * `id`, and nothing anywhere could tell.
 *
 * The runtime half of this lives in scripts/verify-accounting-tabs.mjs, which
 * drives a browser and is the only thing that can catch a broken comparison.
 * This half is static, so it runs in `npm run verify` with no server.
 */
try {
    // TABS lives in the shared accounting module, not the page: the tab bodies
    // were split into components and the vocabulary went with them.
    const tabsSrc = read('components/cloud-app/accounting/constants.js');
    const layoutSrc = read('app/(erp)/cloud/dashboard/layout.js');

    const tabsBlock = tabsSrc.match(/export const TABS\s*=\s*\[([\s\S]*?)\n\];/);
    if (!tabsBlock) {
        problems.push('could not find the TABS array in components/cloud/accounting/constants.js - this check cannot verify the sidebar links');
    } else {
        const tabIds = new Set([...tabsBlock[1].matchAll(/id:\s*'([a-z-]+)'/g)].map(m => m[1]));
        const navTabs = [...layoutSrc.matchAll(/erp\/accounting'[^}]*tab:\s*'([a-z-]+)'/g)].map(m => m[1]);

        if (!navTabs.length) {
            problems.push('layout.js: no Accounting sidebar entries found with a tab - the section may have lost its sub-items');
        }
        for (const t of navTabs) {
            if (!tabIds.has(t)) {
                problems.push(`layout.js: sidebar links to ?tab='${t}', which is not a TABS id on the accounting page - the link opens the wrong view`);
            }
        }
    }
} catch (err) {
    problems.push(`sidebar/tab consistency check could not run: ${err.message}`);
}

if (problems.length) {
    console.error('check:accounting - problems found:\n');
    for (const p of problems) console.error('  ' + p);
    console.error(`\n${problems.length} problem(s). Each of these has shipped before and was invisible at runtime.`);
    process.exit(1);
}

console.log(`check:accounting - clean (${files.length} files, ${validGroups.size} groups, ${validLedgers.size} ledgers)`);
