/**
 * Posts the legacy single-entry cashbook into the double-entry general ledger.
 *
 * WHY
 *
 * `erp_ledger_entries` and `erp_ledgers` were two sets of books that never
 * spoke. Bank balances came from the cashbook; the trial balance, P&L and
 * balance sheet came from the ledger. Neither could see the other, so they
 * could disagree indefinitely and nothing would notice.
 *
 * This makes every cashbook entry a journal voucher, so there is one set of
 * books. It does NOT delete the cashbook - the rows stay exactly as they are.
 * They stop being the source of truth, which is a different thing from being
 * removed, and keeping them means this migration is reversible by dropping the
 * vouchers it created.
 *
 * SAFE TO RUN REPEATEDLY. Every generated voucher carries
 * `sourceRef: cashbook:{entryId}`, backed by a unique partial index, so an
 * entry that already posted is skipped rather than posted twice. That matters
 * because the expected workflow is: run it, look at what landed in suspense,
 * fix the category mapping, run it again.
 *
 *   node scripts/migrate-cashbook-to-vouchers.mjs                 # dry run
 *   node scripts/migrate-cashbook-to-vouchers.mjs --apply
 *   node scripts/migrate-cashbook-to-vouchers.mjs --tenant TNT-X  # one tenant
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { ledgerCodeForCategory, voucherForCashbookEntry, SUSPENSE_LEDGER_CODE } from '../lib/cloud/accounting/cashbook.js';
import { postVoucher } from '../lib/cloud/accounting/voucherEngine.js';
import { ensureChartOfAccounts } from '../lib/cloud/accounting/coa.js';
import { DEFAULT_SYSTEM_LEDGERS } from '../lib/cloud/accounting/defaultLedgers.js';

const APPLY = process.argv.includes('--apply');
const tenantArg = process.argv.indexOf('--tenant');
const ONLY_TENANT = tenantArg > -1 ? process.argv[tenantArg + 1] : null;

const env = Object.fromEntries(
    readFileSync('.env.local', 'utf8').split('\n')
        .filter(l => l.includes('=') && !l.trim().startsWith('#'))
        .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
);

const uri = env.MONGODB_URI || process.env.MONGODB_URI;
const dbName = env.CLOUD_DB_NAME || process.env.CLOUD_DB_NAME || 'velbiz_dev';

if (!uri) { console.error('MONGODB_URI is not set.'); process.exit(1); }

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

console.log(`database: ${dbName}${APPLY ? '  (APPLYING)' : '  (dry run - nothing will be written)'}`);
if (ONLY_TENANT) console.log(`tenant:   ${ONLY_TENANT}`);
console.log();

const match = ONLY_TENANT ? { tenantId: ONLY_TENANT } : {};
const tenants = await db.collection('erp_ledger_entries').distinct('tenantId', match);

if (tenants.length === 0) { console.log('No cashbook entries anywhere.'); await client.close(); process.exit(0); }

let grandPosted = 0, grandSkipped = 0, grandSuspense = 0;
const unmappedCategories = new Map();
// Ledger codes absent for a tenant. `pendingSeed` will be created by --apply;
// `missingLedgers` genuinely do not exist anywhere and are a real problem.
const pendingSeed = new Map();
const missingLedgers = new Map();

for (const tenantId of tenants) {
    const entries = await db.collection('erp_ledger_entries').find({ tenantId }).sort({ date: 1 }).toArray();
    console.log(`── ${tenantId}: ${entries.length} cashbook entries`);

    if (APPLY) await ensureChartOfAccounts(db, tenantId);

    // Resolve every ledger this tenant will need, once.
    const ledgers = await db.collection('erp_ledgers').find({ tenantId }).toArray();
    const byCode = new Map(ledgers.map(l => [l.code, l]));

    if (byCode.size === 0) {
        console.log('    (no chart of accounts - run with --apply to seed it)\n');
        continue;
    }

    // Bank accounts map to their own ledger where one exists, else the house
    // bank ledger. A cashbook entry with no bank account is treated as cash.
    const bankAccounts = await db.collection('erp_bank_accounts').find({ tenantId }).toArray();
    const bankLedgerFor = (bankAccountId) => {
        if (!bankAccountId) return byCode.get('LED_CASH');
        const acc = bankAccounts.find(a => a._id.toString() === String(bankAccountId));
        const named = acc && ledgers.find(l => l.linkedEntityId === String(acc._id));
        return named || byCode.get('LED_MAIN_BANK') || byCode.get('LED_CASH');
    };

    let posted = 0, skipped = 0, suspense = 0;

    for (const entry of entries) {
        const existing = await db.collection('erp_vouchers').findOne({ tenantId, sourceRef: `cashbook:${entry._id}` });
        if (existing) { skipped++; continue; }

        const { code, matched } = ledgerCodeForCategory(entry.category);
        if (!matched) {
            suspense++;
            unmappedCategories.set(entry.category, (unmappedCategories.get(entry.category) || 0) + 1);
        }

        const categoryLedger = byCode.get(code) || byCode.get(SUSPENSE_LEDGER_CODE);
        const bankLedger = bankLedgerFor(entry.bankAccountId);

        if (!categoryLedger || !bankLedger) {
            /*
             * In a dry run the chart of accounts has not been seeded, so a
             * ledger this migration added to DEFAULT_SYSTEM_LEDGERS is legitimately
             * absent and --apply will create it. Collected and reported once at
             * the end rather than shouted per entry, which buried the actual
             * result under a dozen identical lines.
             */
            const willBeSeeded = !APPLY && DEFAULT_SYSTEM_LEDGERS.some(l => l.code === code);
            if (willBeSeeded) {
                pendingSeed.set(code, (pendingSeed.get(code) || 0) + 1);
                posted++;
            } else {
                missingLedgers.set(code, (missingLedgers.get(code) || 0) + 1);
            }
            continue;
        }

        // voucherForCashbookEntry takes the ledger ids as arguments rather than
        // resolving them itself, so it stays pure and unit-testable.
        const payload = voucherForCashbookEntry(entry, {
            bankLedgerId: bankLedger._id,
            categoryLedgerId: categoryLedger._id,
        });
        if (!payload) continue;

        if (APPLY) {
            try {
                await postVoucher(db, tenantId, payload, 'system:cashbook-migration');
                posted++;
            } catch (err) {
                console.log(`    ! ${entry.entryNumber}: ${err.message}`);
            }
        } else {
            posted++;
        }
    }

    console.log(`    ${APPLY ? 'posted' : 'would post'} ${posted}, already posted ${skipped}, to suspense ${suspense}`);
    grandPosted += posted; grandSkipped += skipped; grandSuspense += suspense;
}

console.log(`\n${'─'.repeat(56)}`);
console.log(`${APPLY ? 'Posted' : 'Would post'}: ${grandPosted}   already done: ${grandSkipped}   into suspense: ${grandSuspense}`);

if (unmappedCategories.size) {
    console.log('\nCategories with no ledger mapping - these went to Suspense and need a home');
    console.log('in CATEGORY_LEDGERS (lib/cloud/accounting/cashbook.js):');
    for (const [cat, n] of [...unmappedCategories].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(n).padStart(4)}x  ${cat}`);
    }
}

if (pendingSeed.size) {
    console.log('\nLedgers not yet on this tenant\'s chart of accounts. Running with --apply');
    console.log('seeds them first, so these entries will post:');
    for (const [code, n] of pendingSeed) console.log(`  ${String(n).padStart(4)}x  ${code}`);
}

if (missingLedgers.size) {
    console.log('\nLedger codes that do not exist at all - these entries CANNOT post:');
    for (const [code, n] of missingLedgers) console.log(`  ${String(n).padStart(4)}x  ${code}`);
}

if (!APPLY) console.log('\nRe-run with --apply to post these.');

await client.close();
