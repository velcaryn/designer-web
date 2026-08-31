'use client';

/**
 * Filter the plots by budget and facing.
 *
 * The bespoke piece for the plot seller. The spec table already lists
 * every layout with its approval, survey number and extent, and it is
 * the right way to publish that. What it cannot do is answer the
 * question every single buyer arrives with, which is "what can I afford,
 * facing which way".
 *
 * Facing matters more than a non-Indian reader might expect. East and
 * north facing plots carry a real price premium here, and a buyer
 * filtering for them is not being superstitious about a demo, they are
 * shopping the way this market actually shops.
 *
 * WHY A CLIENT COMPONENT
 *
 * Two selects and a filtered list. It could be done with links and query
 * params, but that is a navigation per tap on a page whose entire
 * audience is on mobile data. One useState, no dependencies, and the
 * unfiltered list is what the server renders, so a visitor with no JS
 * sees every plot rather than an empty box.
 *
 * NO PRICES PER PLOT AND NO BOOKING. Land pricing moves, and a static
 * page quoting a per-cent rate that is three months stale is worse than
 * one that says "ask". The filter narrows; the conversation prices.
 */
import { useState } from 'react';

const ANY = 'any';

export default function PlotFinder({ plots, budgets, title = 'Find a plot', lede, note, id = 'plots' }) {
    const [budget, setBudget] = useState(ANY);
    const [facing, setFacing] = useState(ANY);

    if (!plots?.length) return null;

    /* Facings offered are derived from the stock rather than hardcoded, so
       a layout selling only west-facing plots does not offer a filter that
       returns nothing. */
    const facings = [...new Set(plots.map((p) => p.facing))].sort();

    const shown = plots.filter(
        (p) =>
            (budget === ANY || p.budget === budget) &&
            (facing === ANY || p.facing === facing),
    );

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-plot__controls">
                    <label className="vd-plot__field">
                        <span className="vd-plot__label">Budget</span>
                        <select
                            className="vd-plot__select"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                        >
                            <option value={ANY}>Any</option>
                            {budgets?.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="vd-plot__field">
                        <span className="vd-plot__label">Facing</span>
                        <select
                            className="vd-plot__select"
                            value={facing}
                            onChange={(e) => setFacing(e.target.value)}
                        >
                            <option value={ANY}>Any</option>
                            {facings.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Announced politely so a screen reader hears the count
                    change without the list stealing focus on every tap. */}
                <p className="vd-plot__count" role="status" aria-live="polite">
                    {shown.length === plots.length
                        ? `${plots.length} plots available`
                        : `${shown.length} of ${plots.length} plots`}
                </p>

                {shown.length === 0 ? (
                    <p className="vd-plot__none">
                        Nothing on the ground matching that today. Layouts change
                        weekly, so ask and we will tell you what is coming.
                    </p>
                ) : (
                    <div className="vd-plot__grid">
                        {shown.map((p) => (
                            <article key={p.id} className="vd-plot__card">
                                <header className="vd-plot__head">
                                    <h3 className="vd-plot__id">{p.id}</h3>
                                    <span className="vd-plot__facing">{p.facing} facing</span>
                                </header>
                                <dl className="vd-plot__specs">
                                    <div>
                                        <dt>Extent</dt>
                                        <dd>{p.extent}</dd>
                                    </div>
                                    <div>
                                        <dt>Layout</dt>
                                        <dd>{p.layout}</dd>
                                    </div>
                                    <div>
                                        <dt>Budget band</dt>
                                        <dd>{p.budget}</dd>
                                    </div>
                                </dl>
                                {p.note && <p className="vd-plot__note">{p.note}</p>}
                            </article>
                        ))}
                    </div>
                )}

                {note && <p className="vd-plot__foot">{note}</p>}
            </div>
        </section>
    );
}
