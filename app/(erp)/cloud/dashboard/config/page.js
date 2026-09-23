'use client';
import { useState, useEffect, useMemo } from 'react';
import { prepareLogo } from '@/lib/logoImage';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ThemePicker from '@/components/ThemePicker';
import IconPackPicker from '@/components/IconPackPicker';
import { SkeletonForm } from '@/components/ui/skeleton';
import {
    Building2, MapPin, Palette, FileText,
    ShieldCheck, Sparkles, Users, Upload, Trash2,
    Check, ArrowRight, ExternalLink, KeyRound, Lock,
    FileCheck2, ShieldAlert
} from 'lucide-react';
import { contact } from '@/config/site';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const PRESET_COLORS = [
    { label: 'Velvet Purple', hex: '#482683' },
    { label: 'Royal Violet', hex: '#6A3BB5' },
    { label: 'Deep Indigo', hex: '#2D1752' },
    { label: 'Emerald Teal', hex: '#0D9488' },
    { label: 'Midnight Blue', hex: '#1E3A8A' },
    { label: 'Ruby Crimson', hex: '#9F1239' },
    { label: 'Slate Charcoal', hex: '#334155' },
];

const SECTIONS = [
    { key: 'profile', label: 'Business Profile', icon: Building2, blurb: 'Legal business identity, company tags, and key contact person.' },
    { key: 'address', label: 'Address & GST', icon: MapPin, blurb: 'Official billing address, state jurisdiction, and GSTIN registration.' },
    { key: 'branding', label: 'Branding & Assets', icon: Palette, blurb: 'Brand logo, signatory signature, document prefix, and accent colors.' },
    { key: 'letterheads', label: 'Letterhead & Layout', icon: FileText, blurb: 'Custom letterhead sheets and PDF document layout options.' },
    { key: 'thresholds', label: 'Approval Limits', icon: ShieldCheck, blurb: 'Financial document approval thresholds for non-admin team members.' },
    { key: 'tax', label: 'Tax Profiles & Rates', icon: FileCheck2, blurb: 'Configure GST rates, HSN codes, and place-of-supply tax profiles.' },
    { key: 'appearance', label: 'Appearance', icon: Sparkles, blurb: 'Workspace color theme and navigation icon pack preferences.' },
    { key: 'security', label: 'Logins & Security', icon: Users, blurb: 'Account credentials and workspace authentication management.' },
];

const emptyForm = () => ({
    businessName: '',
    companyTag1: '',
    companyTag2: '',
    companyTag3: '',
    owner: '',
    email: '',
    phone: '',
    gstin: '',
    line1: '',
    city: '',
    state: '',
    pin: '',
    customHexColor: '#482683',
    docPrefix: 'DOC',
    letterheadPage1: '',
    letterheadPage2: '',
    useUploadedLetterhead: false,
    signatoryImage: '',
    brandLogo: '',
});

const emptyThresholds = () => ({ po: '', quote: '', invoice: '' });

const formSignature = (f, t) =>
    JSON.stringify({ f, t }, (k, v) => ((k === 'brandLogo' || k === 'signatoryImage') ? (v ? 'set' : '') : v));

export default function CloudConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('profile');
    const [savedSig, setSavedSig] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [thresholds, setThresholds] = useState(emptyThresholds);
    const [tenantInfo, setTenantInfo] = useState(null);

    // Password reset state
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdErr, setPwdErr] = useState('');

    const currentSig = useMemo(() => formSignature(form, thresholds), [form, thresholds]);
    const isDirty = savedSig !== null && currentSig !== savedSig;

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            fetch('/api/cloud/tenant-config').then(r => r.ok ? r.json() : null),
            fetch('/api/cloud/erp/config/approval-thresholds').then(r => r.ok ? r.json() : null),
        ]).then(([cfgData, threshData]) => {
            if (!isMounted) return;
            let initialForm = emptyForm();
            let initialThresh = emptyThresholds();

            if (cfgData?.tenant) {
                const t = cfgData.tenant;
                setTenantInfo(t);
                initialForm = {
                    businessName: t.businessName || '',
                    companyTag1: t.companyTag1 || '',
                    companyTag2: t.companyTag2 || '',
                    companyTag3: t.companyTag3 || '',
                    owner: t.contact?.owner || '',
                    email: t.contact?.email || '',
                    phone: t.contact?.phone || '',
                    gstin: t.contact?.gstin || '',
                    line1: t.contact?.address?.line1 || '',
                    city: t.contact?.address?.city || '',
                    state: t.contact?.address?.state || '',
                    pin: t.contact?.address?.pin || '',
                    customHexColor: t.branding?.customHexColor || '#482683',
                    docPrefix: t.branding?.docPrefix || 'DOC',
                    letterheadPage1: t.branding?.letterheadPage1 || '',
                    letterheadPage2: t.branding?.letterheadPage2 || '',
                    useUploadedLetterhead: !!t.branding?.useUploadedLetterhead,
                    signatoryImage: t.branding?.signatoryImage || '',
                    brandLogo: t.branding?.brandLogo || '',
                };
            }

            if (threshData?.thresholds) {
                initialThresh = {
                    po: threshData.thresholds.po ?? '',
                    quote: threshData.thresholds.quote ?? '',
                    invoice: threshData.thresholds.invoice ?? '',
                };
            }

            setForm(initialForm);
            setThresholds(initialThresh);
            setSavedSig(formSignature(initialForm, initialThresh));
            setLoading(false);
        }).catch(() => {
            if (isMounted) setLoading(false);
        });

        return () => { isMounted = false; };
    }, []);

    function readFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    }

    async function handleFileChange(field, file) {
        if (!file) return;
        try {
            const raw = await readFile(file);
            /* Same normalisation the hospital panel applies - see
               src/lib/logoImage.js for why a baked-in white backdrop cannot be
               corrected downstream in CSS. */
            const prepared = field === 'brandLogo' ? await prepareLogo(raw) : { dataUrl: raw };
            setForm(prev => ({ ...prev, [field]: prepared.dataUrl }));
            toast.success(prepared.removedBackdrop
                ? 'Brand Logo updated. Its solid background was made transparent so it sits cleanly on every theme.'
                : `${field === 'brandLogo' ? 'Brand Logo' : 'Signatory Signature'} updated.`);
        } catch {
            toast.error('Failed to read image file.');
        }
    }

    async function handleSaveAll(e) {
        if (e) e.preventDefault();
        if (!form.businessName.trim()) {
            toast.error('Business Name is required.');
            setActiveSection('profile');
            return;
        }

        setSaving(true);
        const tenantPayload = {
            businessName: form.businessName,
            companyTag1: form.companyTag1,
            companyTag2: form.companyTag2,
            companyTag3: form.companyTag3,
            contact: {
                owner: form.owner,
                email: form.email,
                phone: form.phone,
                gstin: form.gstin,
                address: {
                    line1: form.line1,
                    city: form.city,
                    state: form.state,
                    pin: form.pin,
                },
            },
            branding: {
                customHexColor: form.customHexColor,
                docPrefix: form.docPrefix,
                letterheadPage1: form.letterheadPage1,
                letterheadPage2: form.letterheadPage2,
                useUploadedLetterhead: form.useUploadedLetterhead,
                signatoryImage: form.signatoryImage,
                brandLogo: form.brandLogo,
            },
        };

        try {
            const [cfgRes, threshRes] = await Promise.all([
                fetch('/api/cloud/tenant-config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tenantPayload),
                }),
                fetch('/api/cloud/erp/config/approval-thresholds', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(thresholds),
                }),
            ]);

            if (!cfgRes.ok) {
                const errData = await cfgRes.json();
                throw new Error(errData.error || 'Failed to save tenant configuration.');
            }
            if (!threshRes.ok) {
                const errData = await threshRes.json();
                throw new Error(errData.error || 'Failed to save approval thresholds.');
            }

            setSavedSig(formSignature(form, thresholds));
            toast.success('All workspace settings saved successfully!');
        } catch (err) {
            toast.error(err.message || 'Error saving workspace configuration.');
        } finally {
            setSaving(false);
        }
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        setPwdErr('');
        if (pwdForm.newPassword.length < 8) {
            setPwdErr('New password must be at least 8 characters long.');
            return;
        }
        setPwdSaving(true);
        try {
            const res = await fetch('/api/cloud/account/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pwdForm),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Password updated successfully!');
                setPwdForm({ currentPassword: '', newPassword: '' });
            } else {
                setPwdErr(data.error || 'Failed to change password.');
            }
        } catch {
            setPwdErr('Network error. Please try again.');
        } finally {
            setPwdSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="vcfg-page">
                <SkeletonForm fields={8} />
            </div>
        );
    }

    return (
        <div className="vcfg-page">
            {/* Header Title */}
            <div className="vcfg-head">
                <h1 className="vcfg-head__title">
                    <Building2 size={24} className="vcfg-head__icon" aria-hidden="true" />
                    Workspace Settings &amp; Configuration
                </h1>
                <p className="vcfg-head__subtitle">
                    Manage business entity information, branding assets, financial limits, and workspace preferences.
                </p>
            </div>

            <div className="vcfg-body">
                {/* Left: Navigation Menu */}
                <nav className="vcfg-nav" aria-label="Settings navigation">
                    <div className="vcfg-navgroup">
                        <div className="vcfg-navheader">Organization</div>
                        {SECTIONS.slice(0, 4).map(s => {
                            const Icon = s.icon;
                            const isActive = activeSection === s.key;
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    className={`vcfg-navitem ${isActive ? 'is-active' : ''}`}
                                    onClick={() => setActiveSection(s.key)}
                                    aria-current={isActive ? 'true' : undefined}
                                >
                                    <Icon size={16} aria-hidden="true" />
                                    <span>{s.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="vcfg-navgroup">
                        <div className="vcfg-navheader">Finance &amp; Governance</div>
                        {SECTIONS.slice(4, 6).map(s => {
                            const Icon = s.icon;
                            const isActive = activeSection === s.key;
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    className={`vcfg-navitem ${isActive ? 'is-active' : ''}`}
                                    onClick={() => setActiveSection(s.key)}
                                    aria-current={isActive ? 'true' : undefined}
                                >
                                    <Icon size={16} aria-hidden="true" />
                                    <span>{s.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="vcfg-navgroup">
                        <div className="vcfg-navheader">System &amp; Workspace</div>
                        {SECTIONS.slice(6).map(s => {
                            const Icon = s.icon;
                            const isActive = activeSection === s.key;
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    className={`vcfg-navitem ${isActive ? 'is-active' : ''}`}
                                    onClick={() => setActiveSection(s.key)}
                                    aria-current={isActive ? 'true' : undefined}
                                >
                                    <Icon size={16} aria-hidden="true" />
                                    <span>{s.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Right: Content Panel */}
                <main className="vcfg-content">
                    {/* 1. Business Profile */}
                    {activeSection === 'profile' && (
                        <div className="vcfg-card">
                            <h2 className="vcfg-card__title">
                                <Building2 size={18} aria-hidden="true" />
                                Business Profile
                            </h2>
                            <p className="vcfg-card__blurb">
                                Legal business identity, registered trade name, and key contact details printed on quotes and invoices.
                            </p>

                            <div className="vcfg-sub vcfg-sub--first">Entity Details</div>
                            <div className="vcfg-grid">
                                <div className="vcfg-span">
                                    <label className="vcfg-label" htmlFor="cfg-bizname">Legal Business Name *</label>
                                    <input
                                        id="cfg-bizname"
                                        className="vcfg-input"
                                        value={form.businessName}
                                        onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
                                        placeholder="e.g. Sri Lakshmi Traders Private Limited"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-tag1">Company Tagline 1</label>
                                    <input
                                        id="cfg-tag1"
                                        className="vcfg-input"
                                        value={form.companyTag1}
                                        onChange={e => setForm(p => ({ ...p, companyTag1: e.target.value }))}
                                        placeholder="e.g. Authorized Enterprise Partner"
                                    />
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-tag2">Company Tagline 2</label>
                                    <input
                                        id="cfg-tag2"
                                        className="vcfg-input"
                                        value={form.companyTag2}
                                        onChange={e => setForm(p => ({ ...p, companyTag2: e.target.value }))}
                                        placeholder="e.g. ISO 9001:2015 Certified"
                                    />
                                </div>
                                <div className="vcfg-span">
                                    <label className="vcfg-label" htmlFor="cfg-tag3">Company Tagline 3</label>
                                    <input
                                        id="cfg-tag3"
                                        className="vcfg-input"
                                        value={form.companyTag3}
                                        onChange={e => setForm(p => ({ ...p, companyTag3: e.target.value }))}
                                        placeholder="e.g. Serving over 500+ Hospital &amp; Diagnostic Networks"
                                    />
                                </div>
                            </div>

                            <div className="vcfg-sub">Key Contact</div>
                            <div className="vcfg-grid">
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-owner">Contact Person / Owner</label>
                                    <input
                                        id="cfg-owner"
                                        className="vcfg-input"
                                        value={form.owner}
                                        onChange={e => setForm(p => ({ ...p, owner: e.target.value }))}
                                        placeholder="e.g. Rajesh Kumar"
                                    />
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-phone">Official Phone</label>
                                    <input
                                        id="cfg-phone"
                                        className="vcfg-input"
                                        value={form.phone}
                                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                        placeholder={contact.phonePlaceholder}
                                    />
                                </div>
                                <div className="vcfg-span">
                                    <label className="vcfg-label" htmlFor="cfg-email">Official Email</label>
                                    <input
                                        id="cfg-email"
                                        type="email"
                                        className="vcfg-input"
                                        value={form.email}
                                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                        placeholder="billing@yourcompany.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Address & GST */}
                    {activeSection === 'address' && (
                        <div className="vcfg-card">
                            <h2 className="vcfg-card__title">
                                <MapPin size={18} aria-hidden="true" />
                                Official Address &amp; GST Details
                            </h2>
                            <p className="vcfg-card__blurb">
                                Primary operating address and tax identifier used for state tax breakdown (CGST + SGST vs IGST).
                            </p>

                            <div className="vcfg-sub vcfg-sub--first">Registered Address</div>
                            <div className="vcfg-grid">
                                <div className="vcfg-span">
                                    <label className="vcfg-label" htmlFor="cfg-addr1">Street Address</label>
                                    <input
                                        id="cfg-addr1"
                                        className="vcfg-input"
                                        value={form.line1}
                                        onChange={e => setForm(p => ({ ...p, line1: e.target.value }))}
                                        placeholder="Door / Flat / Building No., Street name"
                                    />
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-city">City</label>
                                    <input
                                        id="cfg-city"
                                        className="vcfg-input"
                                        value={form.city}
                                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                                        placeholder="e.g. Chennai"
                                    />
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-state">State / UT</label>
                                    <select
                                        id="cfg-state"
                                        className="vcfg-input"
                                        value={form.state}
                                        onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                                    >
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-pin">Postal PIN Code</label>
                                    <input
                                        id="cfg-pin"
                                        className="vcfg-input"
                                        value={form.pin}
                                        onChange={e => setForm(p => ({ ...p, pin: e.target.value }))}
                                        placeholder="e.g. 600001"
                                    />
                                </div>
                            </div>

                            <div className="vcfg-sub">Tax Identification</div>
                            <div className="vcfg-grid">
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-gstin">GSTIN (15-character Tax ID)</label>
                                    <input
                                        id="cfg-gstin"
                                        className="vcfg-input"
                                        value={form.gstin}
                                        onChange={e => setForm(p => ({ ...p, gstin: e.target.value.toUpperCase().slice(0, 15) }))}
                                        placeholder="e.g. 33AAAAA0000A1Z5"
                                    />
                                    <p className="vcfg-hint">Determines the Place of Supply when issuing intra-state vs inter-state tax invoices.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Branding & Assets */}
                    {activeSection === 'branding' && (
                        <div className="vcfg-card">
                            <h2 className="vcfg-card__title">
                                <Palette size={18} aria-hidden="true" />
                                Branding Assets &amp; Document Identity
                            </h2>
                            <p className="vcfg-card__blurb">
                                Custom logo, digital signatory signature, numbering prefixes, and accent colors for PDF exports.
                            </p>

                            <div className="vcfg-sub vcfg-sub--first">Brand Assets</div>
                            <div className="vcfg-grid">
                                <div>
                                    <label className="vcfg-label">Brand Logo (PNG / JPEG / SVG)</label>
                                    <div className="vcfg-upload">
                                        {form.brandLogo ? (
                                            <div className="vcfg-logorow">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={form.brandLogo} alt="Logo preview" className="vcfg-logo-preview" />
                                                <button
                                                    type="button"
                                                    className="vcfg-btn-remove"
                                                    onClick={() => setForm(p => ({ ...p, brandLogo: '' }))}
                                                >
                                                    <Trash2 size={14} aria-hidden="true" /> Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="vcfg-uploadtrigger">
                                                <Upload size={18} aria-hidden="true" />
                                                <span>Upload Brand Logo</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={e => handleFileChange('brandLogo', e.target.files?.[0])}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="vcfg-label">Authorised Signatory Signature</label>
                                    <div className="vcfg-upload">
                                        {form.signatoryImage ? (
                                            <div className="vcfg-logorow">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={form.signatoryImage} alt="Signature preview" className="vcfg-logo-preview" />
                                                <button
                                                    type="button"
                                                    className="vcfg-btn-remove"
                                                    onClick={() => setForm(p => ({ ...p, signatoryImage: '' }))}
                                                >
                                                    <Trash2 size={14} aria-hidden="true" /> Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="vcfg-uploadtrigger">
                                                <Upload size={18} aria-hidden="true" />
                                                <span>Upload Signature (Transparent PNG)</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={e => handleFileChange('signatoryImage', e.target.files?.[0])}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="vcfg-sub">Document Prefix &amp; Colors</div>
                            <div className="vcfg-grid">
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-prefix">Document Code Prefix</label>
                                    <input
                                        id="cfg-prefix"
                                        className="vcfg-input"
                                        value={form.docPrefix}
                                        maxLength={10}
                                        onChange={e => setForm(p => ({ ...p, docPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                                        placeholder="e.g. DOC or INV"
                                    />
                                    <p className="vcfg-hint">Documents are numbered {form.docPrefix || 'DOC'}-0001, {form.docPrefix || 'DOC'}-0002, etc.</p>
                                </div>

                                <div>
                                    <label className="vcfg-label">Brand Accent Color</label>
                                    <div className="vcfg-colorrow">
                                        <input
                                            type="color"
                                            className="vcfg-swatch"
                                            value={form.customHexColor}
                                            onChange={e => setForm(p => ({ ...p, customHexColor: e.target.value }))}
                                            aria-label="Pick custom brand color"
                                        />
                                        <input
                                            type="text"
                                            className="vcfg-input"
                                            style={{ maxWidth: '120px' }}
                                            value={form.customHexColor}
                                            onChange={e => setForm(p => ({ ...p, customHexColor: e.target.value }))}
                                        />
                                    </div>
                                    <div className="vcfg-color-presets">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c.hex}
                                                type="button"
                                                className="vcfg-color-dot"
                                                style={{ backgroundColor: c.hex }}
                                                onClick={() => setForm(p => ({ ...p, customHexColor: c.hex }))}
                                                title={c.label}
                                                aria-label={c.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Letterheads & Documents */}
                    {activeSection === 'letterheads' && (
                        <div className="vcfg-card">
                            <h2 className="vcfg-card__title">
                                <FileText size={18} aria-hidden="true" />
                                Letterhead Sheets &amp; Layout
                            </h2>
                            <p className="vcfg-card__blurb">
                                Use pre-printed background letterheads for quotes, delivery challans, purchase orders, and commercial invoices.
                            </p>

                            <div className="vcfg-sub vcfg-sub--first">Letterhead Images</div>
                            <div className="vcfg-grid">
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-lh1">Page 1 Letterhead Image URL</label>
                                    <input
                                        id="cfg-lh1"
                                        className="vcfg-input"
                                        value={form.letterheadPage1}
                                        onChange={e => setForm(p => ({ ...p, letterheadPage1: e.target.value }))}
                                        placeholder="https://.../letterhead-page1.png"
                                    />
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="cfg-lh2">Page 2+ Continuation Letterhead URL</label>
                                    <input
                                        id="cfg-lh2"
                                        className="vcfg-input"
                                        value={form.letterheadPage2}
                                        onChange={e => setForm(p => ({ ...p, letterheadPage2: e.target.value }))}
                                        placeholder="https://.../letterhead-continuation.png"
                                    />
                                </div>
                                <div className="vcfg-span">
                                    <label className="vcfg-check">
                                        <input
                                            type="checkbox"
                                            checked={form.useUploadedLetterhead}
                                            onChange={e => setForm(p => ({ ...p, useUploadedLetterhead: e.target.checked }))}
                                        />
                                        <span>Use Uploaded Letterhead Image as PDF Background (suppresses default digital header)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Approval Limits */}
                    {activeSection === 'thresholds' && (
                        <div className="vcfg-card">
                            <h2 className="vcfg-card__title">
                                <ShieldCheck size={18} aria-hidden="true" />
                                Financial Approval Limits &amp; Thresholds
                            </h2>
                            <p className="vcfg-card__blurb">
                                Set spending and quotation caps. When a non-admin team member issues or finalizes a document exceeding these limits, explicit Admin authorization is required.
                            </p>

                            <div className="vcfg-sub vcfg-sub--first">Document Approval Thresholds</div>
                            <div className="vcfg-grid">
                                <div>
                                    <label className="vcfg-label" htmlFor="thresh-po">Purchase Orders Threshold (Rs)</label>
                                    <input
                                        id="thresh-po"
                                        type="number"
                                        className="vcfg-input"
                                        value={thresholds.po}
                                        onChange={e => setThresholds(p => ({ ...p, po: e.target.value }))}
                                        placeholder="Unlimited"
                                    />
                                    <p className="vcfg-hint">Leave blank or empty for unlimited approval.</p>
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="thresh-quote">Quotations Threshold (Rs)</label>
                                    <input
                                        id="thresh-quote"
                                        type="number"
                                        className="vcfg-input"
                                        value={thresholds.quote}
                                        onChange={e => setThresholds(p => ({ ...p, quote: e.target.value }))}
                                        placeholder="Unlimited"
                                    />
                                    <p className="vcfg-hint">Quotes exceeding this value require admin sign-off before sending.</p>
                                </div>
                                <div>
                                    <label className="vcfg-label" htmlFor="thresh-inv">Tax Invoices Threshold (Rs)</label>
                                    <input
                                        id="thresh-inv"
                                        type="number"
                                        className="vcfg-input"
                                        value={thresholds.invoice}
                                        onChange={e => setThresholds(p => ({ ...p, invoice: e.target.value }))}
                                        placeholder="Unlimited"
                                    />
                                    <p className="vcfg-hint">Invoices over this threshold require admin validation to finalize.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 6. Tax Profiles & Rates */}
                    {activeSection === 'tax' && (
                        <div className="vcfg-card">
                            <h2 className="vcfg-card__title">
                                <FileCheck2 size={18} aria-hidden="true" />
                                Tax Profiles &amp; GST Configuration
                            </h2>
                            <p className="vcfg-card__blurb">
                                Manage goods &amp; services tax rates (CGST, SGST, IGST), HSN/SAC codes, and tax-exempt classifications.
                            </p>

                            <div className="vcfg-tax-banner">
                                <div>
                                    <h3 className="vcfg-tax-banner__title">Dedicated Tax Profiles Manager</h3>
                                    <p className="vcfg-tax-banner__desc">
                                        Configure customized tax slabs (0%, 5%, 12%, 18%, 28%) and custom tax calculation formulas across product lines.
                                    </p>
                                </div>
                                <Link href="/cloud/dashboard/config/tax-profiles" className="vcfg-btn-link">
                                    <span>Open Tax Profiles</span>
                                    <ExternalLink size={15} aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 7. Appearance & Workspace */}
                    {activeSection === 'appearance' && (
                        <div className="vcfg-card">
                            <h2 className="vcfg-card__title">
                                <Sparkles size={18} aria-hidden="true" />
                                Workspace Appearance &amp; Visual Style
                            </h2>
                            <p className="vcfg-card__blurb">
                                Select your workspace color palette and choose the sidebar navigation icon style.
                            </p>

                            <div className="vcfg-sub vcfg-sub--first">Theme System</div>
                            <ThemePicker apiBase="/api/cloud/theme" />

                            <div className="vcfg-sub" style={{ marginTop: '28px' }}>Sidebar Icon Pack</div>
                            <IconPackPicker />
                        </div>
                    )}

                    {/* 8. Logins & Security */}
                    {activeSection === 'security' && (
                        <div className="vcfg-card">
                            <h2 className="vcfg-card__title">
                                <Users size={18} aria-hidden="true" />
                                Account &amp; Credentials
                            </h2>
                            <p className="vcfg-card__blurb">
                                Review your active tenant identifiers and update account authentication password.
                            </p>

                            <div className="vcfg-sub vcfg-sub--first">Tenant Credentials</div>
                            <div className="vcfg-grid">
                                <div>
                                    <label className="vcfg-label">Tenant ID</label>
                                    <input
                                        className="vcfg-input"
                                        value={tenantInfo?.tenantId || 'Active Workspace'}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="vcfg-label">Account Status</label>
                                    <div className="vcfg-badge-active">
                                        <Check size={14} aria-hidden="true" /> Active Business Workspace
                                    </div>
                                </div>
                            </div>

                            <div className="vcfg-sub">Update Password</div>
                            <form onSubmit={handlePasswordChange} className="vcfg-pwd-form">
                                {pwdErr && (
                                    <div className="vcfg-error-box" role="alert">
                                        <ShieldAlert size={15} aria-hidden="true" />
                                        <span>{pwdErr}</span>
                                    </div>
                                )}
                                <div className="vcfg-grid">
                                    <div>
                                        <label className="vcfg-label" htmlFor="cfg-currpwd">Current Password</label>
                                        <input
                                            id="cfg-currpwd"
                                            type="password"
                                            className="vcfg-input"
                                            value={pwdForm.currentPassword}
                                            onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
                                            placeholder="Enter current password"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="vcfg-label" htmlFor="cfg-newpwd">New Password (8+ characters)</label>
                                        <input
                                            id="cfg-newpwd"
                                            type="password"
                                            className="vcfg-input"
                                            value={pwdForm.newPassword}
                                            onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                                            placeholder="Enter new secure password"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                                    <button
                                        type="submit"
                                        className="vcfg-btn-action"
                                        disabled={pwdSaving}
                                    >
                                        <KeyRound size={15} aria-hidden="true" />
                                        <span>{pwdSaving ? 'Updating...' : 'Update Password'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Sticky Save Bar */}
                    <div className="vcfg-save">
                        <span className="vcfg-save__state">
                            {isDirty ? 'You have unsaved changes.' : 'All workspace settings are up to date.'}
                        </span>
                        <button
                            type="button"
                            className="vcfg-save__btn"
                            disabled={!isDirty || saving}
                            onClick={handleSaveAll}
                            id="vcfg-save-btn"
                        >
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </main>
            </div>

            <style>{`
                .vcfg-page {
                    max-width: 100%;
                    width: 100%;
                    margin: 0;
                    padding-bottom: 40px;
                }

                .vcfg-head {
                    margin-bottom: 24px;
                }
                .vcfg-head__title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 22px;
                    font-weight: 800;
                    color: var(--secondary-color, #2d1752);
                    margin: 0;
                }
                .vcfg-head__icon {
                    color: var(--primary-color, #482683);
                }
                .vcfg-head__subtitle {
                    font-size: 13.5px;
                    color: var(--text-muted, #64748b);
                    margin: 6px 0 0;
                    line-height: 1.5;
                }

                .vcfg-body {
                    display: grid;
                    grid-template-columns: 240px minmax(0, 1fr);
                    gap: 24px;
                    align-items: start;
                }

                .vcfg-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    position: sticky;
                    top: 84px;
                }
                .vcfg-navgroup {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .vcfg-navheader {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--text-muted, #64748b);
                    padding: 0 10px 4px;
                }
                .vcfg-navitem {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 12px;
                    border-radius: var(--border-radius, 10px);
                    border: 1px solid transparent;
                    background: none;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 13.5px;
                    font-weight: 600;
                    text-align: left;
                    color: var(--text-main, #333333);
                    min-height: 40px;
                    transition: background 0.15s ease, color 0.15s ease;
                }
                .vcfg-navitem:hover {
                    background: rgba(72, 38, 131, 0.06);
                    color: var(--primary-color, #482683);
                }
                .vcfg-navitem.is-active {
                    background: rgba(72, 38, 131, 0.12);
                    color: var(--primary-color, #482683);
                    border-color: rgba(72, 38, 131, 0.25);
                    font-weight: 700;
                }
                .vcfg-navitem svg { flex-shrink: 0; }

                .vcfg-card {
                    background: var(--bg-white, #ffffff);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-radius: 14px;
                    padding: 28px 32px;
                    box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.04));
                }
                .vcfg-card__title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 17px;
                    font-weight: 800;
                    color: var(--secondary-color, #2d1752);
                    margin: 0;
                }
                .vcfg-card__blurb {
                    font-size: 13px;
                    color: var(--text-muted, #64748b);
                    margin: 6px 0 24px;
                    line-height: 1.5;
                }

                .vcfg-sub {
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--primary-color, #482683);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                    margin: 28px 0 16px;
                }
                .vcfg-sub--first { margin-top: 0; }

                .vcfg-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 18px;
                }
                .vcfg-span { grid-column: 1 / -1; }

                .vcfg-label {
                    display: block;
                    font-size: 11.5px;
                    font-weight: 700;
                    color: var(--text-muted, #475569);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 6px;
                }
                .vcfg-input {
                    width: 100%;
                    padding: 11px 14px;
                    box-sizing: border-box;
                    border: 1.5px solid #cbd5e1;
                    border-radius: var(--border-radius, 8px);
                    font-size: 13.5px;
                    font-family: inherit;
                    outline: none;
                    background: var(--bg-white, #ffffff);
                    color: var(--text-main, #1e293b);
                    transition: border-color 0.15s ease, box-shadow 0.15s ease;
                }
                .vcfg-input:focus {
                    border-color: var(--primary-color, #482683);
                    box-shadow: 0 0 0 3px rgba(72, 38, 131, 0.12);
                }
                .vcfg-input:disabled {
                    background: #f8fafc;
                    color: #64748b;
                    cursor: not-allowed;
                }
                .vcfg-hint {
                    font-size: 11px;
                    color: var(--text-muted, #64748b);
                    margin: 5px 0 0;
                    line-height: 1.45;
                }

                .vcfg-check {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 13.5px;
                    font-weight: 600;
                    color: var(--text-main, #333333);
                    cursor: pointer;
                }
                .vcfg-check input {
                    width: 17px;
                    height: 17px;
                    cursor: pointer;
                }

                .vcfg-colorrow {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .vcfg-swatch {
                    width: 44px;
                    height: 44px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 8px;
                    padding: 2px;
                    cursor: pointer;
                }
                .vcfg-color-presets {
                    display: flex;
                    gap: 8px;
                    margin-top: 10px;
                }
                .vcfg-color-dot {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    border: 1.5px solid rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                    transition: transform 0.15s ease;
                }
                .vcfg-color-dot:hover {
                    transform: scale(1.15);
                }

                .vcfg-upload {
                    border: 1.5px dashed #cbd5e1;
                    border-radius: 10px;
                    padding: 14px 18px;
                    background: #f8fafc;
                }
                .vcfg-logorow {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .vcfg-logo-preview {
                    height: 44px;
                    width: auto;
                    max-width: 140px;
                    object-fit: contain;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    background: #ffffff;
                    padding: 4px 8px;
                }
                .vcfg-uploadtrigger {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    width: 100%;
                    color: var(--primary-color, #482683);
                    font-size: 13px;
                    font-weight: 700;
                    min-height: 32px;
                }
                .vcfg-btn-remove {
                    background: #fef2f2;
                    border: 1px solid #fca5a5;
                    color: #b91c1c;
                    border-radius: 6px;
                    padding: 6px 12px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .vcfg-tax-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    background: #f5f3f9;
                    border: 1px solid rgba(72, 38, 131, 0.2);
                    border-radius: 12px;
                    padding: 20px 24px;
                }
                .vcfg-tax-banner__title {
                    font-size: 15px;
                    font-weight: 800;
                    color: var(--secondary-color, #2d1752);
                    margin: 0 0 4px;
                }
                .vcfg-tax-banner__desc {
                    font-size: 13px;
                    color: var(--text-muted, #64748b);
                    margin: 0;
                    line-height: 1.45;
                }
                .vcfg-btn-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--primary-color, #482683);
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 700;
                    padding: 10px 18px;
                    border-radius: 8px;
                    white-space: nowrap;
                    transition: background 0.15s ease;
                }
                .vcfg-btn-link:hover {
                    background: var(--secondary-color, #2d1752);
                }

                .vcfg-badge-active {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #ecfdf5;
                    color: #047857;
                    border: 1px solid #a7f3d0;
                    padding: 8px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                }

                .vcfg-btn-action {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--primary-color, #482683);
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 18px;
                    font-size: 13.5px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }
                .vcfg-btn-action:hover:not(:disabled) {
                    background: var(--secondary-color, #2d1752);
                }
                .vcfg-btn-action:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                .vcfg-error-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #fef2f2;
                    border: 1px solid #f87171;
                    color: #b91c1c;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    margin-bottom: 16px;
                }

                /* Sticky Save Bar */
                .vcfg-save {
                    position: sticky;
                    bottom: 16px;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    margin-top: 28px;
                    padding: 14px 22px;
                    background: var(--bg-white, #ffffff);
                    border: 1.5px solid rgba(72, 38, 131, 0.25);
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(72, 38, 131, 0.12);
                }
                .vcfg-save__state {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-muted, #64748b);
                }
                .vcfg-save__btn {
                    padding: 11px 26px;
                    background: var(--primary-color, #482683);
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-weight: 800;
                    font-size: 14px;
                    font-family: inherit;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(72, 38, 131, 0.25);
                    transition: background 0.15s ease;
                }
                .vcfg-save__btn:hover:not(:disabled) {
                    background: var(--secondary-color, #2d1752);
                }
                .vcfg-save__btn:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                @media (max-width: 900px) {
                    .vcfg-body { grid-template-columns: 1fr; }
                    .vcfg-nav {
                        position: static;
                        flex-direction: row;
                        overflow-x: auto;
                        gap: 6px;
                        padding-bottom: 6px;
                    }
                    .vcfg-navitem { width: auto; flex-shrink: 0; }
                }
                @media (max-width: 640px) {
                    .vcfg-card { padding: 20px 16px; }
                    .vcfg-grid { grid-template-columns: 1fr; }
                    .vcfg-save { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </div>
    );
}
