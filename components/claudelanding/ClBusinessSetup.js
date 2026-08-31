'use client';

/**
 * The page's one input, and the mechanic the whole page turns on.
 *
 * It sits directly under the lede, before any explanation. Asking "what do
 * you do" before telling the visitor what we do inverts the usual brochure
 * order on purpose: from this point every mock below is about their
 * business, so the rest of the page reads as a demonstration rather than a
 * claim.
 *
 * ROUND TWO
 *
 * The card is now the visual anchor of the first screen, not a form
 * beneath one. Three things changed:
 *
 *   1. An orb glow follows the pointer across the card: a radial gradient
 *      positioned by two custom properties written from `pointermove`.
 *      Mouse only (`pointerType !== 'mouse'`, the same guard HeroDevices.js
 *      uses for its own parallax) and off entirely under reduced motion.
 *      It is a background-image, never a shadow, so the one-shadow rule in
 *      app/globals.css is untouched.
 *   2. The placeholder is no longer a static string. While the visitor has
 *      typed nothing, `placeholderName` from BusinessContext cycles through
 *      real names for the current sector, so the field is alive before any
 *      input. The cross-fade is CSS (`key`-forced remount + `cl-fill`), not
 *      a JS transition, so a fast cycle never queues animations.
 *   3. Six sectors show as chips; a seventh "More" chip opens a panel of
 *      all twenty grouped under five headings (see sectors.js). Both the
 *      chips and every row in the panel call `pickSector`, which is the
 *      only path that sets `sectorChosen` and therefore the only way this
 *      page ever locks.
 *
 * No submit button, no validation, no error state. See BusinessContext.js
 * for the debounce that keeps the device frames from re-rendering on every
 * keystroke.
 */
import { useEffect, useRef, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { useBusiness } from './BusinessContext';
import { COMMON_SECTORS, GROUPS, sectorsInGroup } from './sectors';
import useReducedMotionPref from './useReducedMotionPref';
import Reveal from '@/components/Reveal';
import ClLeadForm from './ClLeadForm';
import { waLink } from '@/config/site';
import { track } from '@/lib/analytics';

export default function ClBusinessSetup() {
    const {
        draft,
        setDraft,
        typeId,
        pickSector,
        locked,
        placeholderName,
        setFieldFocused,
        displayName,
        type,
        submitted,
        markSubmitted,
    } = useBusiness();
    const [morePanel, setMorePanel] = useState(false);
    const cardRef = useRef(null);
    const reduceMotion = useReducedMotionPref();

    /* The orb. Written as inline custom properties rather than state, so a
       fast mouse does not trigger a React re-render per pixel. */
    useEffect(() => {
        if (reduceMotion) return undefined;
        const card = cardRef.current;
        if (!card) return undefined;
        function onMove(e) {
            if (e.pointerType !== 'mouse') return;
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--cl-orb-x', `${x}%`);
            card.style.setProperty('--cl-orb-y', `${y}%`);
        }
        card.addEventListener('pointermove', onMove);
        return () => card.removeEventListener('pointermove', onMove);
    }, [reduceMotion]);

    /* Escape closes the More panel from anywhere, not just while a row
       inside it has focus. */
    useEffect(() => {
        if (!morePanel) return undefined;
        function onKey(e) {
            if (e.key === 'Escape') setMorePanel(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [morePanel]);

    function choose(id) {
        pickSector(id);
        setMorePanel(false);
    }

    return (
        <section className="cl-setup" id="start">
            {/* Reveal is not forwardRef'd (its own ref drives the entry
                observer), so the orb's pointer target is a plain div one
                level in rather than the Reveal wrapper itself. Shell-
                wrapped so the card gets the same left/right margin as
                every other section instead of running edge to edge. */}
            <div className="nv-shell">
                <Reveal className="cl-card cl-setup__card">
                    <div ref={cardRef} className="cl-setup__inner">
                    <h2 className="cl-setup__label">
                        What is your business called?
                    </h2>
                    <p className="cl-setup__hint">
                        Type it in. The rest of this page becomes about you.
                    </p>

                    {/* No `key` here any more. Keying this on the cycling
                        placeholder (or on the typed/untyped transition)
                        remounted a fresh DOM input every 2.6 seconds,
                        which is exactly why clicking in and typing lost
                        focus and dropped keystrokes: React tears down and
                        recreates the element, and the browser's caret goes
                        with it. The placeholder still changes, because
                        `placeholder` is a plain prop update on the SAME
                        node; there is nothing left to animate a cross-fade
                        on, which is the trade this fix makes deliberately.
                        Focus and blur stop both cycles in BusinessContext,
                        per the "stop on focus" requirement below. */}
                    <input
                        id="cl-bizname"
                        className="cl-setup__input"
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onFocus={() => setFieldFocused(true)}
                        onBlur={() => setFieldFocused(false)}
                        placeholder={placeholderName}
                        maxLength={40}
                        /* Autocomplete/autofill suggestions from the browser
                           are exactly the kind of "auto suggestion" that
                           steals focus and overwrites what was typed the
                           moment a saved value is offered. This field has
                           no real autofill use (nobody has "business name"
                           saved as a browser value the way they do an
                           address), so it is switched off outright rather
                           than hinted with `organization`, which invited
                           the browser to try. */
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                    />

                    <fieldset className="cl-setup__types">
                        {/* The legend names the group for a screen reader.
                            It is visually hidden rather than absent,
                            because a bare row of buttons announces six
                            unrelated controls. */}
                        <legend className="nv-sr-only">
                            What kind of business is it
                        </legend>
                        {COMMON_SECTORS.map((s) => {
                            const isActive = s.id === typeId;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`cl-setup__type${isActive ? ' is-active' : ''}`}
                                    aria-pressed={isActive}
                                    onClick={() => choose(s.id)}
                                >
                                    {s.label}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            className="cl-setup__type cl-setup__type--more"
                            aria-haspopup="dialog"
                            aria-expanded={morePanel}
                            onClick={() => setMorePanel(true)}
                        >
                            More
                        </button>
                    </fieldset>

                    {/* The ask, revealed only once BOTH halves of the
                        commit are true: a real name typed and a sector
                        deliberately picked. At that point the visitor has
                        told us what their business is called and what it
                        does, so the form asks for one thing rather than
                        four, and WhatsApp still sits above it as the
                        louder option. Before the commit there is nothing
                        here at all, which is what keeps the card feeling
                        like a toy rather than a gate. */}
                    {locked && (
                        <div className="cl-setup__after">
                            <p className="cl-setup__locked" role="status">
                                Set. Scroll down and watch it turn into a
                                website below.
                            </p>

                            {submitted ? (
                                <p className="cl-setup__thanks" role="status">
                                    Thanks. We will be in touch about
                                    {' '}
                                    {displayName}
                                    .
                                </p>
                            ) : (
                                <div className="cl-setup__ask">
                                    <p className="cl-setup__askLead">
                                        Want us to price it? Send it over on
                                        WhatsApp, or leave a number and we
                                        will call.
                                    </p>

                                    <a
                                        href={waLink(
                                            `Hello, I run ${displayName}, a ${type.noun}. I would like to talk about a website.`,
                                        )}
                                        className="nv-btn nv-btn--primary cl-setup__wa"
                                        rel="noreferrer noopener"
                                        onClick={() => track('whatsapp_clicked', { source: 'setup' })}
                                    >
                                        Message us on WhatsApp
                                    </a>

                                    <ClLeadForm
                                        variant="setup"
                                        source="setup"
                                        businessName={displayName}
                                        sector={type.label || type.id}
                                        submitLabel="Call me back"
                                        doneMessage="Thanks. We will call you back."
                                        onDone={markSubmitted}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </Reveal>
            </div>

            {morePanel && (
                <div
                    className="cl-more"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Choose your kind of business"
                >
                    <button
                        type="button"
                        className="cl-more__backdrop"
                        aria-label="Close"
                        onClick={() => setMorePanel(false)}
                    />
                    <div className="cl-more__panel">
                        <div className="cl-more__head">
                            <h3 className="cl-more__title">
                                What kind of business is it?
                            </h3>
                            <button
                                type="button"
                                className="cl-more__close"
                                aria-label="Close"
                                onClick={() => setMorePanel(false)}
                            >
                                <X size={18} weight="bold" />
                            </button>
                        </div>
                        <div className="cl-more__body">
                            {GROUPS.map((group) => (
                                <div key={group.id} className="cl-more__group">
                                    <h4 className="cl-more__groupName">
                                        {group.label}
                                    </h4>
                                    <div className="cl-more__rows">
                                        {sectorsInGroup(group.id).map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                className={`cl-more__row${s.id === typeId ? ' is-active' : ''}`}
                                                aria-pressed={s.id === typeId}
                                                onClick={() => choose(s.id)}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
