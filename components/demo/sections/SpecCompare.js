'use client';

/**
 * The numbers behind the product, measured rather than claimed.
 *
 * The bespoke piece for the audio and desk gear brand. The hero promises
 * "driver size, impedance, battery in hours under real use" and the demo
 * had nothing to back it: a cart, a gallery and a process section, the
 * same as the grocery shop.
 *
 * This is the section that makes the promise real, and it is deliberately
 * the least glamorous thing on the page. A brand selling on specification
 * rather than on lifestyle photography wins by publishing the number it
 * would rather not, which here is battery life measured at a stated
 * volume instead of the marketing figure measured at whisper level.
 *
 * WHY A CLIENT COMPONENT
 *
 * A toggle between claimed and measured. That contrast IS the argument,
 * and putting both columns up at once dilutes it: the reader should see
 * the marketing number, then see what it actually is.
 *
 * The table renders with measured figures on the server, so no JS lands
 * on the honest column rather than the flattering one.
 */
import { useState } from 'react';

export default function SpecCompare({ products, rows, title = 'The actual numbers', lede, note, id = 'specs' }) {
    const [claimed, setClaimed] = useState(false);

    if (!products?.length || !rows?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-spc__toggle">
                    <button
                        type="button"
                        className="vd-spc__btn"
                        aria-pressed={claimed}
                        onClick={() => setClaimed((v) => !v)}
                    >
                        {claimed ? 'Showing the claim' : 'Showing what we measured'}
                    </button>
                    <p className="vd-spc__hint">
                        {claimed
                            ? 'This is the figure the industry quotes, at a volume nobody listens at.'
                            : 'Measured at 70 percent volume, on our bench, on a unit off the shelf.'}
                    </p>
                </div>

                <div className="vd-spc__wrap">
                    <table className="vd-spc__table">
                        <thead>
                            <tr>
                                <th scope="col">
                                    <span className="vd-sr-only">Specification</span>
                                </th>
                                {products.map((p) => (
                                    <th key={p.name} scope="col">
                                        {p.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.key}>
                                    <th scope="row">{r.label}</th>
                                    {products.map((p) => {
                                        const v = p[r.key];
                                        /* Only some rows differ between the
                                           claim and the measurement. The rest
                                           are the same number either way. */
                                        const shown =
                                            claimed && v?.claimed ? v.claimed : v?.measured ?? v;
                                        const differs = v?.claimed && v.claimed !== v.measured;
                                        return (
                                            <td key={p.name}>
                                                {shown}
                                                {differs && !claimed && (
                                                    <span className="vd-spc__was">
                                                        claimed {v.claimed}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {note && <p className="vd-spc__note">{note}</p>}
            </div>
        </section>
    );
}
