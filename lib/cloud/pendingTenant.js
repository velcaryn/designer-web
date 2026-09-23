import crypto from 'node:crypto';
import { getCloudDb } from '@/lib/cloudAuth';
import { seatLimitsForTier } from '@/lib/tiers';

/**
 * Records a VelBiz Cloud signup as a tenant awaiting approval.
 *
 * The public form (/cloud/onboarding, via /api/cloud/onboarding) is the only
 * way a tenant comes into existence: it lands here as `pending_approval`, and
 * an admin approves it at /admin/cloud/requests, which is where credentials
 * are issued. Nothing here grants access to anything.
 *
 * The form no longer asks for a document prefix (it is a setting, not a
 * signup question), so one is derived from the business name's initials. It
 * only seeds the tenant ID and the default numbering; the admin sets the real
 * prefix on the approval screen.
 *
 * Returns { tenantId } for a new record, or { tenantId: null, duplicate: true }
 * when the email is already registered. The caller must answer both the same
 * way, so the form cannot be used to test whether a business is a customer.
 */
const TRIAL_DAYS = 45;

export function prefixFromName(name) {
    const initials = String(name)
        .toUpperCase()
        .split(/[^A-Z0-9]+/)
        .filter(Boolean)
        .map(word => word[0])
        .join('')
        .slice(0, 4);
    return initials.length >= 2 ? initials : 'VB';
}

export async function createPendingTenant({ businessName, ownerName, businessType, email, phone, gstin, address }) {
    const db = await getCloudDb();

    if (await db.collection('tenants').findOne({ 'contact.email': email }, { projection: { _id: 1 } })) {
        return { tenantId: null, duplicate: true };
    }

    const docPrefix = prefixFromName(businessName);

    /* Retry on collision, then widen the range, so a run of registrations
       under one prefix can never exhaust it and block later signups. */
    let tenantId = null;
    for (let attempt = 0; attempt < 8 && !tenantId; attempt++) {
        const digits = attempt < 5 ? crypto.randomInt(1000, 9999) : crypto.randomInt(100000, 999999);
        const candidate = `TNT-${docPrefix}-${digits}`;
        const taken = await db.collection('tenants').findOne({ tenantId: candidate }, { projection: { _id: 1 } });
        if (!taken) tenantId = candidate;
    }
    if (!tenantId) throw new Error('tenant-id-exhausted');

    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    try {
        await db.collection('tenants').insertOne({
            tenantId,
            businessName,
            contact: {
                owner: ownerName,
                email,
                phone,
                gstin,
                address: {
                    line1: address.line1,
                    line2: address.line2,
                    city: address.city,
                    state: address.state,
                    pin: address.pin,
                },
            },
            businessType: businessType || 'Other',
            branding: { logoUrl: null, customHexColor: '#4A1088', docPrefix },
            subscription: {
                tier: 'free_trial',
                status: 'pending_approval',
                trialPeriod: true,
                onboardedAt: now,
                trialEndsAt: trialEnd,
                currentPeriodStart: now,
                currentPeriodEnd: trialEnd,
                ...seatLimitsForTier('free_trial'),
            },
            createdAt: now,
            updatedAt: now,
        });
    } catch (err) {
        /* The unique index on contact.email: two submissions raced. Treated
           exactly like the duplicate above. */
        if (err?.code === 11000) return { tenantId: null, duplicate: true };
        throw err;
    }

    return { tenantId };
}
