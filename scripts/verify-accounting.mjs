/**
 * Deep sanity check for the Cloud general ledger, over the real HTTP API.
 *
 * WHY OVER HTTP, AND WHY NOT FROM isBalanced
 *
 * The two scripts that existed before this both called postVoucher() directly,
 * which is exactly why the invoice tax-field mismatch survived: the bug was in
 * the bridge BETWEEN the documents module and the ledger, and nothing crossed
 * that bridge in a test. This drives the same endpoints a browser does.
 *
 * Every invariant is computed from the raw data returned, never from a flag the
 * API sets about itself. `totals.isBalanced` was hardcoded `true` for the life
 * of the module, and a test asserting on it asserted nothing at all.
 *
 *   node scripts/verify-accounting.mjs
 *   BASE=http://localhost:4000 USER=x PASS=y node scripts/verify-accounting.mjs
 */

const BASE = process.env.BASE || 'http://localhost:4000';
const USER = process.env.USER_NAME || 'test-12345';
const PASS = process.env.PASS || 'test-12345';

let cookie = '';
async function api(path, opts = {}) {
    const res = await fetch(BASE + path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', cookie, ...(opts.headers || {}) },
    });
    const sc = res.headers.getSetCookie?.() || [];
    if (sc.length) cookie = sc.map(c => c.split(';')[0]).join('; ');
    let body = null;
    try { body = await res.json(); } catch { /* not json */ }
    return { status: res.status, body };
}

const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
let fail = 0;
const ok = (name, cond, extra = '') => {
    if (cond) console.log('  ok    ' + name);
    else { fail++; console.log('  FAIL  ' + name + (extra ? '  ' + extra : '')); }
};

const login = await api('/api/cloud/auth', { method: 'POST', body: JSON.stringify({ username: USER, password: PASS }) });
if (login.status !== 200) {
    console.error(`Could not log in as ${USER}: ${login.status} ${JSON.stringify(login.body)}`);
    process.exit(1);
}
console.log(`\n══ DEEP SANITY - ${login.body?.user?.tenantId} (${login.body?.user?.businessName}) ══\n`);

// ── 1. The trial balance, summed from its own rows ────────────────────────
console.log('── trial balance ──');
const tb = (await api('/api/cloud/erp/accounting/reports/trial-balance')).body;
let D = 0, C = 0, ledgerCount = 0;
for (const g of (tb.groups || [])) for (const l of (g.ledgers || [])) { D += l.debit || 0; C += l.credit || 0; ledgerCount++; }
console.log(`  ${ledgerCount} ledgers   period Dr ${r2(D)}   Cr ${r2(C)}`);
ok('period movements balance', Math.abs(r2(D) - r2(C)) < 0.01, `${r2(D)} vs ${r2(C)}`);
console.log(`  closing Dr ${tb.totals.rawDebit}   Cr ${tb.totals.rawCredit}   difference ${tb.totals.difference}`);
ok('isBalanced is computed rather than asserted about itself',
    tb.totals.isBalanced === (Math.abs(tb.totals.rawDebit - tb.totals.rawCredit) < 0.05));
if (!tb.totals.isBalanced) {
    console.log(`  note: books are out by ${tb.totals.difference} - shown as Difference in Opening Balances`);
}

// ── 2. The accounting equation ────────────────────────────────────────────
console.log('\n── balance sheet ──');
const bs = (await api('/api/cloud/erp/accounting/reports/balance-sheet')).body;
console.log(`  assets ${bs.assets?.total}   liabilities + equity ${bs.liabilities?.total}`);
ok('ASSETS = LIABILITIES + EQUITY',
    Math.abs(r2(bs.assets?.total) - r2(bs.liabilities?.total)) < 0.05,
    `off by ${r2(bs.assets?.total - bs.liabilities?.total)}`);

// ── 3. Double entry, voucher by voucher ───────────────────────────────────
console.log('\n── every voucher ──');
const all = (await api('/api/cloud/erp/accounting/vouchers?limit=5000')).body?.vouchers || [];
let unbalanced = 0, empty = 0;
for (const v of all) {
    const entries = v.entries || [];
    if (!entries.length) { empty++; continue; }
    const d = entries.filter(e => e.entryType === 'debit').reduce((s, e) => s + e.amount, 0);
    const c = entries.filter(e => e.entryType === 'credit').reduce((s, e) => s + e.amount, 0);
    if (Math.abs(r2(d) - r2(c)) > 0.01) unbalanced++;
}
console.log(`  ${all.length} vouchers`);
ok('every voucher balances individually', unbalanced === 0, `${unbalanced} unbalanced`);
ok('no voucher has zero entries', empty === 0, `${empty}`);

// ── 4. Identity ───────────────────────────────────────────────────────────
console.log('\n── numbering and idempotency ──');
const nums = all.map(v => v.voucherNumber);
ok('voucher numbers are unique', new Set(nums).size === nums.length, `${nums.length - new Set(nums).size} duplicates`);
const refs = all.map(v => v.sourceRef).filter(Boolean);
ok('sourceRefs are unique', new Set(refs).size === refs.length, `${refs.length - new Set(refs).size} duplicates`);
console.log(`  ${refs.length} of ${all.length} were posted automatically`);

// ── 5. The original bug ───────────────────────────────────────────────────
console.log('\n── GST ──');
const sales = all.filter(v => v.voucherType === 'sales');
const taxed = sales.filter(v => (v.entries || []).some(e => /CGST|SGST|IGST/i.test(e.ledgerName)));
let grossToSales = 0;
for (const v of taxed) {
    const salesAmt = v.entries.filter(e => /Sales Account/i.test(e.ledgerName)).reduce((s, e) => s + e.amount, 0);
    if (Math.abs(salesAmt - v.totalAmount) < 0.01) grossToSales++;
}
console.log(`  ${sales.length} sales vouchers, ${taxed.length} with a GST split`);
ok('no sales voucher credits the tax-inclusive total to revenue', grossToSales === 0,
    `${grossToSales} do - this is the original defect`);

// ── 6. Nothing missed the ledger ──────────────────────────────────────────
console.log('\n── unposted ──');
const up = (await api('/api/cloud/erp/accounting/unposted')).body;
console.log(`  total ${up.total}   failed ${up.failed}   never attempted ${up.neverAttempted}`);
ok('nothing is waiting to be posted', up.total === 0, `${up.total} documents have no voucher`);

// ── 7. One set of books ───────────────────────────────────────────────────
console.log('\n── bank balances ──');
const banks = (await api('/api/cloud/erp/accounting/bank-accounts')).body?.bankAccounts || [];
for (const b of banks) console.log(`  ${b.accountName || b.bankName}: ${b.balance}   from ${b.ledgerName || 'NO LEDGER'}`);
ok('every bank balance comes from a named ledger', banks.every(b => b.ledgerName), 'a missing ledger means the old cashbook path');

console.log('\n' + '═'.repeat(52));
console.log(fail === 0 ? 'DEEP SANITY: ALL PASS' : `DEEP SANITY: ${fail} FAILURE(S)`);
process.exit(fail ? 1 : 0);
