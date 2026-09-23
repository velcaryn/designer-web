'use client';
import { PERMISSION_GROUPS as groups } from '@/lib/permissions';
import { moduleEntitlementReason, PROFILES as profiles } from '@/lib/cloud/entitlements';

/**
 * Renders exactly what a client's plan + facility profile resolves to, one
 * chip per module, styled by WHY it resolved that way. Pure - derives every
 * chip from moduleEntitlementReason(), the same reasoning
 * moduleAllowedForTenant() (the actual gate every page/API route calls) uses
 * internally - so this can never show something the client's real sidebar
 * disagrees with. That guarantee is what makes it trustworthy as a demo
 * surface: "this is exactly what their sidebar and dashboard will show."
 *
 * Used on the tenant edit screen in the admin area.
 *
 * Pass `onToggleOverride(moduleKey)` to make chips clickable (cycles a
 * module through: plan-default -> forced on -> forced off -> plan-default).
 * Omit it for a read-only preview.
 */
export default function ModuleAccessPreview({ entitlements, onToggleOverride }) {
    const editable = typeof onToggleOverride === 'function';
    const profileLabel = profiles.find(p => p.key === entitlements?.profile)?.label || 'General';

    // "Excluded" is every reason that means the module will NOT appear for the
    // tenant. Derived from the same reason codes the chips render, so the count
    // can never disagree with the chips sitting under it.
    const EXCLUDED = ['hidden-by-profile', 'not-in-plan', 'override-off', 'restricted', 'trial-expired', 'suspended'];
    const included = groups.reduce((sum, g) => sum + g.modules.filter(m => !EXCLUDED.includes(moduleEntitlementReason(entitlements, m.key))).length, 0);
    const total = groups.reduce((sum, g) => sum + g.modules.length, 0);

    return (
        <div className="map-wrap">
            <div className="map-summary">
                This is exactly what {profileLabel}&apos;s sidebar and dashboard will show - {included} of {total} modules.
            </div>
            {groups.map(g => (
                <div key={g.group} className="map-group">
                    <div className="map-group-label">{g.group}</div>
                    <div className="map-chip-row">
                        {g.modules.map(m => {
                            const reason = moduleEntitlementReason(entitlements, m.key);
                            return (
                                <button
                                    key={m.key}
                                    type="button"
                                    className={`map-chip map-chip--${reason}`}
                                    onClick={editable ? () => onToggleOverride(m.key) : undefined}
                                    disabled={!editable}
                                    title={CHIP_TITLE[reason]}
                                >
                                    {m.label}
                                    {reason === 'vertical' && <span className="map-chip-tag">Vertical core</span>}
                                    {reason === 'not-in-plan' && <span className="map-chip-tag">Upgrade to unlock</span>}
                                    {reason === 'hidden-by-profile' && <span className="map-chip-tag">Not applicable</span>}
                                    {reason === 'restricted' && <span className="map-chip-tag">Billing hold</span>}
                                    {reason === 'trial-expired' && <span className="map-chip-tag">Trial ended</span>}
                                    {reason === 'suspended' && <span className="map-chip-tag">Suspended</span>}
                                    {(reason === 'override-on' || reason === 'override-off') && <span className="map-chip-tag">Manual override</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            <style>{`
                .map-wrap { display: flex; flex-direction: column; gap: 14px; }
                .map-summary { font-size: 12.5px; color: #6b7280; font-weight: 600; }
                .map-group-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
                .map-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
                .map-chip {
                    display: inline-flex; align-items: center; gap: 6px;
                    font-size: 11.5px; font-weight: 700; padding: 5px 10px;
                    border-radius: 999px; border: 1.5px solid transparent;
                    font-family: inherit; cursor: default;
                }
                button.map-chip:not(:disabled) { cursor: pointer; }
                .map-chip:disabled { cursor: default; }

                .map-chip--plan, .map-chip--always, .map-chip--suite, .map-chip--unrestricted {
                    color: #166534; background: #dcfce7; border-color: #bbf7d0;
                }
                .map-chip--vertical, .map-chip--override-on {
                    color: #6d28d9; background: #ede9fe; border-color: #ddd6fe;
                }
                .map-chip--not-in-plan {
                    color: #b45309; background: #fef3c7; border-color: #fde68a;
                }
                .map-chip--hidden-by-profile, .map-chip--override-off {
                    color: #94a3b8; background: #f1f5f9; border-color: #e2e8f0; text-decoration: line-through;
                }
                /* Billing states read as a deliberate hold, not as "not applicable" -
                   red rather than grey, so an admin scanning the grid can tell at a
                   glance that these came back off because of money, not configuration. */
                .map-chip--restricted, .map-chip--trial-expired, .map-chip--suspended {
                    color: #b91c1c; background: #fee2e2; border-color: #fecaca; text-decoration: line-through;
                }
                .map-chip-tag { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.85; text-decoration: none; }
            `}</style>
        </div>
    );
}

const CHIP_TITLE = {
    plan: 'Included by the selected plan',
    always: 'Every client manages its own settings, regardless of plan',
    unrestricted: 'No plan set - unrestricted',
    vertical: 'Granted by the facility profile, regardless of plan',
    'not-in-plan': 'Applicable to this profile but not included in the selected tier',
    'hidden-by-profile': 'Not meaningful for this facility profile',
    'override-on': 'Manually forced ON by VelBiz staff, overriding plan and profile',
    'override-off': 'Manually forced OFF by VelBiz staff, overriding plan and profile',
    restricted: 'Withheld while this workspace is on a billing hold. Their own records stay readable and exportable.',
    'trial-expired': 'Withheld because the trial has ended. Their own records stay readable and exportable.',
    suspended: 'This workspace is suspended - no access at all.',
};
