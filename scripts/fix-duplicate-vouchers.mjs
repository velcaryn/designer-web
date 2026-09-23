/**
 * Repairs duplicate voucher numbers so the unique index can be built.
 *
 * WHY THIS EXISTS
 *
 * `erp_vouchers {tenantId, voucherNumber}` was not unique, and a test script
 * that deleted `erp_counters` caused numbering to restart. CNT-2026-0001 was
 * issued twice in velbiz_dev. `scripts/setup-indexes.cjs` now creates that
 * index as UNIQUE, and Mongo refuses to build it while duplicates exist.
 *
 * WHAT IT DOES, AND WHAT IT REFUSES TO DO
 *
 * The OLDEST voucher of each duplicated number keeps it. Later ones are given
 * a fresh number from the end of that tenant's sequence, and the original is
 * recorded on the document as `renumberedFrom` so the change is traceable
 * rather than silent.
 *
 * It NEVER deletes a voucher and never touches the postings' amounts - the
 * money is correct, only the label is ambiguous. Postings carry a denormalised
 * `voucherNumber`, so those are updated in step or the day book would show the
 * old number against the renumbered entry.
 *
 * Run with --apply to write. Without it, this reports and changes nothing.
 *
 *   node scripts/fix-duplicate-vouchers.mjs
 *   node scripts/fix-duplicate-vouchers.mjs --apply
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

function loadEnv() {
    try {
        return Object.fromEntries(
            readFileSync('.env.local', 'utf8')
                .split('\n')
                .filter(l => l.includes('=') && !l.trim().startsWith('#'))
                .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
        );
    } catch {
        return process.env;
    }
}

const env = loadEnv();
const uri = env.MONGODB_URI || process.env.MONGODB_URI;
const dbName = process.env.CLOUD_DB_NAME || 'velbiz_dev';

if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

console.log(`database: ${dbName}${APPLY ? '  (APPLYING CHANGES)' : '  (dry run - nothing will be written)'}\n`);

const dupes = await db.collection('erp_vouchers').aggregate([
    { $group: { _id: { tenantId: '$tenantId', voucherNumber: '$voucherNumber' }, n: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { n: { $gt: 1 } } },
    { $sort: { '_id.tenantId': 1, '_id.voucherNumber': 1 } },
]).toArray();

if (dupes.length === 0) {
    console.log('No duplicate voucher numbers. The unique index can be built.');
    await client.close();
    process.exit(0);
}

console.log(`${dupes.length} duplicated voucher number(s):\n`);

/*
 * Numbers allocated during THIS run, keyed `tenantId|PREFIX|year`.
 *
 * Without this the next number is read back from the database, which only
 * advances once a write lands - so a dry run assigned every duplicate the same
 * replacement number, and a real run that failed part way through could reissue
 * one. Allocation has to be independent of the write for the dry run to mean
 * anything, which is the whole point of having one.
 */
const allocated = new Map();

let renamed = 0;
for (const d of dupes) {
    const { tenantId, voucherNumber } = d._id;

    // Oldest keeps the number - it is the one already quoted on paperwork.
    const vouchers = await db.collection('erp_vouchers')
        .find({ tenantId, voucherNumber })
        .sort({ createdAt: 1, _id: 1 })
        .toArray();

    const keep = vouchers[0];
    const move = vouchers.slice(1);
    console.log(`  ${tenantId}  ${voucherNumber}  (${vouchers.length} vouchers, keeping ${keep._id})`);

    for (const v of move) {
        const prefix = String(voucherNumber).split('-')[0];
        const year = new Date(v.date || v.createdAt || Date.now()).getFullYear();

        // Take the next number from the highest in use, not from the counter -
        // the counter is what drifted in the first place. Seeded from the
        // database once per series, then advanced in memory.
        const key = `${tenantId}|${prefix}|${year}`;
        if (!allocated.has(key)) {
            const highest = await db.collection('erp_vouchers')
                .find({ tenantId, voucherNumber: { $regex: `^${prefix}-${year}-` } })
                .sort({ voucherNumber: -1 })
                .limit(1)
                .toArray();
            allocated.set(key, highest.length ? parseInt(String(highest[0].voucherNumber).split('-').pop(), 10) || 0 : 0);
        }
        const nextSeq = allocated.get(key) + 1;
        allocated.set(key, nextSeq);
        const next = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;

        console.log(`      ${v._id}  ${voucherNumber}  ->  ${next}`);
        renamed++;

        if (APPLY) {
            await db.collection('erp_vouchers').updateOne(
                { _id: v._id },
                { $set: { voucherNumber: next, renumberedFrom: voucherNumber, renumberedAt: new Date() } }
            );
            // Postings denormalise the number; leaving them stale would make the
            // day book disagree with the voucher it is showing.
            await db.collection('erp_ledger_postings').updateMany(
                { tenantId, voucherId: v._id },
                { $set: { voucherNumber: next } }
            );
        }
    }
}

console.log(`\n${renamed} voucher(s) ${APPLY ? 'renumbered' : 'would be renumbered'}.`);
if (!APPLY) console.log('Re-run with --apply to write these changes.');

// Also advance the counters past whatever is now in use, so the next voucher
// posted does not immediately collide again.
if (APPLY) {
    const tenants = [...new Set(dupes.map(d => d._id.tenantId))];
    for (const tenantId of tenants) {
        const all = await db.collection('erp_vouchers').find({ tenantId }).project({ voucherNumber: 1 }).toArray();
        const byModule = new Map();
        for (const v of all) {
            const [prefix, year, seq] = String(v.voucherNumber || '').split('-');
            if (!prefix || !year || !seq) continue;
            const key = `${prefix}|${year}`;
            byModule.set(key, Math.max(byModule.get(key) || 0, parseInt(seq, 10) || 0));
        }
        for (const [key, maxSeq] of byModule) {
            const [prefix, year] = key.split('|');
            const type = Object.entries({
                SAL: 'sales', PUR: 'purchase', RCP: 'receipt', PMT: 'payment',
                JRN: 'journal', CNT: 'contra', CRN: 'credit_note', DBN: 'debit_note',
            }).find(([p]) => p === prefix)?.[1];
            if (!type) continue;
            await db.collection('erp_counters').updateOne(
                { tenantId, module: `cloud_voucher_${type}`, year: Number(year) },
                { $max: { seq: maxSeq } },
                { upsert: true }
            );
            console.log(`  counter ${tenantId} ${type} ${year} advanced to at least ${maxSeq}`);
        }
    }
}

await client.close();
