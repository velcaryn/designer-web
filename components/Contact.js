'use client';

/**
 * The enquiry form.
 *
 * NO BACKEND, ON PURPOSE, FOR NOW.
 * There is no API route behind this. Submitting composes a WhatsApp message
 * and hands off to the user's own client. Three reasons that is the right
 * call at this stage rather than a shortcut:
 *
 *   1. This route lives inside the Velcaryn repo until the brand moves to its
 *      own. An unauthenticated POST endpoint that writes to Velcaryn's
 *      database would need a public-route declaration in
 *      scripts/check-api-security.mjs, and declaring a public write endpoint
 *      is a decision to expose it to the internet. Not for a staging page.
 *   2. Nothing is stored, so there is no personal data at rest, no retention
 *      question and no DPDP obligation created by a page that exists to talk
 *      about taking DPDP seriously.
 *   3. WhatsApp is where this audience actually replies.
 *
 * When the brand has its own repo and inbox, replace `handoff` with a POST.
 * The validation and the states below do not change.
 *
 * The number and address are placeholders and MUST be set before this goes
 * anywhere public. They are held in one constant so there is exactly one
 * place to change, and no invented digits are printed on screen.
 */
import { useEffect, useState } from 'react';
import {
    WhatsappLogo,
    EnvelopeSimple,
    Warning,
    CheckCircle,
    ArrowUpRight,
} from '@phosphor-icons/react/ssr';
import { contact, emailHref, waDefault, waEnquiry } from '@/config/site';

const EMPTY = { name: '', email: '', company: '', brief: '' };

/* Deliberately loose. A validator that rejects a valid address is far more
   expensive than one that lets a typo through, and the only real test of an
   address is sending to it. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values) {
    const errors = {};
    if (!values.name.trim()) errors.name = 'Please tell us who you are.';
    if (!values.email.trim()) {
        errors.email = 'We need an address to reply to.';
    } else if (!EMAIL_RE.test(values.email.trim())) {
        errors.email = 'That does not look like an email address.';
    }
    if (values.brief.trim().length < 12) {
        errors.brief = 'A sentence or two about the project, so the first call is useful.';
    }
    return errors;
}

export default function Contact() {
    const [values, setValues] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [state, setState] = useState('idle'); // idle | sending | sent

    /* The estimator hands over the scope the visitor just built, so they do
       not retype it. An event rather than shared state or a query parameter:
       both components are islands under a server page, there is no provider
       between them, and a URL parameter would survive a reload and silently
       refill the field long after it was relevant. Appended rather than
       assigned, so anything already typed is never destroyed. */
    useEffect(() => {
        const onPrefill = (e) => {
            const incoming = e.detail;
            if (!incoming) return;
            setValues((v) => ({
                ...v,
                brief: v.brief.trim() ? `${v.brief.trim()}\n\n${incoming}` : incoming,
            }));
            setErrors((prev) => ({ ...prev, brief: undefined }));
            /* Focus lands on the field so it is obvious what just changed. */
            window.requestAnimationFrame(() => {
                const el = document.getElementById('nv-brief');
                if (el) { el.focus({ preventScroll: true }); }
            });
        };
        window.addEventListener('nv:prefill-brief', onPrefill);
        return () => window.removeEventListener('nv:prefill-brief', onPrefill);
    }, []);

    const set = (field) => (e) => {
        const next = e.target.value;
        setValues((v) => ({ ...v, [field]: next }));
        /* Clear a field's error as soon as it is being fixed. Holding an
           error on screen while someone types the correction reads as the
           form not listening. */
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    /* The message is assembled in config/site.js so its wording stays in step
       with every other WhatsApp entry point on the site. */
    const handoff = () => {
        window.open(
            waEnquiry({
                name: values.name.trim(),
                email: values.email.trim(),
                company: values.company.trim(),
                brief: values.brief.trim(),
            }),
            '_blank',
            'noopener,noreferrer',
        );
    };

    const onSubmit = (e) => {
        e.preventDefault();
        const found = validate(values);
        setErrors(found);
        if (Object.keys(found).length > 0) {
            /* Move focus to the first field that failed, so a keyboard or
               screen reader user is taken to the problem instead of being
               told, silently, that something somewhere is wrong. */
            const first = document.getElementById(`nv-${Object.keys(found)[0]}`);
            if (first) first.focus();
            return;
        }
        setState('sending');
        handoff();
        setState('sent');
    };

    const field = (name, label, extra = {}) => {
        const invalid = Boolean(errors[name]);
        return (
            <div className={`nv-field${invalid ? ' is-invalid' : ''}`}>
                <label htmlFor={`nv-${name}`}>{label}</label>
                {extra.hint && <span className="nv-field__hint">{extra.hint}</span>}
                {extra.multiline ? (
                    <textarea
                        id={`nv-${name}`}
                        name={name}
                        value={values[name]}
                        onChange={set(name)}
                        placeholder={extra.placeholder}
                        aria-invalid={invalid}
                        aria-describedby={invalid ? `nv-${name}-error` : undefined}
                    />
                ) : (
                    <input
                        id={`nv-${name}`}
                        name={name}
                        type={extra.type || 'text'}
                        value={values[name]}
                        onChange={set(name)}
                        placeholder={extra.placeholder}
                        autoComplete={extra.autoComplete}
                        aria-invalid={invalid}
                        aria-describedby={invalid ? `nv-${name}-error` : undefined}
                    />
                )}
                {invalid && (
                    <span className="nv-field__error" id={`nv-${name}-error`}>
                        <Warning size={16} weight="fill" aria-hidden="true" />
                        {errors[name]}
                    </span>
                )}
            </div>
        );
    };

    return (
        <section className="nv-section nv-contact nv-ground--lav-full" id="contact">
            <div className="nv-shell nv-contact__grid">
                <div>
                    <h2 className="nv-contact__title">
                        Tell us what you are <span className="nv-mark">building</span>.
                    </h2>
                    <p className="nv-lede nv-contact__body">
                        Send a couple of lines about the business and what the site has to
                        do. You get a real reply from the person who would run the project,
                        usually the same day.
                    </p>

                    <div className="nv-contact__direct">
                        <a
                            className="nv-contact__line"
                            href={waDefault}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <WhatsappLogo size={20} weight="fill" aria-hidden="true" />
                            Message us on WhatsApp
                        </a>
                        <a className="nv-contact__line" href={emailHref}>
                            <EnvelopeSimple size={20} weight="fill" aria-hidden="true" />
                            {contact.email}
                        </a>
                    </div>
                </div>

                <form className="nv-form" onSubmit={onSubmit} noValidate>
                    {state === 'sent' && (
                        <p className="nv-form__status" role="status">
                            <CheckCircle size={20} weight="fill" aria-hidden="true" />
                            <span>
                                WhatsApp should have opened with your message ready to send.
                                If it did not, write to {contact.email} and we will pick it
                                up from there.
                            </span>
                        </p>
                    )}

                    <div className="nv-form__row">
                        {field('name', 'Your name', { autoComplete: 'name', placeholder: 'Aruna Rajan' })}
                        {field('company', 'Company', { autoComplete: 'organization', placeholder: 'Optional' })}
                    </div>

                    {field('email', 'Email', {
                        type: 'email',
                        autoComplete: 'email',
                        placeholder: 'you@company.in',
                    })}

                    {field('brief', 'What are you building', {
                        multiline: true,
                        hint: 'What the business does, and what the site needs to achieve.',
                        placeholder: 'We make handloom sarees in Kanchipuram and sell through resellers. We want to sell direct and be found when people search.',
                    })}

                    <button
                        type="submit"
                        className="nv-btn nv-btn--primary nv-form__submit"
                        disabled={state === 'sending'}
                    >
                        {state === 'sending' ? 'Opening WhatsApp' : 'Send it over'}
                        <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
                    </button>
                </form>
            </div>
        </section>
    );
}
