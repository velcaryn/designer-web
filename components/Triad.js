'use client';

/**
 * CX / UX / UI as three enormous outlined words, one filled at a time.
 *
 * The three terms get thrown around interchangeably in this industry, so the
 * section's job is to separate them: pick a word, read what it actually means
 * and what we do about it. That is the entire justification for making it
 * interactive rather than three paragraphs.
 *
 * AUTO-ADVANCE COMPLIANCE (docs/FRONTEND_RULES.md)
 * Every clause of the house rule is implemented here, because a rotating
 * region that cannot be stopped is genuinely hostile:
 *   - `prefers-reduced-motion` turns rotation OFF ENTIRELY, read in JS with
 *     matchMedia. A CSS media query cannot stop a setInterval, and shortening
 *     the interval is not the same thing as stopping it.
 *   - Pauses on hover AND on focus. The focus case uses a
 *     `currentTarget.contains(relatedTarget)` check so moving between the
 *     controls inside the region does not register as leaving it.
 *   - Stops while the tab is hidden.
 *   - Real previous / pause / next controls, and the terms themselves are
 *     `role="tab"` with `aria-selected`, not decorative dots.
 *   - `aria-live="polite"` on the panel, so the swap is announced instead of
 *     silently replacing content for a screen reader user.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    CaretLeft,
    CaretRight,
    Pause,
    Play,
    Check,
} from '@phosphor-icons/react/ssr';

const TERMS = [
    {
        id: 'cx',
        word: 'CX',
        label: 'Customer experience',
        headline: 'Everything that happens before and after the click.',
        body: 'The website is one touchpoint. CX is the whole path: the ad they saw, the WhatsApp reply they waited on, the invoice that arrived, the follow-up that did not. We map it end to end and fix the parts that leak.',
        points: [
            'Journey mapping across web, social, phone and in person',
            'Response-time and handover design between your team and ours',
            'Retention and repeat-purchase loops, not just first orders',
        ],
    },
    {
        id: 'ux',
        word: 'UX',
        label: 'User experience',
        headline: 'The shortest honest path to the thing they came for.',
        body: 'Structure before surface. What goes on which page, in what order, and what a first-time visitor on a slow connection sees in the first two seconds. Most sites lose people here, long before anyone notices the colours.',
        points: [
            'Information architecture and page-by-page content plan',
            'Prototypes tested at 375px before any visual design starts',
            'Accessibility built in: keyboard paths, contrast, real labels',
        ],
    },
    {
        id: 'ui',
        word: 'UI',
        label: 'User interface',
        headline: 'The part that makes them trust you in half a second.',
        body: 'Type, colour, spacing, motion and the thousand small decisions that separate a site that looks bought from one that looks built. Every project gets its own system, so nothing you ship shares a skeleton with a competitor.',
        points: [
            'A design system per brand: tokens, components, states',
            'Motion with a reason, and a reduced-motion path for everyone else',
            'Handover files your future developer can actually read',
        ],
    },
];

const ROTATE_MS = 6000;

export default function Triad() {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [allowRotate, setAllowRotate] = useState(false);
    const region = useRef(null);

    /* Reduced motion decides whether rotation exists at all, and keeps
       deciding: someone can change the setting without reloading. */
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => setAllowRotate(!mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    /* Stop while the tab is hidden. A desk monitor sits on one screen all
       day, and a region that keeps cycling in a background tab is pure
       wasted work. */
    useEffect(() => {
        const onVisibility = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    useEffect(() => {
        if (!allowRotate || paused) return undefined;
        const id = setInterval(
            () => setIndex((i) => (i + 1) % TERMS.length),
            ROTATE_MS,
        );
        return () => clearInterval(id);
    }, [allowRotate, paused]);

    const go = useCallback((next) => {
        setIndex((i) => (next + TERMS.length) % TERMS.length);
    }, []);

    /* Left and right arrows move between tabs, which is what a screen reader
       user is told to expect from role="tablist". */
    const onKeyDown = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    };

    const active = TERMS[index];

    return (
        <section
            className="nv-section nv-triad nv-ground--lav"
            ref={region}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
                /* Only unpause when focus genuinely leaves the region. */
                if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
            }}
        >
            <div className="nv-shell nv-triad__grid">
                <div
                    className="nv-triad__stack"
                    role="tablist"
                    aria-label="Customer experience, user experience, user interface"
                    aria-orientation="vertical"
                    onKeyDown={onKeyDown}
                >
                    {TERMS.map((term, i) => (
                        <button
                            key={term.id}
                            type="button"
                            role="tab"
                            id={`nv-tab-${term.id}`}
                            aria-selected={i === index}
                            aria-controls="nv-triad-panel"
                            tabIndex={i === index ? 0 : -1}
                            className={`nv-triad__term${i === index ? ' is-active' : ''}`}
                            onClick={() => setIndex(i)}
                        >
                            {term.word}
                        </button>
                    ))}
                </div>

                <div
                    className="nv-triad__panel"
                    id="nv-triad-panel"
                    role="tabpanel"
                    aria-labelledby={`nv-tab-${active.id}`}
                    aria-live="polite"
                >
                    <p className="nv-triad__label">{active.label}</p>
                    <h2 className="nv-triad__headline">{active.headline}</h2>
                    <p className="nv-triad__body">{active.body}</p>

                    <ul className="nv-triad__points">
                        {active.points.map((point) => (
                            <li className="nv-triad__point" key={point}>
                                <Check size={18} weight="bold" aria-hidden="true" />
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Real controls, shown whenever rotation is possible.
                        Under reduced motion nothing rotates, so a pause
                        button would be a control for a thing that is not
                        happening; the tabs remain fully usable. */}
                    {allowRotate && (
                        <div className="nv-triad__controls">
                            <button
                                type="button"
                                className="nv-triad__ctrl"
                                onClick={() => go(index - 1)}
                                aria-label="Previous term"
                            >
                                <CaretLeft size={18} weight="bold" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className="nv-triad__ctrl"
                                onClick={() => setPaused((p) => !p)}
                                aria-label={paused ? 'Resume rotation' : 'Pause rotation'}
                            >
                                {paused
                                    ? <Play size={18} weight="fill" aria-hidden="true" />
                                    : <Pause size={18} weight="fill" aria-hidden="true" />}
                            </button>
                            <button
                                type="button"
                                className="nv-triad__ctrl"
                                onClick={() => go(index + 1)}
                                aria-label="Next term"
                            >
                                <CaretRight size={18} weight="bold" aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
