'use client';

/**
 * A consignment tracker for the freight demo.
 *
 * The bespoke piece for logistics, and the one interaction that makes a
 * freight prospect say "mine could do that". Every transporter's site has
 * one; almost none of them work.
 *
 * NOTHING IS SENT ANYWHERE. The reference numbers are in the demo's own
 * data and the lookup is a find over an array of three. There is no
 * network call, no API, and nothing for the CSP to allow. A wrong number
 * gets a real "not found" state, because a tracker that pretends every
 * input is valid is a worse demonstration than one that does not.
 *
 * Reference numbers stay under twelve digits and carry a letter prefix,
 * because check-brand-leak hard-fails on a bare twelve-digit run and it
 * is right to.
 */
import { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function Tracker({ consignments, title = 'Track a consignment', lede, id = 'track' }) {
    const [entry, setEntry] = useState('');
    const [result, setResult] = useState(null);

    if (!consignments?.length) return null;

    function look(e) {
        e.preventDefault();
        const key = entry.trim().toUpperCase();
        if (!key) return;
        setResult(consignments.find((c) => c.ref.toUpperCase() === key) ?? 'none');
    }

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <form className="vd-track__form" onSubmit={look}>
                    <label className="vd-track__label" htmlFor="track-ref">
                        Consignment number
                    </label>
                    <div className="vd-track__row">
                        <input
                            id="track-ref"
                            className="vd-track__input"
                            value={entry}
                            onChange={(e) => setEntry(e.target.value)}
                            placeholder={consignments[0].ref}
                            autoComplete="off"
                            spellCheck="false"
                        />
                        <button type="submit" className="vd-btn vd-btn--primary">
                            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
                            Track
                        </button>
                    </div>
                    <p className="vd-track__hint">
                        Try {consignments.map((c) => c.ref).join(' or ')}.
                    </p>
                </form>

                {result === 'none' && (
                    <p className="vd-track__miss" role="status">
                        No consignment with that number. Check the digits on
                        your receipt, or send it to us and we will look.
                    </p>
                )}

                {result && result !== 'none' && (
                    <div className="vd-track__out" role="status">
                        <div className="vd-track__head">
                            <span className="vd-track__ref">{result.ref}</span>
                            <span className="vd-track__route">{result.route}</span>
                        </div>

                        <ol className="vd-track__steps">
                            {result.steps.map((s, i) => (
                                <li
                                    key={s.at}
                                    className={`vd-track__step${i === result.steps.length - 1 ? ' vd-track__step--now' : ''}`}
                                >
                                    <span className="vd-track__when">{s.at}</span>
                                    <span className="vd-track__where">{s.where}</span>
                                    <span className="vd-track__what">{s.what}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </section>
    );
}
