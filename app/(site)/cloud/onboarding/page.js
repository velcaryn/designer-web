'use client';

/**
 * VelBiz Cloud onboarding: a two-step signup wizard.
 *
 * Migrated from the Velcaryn Cloud onboarding screen. Its client-side
 * validation is carried across unchanged, because it is genuinely good:
 * it checks the phone and email shapes and the GSTIN layout before
 * anything is sent, so a person is told what is wrong while they are
 * still looking at the field.
 *
 * The source had a third step asking for a document prefix and a brand
 * colour. Both were setup preferences for an account that does not exist
 * yet, and asking for them before anyone has agreed to anything is two
 * more screens of friction in front of a signup. They are settings, not
 * signup questions, and belong wherever the account is actually
 * configured.
 *
 * WHAT CHANGED IN THE MOVE
 *
 * The source screen was dark violet glass with a Cormorant heading, to
 * match a sign-in page that is not part of this migration. It is rebuilt
 * here on this site's tokens: light card, one hard shadow, the two locked
 * radii. Its styles moved out of an inline `<style>` block and into the
 * `.cld-onb-*` rules in app/claudelanding.css, so the whole route obeys
 * the same cascade as every other page.
 *
 * `normalizePhone` was a one-function import from the source repo's
 * src/lib/phone.js. It is inlined below rather than given a lib/ of its
 * own for a single caller.
 *
 * WHERE A SUBMISSION GOES
 *
 * To app/api/cloud/onboarding/route.js, which formats it and forwards it
 * to Telegram. The route exists because the bot token is a bearer
 * credential: posting to Telegram from here would put the token in the
 * client bundle for anyone to read. The honeypot and the load timestamp
 * are sent along so the route can apply the same bot checks the original
 * server route used.
 *
 * The source repo posted to a route of the same path that also needed
 * MongoDB, a rate limiter and a tiers library. None of that came across;
 * ours only validates, formats and forwards.
 */
import '../../claudelanding.css';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, ArrowLeft } from '@phosphor-icons/react';

const BIZ_TYPES = [
    'Manufacturing',
    'Distribution',
    'Services',
    'Retail',
    'Healthcare',
    'Other',
];

const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Lakshadweep', 'Puducherry',
];

const STEPS = ['Business', 'Address'];

/* Inlined from the source repo's src/lib/phone.js. Strips spaces and
   punctuation and puts a bare ten-digit number into +91 form, so the
   value that leaves this page is shaped the same way every time. */
function normalizePhone(value) {
    const digits = String(value || '').replace(/[^\d+]/g, '');
    if (!digits) return '';
    if (digits.startsWith('+')) return digits;
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return digits;
}

/**
 * Posts the compiled submission to our own API route, which is what
 * talks to Telegram. Throws on any non-2xx so the caller shows the error
 * line rather than a success panel over a submission that never landed.
 */
async function submitOnboarding(payload) {
    const res = await fetch('/api/cloud/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed.');
    }

    return res.json();
}

export default function CloudOnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    /* Both bot signals from the source route: a honeypot field no human
       sees, and how long the form was open before it was submitted.

       Set in an effect, which is the only place a timestamp may be taken:
       Date.now() during render is impure and the lint rule rejects it.
       That leaves the ref at 0 until after mount, so the submit path
       below must never send that 0 through. A submission carrying _t: 0
       fails the server's plausibility gate, and that gate answers 200
       and sends nothing, so the visitor would read "You are on the list"
       over a submission that never reached Telegram. */
    const formLoadedAt = useRef(0);
    useEffect(() => {
        formLoadedAt.current = Date.now();
    }, []);

    const [form, setForm] = useState({
        businessName: '', ownerName: '', businessType: 'Retail',
        email: '', phone: '',
        addressLine1: '', addressLine2: '', city: '', state: '', pin: '',
        gstin: '',
        bot_trap: '',
    });

    const set = (k, v) => {
        setForm((p) => ({ ...p, [k]: v }));
        if (error) setError('');
    };

    function validateStep1() {
        if (!form.businessName.trim()) return 'Business name is required.';
        if (!form.ownerName.trim()) return 'Owner or contact name is required.';
        const cleanPhone = form.phone.replace(/\s+/g, '');
        if (!/^(?:\+91)?[0-9]{10}$/.test(cleanPhone)) {
            return 'Phone must be 10 digits, optionally starting with +91.';
        }
        if (!form.email.trim()) return 'Email is required.';
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'That email does not look right.';
        return null;
    }

    function validateStep2() {
        if (!form.addressLine1.trim()) return 'Address line 1 is required.';
        if (!form.city.trim()) return 'City is required.';
        if (!form.state) return 'State is required.';
        if (!form.pin.trim()) return 'PIN code is required.';
        if (
            form.gstin
            && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
                .test(form.gstin.toUpperCase())
        ) {
            return 'That GSTIN does not look right.';
        }
        return null;
    }

    function handleNext() {
        const err = validateStep1();
        if (err) { setError(err); return; }
        setStep(2);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const err = validateStep2();
        if (err) { setError(err); return; }

        setLoading(true);
        try {
            await submitOnboarding({
                businessName: form.businessName.trim(),
                ownerName: form.ownerName.trim(),
                businessType: form.businessType,
                email: form.email.trim().toLowerCase(),
                phone: normalizePhone(form.phone),
                address: {
                    line1: form.addressLine1.trim(),
                    line2: form.addressLine2.trim(),
                    city: form.city.trim(),
                    state: form.state,
                    pin: form.pin.trim(),
                },
                gstin: form.gstin.toUpperCase().trim(),
                bot_trap: form.bot_trap,
                /* Falls back to now if the effect has not run. A human
                   who has typed a whole form has self-evidently been on
                   the page, so the honest reading of a missing timestamp
                   is "unknown", not "instant". Sending 0 would silently
                   bin a real signup. */
                _t: formLoadedAt.current || Date.now(),
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'That did not go through. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <main className="cld-onb">
                <div className="cld-onb__card cld-onb__card--done">
                    <span className="cld-onb__tick" aria-hidden="true">
                        <CheckCircle size={30} weight="fill" />
                    </span>
                    <h1 className="cld-onb__title">You are on the list.</h1>
                    <p className="cld-onb__sub">
                        We have your details for {form.businessName.trim()}. We
                        will be in touch to set the account up and walk you
                        through it.
                    </p>
                    <div className="cld-onb__doneActions">
                        <Link href="/cloud" className="nv-btn nv-btn--primary">
                            Back to Cloud
                        </Link>
                        <Link href="/" className="nv-btn nv-btn--ghost">
                            Go to the home page
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="cld-onb">
            <div className="cld-onb__card">
                <Link href="/cloud" className="cld-onb__back">
                    <ArrowLeft size={14} weight="bold" />
                    VelBiz Cloud
                </Link>

                <h1 className="cld-onb__title">Set up your account.</h1>
                <p className="cld-onb__sub">
                    Two short steps. Nothing is charged today.
                </p>

                {/* The step indicator is a list, so a screen reader hears
                    three items and which one is current, rather than three
                    unlabelled coloured bars. */}
                <ol className="cld-onb__steps">
                    {STEPS.map((label, i) => {
                        const n = i + 1;
                        const state = n === step ? ' is-active' : n < step ? ' is-done' : '';
                        return (
                            <li
                                key={label}
                                className={`cld-onb__step${state}`}
                                aria-current={n === step ? 'step' : undefined}
                            >
                                <span className="cld-onb__stepNum">{n}</span>
                                {label}
                            </li>
                        );
                    })}
                </ol>

                <form className="cld-onb__form" onSubmit={handleSubmit} noValidate>
                    {/* Honeypot. Hidden from sight and from the a11y tree,
                        and skipped by the tab order: only a bot fills it. */}
                    <input
                        type="text"
                        name="bot_trap"
                        className="cld-onb__trap"
                        value={form.bot_trap}
                        onChange={(e) => set('bot_trap', e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                    />

                    {step === 1 && (
                        <div className="cld-onb__grid">
                            <Field label="Business name" id="ob-biz">
                                <input
                                    id="ob-biz" type="text" className="cld-onb__input"
                                    value={form.businessName}
                                    onChange={(e) => set('businessName', e.target.value)}
                                    placeholder="Anbu Traders" autoComplete="organization"
                                />
                            </Field>
                            <Field label="Owner or contact name" id="ob-owner">
                                <input
                                    id="ob-owner" type="text" className="cld-onb__input"
                                    value={form.ownerName}
                                    onChange={(e) => set('ownerName', e.target.value)}
                                    placeholder="Full name" autoComplete="name"
                                />
                            </Field>
                            <Field label="What kind of business" id="ob-type">
                                <select
                                    id="ob-type" className="cld-onb__input"
                                    value={form.businessType}
                                    onChange={(e) => set('businessType', e.target.value)}
                                >
                                    {BIZ_TYPES.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </Field>
                            <Field label="Phone" id="ob-phone">
                                <input
                                    id="ob-phone" type="tel" className="cld-onb__input"
                                    value={form.phone}
                                    onChange={(e) => set('phone', e.target.value)}
                                    onBlur={() => set('phone', normalizePhone(form.phone))}
                                    placeholder="10 digits, or +91 then 10 digits"
                                    autoComplete="tel"
                                />
                            </Field>
                            <Field label="Email" id="ob-email" wide>
                                <input
                                    id="ob-email" type="email" className="cld-onb__input"
                                    value={form.email}
                                    onChange={(e) => set('email', e.target.value)}
                                    placeholder="you@yourbusiness.com" autoComplete="email"
                                />
                            </Field>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="cld-onb__grid">
                            <Field label="Address line 1" id="ob-a1" wide>
                                <input
                                    id="ob-a1" type="text" className="cld-onb__input"
                                    value={form.addressLine1}
                                    onChange={(e) => set('addressLine1', e.target.value)}
                                    autoComplete="address-line1"
                                />
                            </Field>
                            <Field label="Address line 2" id="ob-a2" optional wide>
                                <input
                                    id="ob-a2" type="text" className="cld-onb__input"
                                    value={form.addressLine2}
                                    onChange={(e) => set('addressLine2', e.target.value)}
                                    autoComplete="address-line2"
                                />
                            </Field>
                            <Field label="City" id="ob-city">
                                <input
                                    id="ob-city" type="text" className="cld-onb__input"
                                    value={form.city}
                                    onChange={(e) => set('city', e.target.value)}
                                    autoComplete="address-level2"
                                />
                            </Field>
                            <Field label="State" id="ob-state">
                                <select
                                    id="ob-state" className="cld-onb__input"
                                    value={form.state}
                                    onChange={(e) => set('state', e.target.value)}
                                >
                                    <option value="">Choose a state</option>
                                    {STATES.map((st) => <option key={st}>{st}</option>)}
                                </select>
                            </Field>
                            <Field label="PIN code" id="ob-pin">
                                <input
                                    id="ob-pin" type="text" inputMode="numeric"
                                    className="cld-onb__input" value={form.pin}
                                    onChange={(e) => set('pin', e.target.value)}
                                    autoComplete="postal-code" maxLength={6}
                                />
                            </Field>
                            <Field label="GSTIN" id="ob-gstin" optional>
                                <input
                                    id="ob-gstin" type="text" className="cld-onb__input"
                                    value={form.gstin}
                                    onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                                    placeholder="33ABCDE1234F1Z5" maxLength={15}
                                />
                            </Field>
                        </div>
                    )}

                    {error && (
                        <p className="cld-onb__error" role="alert">{error}</p>
                    )}

                    <div className="cld-onb__actions">
                        {step > 1 && (
                            <button
                                type="button"
                                className="nv-btn nv-btn--ghost"
                                onClick={() => { setError(''); setStep(step - 1); }}
                            >
                                <ArrowLeft size={16} weight="bold" />
                                Back
                            </button>
                        )}

                        {step < 2 ? (
                            <button
                                type="button"
                                className="nv-btn nv-btn--primary"
                                onClick={handleNext}
                            >
                                Continue
                                <ArrowRight size={16} weight="bold" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="nv-btn nv-btn--primary"
                                disabled={loading}
                            >
                                {loading ? 'Sending' : 'Finish setup'}
                                {!loading && <ArrowRight size={16} weight="bold" />}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </main>
    );
}

function Field({ label, id, children, hint, optional, wide }) {
    return (
        <p className={`cld-onb__field${wide ? ' cld-onb__field--wide' : ''}`}>
            <label htmlFor={id} className="cld-onb__label">
                {label}
                {optional && <span className="cld-onb__optional">Optional</span>}
            </label>
            {children}
            {hint && <span className="cld-onb__hint">{hint}</span>}
        </p>
    );
}
