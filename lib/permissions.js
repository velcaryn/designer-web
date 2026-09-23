import { NextResponse } from 'next/server';
import { moduleAllowedForTenant, ALL_MODULE_KEYS, normalizeStatus, isTrialExpired } from './cloud/entitlements';

/**
 * VelBiz Cloud - Sub-User Permission Model
 *
 * A tenant_users doc is one of three roles:
 *   - 'owner'  - the Primary Admin created at tenant onboarding. Universal access, always.
 *   - 'admin'  - a Secondary Admin (promoted employee). Universal access, same as owner.
 *   - 'custom' - a Sub-User with an explicit per-module checklist (see PERMISSION_MODULES).
 *
 * Every module page/route in the checklist below must independently verify permission
 * server-side (see hasPermission) - the sidebar hiding a nav item is a UX nicety, not security.
 */

export const PERMISSION_MODULES = [
    { key: 'items', label: 'Items' },
    { key: 'clients', label: 'Clients' },
    { key: 'documents', label: 'Documents' },
    { key: 'templates', label: 'Templates' },
    { key: 'crm', label: 'CRM' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'purchases', label: 'Purchases & Vendors' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'accounting', label: 'Accounting' },
    { key: 'hr', label: 'HR' },
    { key: 'config', label: 'Config' },
];

export const PERMISSION_KEYS = PERMISSION_MODULES.map(m => m.key);

/** Groups in display order - Cloud has one flat group, but the shared admin
 *  preview component takes the same {group, modules} shape both products use. */
export const PERMISSION_GROUPS = [{ group: 'Workspace', modules: PERMISSION_MODULES }];

// Loud-in-dev parity check, mirroring connectPermissions.js. entitlements.js
// keeps its own ALL_MODULE_KEYS list (importing PERMISSION_KEYS back from here
// would be a circular import, since this file already imports from it). If the
// two disagree, a module can silently vanish from the admin entitlement preview
// or from every permission check depending on which list missed the update.
if (process.env.NODE_ENV !== 'production') {
    const a = [...PERMISSION_KEYS].sort();
    const b = [...ALL_MODULE_KEYS].sort();
    if (a.length !== b.length || a.some((k, i) => k !== b[i])) {
        console.error(
            '[permissions] PERMISSION_KEYS and cloud/entitlements.js\'s ALL_MODULE_KEYS have drifted apart. ' +
            `Permissions: [${a.join(', ')}]. Entitlements: [${b.join(', ')}]. ` +
            'Update both lists together whenever a module is added or removed.'
        );
    }
}

export function sanitizePermissions(raw) {
    const src = (raw && typeof raw === 'object') ? raw : {};
    const out = {};
    for (const key of PERMISSION_KEYS) out[key] = src[key] === true;
    return out;
}

export function defaultPermissions() {
    const out = {};
    for (const key of PERMISSION_KEYS) out[key] = false;
    return out;
}

/**
 * Server-side permission check - the single choke point both access axes flow
 * through.
 *
 * The TENANT ceiling is checked FIRST, deliberately BEFORE the owner/admin
 * bypass. That ordering is the whole point: owner and admin skip the per-user
 * checklist entirely, so a check placed after the bypass would leave every
 * tenant's own owner login reaching every module on every plan - which is
 * exactly the gap this closed. Mirrors connectPermissions.js's ordering.
 *
 * `user.entitlements` is the live `tenants.modules` doc, attached by
 * getCloudUser() (lib/cloudAuth.js) on every request rather than taken from the
 * JWT, so a tier change or a suspension takes effect on the tenant's next click
 * instead of at their next login. Absent entitlements means unrestricted - see
 * moduleAllowedForTenant().
 *
 * Then the per-USER axis: owner/admin always pass. A missing/legacy role
 * (undefined) is treated as 'owner' - every tenant_users doc created before
 * that feature existed represents the original single full-rights login.
 */
export function hasPermission(user, moduleKey) {
    if (!moduleAllowedForTenant(user?.entitlements, moduleKey)) return false;

    const role = user?.role || 'owner';
    if (role === 'owner' || role === 'admin') return true;
    return !!user?.permissions?.[moduleKey];
}

/**
 * Server-side route guard. Returns a 403 NextResponse if the caller lacks
 * `moduleKey`, or null if the call should proceed.
 */
export function permissionDenied(user, moduleKey) {
    if (hasPermission(user, moduleKey)) return null;

    // Distinguish "your plan does not include this" from "your account is not
    // allowed this", because they need different actions from the reader: one
    // is a conversation with VelBiz, the other with their own admin. Never
    // leaks anything beyond the tenant's own plan state.
    if (!moduleAllowedForTenant(user?.entitlements, moduleKey)) {
        return NextResponse.json({ error: planDeniedMessage(user?.entitlements), code: 'plan_restricted' }, { status: 403 });
    }
    return NextResponse.json({ error: 'You do not have permission to access this module.' }, { status: 403 });
}

/** Plain, non-punitive wording. A tenant reading this is usually not the person
 *  who owes the invoice, and a scolding error string helps nobody. */
function planDeniedMessage(entitlements) {
    const status = normalizeStatus(entitlements?.status);
    if (status === 'suspended') return 'This workspace is suspended. Please contact VelBiz support.';
    if (status === 'restricted') return 'This workspace is on a billing hold. Your existing records stay available to read and export. Please contact VelBiz to restore full access.';
    if (isTrialExpired(entitlements)) return 'Your trial has ended. Your existing records stay available to read and export. Upgrade to restore full access.';
    return 'This module is not included in your current plan.';
}

/**
 * Approval-threshold guard (Phase 8c). A 'custom' sub-user confirming/sending a
 * document over the tenant's configured threshold for that doc type is blocked - an
 * owner/admin performing the same action always passes, since their action *is* the
 * approval (no separate approval-request step exists yet).
 */
export function approvalBlocked(user, tenant, docTypeKey, grandTotal) {
    const role = user?.role || 'owner';
    if (role === 'owner' || role === 'admin') return null;
    const threshold = tenant?.approvalThresholds?.[docTypeKey];
    if (threshold === null || threshold === undefined) return null;
    if ((grandTotal || 0) <= threshold) return null;
    return NextResponse.json({
        error: `This ${docTypeKey.toUpperCase()} total (${grandTotal}) exceeds the ₹${threshold} approval threshold - an Admin must confirm/send it.`,
    }, { status: 403 });
}
