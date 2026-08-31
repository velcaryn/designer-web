'use client';

/**
 * Enter the odometer, see what is actually due.
 *
 * The bespoke piece for the car service centre. The price grid already
 * lists periodic service by body type, and the booking module already
 * takes a date. Neither answers the question that brings somebody to a
 * workshop's website at eleven at night, which is "the car has done
 * 58,000 km, is it the big service or the small one, and what will it
 * cost me".
 *
 * This is also what separates the car demo from the bike demo. A bike is
 * walk in and wait, so that page shows a live queue. A car is booked in
 * for a day against a service schedule, so this page shows the schedule.
 * Same trade group, opposite question.
 *
 * WHY A CLIENT COMPONENT
 *
 * One number in, one band out. It could be a table of every interval,
 * and the table is in fact still rendered underneath for anyone who
 * wants to read ahead or has JavaScript off. The input just jumps you to
 * your row.
 *
 * THE NUMBERS ARE INDICATIVE AND THE COPY SAYS SO. A workshop that
 * quotes a firm price against an odometer reading alone, without seeing
 * the car, is a workshop that will surprise you at the counter.
 */
import { useState } from 'react';

export default function ServiceInterval({ intervals, everyKm = 10000, title = 'What is due', lede, note, id = 'due' }) {
    const [km, setKm] = useState('');

    if (!intervals?.length) return null;

    const value = Number(km.replace(/[^\d]/g, ''));
    const valid = km !== '' && Number.isFinite(value) && value > 0;

    /* Which interval this reading falls into. Services repeat on a cycle,
       so the reading is folded back into one cycle length rather than
       running off the end of the table. */
    let due = null;
    let nextAt = null;
    if (valid) {
        const cycle = intervals.length * everyKm;
        const into = value % cycle;
        const index = Math.floor(into / everyKm);
        due = intervals[index];
        nextAt = value + (everyKm - (value % everyKm));
    }

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-due__form">
                    <label className="vd-due__field">
                        <span className="vd-due__label">Odometer reading</span>
                        <span className="vd-due__inputWrap">
                            <input
                                className="vd-due__input"
                                /* Not type=number: it brings a spinner nobody
                                   wants and rejects "58,000" outright. */
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="58000"
                                value={km}
                                onChange={(e) => setKm(e.target.value)}
                                aria-describedby={`${id}-hint`}
                            />
                            <span className="vd-due__unit" aria-hidden="true">km</span>
                        </span>
                    </label>
                    <p id={`${id}-hint`} className="vd-due__hint">
                        Roughly is fine. The schedule works in {everyKm.toLocaleString('en-IN')} km steps.
                    </p>
                </div>

                {/* Polite, so a screen reader hears the result without the
                    focus leaving the field being typed into. */}
                <div className="vd-due__out" role="status" aria-live="polite">
                    {valid && due && (
                        <div className="vd-due__card">
                            <span className="vd-due__cardLabel">At {value.toLocaleString('en-IN')} km</span>
                            <h3 className="vd-due__name">{due.name}</h3>
                            <p className="vd-due__price">{due.price}</p>
                            <ul className="vd-due__includes">
                                {due.includes.map((i) => (
                                    <li key={i}>{i}</li>
                                ))}
                            </ul>
                            <p className="vd-due__next">
                                Next one due around {nextAt.toLocaleString('en-IN')} km.
                            </p>
                        </div>
                    )}
                </div>

                {/* The full schedule, always rendered. This is what a visitor
                    with no JS sees, and what anyone planning ahead wants. */}
                <div className="vd-due__all">
                    <h3 className="vd-due__allH">The full schedule</h3>
                    <ol className="vd-due__list">
                        {intervals.map((iv, i) => (
                            <li key={iv.name} className="vd-due__row">
                                <span className="vd-due__at">
                                    {((i + 1) * everyKm).toLocaleString('en-IN')} km
                                </span>
                                <span className="vd-due__rowName">{iv.name}</span>
                                <span className="vd-due__rowPrice">{iv.price}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                {note && <p className="vd-due__note">{note}</p>}
            </div>
        </section>
    );
}
