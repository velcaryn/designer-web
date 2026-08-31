'use client';

/**
 * Search the shelf.
 *
 * The bespoke piece for the electrical hardware shop. The whole demo
 * rests on one promise, made in the hero and repeated in the story:
 * send a list and you get back what is on the shelf, what is two days
 * out, and the price against each. Nobody will tell you something is
 * available when it is not.
 *
 * Every other section on that page describes the promise. This one
 * performs it. A workshop buyer types "contactor", sees what is actually
 * there, and the claim stops being marketing.
 *
 * WHY A CLIENT COMPONENT
 *
 * A text filter over a catalogue. The full catalogue is what the server
 * renders, so no JS still gets a browsable price list.
 *
 * THREE STATES, NOT TWO. In stock, coming in a couple of days, and
 * genuinely not stocked. A shop that shows only the first two is the
 * shop the story explicitly says this one is not.
 */
import { useState } from 'react';

export default function StockCheck({ items, title = 'Is it on the shelf', lede, note, id = 'stock' }) {
    const [q, setQ] = useState('');

    if (!items?.length) return null;

    const needle = q.trim().toLowerCase();
    const shown = needle
        ? items.filter(
              (i) =>
                  i.name.toLowerCase().includes(needle) ||
                  i.also?.toLowerCase().includes(needle),
          )
        : items;

    const label = {
        in: 'On the shelf',
        soon: 'Two days',
        no: 'Not stocked',
    };

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <label className="vd-stock__field">
                    <span className="vd-stock__label">Search the catalogue</span>
                    <input
                        className="vd-stock__input"
                        type="search"
                        autoComplete="off"
                        placeholder="contactor, 2.5 sq mm, MCB"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </label>

                <p className="vd-stock__count" role="status" aria-live="polite">
                    {needle
                        ? `${shown.length} of ${items.length} lines`
                        : `${items.length} lines listed`}
                </p>

                {shown.length === 0 ? (
                    <p className="vd-stock__none">
                        Not in the list, which does not mean we cannot get it. Send
                        the part number and you will get an honest answer on whether
                        it is worth waiting for.
                    </p>
                ) : (
                    <ul className="vd-stock__list">
                        {shown.map((i) => (
                            <li key={i.name} className="vd-stock__row">
                                <span className="vd-stock__name">
                                    {i.name}
                                    {i.pack && (
                                        <span className="vd-stock__pack">{i.pack}</span>
                                    )}
                                </span>
                                <span className="vd-stock__price">{i.price}</span>
                                {/* The word carries the state, the colour only
                                    reinforces it. */}
                                <span className={`vd-stock__state is-${i.state}`}>
                                    {label[i.state]}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {note && <p className="vd-stock__note">{note}</p>}
            </div>
        </section>
    );
}
