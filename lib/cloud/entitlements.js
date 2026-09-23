/**
 * VelBiz Cloud - Tenant plan / tier / vertical entitlements (client-safe half)
 *
 * Direct port of the Connect model (src/lib/hms/entitlements.js), deliberately
 * kept structurally identical so the two products' admin surfaces, override
 * semantics and reasoning codes stay learnable as one thing. Read that file's
 * header first - the design rationale there applies here unchanged.
 *
 * Two independent axes decide what a tenant's account can reach:
 *   - TIER    answers "how much did they pay for"
 *   - PROFILE answers "what kind of business is this"
 *
 * WHY THIS EXISTS: before it, Cloud had NO tenant-level module ceiling at all.
 * src/lib/permissions.js's hasPermission() checks a per-USER checklist, but
 * owner/admin bypass that entirely, so any tenant's own owner login reached
 * every ERP module (CRM, HR, Accounting, Inventory) on any plan. The tier
 * system that was supposed to constrain them (src/lib/tierInterceptor.js) had
 * zero call sites and enforced nothing. This file is the ceiling that was
 * missing. getCloudUser() (lib/cloudAuth.js) attaches it to every authenticated
 * request, and hasPermission() (lib/permissions.js) is what applies it.
 *
 * Deliberately ZERO server-only imports - imported by client components (the
 * admin tier/profile picker) as well as the server-side gate.
 */

/**
 * Tier keys match the pre-existing subscription.tier values already stored on
 * `tenants` docs (see src/lib/tiers.js, which owns the SEAT limits for these
 * same keys). Changing a key here would orphan every existing tenant, so the
 * legacy names stay even though they read oddly next to Connect's.
 */
export const TIERS = [
    {
        key: 'free_trial',
        label: 'Free Trial',
        description: 'Full access for the trial window - documents, clients, items, templates.',
    },
    {
        key: 'core_workspace',
        label: 'Core Workspace',
        description: 'Documents and the client/item registry, plus CRM and calendar.',
    },
    {
        key: 'premium_command_tier',
        label: 'Premium Command Tier',
        description: 'Everything, plus analytics, the full ERP suite and dynamic QR.',
    },
];

export const TIER_KEYS = TIERS.map(t => t.key);
export const DEFAULT_TIER = 'free_trial';

/**
 * Modules each tier includes. Additive in the same direction as Connect's, so
 * a tenant never loses a module by moving to a higher tier.
 *
 * 'config' is deliberately NOT here - every tenant manages its own settings and
 * staff regardless of plan, so it is in ALWAYS_ALLOWED_MODULES below.
 *
 * free_trial gets the SAME list as core_workspace on purpose. The trial is a
 * full-featured window, and the thing that ends it is the trial-expiry check in
 * moduleAllowedForTenant(), not a shorter module list. A trial that silently
 * withheld modules would read as a broken product rather than a trial.
 */
export const TIER_MODULES = {
    free_trial: ['items', 'clients', 'documents', 'templates', 'crm', 'calendar'],
    core_workspace: ['items', 'clients', 'documents', 'templates', 'crm', 'calendar'],
    premium_command_tier: [
        'items', 'clients', 'documents', 'templates', 'crm', 'calendar',
        'analytics', 'purchases', 'inventory', 'expenses', 'accounting', 'hr',
    ],
};

/**
 * Never tier-gated, never profile-gated.
 *
 * 'config' - every tenant manages its own settings, branding and team
 * regardless of plan. A tenant locked out of its own config cannot fix its own
 * billing details, which is precisely the state a suspension needs them to be
 * able to escape.
 */
const ALWAYS_ALLOWED_MODULES = ['config'];

/**
 * Every module key this app gates on. Mirrors permissions.js's PERMISSION_KEYS,
 * duplicated here rather than imported to match the Connect split exactly
 * (and because permissions.js imports NextResponse, a server-only concern).
 * assertCloudModuleParity() below makes drift loud rather than silent.
 */
export const ALL_MODULE_KEYS = [
    'items', 'clients', 'documents', 'templates', 'crm', 'calendar',
    'analytics', 'purchases', 'inventory', 'expenses', 'accounting', 'hr', 'config',
];

/**
 * Business verticals. `allow` is a whitelist of module keys meaningful for that
 * vertical - `null` means "no whitelist", deliberately different from a list
 * containing every key: a module added later is automatically reachable through
 * the 'general' profile instead of being silently withheld until someone
 * remembers to add it here. `core` modules are granted regardless of tier.
 */
export const PROFILES = [
    {
        key: 'general',
        label: 'General Business',
        description: 'Full module universe - the default. No vertical restriction.',
        allow: null,
        core: [],
    },
    {
        key: 'services',
        label: 'Services / Consultancy',
        description: 'Documents, clients and CRM first. No stock to keep.',
        allow: ['items', 'clients', 'documents', 'templates', 'crm', 'calendar', 'analytics', 'expenses', 'accounting', 'hr'],
        core: [],
    },
    {
        key: 'trading',
        label: 'Trading / Distribution',
        description: 'Stock and purchasing led. Inventory is the reason to exist.',
        allow: ['items', 'clients', 'documents', 'templates', 'crm', 'analytics', 'purchases', 'inventory', 'expenses', 'accounting'],
        core: ['inventory'],
    },
    {
        key: 'documents_only',
        label: 'Documentation Only',
        description: 'Quotations and letterheads only - no ERP, no pipeline.',
        allow: ['items', 'clients', 'documents', 'templates'],
        core: [],
    },
];

export const PROFILE_KEYS = PROFILES.map(p => p.key);
export const DEFAULT_PROFILE = 'general';
const PROFILE_BY_KEY = Object.fromEntries(PROFILES.map(p => [p.key, p]));

export function normalizeTier(tier) {
    return TIER_KEYS.includes(tier) ? tier : DEFAULT_TIER;
}

/**
 * Falls back to 'general' - the MOST PERMISSIVE profile - on anything
 * unrecognized. Unknown input must always widen access, never narrow it;
 * narrowing on a typo or a stale client is how a tenant silently loses a module
 * it is actively using with no error and no way to self-recover.
 */
export function normalizeProfile(profile) {
    return PROFILE_KEYS.includes(profile) ? profile : DEFAULT_PROFILE;
}

export function tierAllowsModule(tier, moduleKey) {
    return (TIER_MODULES[normalizeTier(tier)] || []).includes(moduleKey);
}

/**
 * Subscription states. Graded on purpose - see moduleAllowedForTenant().
 *
 * 'restricted' is the billing lever: it withholds the revenue and convenience
 * features while leaving the tenant able to read and export their own records
 * and fix their own billing details. A single binary suspend/active pair forces
 * a choice between "no leverage" and "lock a business out of its own data",
 * and the second is a reputational and legal problem, not just a harsh one.
 */
export const SUBSCRIPTION_STATUSES = [
    { key: 'active', label: 'Active', description: 'Full access per plan.' },
    { key: 'restricted', label: 'Restricted (billing hold)', description: 'Read and export their own data, plus config. Creation and ERP features withheld.' },
    { key: 'suspended', label: 'Suspended', description: 'No portal access at all. Login is refused.' },
];
export const SUBSCRIPTION_STATUS_KEYS = SUBSCRIPTION_STATUSES.map(s => s.key);

export function normalizeStatus(status) {
    return SUBSCRIPTION_STATUS_KEYS.includes(status) ? status : 'active';
}

/**
 * What a 'restricted' tenant keeps. Deliberately the tenant's own records and
 * their own config - never the modules that generate new billable work. The
 * point of a billing hold is to stop the value accruing, not to hold the
 * customer's existing data hostage.
 */
const RESTRICTED_MODULES = ['clients', 'documents', 'items', 'templates', 'config'];

/**
 * The full entitlement answer for one module.
 *
 * Missing `entitlements` (every tenant created before this shipped) means
 * UNRESTRICTED - only a tenant with an explicit `modules.tier` set is actually
 * constrained. Same "absence means no restriction" discipline as Connect's.
 * A tenant never loses access retroactively because this feature shipped.
 * This line must never change.
 *
 * Resolution order, each one a hard stop:
 *   1. Suspended - false for everything. Login is refused anyway; this is the
 *      belt to that braces, for any already-issued session still in flight.
 *   2. `moduleOverrides[moduleKey]` if explicitly set - the staff escape hatch,
 *      wins over tier and profile. Turns a wrong profile assignment into a
 *      sixty-second fix rather than a code change. NOTE it deliberately does
 *      NOT win over suspension or restriction above/below it.
 *   3. Restricted - only RESTRICTED_MODULES survive.
 *   4. Expired trial - collapses to RESTRICTED_MODULES too, so the tenant keeps
 *      reading and exporting what they already built.
 *   5. Always-allowed modules (config) - true, unconditionally.
 *   6. Profile whitelist - the only place access can be REMOVED versus the
 *      pre-entitlement behavior, which is why the admin UI diffs it loudly.
 *   7. Profile core - granted by the vertical regardless of tier.
 *   8. Otherwise, the tier answer.
 */
export function moduleAllowedForTenant(entitlements, moduleKey) {
    if (!entitlements || !entitlements.tier) return true;

    const status = normalizeStatus(entitlements.status);
    if (status === 'suspended') return false;

    const overrides = entitlements.moduleOverrides;
    if (overrides && typeof overrides === 'object' && typeof overrides[moduleKey] === 'boolean') {
        // An override still cannot resurrect a module for a restricted or
        // expired tenant - otherwise a stale "forced on" override from months
        // ago would quietly defeat the billing lever it is sitting underneath.
        if (status === 'restricted' || isTrialExpired(entitlements)) {
            return RESTRICTED_MODULES.includes(moduleKey) && overrides[moduleKey];
        }
        return overrides[moduleKey];
    }

    if (status === 'restricted') return RESTRICTED_MODULES.includes(moduleKey);
    if (isTrialExpired(entitlements)) return RESTRICTED_MODULES.includes(moduleKey);

    if (ALWAYS_ALLOWED_MODULES.includes(moduleKey)) return true;

    const profile = PROFILE_BY_KEY[normalizeProfile(entitlements.profile)];
    if (profile.allow && !profile.allow.includes(moduleKey)) {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
            console.log(`[cloud-entitlements] profile=${profile.key} blocked module=${moduleKey}`);
        }
        return false;
    }
    if (profile.core.includes(moduleKey)) return true;

    return tierAllowsModule(entitlements.tier, moduleKey);
}

/**
 * A free_trial tenant past its trialEndsAt. Any other tier ignores the date
 * entirely - a paying tenant with a stale trial date must never be downgraded
 * by it. Absent date means "no expiry known", which widens rather than narrows.
 */
export function isTrialExpired(entitlements) {
    if (!entitlements) return false;
    if (normalizeTier(entitlements.tier) !== 'free_trial') return false;
    if (!entitlements.trialEndsAt) return false;
    const ends = new Date(entitlements.trialEndsAt);
    if (Number.isNaN(ends.getTime())) return false;
    return Date.now() > ends.getTime();
}

/** null = unrestricted, caller decides how to render "all". */
export function entitledModules(entitlements) {
    if (!entitlements || !entitlements.tier) return null;
    return ALL_MODULE_KEYS.filter(key => moduleAllowedForTenant(entitlements, key));
}

/**
 * Why a module resolved the way it did, for the admin preview UI only - never
 * used for the actual gate, which stays moduleAllowedForTenant()'s job alone.
 * Reason codes are shared with the Connect preview component so one set of chip
 * styles covers both products.
 */
export function moduleEntitlementReason(entitlements, moduleKey) {
    if (!entitlements || !entitlements.tier) return 'unrestricted';

    const status = normalizeStatus(entitlements.status);
    if (status === 'suspended') return 'suspended';

    const overrides = entitlements.moduleOverrides;
    const hasOverride = overrides && typeof overrides === 'object' && typeof overrides[moduleKey] === 'boolean';

    if (status === 'restricted' || isTrialExpired(entitlements)) {
        const label = status === 'restricted' ? 'restricted' : 'trial-expired';
        return RESTRICTED_MODULES.includes(moduleKey) && (!hasOverride || overrides[moduleKey])
            ? 'plan'
            : label;
    }

    if (hasOverride) return overrides[moduleKey] ? 'override-on' : 'override-off';
    if (ALWAYS_ALLOWED_MODULES.includes(moduleKey)) return 'always';

    const profile = PROFILE_BY_KEY[normalizeProfile(entitlements.profile)];
    if (profile.allow && !profile.allow.includes(moduleKey)) return 'hidden-by-profile';
    if (profile.core.includes(moduleKey)) return 'vertical';
    return tierAllowsModule(entitlements.tier, moduleKey) ? 'plan' : 'not-in-plan';
}

/** Cycles one module: plan-default -> forced ON -> forced OFF -> plan-default. Pure. */
export function cycleModuleOverride(moduleOverrides, moduleKey) {
    const overrides = { ...(moduleOverrides || {}) };
    if (!(moduleKey in overrides)) {
        overrides[moduleKey] = true;
    } else if (overrides[moduleKey] === true) {
        overrides[moduleKey] = false;
    } else {
        delete overrides[moduleKey];
    }
    return overrides;
}

export function defaultEntitlements() {
    return { tier: DEFAULT_TIER, profile: DEFAULT_PROFILE, status: 'active', trialEndsAt: null, moduleOverrides: {} };
}

/** Only known module keys, only boolean values - anything else is dropped, never persisted. */
function sanitizeModuleOverrides(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const out = {};
    for (const key of ALL_MODULE_KEYS) {
        if (typeof raw[key] === 'boolean') out[key] = raw[key];
    }
    return out;
}

/**
 * The security boundary for this whole feature - anything not explicitly
 * handled here can never reach `tenants.modules`, regardless of request body.
 */
export function sanitizeEntitlements(raw) {
    if (!raw || typeof raw !== 'object') return defaultEntitlements();
    let trialEndsAt = null;
    if (raw.trialEndsAt) {
        const d = new Date(raw.trialEndsAt);
        if (!Number.isNaN(d.getTime())) trialEndsAt = d;
    }
    return {
        tier: normalizeTier(raw.tier),
        profile: normalizeProfile(raw.profile),
        status: normalizeStatus(raw.status),
        trialEndsAt,
        moduleOverrides: sanitizeModuleOverrides(raw.moduleOverrides),
    };
}
