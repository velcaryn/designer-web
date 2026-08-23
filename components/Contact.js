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
import { useState } from 'react';
import {
    WhatsappLogo,
    EnvelopeSimple,
    Warning,
    CheckCircle,
    ArrowUpRight,
} from '@phosphor-icons/react/ssr';

/*
 * PLACEHOLDERS. Both of these must be replaced before this page is public.
 *
 * The number is deliberately an unroutable one rather than a plausible one:
 * a plausible placeholder is a number that belongs to a real person who then
 * receives your enquiries. Leave it obviously broken so it cannot ship
 * quietly.
 */
const CONTACT = {
    whatsapp: '910000000000',
    email: 'hello@velbrant.studio',
};

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

    const set = (field) => (e) => {
        const next = e.target.value;
        setValues((v) => ({ ...v, [field]: next }));
        /* Clear a field's error as soon as it is being fixed. Holding an
           error on screen while someone types the correction reads as the
           form not listening. */
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handoff = () => {
        const lines = [
            'Hello Velbrant Studios.',
            '',
            `Name: ${values.name.trim()}`,
            `Email: ${values.email.trim()}`,
            values.company.trim() ? `Company: ${values.company.trim()}` : null,
            '',
            values.brief.trim(),
        ].filter((line) => line !== null);

        window.open(
            `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`,
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
                            href={`https://wa.me/${CONTACT.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <WhatsappLogo size={20} weight="fill" aria-hidden="true" />
                            Message us on WhatsApp
                        </a>
                        <a className="nv-contact__line" href={`mailto:${CONTACT.email}`}>
                            <EnvelopeSimple size={20} weight="fill" aria-hidden="true" />
                            {CONTACT.email}
                        </a>
                    </div>
                </div>

                <form className="nv-form" onSubmit={onSubmit} noValidate>
                    {state === 'sent' && (
                        <p className="nv-form__status" role="status">
                            <CheckCircle size={20} weight="fill" aria-hidden="true" />
                            <span>
                                WhatsApp should have opened with your message ready to send.
                                If it did not, write to {CONTACT.email} and we will pick it
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
