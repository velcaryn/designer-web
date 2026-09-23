/**
 * Posts historical invoices and payments that never reached the general ledger.
 *
 * WHY
 *
 * Auto-posting was fire-and-forget with a swallowed catch until Phase 1d, and
 * the recurring-invoice cron never posted at all until Phase 3. Everything
 * raised before those fixes exists in tenant_documents and erp_payments with no
 * corresponding voucher - 183 documents on the dev tenant when the unposted
 * worklist first ran.
 *
 * Those invoices are real revenue. Leaving them out means the P&L understates
 * turnover by however much was billed before today, and the receivables figure
 * is missing every customer who was invoiced and has not paid.
 *
 * SAFE TO RUN REPEATEDLY. Every voucher carries `sourceRef` (invoice:{id},
 * payment:{id}) against a unique partial index, so a document that already
 * posted is skipped rather than posted twice. Dry run by default.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not touch a document that already has a voucher, and it does not
 * correct one that posted WRONG - the pre-Phase-1a invoices that credited the
 * full tax-inclusive amount to revenue are a different problem needing a
 * reversal, not a second posting. Those are reported separately so the decision
 * stays with a person.
 *
 *   node scripts/backfill-unposted-invoices.mjs
 *   node scripts/backfill-unposted-invoices.mjs --apply
 *   node scripts/backfill-unposted-invoices.mjs --apply --tenant TNT-X
 */

import { MongoClient, ObjectId } from 'mongodb';
import { readFileSync } from 'fs';
import { postSalesVoucherFromInvoice, postReceiptVoucherFromPayment } from '../lib/cloud/accounting/voucherEngine.js';
import { ensureChartOfAccounts } from '../lib/cloud/accounting/coa.js';

const APPLY = process.argv.includes('--apply');
const tArg = process.argv.indexOf('--tenant');
const ONLY = tArg > -1 ? process.argv[tArg + 1] : null;

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

console.log(`database: ${dbName}${APPLY ? '  (APPLYING)' : '  (dry run)'}`);
if (ONLY) console.log(`tenant:   ${ONLY}`);
console.log();

const tenantFilter = ONLY ? { tenantId: ONLY } : {};

// Vouchers already posted, so we can tell "never attempted" from "done".
const posted = await db.collection('erp_vouchers')
    .find({ ...tenantFilter, sourceRef: { $type: 'string' } })
    .project({ sourceRef: 1 })
    .toArray();
const postedRefs = new Set(posted.map(v => v.sourceRef));

let invPosted = 0, invSkipped = 0, invFailed = 0;
let payPosted = 0, paySkipped = 0, payFailed = 0;
const failures = [];

// ── Invoices ──────────────────────────────────────────────────────────────
const invoices = await db.collection('tenant_documents')
    .find({ ...tenantFilter, docType: 'Invoice', status: { $ne: 'draft' } })
    .sort({ createdAt: 1 })
    .toArray();

console.log(`${invoices.length} non-draft invoices`);

const seededTenants = new Set();
for (const inv of invoices) {
    if (postedRefs.has(`invoice:${inv._id}`)) { invSkipped++; continue; }

    if (APPLY && !seededTenants.has(inv.tenantId)) {
        await ensureChartOfAccounts(db, inv.tenantId);
        seededTenants.add(inv.tenantId);
    }

    if (!APPLY) { invPosted++; continue; }

    try {
        await postSalesVoucherFromInvoice(db, inv.tenantId, inv, 'system:backfill');
        await db.collection('tenant_documents').updateOne(
            { _id: inv._id },
            { $set: { ledgerPosting: { status: 'posted', backfilled: true, at: new Date() } } }
        );
        invPosted++;
    } catch (err) {
        invFailed++;
        failures.push(`invoice ${inv.docNumber}: ${err.message}`);
    }
}

// ── Payments ──────────────────────────────────────────────────────────────
const payments = await db.collection('erp_payments').find(tenantFilter).sort({ createdAt: 1 }).toArray();
console.log(`${payments.length} payments`);

for (const pay of payments) {
    if (postedRefs.has(`payment:${pay._id}`)) { paySkipped++; continue; }
    if (!APPLY) { payPosted++; continue; }

    try {
        const invoice = pay.documentId && ObjectId.isValid(pay.documentId)
            ? await db.collection('tenant_documents').findOne({ _id: new ObjectId(pay.documentId) })
            : null;
        await postReceiptVoucherFromPayment(db, pay.tenantId, pay, invoice, 'system:backfill');
        await db.collection('erp_payments').updateOne(
            { _id: pay._id },
            { $set: { ledgerPosting: { status: 'posted', backfilled: true, at: new Date() } } }
        );
        payPosted++;
    } catch (err) {
        payFailed++;
        failures.push(`payment ${pay.paymentNumber || pay._id}: ${err.message}`);
    }
}

console.log(`\n${'─'.repeat(56)}`);
console.log(`invoices  ${APPLY ? 'posted' : 'would post'} ${invPosted}   already done ${invSkipped}   failed ${invFailed}`);
console.log(`payments  ${APPLY ? 'posted' : 'would post'} ${payPosted}   already done ${paySkipped}   failed ${payFailed}`);

if (failures.length) {
    console.log(`\n${failures.length} failure(s):`);
    for (const f of failures.slice(0, 20)) console.log('  ' + f);
    if (failures.length > 20) console.log(`  ... and ${failures.length - 20} more`);
}

if (!APPLY) console.log('\nRe-run with --apply to post these.');

await client.close();
process.exit(invFailed + payFailed > 0 ? 1 : 0);
