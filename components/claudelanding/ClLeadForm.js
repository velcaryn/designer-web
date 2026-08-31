'use client';

/**
 * The one form both capture points share.
 *
 * WHY A FORM EXISTS AT ALL, GIVEN WHAT ClContact.js SAYS
 *
 * That file argued there should be no form: a shop owner on a phone can
 * open WhatsApp in one tap, and asking them to fill four fields first is
 * friction bought with nothing. That reasoning still holds and WhatsApp
 * is still the primary button in both places this renders.
 *
 * What it missed is the visitor it does not describe. A B2B buyer at a
 * desk, on a laptop with no WhatsApp session signed in, had no path at
 * all: the only two actions on the page were a `wa.me` link that opens a
 * QR page and a `mailto:` that opens whatever the machine thinks is a
 * mail client. Both of those are dead ends often enough to matter. So
 * this is the third door, never the first one.
 *
 * TWO SHAPES, ONE COMPONENT
 *
 * `variant="setup"` renders a single number field. It only ever appears
 * after the visitor has typed a real business name and deliberately
 * picked a sector, so the two things a form would normally ask for are
 * already known and asking again would be insulting.
 *
 * `variant="talk"` renders name, number and one optional line, for
 * someone who scrolled straight past the setup card.
 *
 * The number is the only required field in either shape. Everything else
 * is optional and the route fills "Not given". Rejecting a real enquiry
 * over a missing email costs more than the email is worth.
 *
 * THE TWO HIDDEN FIELDS ARE NOT OPTIONAL
 *
 * `bot_trap` is a honeypot positioned off-screen rather than hidden with
 * `display: none`, because plenty of bots skip anything not rendered.
 * `_t` is when the form mounted, so the server can see how long it was
 * actually on screen. Both are checked in lib/leadIntake.js and both
 * answer 200 on failure, so a script never learns which one caught it.
 *
 * `_t` falls back to `Date.now()` at submit time. An earlier version of
 * the onboarding form sent whatever the ref held, which was 0 if the
 * mount effect had not run, and the server treats 0 as a bot. That
 * silently binned real submissions while telling the visitor they were
 * on the list.
 */
import { useEffect, useRef, useState } from 'react';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { track } from '@/lib/analytics';

export default function ClLeadForm({
    variant = 'talk',
    source,
    businessName = '',
    sector = '',
    onDone,
    submitLabel = 'Ask us to call back',
    doneMessage = 'Got it. We will call you back.',
}) {
    const [phone, setPhone] = useState('');
    const [personName, setPersonName] = useState('');
    const [note, setNote] = useState('');
    const [state, setState] = useState('idle');
    const [error, setError] = useState('');
    const loadedAt = useRef(0);
    const errorRef = useRef(null);

    useEffect(() => {
        loadedAt.current = Date.now();
    }, []);

    /* Focus moves to the error only when one appears, so a screen reader
       user is told why nothing happened. `role="alert"` alone announces
       it, but on a long page the visitor also has to be able to find it. */
    useEffect(() => {
        if (error) errorRef.current?.focus();
    }, [error]);

    async function onSubmit(event) {
        event.preventDefault();
        if (state === 'sending') return;

        setError('');
        setState('sending');

        try {
            const res = await fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source,
                    phone,
                    personName,
                    note,
                    businessName,
                    sector,
                    bot_trap: '',
                    _t: loadedAt.current || Date.now(),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || 'That did not go through. Please try again.');
                setState('idle');
                return;
            }

            track('lead_submitted', { source });
            setState('done');
            onDone?.();
        } catch {
            setError('That did not go through. Please try again.');
            setState('idle');
        }
    }

    if (state === 'done') {
        return (
            <p className="cl-lead__done" role="status">
                {doneMessage}
            </p>
        );
    }

    const sending = state === 'sending';

    return (
        <form className={`cl-lead cl-lead--${variant}`} onSubmit={onSubmit} noValidate>
            {/* The honeypot. Off-screen, never announced, never tabbable. */}
            <label className="cl-lead__trap" aria-hidden="true">
                Leave this empty
                <input
                    type="text"
                    name="bot_trap"
                    tabIndex={-1}
                    autoComplete="off"
                />
            </label>

            {variant === 'talk' && (
                <p className="cl-lead__field">
                    <label className="cl-lead__label" htmlFor="lead-name">
                        Your name
                        <span className="cl-lead__optional">Optional</span>
                    </label>
                    <input
                        id="lead-name"
                        className="cl-lead__input"
                        type="text"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        maxLength={120}
                        autoComplete="name"
                        disabled={sending}
                    />
                </p>
            )}

            <p className="cl-lead__field">
                <label className="cl-lead__label" htmlFor="lead-phone">
                    {variant === 'setup' ? 'Your WhatsApp number' : 'Phone or WhatsApp'}
                </label>
                <input
                    id="lead-phone"
                    className="cl-lead__input"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10 digits, or +91 then 10"
                    maxLength={20}
                    autoComplete="tel"
                    required
                    disabled={sending}
                    aria-describedby={error ? 'lead-error' : undefined}
                />
            </p>

            {variant === 'talk' && (
                <p className="cl-lead__field">
                    <label className="cl-lead__label" htmlFor="lead-note">
                        What do you sell?
                        <span className="cl-lead__optional">Optional</span>
                    </label>
                    <input
                        id="lead-note"
                        className="cl-lead__input"
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={400}
                        disabled={sending}
                    />
                </p>
            )}

            <button
                type="submit"
                className="nv-btn nv-btn--primary cl-lead__submit"
                disabled={sending}
            >
                <PaperPlaneRight size={18} weight="fill" />
                {sending ? 'Sending' : submitLabel}
            </button>

            {error && (
                <span
                    id="lead-error"
                    className="cl-lead__error"
                    role="alert"
                    ref={errorRef}
                    tabIndex={-1}
                >
                    {error}
                </span>
            )}
        </form>
    );
}
