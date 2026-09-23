/**
 * VelBiz Cloud - Subscription Tiers & Seat Limits
 *
 * Seat limits gate how many login-enabled tenant_users a tenant may create:
 *   - "admin seats" = role 'owner' + role 'admin' (universal-access users)
 *   - "sub-user seats" = role 'custom' (per-module checklist users)
 *
 * Limits are stored per-tenant on `tenants.subscription.{adminSeatLimit,subUserSeatLimit}`
 * so an individual tenant can be granted a manual override without changing the tier map.
 */

export const TIER_SEATS = {
    free_trial: { adminSeatLimit: 1, subUserSeatLimit: 2 },
    core_workspace: { adminSeatLimit: 2, subUserSeatLimit: 5 },
    premium_command_tier: { adminSeatLimit: 5, subUserSeatLimit: 20 },
};

export function seatLimitsForTier(tier) {
    return TIER_SEATS[tier] || TIER_SEATS.free_trial;
}

export const TIER_KEYS = Object.keys(TIER_SEATS);
