/**
 * Chart of Accounts (COA) Service for VelBiz Cloud.
 *
 * Manages Group hierarchies, Ledger lifecycle, opening balances, and
 * dynamic client/vendor ledger synchronisation under Sundry Debtors/Creditors.
 */

import { ObjectId } from 'mongodb';
import { ACCOUNT_GROUPS, getGroupByCode } from './groups.js';
import { DEFAULT_SYSTEM_LEDGERS } from './defaultLedgers.js';

/**
 * Initializes the default Chart of Accounts for a tenant if not already seeded.
 * Idempotent: safe to run multiple times.
 */
export async function ensureChartOfAccounts(db, tenantId) {
    if (!tenantId) return;

    /*
     * IDEMPOTENT PER LEDGER CODE, not per tenant.
     *
     * This used to count the tenant's ledgers and return early if there were
     * any at all. Two consequences, both silent:
     *
     *   - A ledger added to DEFAULT_SYSTEM_LEDGERS later never reached any
     *     existing tenant. Every posting helper that resolves a ledger by code
     *     would then find nothing and fall back, or throw, on exactly the
     *     hospitals that have been using the product longest.
     *   - A tenant who happened to create one custom ledger before the seed ran
     *     was never seeded at all, and started with a chart of accounts of one.
     *
     * Seeding per code fixes both and stays safe to run on every request: it
     * only ever inserts codes that are missing, and never touches a ledger a
     * user created or edited.
     */
    const existing = await db.collection('erp_ledgers')
        .find({ tenantId }, { projection: { code: 1 } })
        .toArray();
    const have = new Set(existing.map(l => l.code).filter(Boolean));

    const missing = DEFAULT_SYSTEM_LEDGERS.filter(l => !have.has(l.code));
    if (missing.length === 0) return;

    const now = new Date();
    const seedDocs = missing.map(l => {
        const group = getGroupByCode(l.groupCode);
        return {
            tenantId,
            code: l.code,
            name: l.name,
            groupCode: l.groupCode,
            pillar: group ? group.pillar : 'Assets',
            normalBalance: group ? group.normalBalance : 'debit',
            isSystem: true,
            openingBalance: 0,
            openingBalanceType: group ? group.normalBalance : 'debit', // 'debit' or 'credit'
            currentBalance: 0,
            currentBalanceType: group ? group.normalBalance : 'debit',
            description: l.description || '',
            gstin: '',
            pan: '',
            bankDetails: {},
            active: true,
            createdAt: now,
            updatedAt: now,
        };
    });

    try {
        // ordered:false so one clash (a concurrent request seeding the same
        // tenant) does not abandon the rest of the batch.
        await db.collection('erp_ledgers').insertMany(seedDocs, { ordered: false });
    } catch (err) {
        // E11000 here means another request won the race and seeded the same
        // codes. That is the desired end state, so it is not an error.
        if (err?.code !== 11000) throw err;
    }
}

/**
 * Retrieves the full Chart of Accounts for a tenant, grouped by the 4 pillars.
 */
export async function getChartOfAccounts(db, tenantId) {
    await ensureChartOfAccounts(db, tenantId);

    const [ledgers, postingsAgg] = await Promise.all([
        db.collection('erp_ledgers').find({ tenantId, active: { $ne: false } }).sort({ name: 1 }).toArray(),
        db.collection('erp_ledger_postings').aggregate([
            { $match: { tenantId } },
            {
                $group: {
                    _id: '$ledgerId',
                    totalDebit: { $sum: { $cond: [{ $eq: ['$entryType', 'debit'] }, '$amount', 0] } },
                    totalCredit: { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
                },
            },
        ]).toArray(),
    ]);

    const postingsMap = new Map();
    for (const p of postingsAgg) {
        if (p._id) postingsMap.set(p._id.toString(), p);
    }

    // Compute live closing balance for each ledger
    const enrichedLedgers = ledgers.map(ledger => {
        const p = postingsMap.get(ledger._id.toString()) || { totalDebit: 0, totalCredit: 0 };
        const openingDr = ledger.openingBalanceType === 'debit' ? (ledger.openingBalance || 0) : 0;
        const openingCr = ledger.openingBalanceType === 'credit' ? (ledger.openingBalance || 0) : 0;

        const netDebit = openingDr + p.totalDebit;
        const netCredit = openingCr + p.totalCredit;

        let balance = 0;
        let balanceType = ledger.normalBalance || 'debit';

        if (netDebit >= netCredit) {
            balance = netDebit - netCredit;
            balanceType = 'debit';
        } else {
            balance = netCredit - netDebit;
            balanceType = 'credit';
        }

        return {
            ...ledger,
            _id: ledger._id.toString(),
            totalDebit: p.totalDebit,
            totalCredit: p.totalCredit,
            closingBalance: balance,
            closingBalanceType: balanceType,
        };
    });

    // Structure groups with nested ledgers
    const groupsWithLedgers = ACCOUNT_GROUPS.map(group => {
        const groupLedgers = enrichedLedgers.filter(l => l.groupCode === group.code);
        const groupDebitTotal = groupLedgers.reduce((s, l) => s + (l.closingBalanceType === 'debit' ? l.closingBalance : 0), 0);
        const groupCreditTotal = groupLedgers.reduce((s, l) => s + (l.closingBalanceType === 'credit' ? l.closingBalance : 0), 0);

        return {
            ...group,
            ledgers: groupLedgers,
            totalDebit: groupDebitTotal,
            totalCredit: groupCreditTotal,
        };
    });

    return {
        groups: groupsWithLedgers,
        ledgers: enrichedLedgers,
    };
}

/**
 * Creates a custom ledger in the Chart of Accounts under a specified group.
 */
export async function createLedger(db, tenantId, payload) {
    await ensureChartOfAccounts(db, tenantId);

    const {
        name,
        groupCode,
        openingBalance = 0,
        openingBalanceType = 'debit',
        description = '',
        gstin = '',
        pan = '',
        bankDetails = {},
        linkedEntityId = null,
        linkedEntityType = null,
    } = payload;

    const group = getGroupByCode(groupCode);
    if (!group) {
        throw new Error(`Invalid group code: ${groupCode}`);
    }

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
        throw new Error('Ledger name is required.');
    }

    // Check duplicate name within tenant
    const existing = await db.collection('erp_ledgers').findOne({
        tenantId,
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        active: { $ne: false },
    });
    if (existing) {
        throw new Error(`A ledger named "${trimmedName}" already exists.`);
    }

    const now = new Date();
    const doc = {
        tenantId,
        name: trimmedName,
        groupCode,
        pillar: group.pillar,
        normalBalance: group.normalBalance,
        isSystem: false,
        openingBalance: Number(openingBalance) || 0,
        openingBalanceType: openingBalanceType === 'credit' ? 'credit' : 'debit',
        currentBalance: Number(openingBalance) || 0,
        currentBalanceType: openingBalanceType === 'credit' ? 'credit' : 'debit',
        description: (description || '').trim(),
        gstin: (gstin || '').trim().toUpperCase(),
        pan: (pan || '').trim().toUpperCase(),
        bankDetails: bankDetails || {},
        linkedEntityId: linkedEntityId ? String(linkedEntityId) : null,
        linkedEntityType: linkedEntityType || null,
        active: true,
        createdAt: now,
        updatedAt: now,
    };

    const res = await db.collection('erp_ledgers').insertOne(doc);
    return { ...doc, _id: res.insertedId.toString() };
}

/**
 * Synchronises a CRM client into a Sundry Debtor ledger.
 */
export async function syncClientToDebtor(db, tenantId, client) {
    if (!client || !client.name) return null;
    await ensureChartOfAccounts(db, tenantId);

    const clientIdStr = client._id ? client._id.toString() : null;
    let ledger = await db.collection('erp_ledgers').findOne({
        tenantId,
        groupCode: 'SUNDRY_DEBTORS',
        $or: [
            ...(clientIdStr ? [{ linkedEntityId: clientIdStr, linkedEntityType: 'client' }] : []),
            { name: client.name.trim() },
        ],
    });

    if (!ledger) {
        const group = getGroupByCode('SUNDRY_DEBTORS');
        const now = new Date();
        const doc = {
            tenantId,
            name: client.name.trim(),
            groupCode: 'SUNDRY_DEBTORS',
            pillar: group.pillar,
            normalBalance: group.normalBalance,
            isSystem: false,
            openingBalance: Number(client.openingBalance) || 0,
            openingBalanceType: 'debit',
            currentBalance: Number(client.openingBalance) || 0,
            currentBalanceType: 'debit',
            description: `Client / Customer account: ${client.company || client.name}`,
            gstin: (client.gstin || '').trim().toUpperCase(),
            pan: (client.pan || '').trim().toUpperCase(),
            bankDetails: {},
            linkedEntityId: clientIdStr,
            linkedEntityType: 'client',
            active: true,
            createdAt: now,
            updatedAt: now,
        };
        const res = await db.collection('erp_ledgers').insertOne(doc);
        return { ...doc, _id: res.insertedId.toString() };
    }

    return { ...ledger, _id: ledger._id.toString() };
}

/**
 * Synchronises a vendor into a Sundry Creditor ledger.
 *
 * The exact mirror of syncClientToDebtor, and its absence is why purchases
 * could not post at all: a purchase needs somebody to owe money TO, and there
 * was no way to turn a vendor into a ledger. Customers had this from the start;
 * suppliers were simply never built, so half the double entry had nowhere to go.
 *
 * A creditor is a liability, so the opening balance sits on the CREDIT side -
 * the one line that must not be copy-pasted from the debtor version.
 */
export async function syncVendorToCreditor(db, tenantId, vendor) {
    if (!vendor || !vendor.name) return null;
    await ensureChartOfAccounts(db, tenantId);

    const vendorIdStr = vendor._id ? vendor._id.toString() : null;
    let ledger = await db.collection('erp_ledgers').findOne({
        tenantId,
        groupCode: 'SUNDRY_CREDITORS',
        $or: [
            ...(vendorIdStr ? [{ linkedEntityId: vendorIdStr, linkedEntityType: 'vendor' }] : []),
            { name: vendor.name.trim() },
        ],
    });

    if (!ledger) {
        const group = getGroupByCode('SUNDRY_CREDITORS');
        const now = new Date();
        const doc = {
            tenantId,
            name: vendor.name.trim(),
            groupCode: 'SUNDRY_CREDITORS',
            pillar: group.pillar,
            normalBalance: group.normalBalance,
            isSystem: false,
            openingBalance: Number(vendor.openingBalance) || 0,
            // Credit, not debit. A supplier's opening balance is money owed BY
            // the business, and booking it as a debit would turn every vendor
            // into an asset and quietly inflate the balance sheet.
            openingBalanceType: 'credit',
            currentBalance: Number(vendor.openingBalance) || 0,
            currentBalanceType: 'credit',
            description: `Vendor / Supplier account: ${vendor.company || vendor.name}`,
            gstin: (vendor.gstin || '').trim().toUpperCase(),
            pan: (vendor.pan || '').trim().toUpperCase(),
            bankDetails: {},
            linkedEntityId: vendorIdStr,
            linkedEntityType: 'vendor',
            active: true,
            createdAt: now,
            updatedAt: now,
        };
        const res = await db.collection('erp_ledgers').insertOne(doc);
        return { ...doc, _id: res.insertedId.toString() };
    }

    return { ...ledger, _id: ledger._id.toString() };
}

/**
 * Retrieves a ledger by its system code or ID.
 */
export async function findLedgerByCodeOrId(db, tenantId, codeOrId) {
    if (!codeOrId) return null;
    const filter = { tenantId, active: { $ne: false } };
    if (ObjectId.isValid(codeOrId)) {
        filter.$or = [{ _id: new ObjectId(codeOrId) }, { code: codeOrId }];
    } else {
        filter.code = codeOrId;
    }
    const l = await db.collection('erp_ledgers').findOne(filter);
    return l ? { ...l, _id: l._id.toString() } : null;
}
