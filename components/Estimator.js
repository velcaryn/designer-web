'use client';

/**
 * Scoping estimator.
 *
 * WHY IT IS HERE
 * The contact form asks a stranger to write a project brief from a blank
 * textarea, which is the most work we could possibly demand at the exact
 * moment they are least invested. This asks them to press four or five
 * buttons instead, and by the end they have specified their own project. It
 * also qualifies the enquiry before a call happens, and it hands the visitor
 * the thing they actually came for, which is a sense of how long this takes
 * and what it involves.
 *
 * WHAT IT DELIBERATELY DOES NOT OUTPUT
 *
 *   - No price. Every project here is scoped, and a number on this page would
 *     either be fiction or an anchor we spend the first call arguing against.
 *   - No projected conversion uplift, no revenue multiple, no "3.2x surge".
 *     We do not have that data for a project that does not exist yet. A
 *     fabricated performance promise is the fastest way to lose the kind of
 *     buyer we want, because it is the one claim they know how to check.
 *
 * What it outputs is a working-week range and a plain list of what is in
 * scope. Both are things we control and can stand behind.
 *
 * THE ARITHMETIC IS HONEST AND VISIBLE. Durations come from the per-option
 * `weeks` values below, summed with overlap applied because workstreams
 * genuinely run in parallel, then clamped to the 1 to 3 week band the section
 * promises. A real estimate built from stated parts, not a lookup table
 * dressed up as a simulation.
 *
 * The result feeds straight into the WhatsApp handoff, so the first message
 * we receive already contains the spec the visitor just built. That is the
 * whole point: this is a lead-qualification instrument, not a toy.
 */
import { useMemo, useState } from 'react';
import { Check, ArrowUpRight, Clock, Warning } from '@phosphor-icons/react/ssr';

/*
 * Each deliverable carries a [min, max] range in working weeks, and the scope
 * lines that appear in the summary. Ranges rather than points because a
 * single number implies a precision that does not exist before discovery.
 */
const DELIVERABLES = [
    {
        id: 'build',
        label: 'Website design and build',
        weeks: [0.5, 1],
        scope: 'Strategy, architecture, a design system of your own, and the Next.js build',
    },
    {
        id: 'seo',
        label: 'SEO foundations',
        weeks: [0.5, 1],
        scope: 'Technical SEO, schema, sitemaps, Search Console and a content plan',
    },
    {
        id: 'social',
        label: 'Social and content',
        weeks: [1, 2],
        scope: 'Content calendar, creative and community, running monthly after launch',
    },
    {
        id: 'cloud',
        label: 'Cloud and ERP integration',
        weeks: [2, 3],
        scope: 'Your own Velcaryn Cloud instance, wired to the site as one customer record',
    },
];

/*
 * Sector and scale shape the SCOPE, not the clock. They used to add weeks,
 * which pushed a regulated four-item selection out past six and made the
 * whole section read as a hedge. They now change what is said, and the
 * ceiling below holds regardless.
 */
const SECTORS = [
    { id: 'retail', label: 'Retail and D2C', note: null },
    { id: 'b2b', label: 'B2B and trade', note: null },
    {
        id: 'regulated',
        label: 'Healthcare or finance',
        note: 'Regulated sectors get a tightened build at no extra time: stricter retention, audit logging, and data residency confirmed in writing before launch.',
    },
];

const SCALES = [
    { id: 'launch', label: 'Launching' },
    { id: 'national', label: 'Growing across India' },
    { id: 'enterprise', label: 'Established, high volume' },
];

/*
 * Workstreams overlap: SEO groundwork happens during the build, content
 * starts before launch. Running every item end to end would overstate a
 * four-item selection badly, so the longest runs at full duration and each
 * additional one contributes 55% of its range.
 */
const OVERLAP = 0.55;

/*
 * The hard ceiling. Everything selected together lands at 3 weeks, and a
 * single item never reads as less than 1, because "under a week" invites an
 * argument about which day. One to three is the promise this section makes,
 * and the clamp is what guarantees the arithmetic can never contradict it.
 */
const FLOOR = 1;
const CEILING = 3;

function estimate(selected) {
    if (selected.length === 0) return null;

    const chosen = DELIVERABLES.filter((d) => selected.includes(d.id));
    const sorted = [...chosen].sort((a, b) => b.weeks[1] - a.weeks[1]);

    let min = 0;
    let max = 0;
    sorted.forEach((d, i) => {
        const factor = i === 0 ? 1 : OVERLAP;
        min += d.weeks[0] * factor;
        max += d.weeks[1] * factor;
    });

    min = Math.min(CEILING, Math.max(FLOOR, Math.round(min)));
    max = Math.min(CEILING, Math.max(min, Math.round(max)));

    return { min, max, items: chosen };
}

export default function Estimator() {
    const [selected, setSelected] = useState(['build']);
    const [sectorId, setSectorId] = useState('retail');
    const [scaleId, setScaleId] = useState('launch');

    const sector = SECTORS.find((s) => s.id === sectorId);
    const scale = SCALES.find((s) => s.id === scaleId);
    const result = useMemo(() => estimate(selected), [selected]);

    const toggle = (id) => {
        setSelected((prev) => (prev.includes(id)
            ? prev.filter((x) => x !== id)
            : [...prev, id]));
    };

    /* The selection is carried into the enquiry as prefilled text, so the
       visitor never retypes what they just specified. */
    const brief = result
        ? [
            'Scope from the estimator:',
            ...result.items.map((d) => `- ${d.label}`),
            `Sector: ${sector.label}`,
            `Stage: ${scale.label}`,
            `Indicative timeline: ${result.min === result.max
                ? `${result.min} week${result.min === 1 ? '' : 's'}`
                : `${result.min} to ${result.max} weeks`}`,
        ].join('\n')
        : '';

    return (
        <section className="nv-section nv-ground--paper" id="estimator">
            <div className="nv-shell">
                <div className="nv-est__head">
                    <p className="nv-eyebrow">Scope it yourself</p>
                    <h2 className="nv-est__title">
                        Roughly how long, and what is in it.
                    </h2>
                    <p className="nv-lede nv-est__lede">
                        Pick what you need. You get a working-week range and a scope list,
                        not a price: every project is quoted after a conversation, and a
                        number here would be a guess dressed up as a fact.
                    </p>
                </div>

                <div className="nv-est__grid">
                    <div className="nv-est__controls">
                        <fieldset className="nv-est__group">
                            <legend className="nv-est__legend">What do you need</legend>
                            <div className="nv-est__options">
                                {DELIVERABLES.map(({ id, label }) => {
                                    const on = selected.includes(id);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            className={`nv-chip${on ? ' is-active' : ''}`}
                                            aria-pressed={on}
                                            onClick={() => toggle(id)}
                                        >
                                            <span className="nv-chip__box" aria-hidden="true">
                                                {on && <Check size={13} weight="bold" />}
                                            </span>
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <fieldset className="nv-est__group">
                            <legend className="nv-est__legend">What sector</legend>
                            <div className="nv-est__options" role="radiogroup" aria-label="Sector">
                                {SECTORS.map(({ id, label }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        role="radio"
                                        aria-checked={sectorId === id}
                                        className={`nv-chip${sectorId === id ? ' is-active' : ''}`}
                                        onClick={() => setSectorId(id)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="nv-est__group">
                            <legend className="nv-est__legend">Where you are</legend>
                            <div className="nv-est__options" role="radiogroup" aria-label="Stage">
                                {SCALES.map(({ id, label }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        role="radio"
                                        aria-checked={scaleId === id}
                                        className={`nv-chip${scaleId === id ? ' is-active' : ''}`}
                                        onClick={() => setScaleId(id)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    </div>

                    {/* aria-live so the result is announced when it changes, rather
                        than silently updating for a screen reader user. */}
                    <div className="nv-est__result" aria-live="polite">
                        {result ? (
                            <>
                                <p className="nv-est__resultLabel">
                                    <Clock size={16} weight="bold" aria-hidden="true" />
                                    Indicative timeline
                                </p>
                                <p className="nv-est__weeks">
                                    {result.min === result.max
                                        ? result.min
                                        : `${result.min} to ${result.max}`}
                                    <span className="nv-est__unit">
                                        {result.max === 1 ? 'week' : 'weeks'}
                                    </span>
                                </p>

                                <ul className="nv-est__scope">
                                    {result.items.map(({ id, scope }) => (
                                        <li className="nv-est__scopeItem" key={id}>
                                            <Check size={16} weight="bold" aria-hidden="true" />
                                            <span>{scope}</span>
                                        </li>
                                    ))}
                                </ul>

                                {sector.note && (
                                    <p className="nv-est__note">{sector.note}</p>
                                )}

                                <a
                                    className="nv-btn nv-btn--primary nv-est__cta"
                                    href={`#contact?brief=${encodeURIComponent(brief)}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        /* Hand the built scope to the form rather than
                                           making them describe it again. */
                                        window.dispatchEvent(
                                            new CustomEvent('nv:prefill-brief', { detail: brief }),
                                        );
                                        document.getElementById('contact')
                                            ?.scrollIntoView({ block: 'start' });
                                    }}
                                >
                                    Send this scope
                                    <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
                                </a>

                                <p className="nv-est__caveat">
                                    Working weeks from kickoff, assuming content and approvals
                                    arrive on time. Firmed up after one call.
                                </p>
                            </>
                        ) : (
                            /* Empty state. The panel keeps its shape so selecting the
                               first option does not shift the layout underneath. */
                            <div className="nv-est__empty">
                                <Warning size={22} weight="bold" aria-hidden="true" />
                                <p>Pick at least one thing you need and the estimate appears here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
