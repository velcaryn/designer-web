/**
 * One-off, idempotent update: adds/refreshes `costPrice` on the demo products
 * already created by scripts/seed-analytics-demo.cjs, WITHOUT touching invoices,
 * payments, or any other seeded collection (those figures - 86 invoices,
 * ₹2,69,00,650.92 total, 16 overdue/₹34,73,818 - must stay exactly as-is).
 *
 * Matches existing docs by { tenantId, _seedDemo: true, itemId } and only
 * $sets costPrice, so it is safe to run repeatedly.
 *
 * Usage: node scripts/update-seed-costprice.cjs
 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DEV_DB_NAME = 'velbiz_dev';
const PROD_DB_NAME = 'velbiz';

if (process.env.NODE_ENV === 'production') {
    console.error('[update-seed-costprice] REFUSING TO RUN: NODE_ENV=production.');
    process.exit(1);
}
if (DEV_DB_NAME === PROD_DB_NAME) {
    console.error('[update-seed-costprice] REFUSING TO RUN: target db resolves to production.');
    process.exit(1);
}

const TENANT_ID = 'TNT-SIF-5584';
const round2 = n => Math.round(n * 100) / 100;

// Keep in sync with PRODUCTS in scripts/seed-analytics-demo.cjs.
const COST_RATIOS = {
    'DEMO-PRD-001': 0.62, 'DEMO-PRD-002': 0.70, 'DEMO-PRD-003': 0.58, 'DEMO-PRD-004': 0.65,
    'DEMO-PRD-005': 0.72, 'DEMO-PRD-006': 0.68, 'DEMO-PRD-007': 0.55, 'DEMO-PRD-008': 0.60,
    'DEMO-PRD-009': 0.75, 'DEMO-PRD-010': 0.73,
};

function readMongoUri() {
    if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
    const envPath = path.join(__dirname, '..', '.env.local');
    const raw = fs.readFileSync(envPath, 'utf8');
    const m = raw.match(/^MONGODB_URI\s*=\s*"?([^"\n\r]+)"?/m);
    if (!m) throw new Error('MONGODB_URI not found in env or .env.local');
    return m[1].trim();
}

(async () => {
    const uri = readMongoUri();
    const client = await new MongoClient(uri).connect();
    try {
        const db = client.db(DEV_DB_NAME);
        if (db.databaseName !== DEV_DB_NAME) {
            throw new Error(`Refusing to write: resolved db is "${db.databaseName}", expected "${DEV_DB_NAME}"`);
        }
        let updated = 0;
        for (const [itemId, ratio] of Object.entries(COST_RATIOS)) {
            const product = await db.collection('tenant_products').findOne({ tenantId: TENANT_ID, _seedDemo: true, itemId });
            if (!product) continue;
            const costPrice = round2((product.defaultUnitPrice || 0) * ratio);
            const res = await db.collection('tenant_products').updateOne(
                { tenantId: TENANT_ID, _seedDemo: true, itemId },
                { $set: { costPrice, updatedAt: new Date() } },
            );
            if (res.modifiedCount) updated++;
        }
        console.log(`[update-seed-costprice] Updated costPrice on ${updated} seeded product(s) for tenant ${TENANT_ID}.`);
    } finally {
        await client.close();
    }
})().catch(err => {
    console.error('[update-seed-costprice] FAILED:', err);
    process.exit(1);
});
