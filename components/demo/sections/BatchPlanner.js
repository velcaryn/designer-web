'use client';

/**
 * Pick a class and a stream, see the batches and what is left.
 *
 * The bespoke piece for the coaching centre. The directory lists the
 * streams and the price grid lists the fees, but a parent choosing a
 * coaching centre in July has one practical question: is there a batch
 * that fits around school, and is there still room in it.
 *
 * Seats remaining is the honest version of urgency. It is a real number
 * a centre tracks anyway, unlike a countdown timer, and it is the thing
 * that actually makes a parent ring today rather than in September.
 *
 * WHY A CLIENT COMPONENT
 *
 * Two filters over a batch list. The unfiltered list is what the server
 * renders, so no JS still shows every batch.
 *
 * NO "ONLY 2 SEATS LEFT" MANUFACTURED SCARCITY. Where a batch is full it
 * says full and offers the waiting list, which is what a real centre
 * does and reads as more honest than a page where everything is nearly
 * gone.
 */
import { useState } from 'react';

const ANY = 'any';

export default function BatchPlanner({ batches, title = 'Find a batch', lede, note, id = 'batches' }) {
    const [level, setLevel] = useState(ANY);
    const [when, setWhen] = useState(ANY);

    if (!batches?.length) return null;

    const levels = [...new Set(batches.map((b) => b.level))];
    const whens = [...new Set(batches.map((b) => b.when))];

    const shown = batches.filter(
        (b) => (level === ANY || b.level === level) && (when === ANY || b.when === when),
    );

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-batch__controls">
                    <label className="vd-batch__field">
                        <span className="vd-batch__label">Class</span>
                        <select
                            className="vd-batch__select"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                        >
                            <option value={ANY}>Any</option>
                            {levels.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </label>

                    <label className="vd-batch__field">
                        <span className="vd-batch__label">When</span>
                        <select
                            className="vd-batch__select"
                            value={when}
                            onChange={(e) => setWhen(e.target.value)}
                        >
                            <option value={ANY}>Any</option>
                            {whens.map((w) => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <p className="vd-batch__count" role="status" aria-live="polite">
                    {shown.length === batches.length
                        ? `${batches.length} batches running`
                        : `${shown.length} of ${batches.length} batches`}
                </p>

                {shown.length === 0 ? (
                    <p className="vd-batch__none">
                        Nothing running in that combination this term. Ask, and if
                        four students want the same slot we will open one.
                    </p>
                ) : (
                    <div className="vd-batch__grid">
                        {shown.map((b) => {
                            const full = b.left === 0;
                            return (
                                <article
                                    key={b.name}
                                    className={`vd-batch__card${full ? ' is-full' : ''}`}
                                >
                                    <h3 className="vd-batch__name">{b.name}</h3>
                                    <p className="vd-batch__meta">
                                        {b.level}
                                        <span aria-hidden="true"> · </span>
                                        {b.when}
                                    </p>
                                    <p className="vd-batch__days">{b.days}</p>
                                    <p className="vd-batch__teacher">{b.teacher}</p>
                                    <p className={`vd-batch__seats${full ? ' is-full' : ''}`}>
                                        {full
                                            ? 'Full. Waiting list open.'
                                            : `${b.left} of ${b.size} seats left`}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                )}

                {note && <p className="vd-batch__note">{note}</p>}
            </div>
        </section>
    );
}
