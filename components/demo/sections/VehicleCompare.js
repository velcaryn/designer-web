'use client';

/**
 * Pin two vehicles side by side.
 *
 * The bespoke piece for the used vehicle yard. The spec table already
 * lists the stock, and a list is the right way to publish stock. But
 * nobody buys a used car off a list: they narrow to two and then go back
 * and forth between them, which on a phone means scrolling up and down
 * the same table losing their place.
 *
 * This is the section that makes the resale demo a different page from
 * the car service demo, which is the other Tirunelveli automobile demo
 * in the set. One sells labour against a schedule; this one sells
 * individual objects that a buyer agonises between.
 *
 * WHY A CLIENT COMPONENT
 *
 * Two selects and a diff. One useState holding two indices.
 *
 * NO REGISTRATION NUMBERS ANYWHERE. A plausible TN plate on a page that
 * gets forwarded is a real vehicle's number. Stock is identified by make
 * and year, which is how a yard talks about it anyway.
 *
 * The comparison marks which of the two is better on each row where
 * "better" is unambiguous, and stays silent where it is a matter of
 * preference. Marking a diesel as better than a petrol would be a lie
 * dressed as a feature.
 */
import { useState } from 'react';

export default function VehicleCompare({ stock, rows, title = 'Compare two', lede, note, id = 'compare' }) {
    const [left, setLeft] = useState(0);
    const [right, setRight] = useState(1);

    if (!stock || stock.length < 2 || !rows?.length) return null;

    const a = stock[left];
    const b = stock[right];
    const same = left === right;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-cmp__picks">
                    <label className="vd-cmp__field">
                        <span className="vd-cmp__label">First</span>
                        <select
                            className="vd-cmp__select"
                            value={left}
                            onChange={(e) => setLeft(Number(e.target.value))}
                        >
                            {stock.map((v, i) => (
                                <option key={v.name} value={i}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="vd-cmp__field">
                        <span className="vd-cmp__label">Second</span>
                        <select
                            className="vd-cmp__select"
                            value={right}
                            onChange={(e) => setRight(Number(e.target.value))}
                        >
                            {stock.map((v, i) => (
                                <option key={v.name} value={i}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {same ? (
                    <p className="vd-cmp__same">
                        Pick two different vehicles to see them side by side.
                    </p>
                ) : (
                    /* A real table. Two columns of specs is exactly what a
                       table is for, and a screen reader gets the row and
                       column headers for free. */
                    <div className="vd-cmp__wrap">
                        <table className="vd-cmp__table">
                            <thead>
                                <tr>
                                    <th scope="col">
                                        <span className="vd-sr-only">Specification</span>
                                    </th>
                                    <th scope="col">{a.name}</th>
                                    <th scope="col">{b.name}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => {
                                    const av = a[r.key];
                                    const bv = b[r.key];
                                    /* Only mark a winner where lower or higher
                                       is genuinely better. r.better is unset
                                       for rows that are pure preference. */
                                    let mark = null;
                                    if (r.better && av !== bv) {
                                        const an = Number(String(av).replace(/[^\d.]/g, ''));
                                        const bn = Number(String(bv).replace(/[^\d.]/g, ''));
                                        if (Number.isFinite(an) && Number.isFinite(bn)) {
                                            mark = r.better === 'low'
                                                ? (an < bn ? 'a' : 'b')
                                                : (an > bn ? 'a' : 'b');
                                        }
                                    }
                                    return (
                                        <tr key={r.key}>
                                            <th scope="row">{r.label}</th>
                                            <td className={mark === 'a' ? 'is-better' : undefined}>
                                                {av ?? 'Not listed'}
                                                {mark === 'a' && (
                                                    <span className="vd-sr-only"> (better)</span>
                                                )}
                                            </td>
                                            <td className={mark === 'b' ? 'is-better' : undefined}>
                                                {bv ?? 'Not listed'}
                                                {mark === 'b' && (
                                                    <span className="vd-sr-only"> (better)</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {note && <p className="vd-cmp__note">{note}</p>}
            </div>
        </section>
    );
}
