/**
 * Seeds ~12 months of realistic demo data for the Cloud Analytics v2 dashboard.
 *
 * SAFETY: this script writes ONLY to the dev database (`velbiz_dev`). It hard-fails
 * if anything would resolve to the production database name, and it never runs with
 * NODE_ENV=production.
 *
 * Every document written carries `_seedDemo: true` so `--clean` can remove exactly
 * what this script created and nothing else.
 *
 * Usage:
 *   node scripts/seed-analytics-demo.cjs            # seed
 *   node scripts/seed-analytics-demo.cjs --clean    # remove seeded docs only
 */
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

// ─── Hard safety rails ──────────────────────────────────────────────────────
const DEV_DB_NAME = 'velbiz_dev';
const PROD_DB_NAME = 'velbiz';

if (process.env.NODE_ENV === 'production') {
    console.error('[seed-analytics-demo] REFUSING TO RUN: NODE_ENV=production.');
    process.exit(1);
}
if (DEV_DB_NAME === PROD_DB_NAME) {
    console.error('[seed-analytics-demo] REFUSING TO RUN: target db resolves to production.');
    process.exit(1);
}

const TENANT_ID = 'TNT-SIF-5584';
const BUSINESS_NAME = 'Shifa and Co';
const DOC_PREFIX = 'SIF';
const BRAND_COLOR = '#43fa00';
const MARKER = { _seedDemo: true };
const DAY_MS = 24 * 60 * 60 * 1000;

const COLLECTIONS = [
    'tenant_documents', 'tenant_products', 'tenant_clients', 'erp_payments', 'erp_leads',
    'erp_sales_orders', 'erp_stock_moves', 'erp_warehouses', 'erp_ledger_entries',
];

// ─── Deterministic PRNG so re-seeding produces a comparable dataset ─────────
let _seed = 20260727;
function rnd() {
    _seed = (_seed * 1103515245 + 12345) % 2147483648;
    return _seed / 2147483648;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const randInt = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
const round2 = n => Math.round(n * 100) / 100;

function readMongoUri() {
    if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
    const envPath = path.join(__dirname, '..', '.env.local');
    const raw = fs.readFileSync(envPath, 'utf8');
    const m = raw.match(/^MONGODB_URI\s*=\s*"?([^"\n\r]+)"?/m);
    if (!m) throw new Error('MONGODB_URI not found in env or .env.local');
    return m[1].trim();
}

// ─── Demo entities ──────────────────────────────────────────────────────────
const CLIENTS = [
    { name: 'Ravi Kumar',     company: 'Aravind Textiles',        weight: 0.22, email: 'ravi@aravindtextiles.in',   phone: '9840112233', city: 'Coimbatore' },
    { name: 'Meera Nair',     company: 'Nair Hospitals',          weight: 0.16, email: 'meera@nairhospitals.in',    phone: '9840223344', city: 'Kochi' },
    { name: 'Suresh Iyer',    company: 'Iyer Engineering Works',  weight: 0.14, email: 'suresh@iyerworks.in',       phone: '9840334455', city: 'Madurai' },
    { name: 'Fatima Sheikh',  company: 'Crescent Traders',        weight: 0.12, email: 'fatima@crescenttraders.in', phone: '9840445566', city: 'Chennai' },
    { name: 'Arun Prasad',    company: 'Vel Logistics',           weight: 0.11, email: 'arun@vellogistics.in',      phone: '9840556677', city: 'Tirunelveli' },
    { name: 'Divya Menon',    company: 'Menon Diagnostics',       weight: 0.09, email: 'divya@menondiag.in',        phone: '9840667788', city: 'Trichy' },
    { name: 'Karthik Raja',   company: 'Raja Constructions',      weight: 0.07, email: 'karthik@rajacons.in',       phone: '9840778899', city: 'Salem' },
    { name: 'Nisha Verma',    company: 'Verma Pharma Supplies',   weight: 0.05, email: 'nisha@vermapharma.in',      phone: '9840889900', city: 'Erode' },
    { name: 'Joseph Thomas',  company: 'Thomas Cold Storage',     weight: 0.03, email: 'joseph@thomascold.in',      phone: '9840990011', city: 'Kottayam' },
    { name: 'Lakshmi Devi',   company: 'Devi Enterprises',        weight: 0.01, email: 'lakshmi@devient.in',        phone: '9841001122', city: 'Vellore' },
];

// costRatio = costPrice as a fraction of `price` (55%-75%, varied per product)
// so the seeded tenant can demonstrate a real, non-uniform Gross Margin KPI.
const PRODUCTS = [
    { itemId: 'DEMO-PRD-001', name: 'Centrifugal Pump 5HP',       sku: 'CP-5HP',    price: 48500, unit: 'Nos', costRatio: 0.62 },
    { itemId: 'DEMO-PRD-002', name: 'Stainless Steel Pipe 2in',   sku: 'SSP-2',     price: 1850,  unit: 'Mtr', costRatio: 0.70 },
    { itemId: 'DEMO-PRD-003', name: 'Industrial Air Compressor',  sku: 'IAC-10',    price: 92000, unit: 'Nos', costRatio: 0.58 },
    { itemId: 'DEMO-PRD-004', name: 'Control Panel Assembly',     sku: 'CPA-3P',    price: 27500, unit: 'Nos', costRatio: 0.65 },
    { itemId: 'DEMO-PRD-005', name: 'Ball Valve 1.5in',           sku: 'BV-15',     price: 940,   unit: 'Nos', costRatio: 0.72 },
    { itemId: 'DEMO-PRD-006', name: 'Pressure Gauge 0-16bar',     sku: 'PG-16',     price: 1250,  unit: 'Nos', costRatio: 0.68 },
    { itemId: 'DEMO-PRD-007', name: 'Annual Maintenance Contract', sku: 'AMC-1Y',   price: 65000, unit: 'Nos', costRatio: 0.55 },
    { itemId: 'DEMO-PRD-008', name: 'Motor Rewinding Service',    sku: 'SVC-MRW',   price: 12500, unit: 'Nos', costRatio: 0.60 },
    { itemId: 'DEMO-PRD-009', name: 'Flange Coupling Set',        sku: 'FCS-4',     price: 3400,  unit: 'Set', costRatio: 0.75 },
    { itemId: 'DEMO-PRD-010', name: 'Vibration Damper Pad',       sku: 'VDP-M',     price: 620,   unit: 'Nos', costRatio: 0.73 },
];

const WAREHOUSES = [
    { name: 'Tirunelveli Main Godown', address: 'AMK Plaza, Gandhi Nagar, Tirunelveli' },
    { name: 'Madurai Transit Depot',   address: 'Bypass Road, Madurai' },
];

const LEAD_SOURCES = ['referral', 'website', 'exhibition', 'cold_call', 'partner'];
const PAYMENT_METHODS = ['bank', 'upi', 'cash', 'cheque', 'card'];
const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const SO_STATUSES = ['draft', 'confirmed', 'fulfilled', 'invoiced', 'cancelled'];

/** Seasonality multiplier by month index (0=Jan) - Indian B2B: soft monsoon, strong Q4/festive. */
const SEASONALITY = [0.85, 0.9, 1.35, 1.0, 1.05, 0.8, 0.75, 0.9, 1.15, 1.3, 1.25, 1.0];

function weightedClient() {
    const r = rnd();
    let acc = 0;
    for (const c of CLIENTS) { acc += c.weight; if (r <= acc) return c; }
    return CLIENTS[0];
}

function customerOf(c) {
    return {
        name: c.name, company: c.company, phone: c.phone, email: c.email,
        address: `${c.city}, Tamil Nadu`, gstin: '33ABBFV8123F1ZD',
    };
}

function buildLineItems() {
    const n = randInt(1, 4);
    const chosen = [];
    const items = [];
    let subtotal = 0, taxTotal = 0;
    for (let i = 0; i < n; i++) {
        let p = pick(PRODUCTS);
        let guard = 0;
        while (chosen.includes(p.itemId) && guard++ < 10) p = pick(PRODUCTS);
        chosen.push(p.itemId);
        const qty = p.price > 40000 ? randInt(1, 3) : randInt(2, 25);
        // Occasional negotiated discount so unit prices are not all identical.
        const unitPrice = round2(p.price * (rnd() < 0.3 ? 0.9 + rnd() * 0.1 : 1));
        const totalPrice = round2(unitPrice * qty);
        const taxRate = 18;
        subtotal += totalPrice;
        taxTotal += round2(totalPrice * taxRate / 100);
        items.push({
            product: p.name, description: '', hsnCode: '84131900', itemId: p.itemId,
            qty, unit: p.unit, unitPrice, taxRate, totalPrice,
        });
    }
    return { lineItems: items, subtotal: round2(subtotal), taxTotal: round2(taxTotal), grandTotal: round2(subtotal + taxTotal) };
}

function secretKey() {
    return Array.from({ length: 20 }, () => '0123456789abcdef'[Math.floor(rnd() * 16)]).join('');
}

async function clean(db) {
    let total = 0;
    for (const col of COLLECTIONS) {
        const res = await db.collection(col).deleteMany({ tenantId: TENANT_ID, _seedDemo: true });
        if (res.deletedCount) console.log(`  removed ${res.deletedCount} from ${col}`);
        total += res.deletedCount;
    }
    console.log(`[seed-analytics-demo] Cleaned ${total} seeded documents.`);
}

async function seed(db) {
    const now = new Date();
    // Range anchor: 12 full months back from the start of the current month (UTC).
    const startMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

    // ── Clients ─────────────────────────────────────────────────────────────
    // The invoices below embed a `customer` snapshot (see customerOf), but the
    // Clients module reads `tenant_clients`. Without these the dashboard
    // truthfully reported "Active Clients: 1" while ten demo customers were
    // being actively invoiced, which reads as a bug rather than as seed data.
    // Upserted (not insertMany) so a re-run - or a hand-created client of the
    // same name - never produces a duplicate.
    let clientsInserted = 0;
    for (const c of CLIENTS) {
        const snap = customerOf(c);
        const res = await db.collection('tenant_clients').updateOne(
            { tenantId: TENANT_ID, name: snap.name },
            {
                $set: {
                    ...MARKER,
                    tenantId: TENANT_ID,
                    name: snap.name,
                    company: snap.company,
                    contactPerson: snap.name,
                    phone: snap.phone,
                    email: snap.email,
                    address: snap.address,
                    gstin: snap.gstin,
                    roles: ['customer'],
                    panNumber: '',
                    paymentTerms: 'Net 30',
                    notes: '',
                    bankDetails: null,
                    updatedAt: now,
                },
                $setOnInsert: { createdAt: startMonth },
            },
            { upsert: true },
        );
        if (res.upsertedCount) clientsInserted++;
    }

    // ── Products ────────────────────────────────────────────────────────────
    const productDocs = PRODUCTS.map(p => ({
        ...MARKER, tenantId: TENANT_ID, itemId: p.itemId, name: p.name, sku: p.sku,
        hsnCode: '84131900', unit: p.unit, defaultUnitPrice: p.price, taxRate: 18,
        costPrice: round2(p.price * p.costRatio),
        stockCount: 0, specifications: {},
        createdAt: startMonth, updatedAt: now,
    }));
    await db.collection('tenant_products').insertMany(productDocs);

    // ── Warehouses ──────────────────────────────────────────────────────────
    const warehouseDocs = WAREHOUSES.map((w, i) => ({
        ...MARKER, _id: new ObjectId(), tenantId: TENANT_ID, name: w.name, address: w.address,
        isDefault: i === 0, createdAt: startMonth, updatedAt: now,
    }));
    await db.collection('erp_warehouses').insertMany(warehouseDocs);

    // ── Invoices across 12 months with seasonality ──────────────────────────
    const invoiceDocs = [];
    const payments = [];
    const ledger = [];
    let invSeq = 1000;
    let overdue90Count = 0;

    for (let m = 0; m < 12; m++) {
        const monthStart = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + m, 1));
        if (monthStart > now) break;
        const daysInMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
        const season = SEASONALITY[monthStart.getUTCMonth()];
        // 4-8 invoices/month scaled by seasonality → ~65-75 total.
        let count = Math.max(2, Math.round(randInt(4, 8) * season));
        // Growth trend across the year so YoY/prev comparisons are meaningful.
        if (m >= 8) count += 1;

        for (let i = 0; i < count; i++) {
            const day = randInt(1, Math.min(daysInMonth, monthStart.getUTCMonth() === now.getUTCMonth() && monthStart.getUTCFullYear() === now.getUTCFullYear() ? Math.max(1, now.getUTCDate()) : daysInMonth));
            const createdAt = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day, randInt(9, 18), randInt(0, 59)));
            if (createdAt > now) continue;
            const client = weightedClient();
            const li = buildLineItems();
            const termDays = pick([15, 30, 30, 45]);
            const dueDate = new Date(createdAt.getTime() + termDays * DAY_MS);
            const _id = new ObjectId();
            const age = Math.floor((now - createdAt) / DAY_MS);

            // Payment behaviour: older invoices mostly settled; a deliberate tail of
            // long-overdue ones so the critical receivables insight fires.
            let payRatio;
            const roll = rnd();
            if (age > 200) payRatio = roll < 0.94 ? 1 : 0;
            else if (age > 120) payRatio = roll < 0.85 ? 1 : (roll < 0.93 ? 0.5 : 0);
            else if (age > 60) payRatio = roll < 0.7 ? 1 : (roll < 0.85 ? 0.4 : 0);
            else payRatio = roll < 0.45 ? 1 : (roll < 0.7 ? 0.35 : 0);

            const overdueDays = Math.floor((now - dueDate) / DAY_MS);
            if (payRatio < 1 && overdueDays > 90) overdue90Count++;

            const paidAmount = round2(li.grandTotal * payRatio);
            let status = 'sent';
            if (payRatio >= 1) status = 'paid';
            else if (payRatio > 0) status = 'partially_paid';
            else if (overdueDays > 0) status = 'overdue';

            invoiceDocs.push({
                ...MARKER, _id, tenantId: TENANT_ID, businessName: BUSINESS_NAME, brandColor: BRAND_COLOR,
                docType: 'Invoice', docNumber: `${DOC_PREFIX}-2026-INV-${++invSeq}`, secretKey: secretKey(),
                status, customer: customerOf(client), lineItems: li.lineItems,
                subtotal: li.subtotal, taxTotal: li.taxTotal, grandTotal: li.grandTotal,
                notes: '', terms: `Payment due within ${termDays} days.`,
                dueDate, createdAt, updatedAt: createdAt,
            });

            if (paidAmount > 0) {
                // Full payments sometimes arrive in two instalments.
                const parts = payRatio >= 1 && rnd() < 0.3 ? 2 : 1;
                let remaining = paidAmount;
                for (let p = 0; p < parts; p++) {
                    const amt = p === parts - 1 ? round2(remaining) : round2(paidAmount / 2);
                    remaining -= amt;
                    const payDate = new Date(Math.min(now.getTime(), createdAt.getTime() + randInt(3, termDays + 20) * DAY_MS + p * 7 * DAY_MS));
                    payments.push({
                        ...MARKER, tenantId: TENANT_ID, documentId: _id.toString(), docNumber: `${DOC_PREFIX}-2026-INV-${invSeq}`,
                        amount: amt, method: pick(PAYMENT_METHODS), reference: '', notes: '',
                        createdAt: payDate, updatedAt: payDate,
                    });
                    ledger.push({
                        ...MARKER, tenantId: TENANT_ID, entryNumber: `LED-DEMO-${ledger.length + 1}`,
                        type: 'income', category: 'Sales', description: `Payment against ${DOC_PREFIX}-2026-INV-${invSeq}`,
                        amount: amt, date: payDate, reference: '', reconciled: rnd() < 0.6, by: null,
                        createdAt: payDate, updatedAt: payDate,
                    });
                }
            }
        }

        // ── Monthly expenses so the cash-flow chart has an outflow side ──────
        const expenseCats = ['Rent', 'Salaries', 'Freight', 'Utilities', 'Raw Material', 'Marketing'];
        for (const cat of expenseCats) {
            const d = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), randInt(1, Math.min(28, daysInMonth))));
            if (d > now) continue;
            const base = { Rent: 45000, Salaries: 180000, Freight: 22000, Utilities: 14000, 'Raw Material': 95000, Marketing: 18000 }[cat];
            ledger.push({
                ...MARKER, tenantId: TENANT_ID, entryNumber: `LED-DEMO-EXP-${ledger.length + 1}`,
                type: 'expense', category: cat, description: `${cat} - ${d.toISOString().slice(0, 7)}`,
                amount: round2(base * (0.85 + rnd() * 0.3)), date: d, reference: '', reconciled: true, by: null,
                createdAt: d, updatedAt: d,
            });
        }
    }
    await db.collection('tenant_documents').insertMany(invoiceDocs);
    if (payments.length) await db.collection('erp_payments').insertMany(payments);
    if (ledger.length) await db.collection('erp_ledger_entries').insertMany(ledger);

    // ── Quotes (with a realistic conversion subset) ──────────────────────────
    const quoteDocs = [];
    let qSeq = 2000;
    for (let i = 0; i < 25; i++) {
        const offsetDays = randInt(0, 350);
        const createdAt = new Date(now.getTime() - offsetDays * DAY_MS);
        const client = weightedClient();
        const li = buildLineItems();
        const converted = rnd() < 0.36;
        quoteDocs.push({
            ...MARKER, _id: new ObjectId(), tenantId: TENANT_ID, businessName: BUSINESS_NAME, brandColor: BRAND_COLOR,
            docType: 'Quote', docNumber: `${DOC_PREFIX}-2026-QT-${++qSeq}`, secretKey: secretKey(),
            status: converted ? 'converted' : pick(['draft', 'sent', 'sent', 'expired']),
            customer: customerOf(client), lineItems: li.lineItems,
            subtotal: li.subtotal, taxTotal: li.taxTotal, grandTotal: li.grandTotal,
            notes: '', terms: 'Valid for 30 days.', _demoConverted: converted,
            createdAt, updatedAt: createdAt,
        });
    }
    await db.collection('tenant_documents').insertMany(quoteDocs.map(({ _demoConverted, ...q }) => q));

    // ── Sales orders (some linked to converted quotes) ───────────────────────
    const convertedQuotes = quoteDocs.filter(q => q._demoConverted);
    const soDocs = [];
    for (let i = 0; i < 15; i++) {
        const linked = convertedQuotes[i] || null;
        const createdAt = linked
            ? new Date(new Date(linked.createdAt).getTime() + randInt(2, 21) * DAY_MS)
            : new Date(now.getTime() - randInt(0, 300) * DAY_MS);
        if (createdAt > now) continue;
        const status = i < 3 ? 'draft' : i < 8 ? 'confirmed' : i < 11 ? 'fulfilled' : i < 14 ? 'invoiced' : 'cancelled';
        const updatedAt = new Date(Math.min(now.getTime(), createdAt.getTime() + randInt(1, 25) * DAY_MS));
        const li = linked ? { grandTotal: linked.grandTotal, subtotal: linked.subtotal, taxTotal: linked.taxTotal, lineItems: linked.lineItems } : buildLineItems();
        soDocs.push({
            ...MARKER, tenantId: TENANT_ID, soNumber: `SO-DEMO-${String(i + 1).padStart(4, '0')}`,
            quoteDocumentId: linked ? linked._id.toString() : null,
            quoteDocNumber: linked ? linked.docNumber : null,
            invoiceDocumentId: null, invoiceDocNumber: null,
            customer: linked ? linked.customer : customerOf(weightedClient()),
            status, lineItems: li.lineItems, subtotal: li.subtotal, taxTotal: li.taxTotal, grandTotal: li.grandTotal,
            createdAt, updatedAt,
        });
    }
    await db.collection('erp_sales_orders').insertMany(soDocs);

    // ── Leads across stages and sources ──────────────────────────────────────
    const leadDocs = [];
    const firstNames = ['Ganesh', 'Priya', 'Vignesh', 'Anitha', 'Rahul', 'Sneha', 'Mohan', 'Deepa', 'Vikram', 'Kavya'];
    const companies = ['Sri Balaji Mills', 'Kumaran Steels', 'Ocean Exports', 'Pearl Chemicals', 'Anand Motors', 'Tamil Agro Foods', 'Bharath Packaging', 'Zenith Plastics', 'Coastal Marine', 'Green Valley Farms'];
    for (let i = 0; i < 30; i++) {
        const createdAt = new Date(now.getTime() - randInt(0, 340) * DAY_MS);
        // Weighted so the funnel narrows realistically toward won/lost.
        const stage = STAGES[Math.min(5, Math.floor(Math.pow(rnd(), 0.75) * 6))];
        const source = pick(LEAD_SOURCES);
        const activities = [{ type: 'created', message: 'Lead created', at: createdAt, by: null }];
        const stageIdx = STAGES.indexOf(stage);
        let cursor = createdAt;
        for (let s = 1; s <= stageIdx; s++) {
            cursor = new Date(cursor.getTime() + randInt(2, 18) * DAY_MS);
            if (cursor > now) break;
            activities.push({ type: 'stage_change', message: `Stage changed: ${STAGES[s - 1]} → ${STAGES[s]}`, at: cursor, by: null });
        }
        leadDocs.push({
            ...MARKER, tenantId: TENANT_ID, leadNumber: `LEAD-DEMO-${String(i + 1).padStart(4, '0')}`,
            name: pick(firstNames), company: companies[i % companies.length],
            email: `lead${i + 1}@example.in`, phone: `98${randInt(10000000, 99999999)}`,
            stage, expectedRevenue: round2(randInt(20, 400) * 1000), source,
            assignee: '', notes: '',
            tags: stage === 'lost' ? [pick(['price', 'timing', 'competitor', 'no-budget'])] : [],
            activities, createdAt, updatedAt: cursor,
        });
    }
    await db.collection('erp_leads').insertMany(leadDocs);

    // ── Pipeline stages (upsert, not marked - shared config, left if present) ─
    const existingStages = await db.collection('erp_pipeline_stages').findOne({ tenantId: TENANT_ID });
    if (!existingStages) {
        await db.collection('erp_pipeline_stages').insertOne({
            tenantId: TENANT_ID,
            stages: [
                { id: 'new', name: 'New', order: 0, color: '#3b82f6' },
                { id: 'qualified', name: 'Qualified', order: 1, color: '#8b5cf6' },
                { id: 'proposal', name: 'Proposal', order: 2, color: '#f59e0b' },
                { id: 'negotiation', name: 'Negotiation', order: 3, color: '#ef4444' },
                { id: 'won', name: 'Won', order: 4, color: '#10b981' },
                { id: 'lost', name: 'Lost', order: 5, color: '#6b7280' },
            ],
            createdAt: now, updatedAt: now,
        });
    }

    // ── Stock moves ──────────────────────────────────────────────────────────
    const moves = [];
    let moveSeq = 0;
    for (const p of PRODUCTS) {
        // Opening stock, then a stream of ins/outs. The last two products stay
        // deliberately thin so the low-stock insight has something real to report.
        const thin = PRODUCTS.indexOf(p) >= 8;
        const opening = thin ? randInt(3, 8) : randInt(40, 160);
        const openDate = new Date(startMonth.getTime() + randInt(0, 10) * DAY_MS);
        moves.push({
            ...MARKER, tenantId: TENANT_ID, moveNumber: `STK-DEMO-${String(++moveSeq).padStart(4, '0')}`,
            itemId: p.itemId, warehouseId: warehouseDocs[0]._id.toString(), type: 'in', qty: opening,
            reference: 'Opening stock', notes: '', by: null, createdAt: openDate,
        });
        let balance = opening;
        const txns = thin ? randInt(3, 6) : randInt(10, 26);
        for (let i = 0; i < txns; i++) {
            const d = new Date(startMonth.getTime() + randInt(10, Math.floor((now - startMonth) / DAY_MS)) * DAY_MS);
            if (d > now) continue;
            const isOut = rnd() < 0.62 && balance > 1;
            const qty = isOut ? randInt(1, Math.max(1, Math.min(12, balance - 1))) : randInt(5, 40);
            balance += isOut ? -qty : qty;
            moves.push({
                ...MARKER, tenantId: TENANT_ID, moveNumber: `STK-DEMO-${String(++moveSeq).padStart(4, '0')}`,
                itemId: p.itemId, warehouseId: pick(warehouseDocs)._id.toString(),
                type: isOut ? 'out' : 'in', qty, reference: '', notes: '', by: null, createdAt: d,
            });
        }
    }
    await db.collection('erp_stock_moves').insertMany(moves);

    console.log('[seed-analytics-demo] Seeded:');
    console.log(`  clients (distinct)   : ${CLIENTS.length}`);
    console.log(`  products             : ${productDocs.length}`);
    console.log(`  warehouses           : ${warehouseDocs.length}`);
    console.log(`  invoices             : ${invoiceDocs.length}`);
    console.log(`  tenant_clients recs  : ${CLIENTS.length} (${clientsInserted} newly inserted)`);
    console.log(`  90+ day overdue invs : ${overdue90Count}`);
    console.log(`  payments             : ${payments.length}`);
    console.log(`  ledger entries       : ${ledger.length}`);
    console.log(`  quotes               : ${quoteDocs.length} (${convertedQuotes.length} converted)`);
    console.log(`  sales orders         : ${soDocs.length}`);
    console.log(`  leads                : ${leadDocs.length}`);
    console.log(`  stock moves          : ${moves.length}`);
    const revenue = invoiceDocs.reduce((s, i) => s + i.grandTotal, 0);
    console.log(`  total invoiced value : ₹${revenue.toLocaleString('en-IN')}`);
}

(async () => {
    const uri = readMongoUri();
    const client = await new MongoClient(uri).connect();
    try {
        const db = client.db(DEV_DB_NAME);
        if (db.databaseName !== DEV_DB_NAME) {
            throw new Error(`Refusing to write: resolved db is "${db.databaseName}", expected "${DEV_DB_NAME}"`);
        }
        console.log(`[seed-analytics-demo] Target database: ${db.databaseName} · tenant ${TENANT_ID}`);

        // Always clear prior seed docs first so re-running is idempotent.
        await clean(db);
        if (process.argv.includes('--clean')) return;
        await seed(db);
    } finally {
        await client.close();
    }
})().catch(err => {
    console.error('[seed-analytics-demo] FAILED:', err);
    process.exit(1);
});
