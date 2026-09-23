'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ClientControlShell, { ControlBanner, ControlField, ControlSection } from '@/components/admin/ClientControlShell';
import ModuleAccessPreview from '@/components/admin/ModuleAccessPreview';
import {
    TIERS, PROFILES, SUBSCRIPTION_STATUSES,
    cycleModuleOverride, entitledModules, isTrialExpired,
} from '@/lib/cloud/entitlements';

const BIZ_TYPES = ['Manufacturing', 'Distribution', 'Services', 'Retail', 'Healthcare', 'Other'];

/**
 * VelBiz Cloud admin - Cloud tenant control surface.
 *
 * Every control here writes to `tenants`, and the tenant's portal re-reads that
 * doc on EVERY API call (see getCloudUser in src/lib/cloudAuth.js), so a change
 * saved on this page takes effect on the tenant's next click rather than at
 * their next login. That is what makes the plan panel a real lever instead of
 * an annotation.
 *
 * Scope is deliberately access only - plan, seats, status, credentials. This
 * page never surfaces a tenant's business content (their leads, documents,
 * payroll). Controlling what a client can REACH does not require reading what
 * they have WRITTEN, and conflating the two turns an admin console into a
 * standing privacy liability.
 */
/* Small roster action. This page is light-themed (ccs-*), unlike the Connect
   client page, so it gets its own palette rather than sharing a constant. */
const MODAL_BACKDROP = {
    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
};

const MODAL_CARD = {
    background: '#ffffff', border: '1px solid #e2e8f0', padding: '22px',
    borderRadius: '12px', width: '420px', maxWidth: 'calc(100vw - 32px)',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)',
};

const ROSTER_BTN = {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#ffffff',
    color: '#475569',
    border: '1px solid #e2e8f0',
};

export default function EditClientPage({ params }) {
    const router = useRouter();
    const { id } = React.use(params);

    const [client, setClient] = useState(null);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // The entitlement set last confirmed saved (or loaded). Baseline for the
    // "this will remove access" diff below - mirrors the Connect page.
    const [savedModules, setSavedModules] = useState(null);
    const [pendingSave, setPendingSave] = useState(null);
    const [resetPwFor, setResetPwFor] = useState(null);
    const [resetPwValue, setResetPwValue] = useState('');
    const [rosterBusy, setRosterBusy] = useState(false);
    const [showWipeModal, setShowWipeModal] = useState(false);
    const [wipeConfirm, setWipeConfirm] = useState('');
    const [wipeIncludeOwner, setWipeIncludeOwner] = useState(false);

    const [form, setForm] = useState({
        businessName: '', ownerName: '', businessType: '', phone: '', email: '',
        addressLine1: '', addressLine2: '', city: '', state: '', pin: '', gstin: '',
        docPrefix: '', brandColor: '#4A1088',
        letterheadPage1: '', letterheadPage2: '', useUploadedLetterhead: false,
        subscriptionStatus: 'active', subscriptionTier: 'free_trial', trialEndsAt: '',
        profile: 'general', moduleOverrides: {},
        adminSeatLimit: '', subUserSeatLimit: '',
        username: '', password: '',
    });

    useEffect(() => {
        fetch(`/api/admin/cloud/tenants/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    toast.error(data.error);
                    router.push('/admin/cloud');
                    return;
                }
                const c = data.client;
                const u = data.user;
                const m = c.modules || null;
                setClient(c);
                setTeam(data.team || []);
                setSavedModules(m);
                setForm({
                    businessName: c.businessName || '',
                    businessType: c.businessType || 'Other',
                    ownerName: c.contact?.owner || '',
                    phone: c.contact?.phone || '',
                    email: c.contact?.email || '',
                    addressLine1: c.contact?.address?.line1 || '',
                    addressLine2: c.contact?.address?.line2 || '',
                    city: c.contact?.address?.city || '',
                    state: c.contact?.address?.state || '',
                    pin: c.contact?.address?.pin || '',
                    gstin: c.contact?.gstin || '',
                    docPrefix: c.branding?.docPrefix || '',
                    brandColor: c.branding?.customHexColor || '#4A1088',
                    letterheadPage1: c.branding?.letterheadPage1 || '',
                    letterheadPage2: c.branding?.letterheadPage2 || '',
                    useUploadedLetterhead: !!c.branding?.useUploadedLetterhead,
                    subscriptionStatus: c.subscription?.status || 'active',
                    subscriptionTier: c.subscription?.tier || 'free_trial',
                    trialEndsAt: c.subscription?.trialEndsAt ? new Date(c.subscription.trialEndsAt).toISOString().split('T')[0] : '',
                    profile: m?.profile || 'general',
                    moduleOverrides: m?.moduleOverrides || {},
                    adminSeatLimit: c.subscription?.adminSeatLimit ?? '',
                    subUserSeatLimit: c.subscription?.subUserSeatLimit ?? '',
                    username: u?.username || '',
                    password: '',
                });
            })
            .catch(() => toast.error('Failed to load client details'))
            .finally(() => setLoading(false));
    }, [id, router]);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    /** What the tenant's portal will resolve to under the CURRENT form state. */
    const draftEntitlements = useMemo(() => ({
        tier: form.subscriptionTier,
        profile: form.profile,
        status: form.subscriptionStatus,
        trialEndsAt: form.trialEndsAt || null,
        moduleOverrides: form.moduleOverrides,
    }), [form.subscriptionTier, form.profile, form.subscriptionStatus, form.trialEndsAt, form.moduleOverrides]);

    /**
     * Modules the tenant can reach today but would lose on save. Computed
     * against the last SAVED state, not the last render, so it answers the only
     * question that matters at the moment of saving: "what breaks for them now?"
     * A tenant with no saved plan is unrestricted, so everything not in the new
     * set is a removal - which is exactly the case worth warning hardest about.
     */
    const losingAccess = useMemo(() => {
        const before = entitledModules(savedModules
            ? { ...savedModules, status: client?.subscription?.status, trialEndsAt: client?.subscription?.trialEndsAt }
            : null);
        const after = entitledModules(draftEntitlements) || [];
        const beforeList = before || (entitledModules({ tier: 'premium_command_tier', profile: 'general', status: 'active', moduleOverrides: {} }) || []);
        return beforeList.filter(k => !after.includes(k));
    }, [savedModules, draftEntitlements, client]);

    async function submit() {
        setError('');
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/cloud/tenants/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: form.businessName.trim(),
                    businessType: form.businessType,
                    ownerName: form.ownerName.trim(),
                    phone: form.phone.trim(),
                    email: form.email.trim(),
                    address: {
                        line1: form.addressLine1.trim(), line2: form.addressLine2.trim(),
                        city: form.city.trim(), state: form.state.trim(), pin: form.pin.trim(),
                    },
                    gstin: form.gstin.trim(),
                    docPrefix: form.docPrefix.trim(),
                    brandColor: form.brandColor,
                    letterheadPage1: form.letterheadPage1.trim(),
                    letterheadPage2: form.letterheadPage2.trim(),
                    useUploadedLetterhead: form.useUploadedLetterhead,
                    subscriptionStatus: form.subscriptionStatus,
                    subscriptionTier: form.subscriptionTier,
                    trialEndsAt: form.trialEndsAt,
                    modules: {
                        tier: form.subscriptionTier,
                        profile: form.profile,
                        status: form.subscriptionStatus,
                        moduleOverrides: form.moduleOverrides,
                    },
                    ...(form.adminSeatLimit !== '' ? { adminSeatLimit: Number(form.adminSeatLimit) } : {}),
                    ...(form.subUserSeatLimit !== '' ? { subUserSeatLimit: Number(form.subUserSeatLimit) } : {}),
                    username: form.username.trim(),
                    password: form.password,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to update client.');
            } else {
                toast.success('Saved. The change is live for this client immediately.');
                setSavedModules({
                    tier: form.subscriptionTier, profile: form.profile,
                    status: form.subscriptionStatus, moduleOverrides: form.moduleOverrides,
                });
                setForm(p => ({ ...p, password: '' }));
            }
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
            setPendingSave(null);
        }
    }

    function handleSave(e) {
        e?.preventDefault();
        // Removing access is the one action here a client will notice within
        // minutes, so it gets an explicit confirmation naming what breaks.
        if (losingAccess.length > 0) {
            setPendingSave(true);
            return;
        }
        submit();
    }

    if (loading) return <div style={{ padding: '40px' }}>Loading client workspace settings...</div>;
    if (!client) return null;

    async function handleDeleteUser(t) {
        if (!window.confirm(`Delete the login "${t.username}"?\n\nThey are signed out immediately and cannot sign in again. The username is freed for reuse.`)) return;
        setRosterBusy(true);
        try {
            const res = await fetch(`/api/admin/cloud/tenants/${id}/users/${t._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setTeam(prev => prev.filter(x => x._id !== t._id));
            else alert(data.error || 'Failed to delete.');
        } catch {
            alert('Error deleting user.');
        } finally {
            setRosterBusy(false);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        if (!resetPwFor) return;
        setRosterBusy(true);
        try {
            const res = await fetch(`/api/admin/cloud/tenants/${id}/users/${resetPwFor._id}/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: resetPwValue }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`Password updated for ${resetPwFor.username}. They have been signed out of any existing session.`);
                setResetPwFor(null);
                setResetPwValue('');
            } else {
                alert(data.error || 'Failed to reset password.');
            }
        } catch {
            alert('Error resetting password.');
        } finally {
            setRosterBusy(false);
        }
    }

    async function handleWipeUsers(e) {
        e.preventDefault();
        setRosterBusy(true);
        try {
            const res = await fetch(`/api/admin/cloud/tenants/${id}/users`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: wipeConfirm, includeOwner: wipeIncludeOwner }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`${data.deleted} login${data.deleted === 1 ? '' : 's'} deleted.`);
                setShowWipeModal(false);
                setWipeConfirm('');
                setTeam(prev => wipeIncludeOwner ? [] : prev.filter(x => x.role === 'owner'));
                setWipeIncludeOwner(false);
            } else {
                alert(data.error || 'Failed to delete users.');
            }
        } catch {
            alert('Error deleting users.');
        } finally {
            setRosterBusy(false);
        }
    }

    const adminSeats = team.filter(t => t.role === 'owner' || t.role === 'admin').length;
    const subSeats = team.filter(t => t.role === 'custom').length;
    const adminLimit = form.adminSeatLimit === '' ? (client.subscription?.adminSeatLimit ?? null) : Number(form.adminSeatLimit);
    const subLimit = form.subUserSeatLimit === '' ? (client.subscription?.subUserSeatLimit ?? null) : Number(form.subUserSeatLimit);
    const overAdmin = adminLimit !== null && adminSeats > adminLimit;
    const overSub = subLimit !== null && subSeats > subLimit;

    const sections = [
        {
            key: 'plan',
            label: 'Plan & Access',
            group: 'Entitlements',
            description: 'What this client can reach. Saved changes apply to their portal on their next request, without a re-login.',
            badge: losingAccess.length || undefined,
            badgeTone: 'warn',
            render: () => (
                <>
                    {form.subscriptionStatus === 'suspended' && (
                        <ControlBanner tone="danger" title="Workspace suspended">
                            This client cannot log in at all, and any session already open stops working on its next request.
                        </ControlBanner>
                    )}
                    {form.subscriptionStatus === 'restricted' && (
                        <ControlBanner tone="warn" title="Billing hold in effect">
                            The client keeps access to their own clients, documents, items, templates and settings, so they can still read and export their records and correct their billing details. Everything else is withheld.
                        </ControlBanner>
                    )}
                    {isTrialExpired(draftEntitlements) && form.subscriptionStatus === 'active' && (
                        <ControlBanner tone="warn" title="Trial has ended">
                            This workspace is on the free trial and the end date has passed, so it is already behaving as a billing hold. Move them to a paid tier to restore full access.
                        </ControlBanner>
                    )}

                    <ControlSection title="Subscription">
                        <div className="ccs-grid">
                            <ControlField label="Status" hint={SUBSCRIPTION_STATUSES.find(s => s.key === form.subscriptionStatus)?.description}>
                                <select className="ccs-select" value={form.subscriptionStatus} onChange={e => set('subscriptionStatus', e.target.value)}>
                                    {SUBSCRIPTION_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                </select>
                            </ControlField>
                            <ControlField label="Plan tier" hint={TIERS.find(t => t.key === form.subscriptionTier)?.description}>
                                <select className="ccs-select" value={form.subscriptionTier} onChange={e => set('subscriptionTier', e.target.value)}>
                                    {TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                </select>
                            </ControlField>
                            <ControlField label="Trial ends" hint="Only meaningful on the Free Trial tier. Ignored on a paid plan.">
                                <input type="date" className="ccs-input" value={form.trialEndsAt} onChange={e => set('trialEndsAt', e.target.value)} />
                            </ControlField>
                            <ControlField label="Business vertical" hint={PROFILES.find(p => p.key === form.profile)?.description}>
                                <select className="ccs-select" value={form.profile} onChange={e => set('profile', e.target.value)}>
                                    {PROFILES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                </select>
                            </ControlField>
                        </div>
                    </ControlSection>

                    <ControlSection title="Resolved module access">
                        <p className="ccs-hint" style={{ marginBottom: '12px' }}>
                            Click any module to override the plan for this client alone. Each click cycles: plan default, then forced on, then forced off, then back to plan default.
                        </p>
                        <ModuleAccessPreview
                            entitlements={draftEntitlements}
                            onToggleOverride={key => set('moduleOverrides', cycleModuleOverride(form.moduleOverrides, key))}
                        />
                    </ControlSection>
                </>
            ),
        },
        {
            key: 'seats',
            label: 'Team & Seats',
            group: 'Entitlements',
            description: 'How many login-enabled accounts this client may create, and who currently holds one.',
            badge: team.length,
            badgeTone: (overAdmin || overSub) ? 'warn' : undefined,
            render: () => (
                <>
                    {(overAdmin || overSub) && (
                        <ControlBanner tone="warn" title="Over the seat limit">
                            This client already holds more seats than the limit allows. Existing accounts keep working, the limit only blocks creating new ones, so raise the limit or ask them to deactivate an account.
                        </ControlBanner>
                    )}
                    <ControlSection title="Seat limits">
                        <div className="ccs-grid">
                            <ControlField label="Admin seats" hint={`${adminSeats} in use. Owner and admin accounts, which reach every module.`}>
                                <input type="number" min="0" className="ccs-input" value={form.adminSeatLimit}
                                    onChange={e => set('adminSeatLimit', e.target.value)}
                                    placeholder={`Plan default (${client.subscription?.adminSeatLimit ?? '-'})`} />
                            </ControlField>
                            <ControlField label="Sub-user seats" hint={`${subSeats} in use. Custom accounts with a per-module checklist.`}>
                                <input type="number" min="0" className="ccs-input" value={form.subUserSeatLimit}
                                    onChange={e => set('subUserSeatLimit', e.target.value)}
                                    placeholder={`Plan default (${client.subscription?.subUserSeatLimit ?? '-'})`} />
                            </ControlField>
                        </div>
                    </ControlSection>

                    <ControlSection title="Current roster">
                        {team.length === 0 && <div className="ccs-hint">No users yet.</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {team.map(t => (
                                <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12.5px', flexWrap: 'wrap', border: '1px solid #f1f5f9' }}>
                                    <span style={{ fontWeight: 700, color: '#0f172a', minWidth: '110px' }}>{t.name || t.username}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', background: t.role === 'owner' ? '#ede9fe' : t.role === 'admin' ? '#dbeafe' : '#f1f5f9', color: t.role === 'owner' ? '#4A1088' : t.role === 'admin' ? '#1d4ed8' : '#475569' }}>{t.role}</span>
                                    <span style={{ color: t.active ? '#166534' : '#991b1b', fontWeight: 600 }}>{t.active ? 'active' : 'inactive'}</span>
                                    {t.role === 'custom' && t.permissions && (
                                        <span style={{ color: '#64748b' }}>
                                            {Object.entries(t.permissions).filter(([, v]) => v).map(([k]) => k).join(', ') || 'no modules granted'}
                                        </span>
                                    )}
                                    <span style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                        <button type="button" disabled={rosterBusy} onClick={() => { setResetPwFor(t); setResetPwValue(''); }} style={ROSTER_BTN}>Reset password</button>
                                        {t.role !== 'owner' && (
                                            <button type="button" disabled={rosterBusy} onClick={() => handleDeleteUser(t)} style={{ ...ROSTER_BTN, color: '#991b1b', borderColor: '#fecaca', background: '#fef2f2' }}>Delete</button>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="ccs-hint" style={{ marginTop: '12px' }}>
                            A client manages their own staff from their workspace, and their per-user grants still sit under the plan ceiling set above. Resetting a password or deleting a login here signs that person out immediately.
                        </p>
                        {team.length > 0 && (
                            <button type="button" onClick={() => setShowWipeModal(true)} style={{ ...ROSTER_BTN, marginTop: '10px', color: '#991b1b', borderColor: '#fecaca', background: '#fef2f2', padding: '6px 12px' }}>
                                Delete every login for this client
                            </button>
                        )}
                    </ControlSection>
                </>
            ),
        },
        {
            key: 'profile',
            label: 'Business Profile',
            group: 'Client record',
            description: 'Identity and contact details for this workspace.',
            render: () => (
                <ControlSection>
                    <div className="ccs-grid">
                        <ControlField label="Business / company name">
                            <input className="ccs-input" value={form.businessName} onChange={e => set('businessName', e.target.value)} />
                        </ControlField>
                        <ControlField label="Business type">
                            <select className="ccs-select" value={form.businessType} onChange={e => set('businessType', e.target.value)}>
                                {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </ControlField>
                        <ControlField label="Owner / contact name">
                            <input className="ccs-input" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
                        </ControlField>
                        <ControlField label="Phone number">
                            <input className="ccs-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
                        </ControlField>
                        <ControlField label="Email address">
                            <input className="ccs-input" value={form.email} onChange={e => set('email', e.target.value)} />
                        </ControlField>
                        <ControlField label="GSTIN">
                            <input className="ccs-input" value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} />
                        </ControlField>
                        <ControlField label="Address line 1" wide>
                            <input className="ccs-input" value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} />
                        </ControlField>
                        <ControlField label="Address line 2" wide>
                            <input className="ccs-input" value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} />
                        </ControlField>
                        <ControlField label="City">
                            <input className="ccs-input" value={form.city} onChange={e => set('city', e.target.value)} />
                        </ControlField>
                        <ControlField label="State">
                            <input className="ccs-input" value={form.state} onChange={e => set('state', e.target.value)} />
                        </ControlField>
                        <ControlField label="PIN code">
                            <input className="ccs-input" value={form.pin} onChange={e => set('pin', e.target.value)} />
                        </ControlField>
                    </div>
                </ControlSection>
            ),
        },
        {
            key: 'branding',
            label: 'Documents & Branding',
            group: 'Client record',
            description: "How this client's generated documents look.",
            render: () => (
                <>
                    <ControlSection title="Document identity">
                        <div className="ccs-grid">
                            <ControlField label="Document prefix" hint="Appears on every generated document number, for example APX-0142.">
                                <input className="ccs-input" value={form.docPrefix} onChange={e => set('docPrefix', e.target.value.toUpperCase())} />
                            </ControlField>
                            <ControlField label="Brand theme colour">
                                <input type="color" className="ccs-input" style={{ height: '40px', padding: '4px' }} value={form.brandColor} onChange={e => set('brandColor', e.target.value)} />
                            </ControlField>
                        </div>
                    </ControlSection>
                    <ControlSection title="Letterhead">
                        <ControlField>
                            <label className="ccs-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.useUploadedLetterhead} onChange={e => set('useUploadedLetterhead', e.target.checked)} />
                                Use an uploaded letterhead background
                            </label>
                        </ControlField>
                        {form.useUploadedLetterhead && (
                            <div className="ccs-grid" style={{ marginTop: '12px' }}>
                                <ControlField label="Page 1 background URL" wide hint="A4 size.">
                                    <input className="ccs-input" value={form.letterheadPage1} onChange={e => set('letterheadPage1', e.target.value)} />
                                </ControlField>
                                <ControlField label="Page 2 and later background URL" wide>
                                    <input className="ccs-input" value={form.letterheadPage2} onChange={e => set('letterheadPage2', e.target.value)} />
                                </ControlField>
                            </div>
                        )}
                    </ControlSection>
                </>
            ),
        },
        {
            key: 'credentials',
            label: 'Primary Login',
            group: 'Client record',
            description: 'The owner account created at onboarding. Staff logins are managed by the client.',
            render: () => (
                <>
                    <ControlBanner tone="info" title="Password resets are one-way">
                        Setting a password here replaces the client&apos;s current one immediately. It is never displayed back afterwards, so send it to the client through a channel they already trust and ask them to change it.
                    </ControlBanner>
                    <ControlSection>
                        <div className="ccs-grid">
                            <ControlField label="Login username" hint="Lowercase letters, numbers and hyphens only.">
                                <input className="ccs-input" value={form.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
                            </ControlField>
                            <ControlField label="Reset password" hint="Leave empty to keep the current password.">
                                <input type="text" className="ccs-input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Type a new password to override" />
                            </ControlField>
                        </div>
                    </ControlSection>
                </>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="dashboard-header">
                <button onClick={() => router.back()} className="ccs-btn ccs-btn--ghost" style={{ marginBottom: '16px' }}>Back</button>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#2d1752' }}>Manage SaaS Client</h1>
                <p style={{ color: '#6c757d' }}>
                    Access, plan and credentials for <strong>{client.businessName}</strong>
                </p>
            </div>

            <ClientControlShell
                sections={sections}
                footer={
                    <>
                        {error && (
                            <div style={{ marginTop: '18px', color: '#b91c1c', fontSize: '13px', padding: '12px 15px', background: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca', fontWeight: 600 }}>
                                {error}
                            </div>
                        )}

                        {pendingSave && (
                            <div style={{ marginTop: '18px' }}>
                                <ControlBanner tone="danger" title="This will remove access">
                                    Saving takes these modules away from the client straight away:{' '}
                                    <strong>{losingAccess.join(', ')}</strong>. Anyone using them loses them on their next click.
                                </ControlBanner>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" className="ccs-btn ccs-btn--danger" onClick={submit} disabled={saving}>
                                        {saving ? 'Saving...' : 'Yes, remove access and save'}
                                    </button>
                                    <button type="button" className="ccs-btn ccs-btn--ghost" onClick={() => setPendingSave(null)} disabled={saving}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {!pendingSave && (
                            <div className="ccs-actions">
                                <button type="button" className="ccs-btn ccs-btn--primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save changes'}
                                </button>
                                <button type="button" className="ccs-btn ccs-btn--ghost" onClick={() => router.back()} disabled={saving}>
                                    Cancel
                                </button>
                                <span className="ccs-actions-note">Every change is recorded in the audit log against your account.</span>
                            </div>
                        )}
                    </>
                }
            />

            {resetPwFor && (
                <div style={MODAL_BACKDROP}>
                    <div style={MODAL_CARD}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Reset password</h3>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
                            For <strong>{resetPwFor.username}</strong>. They will be signed out of any session they already have open.
                        </p>
                        <form onSubmit={handleResetPassword}>
                            <input
                                required
                                type="text"
                                autoComplete="new-password"
                                className="ccs-input"
                                value={resetPwValue}
                                onChange={e => setResetPwValue(e.target.value)}
                                placeholder="At least 12 characters"
                            />
                            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '8px 0 0' }}>
                                Shown in plain text so you can read it out. Ask them to change it after signing in.
                            </p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                                <button type="submit" className="ccs-btn ccs-btn--primary" disabled={rosterBusy}>
                                    {rosterBusy ? 'Saving...' : 'Set password'}
                                </button>
                                <button type="button" className="ccs-btn ccs-btn--ghost" onClick={() => { setResetPwFor(null); setResetPwValue(''); }} disabled={rosterBusy}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showWipeModal && (
                <div style={MODAL_BACKDROP}>
                    <div style={MODAL_CARD}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px', color: '#991b1b' }}>Delete every login for this client</h3>
                        <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
                            Everyone is signed out immediately and nobody can sign back in. The workspace, its documents and its billing are not touched, and you can create new logins afterwards.
                        </p>
                        <form onSubmit={handleWipeUsers}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155', marginBottom: '14px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={wipeIncludeOwner} onChange={e => setWipeIncludeOwner(e.target.checked)} style={{ marginTop: '2px' }} />
                                <span>Include the primary admin. Leaves this client with no way to sign in at all.</span>
                            </label>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                                Type <code style={{ color: '#991b1b' }}>{id}</code> to confirm
                            </label>
                            <input required className="ccs-input" value={wipeConfirm} onChange={e => setWipeConfirm(e.target.value)} style={{ fontFamily: 'monospace' }} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                                <button type="submit" className="ccs-btn ccs-btn--danger" disabled={rosterBusy || wipeConfirm !== id}>
                                    {rosterBusy ? 'Deleting...' : 'Delete logins'}
                                </button>
                                <button type="button" className="ccs-btn ccs-btn--ghost" onClick={() => { setShowWipeModal(false); setWipeConfirm(''); setWipeIncludeOwner(false); }} disabled={rosterBusy}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
