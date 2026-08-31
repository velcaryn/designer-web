'use client';

/**
 * Pick a trade, see what today looks like and what the visit costs.
 *
 * The bespoke piece for the home services demo, and the section that
 * justifies the demo's central claim. This business bundles a plumber,
 * an electrician and a painter behind one number, which sounds like a
 * convenience and is actually a scheduling problem: the three trades
 * have completely different call-out charges, different response times
 * and different reasons to be called at all.
 *
 * The directory section lists the three trades. This makes the choice
 * consequential: tap plumbing and the whole panel changes, including the
 * charge and what counts as urgent.
 *
 * WHY A CLIENT COMPONENT
 *
 * Three tabs. One useState. The alternative is three near-identical
 * blocks stacked vertically, which on a 390px screen is a long scroll
 * past two trades the reader does not need.
 *
 * Real tab semantics, because the pattern is genuinely a tab set and a
 * screen reader should hear it as one. Arrow keys move between tabs, as
 * the pattern requires and as a row of buttons would not give for free.
 */
import { useRef, useState } from 'react';

export default function TradeDispatch({ trades, title = 'What do you need', lede, note, id = 'dispatch' }) {
    const [active, setActive] = useState(0);
    const tabRefs = useRef([]);

    if (!trades?.length) return null;

    const current = trades[active];

    /* Left and right move between tabs, home and end jump to the ends.
       Without this a keyboard user tabs through every trade to reach the
       panel, which is exactly what the tab pattern exists to avoid. */
    const onKeyDown = (e) => {
        const last = trades.length - 1;
        let next = null;
        if (e.key === 'ArrowRight') next = active === last ? 0 : active + 1;
        if (e.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = last;
        if (next === null) return;
        e.preventDefault();
        setActive(next);
        tabRefs.current[next]?.focus();
    };

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-disp__tabs" role="tablist" aria-label={title} onKeyDown={onKeyDown}>
                    {trades.map((t, i) => (
                        <button
                            key={t.trade}
                            type="button"
                            role="tab"
                            id={`${id}-tab-${i}`}
                            aria-selected={i === active}
                            aria-controls={`${id}-panel-${i}`}
                            tabIndex={i === active ? 0 : -1}
                            ref={(el) => {
                                tabRefs.current[i] = el;
                            }}
                            className={`vd-disp__tab${i === active ? ' is-active' : ''}`}
                            onClick={() => setActive(i)}
                        >
                            {t.trade}
                        </button>
                    ))}
                </div>

                <div
                    role="tabpanel"
                    id={`${id}-panel-${active}`}
                    aria-labelledby={`${id}-tab-${active}`}
                    tabIndex={0}
                    className="vd-disp__panel"
                >
                    <div className="vd-disp__rate">
                        <span className="vd-disp__rateLabel">Call out</span>
                        <span className="vd-disp__rateValue">{current.callout}</span>
                        <span className="vd-disp__rateNote">{current.calloutNote}</span>
                    </div>

                    <div className="vd-disp__cols">
                        <div className="vd-disp__col">
                            <h3 className="vd-disp__h">Today</h3>
                            <ul className="vd-disp__list">
                                {current.slots.map((s) => (
                                    <li key={s} className="vd-disp__slot">
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="vd-disp__col">
                            <h3 className="vd-disp__h">Common jobs</h3>
                            <ul className="vd-disp__list">
                                {current.jobs.map((j) => (
                                    <li key={j} className="vd-disp__job">
                                        {j}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {current.urgent && (
                        <p className="vd-disp__urgent">
                            <span className="vd-disp__urgentLabel">Treated as urgent</span>
                            {current.urgent}
                        </p>
                    )}
                </div>

                {note && <p className="vd-disp__note">{note}</p>}
            </div>
        </section>
    );
}
