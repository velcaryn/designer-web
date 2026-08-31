'use client';

/**
 * A live workshop board: what is on the ramps right now.
 *
 * The bespoke piece for the bike service demo, and the reason that page
 * is not the car service page with different prices. A car goes in for
 * the day and the owner wants a booking; a bike is walk in, wait, ride
 * away, and the only question that matters is how long the wait is.
 *
 * WHY IT IS A CLIENT COMPONENT
 *
 * The wait depends on the clock, and these pages are static: generated
 * once, served for weeks. Same reasoning as DemoHours, and the same
 * safeguard. The server renders the board with the queue but no "now"
 * marker and no minutes; the client fills those in. Nothing moves,
 * nothing shifts, and a visitor with no JS still sees the queue.
 *
 * The times are derived from the data rather than stored, so the board
 * never shows a stale hour. IST, because the workshop is in Thoothukudi
 * whoever is looking at it.
 */
import { useEffect, useState } from 'react';

function minutesNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());
    const get = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return get('hour') * 60 + get('minute');
}

function clock(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const suffix = h >= 12 ? 'pm' : 'am';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}.${String(m).padStart(2, '0')} ${suffix}`;
}

export default function JobBoard({ jobs, title = 'On the ramps', lede, id = 'board' }) {
    const [now, setNow] = useState(null);

    useEffect(() => {
        const read = () => setNow(minutesNow());
        read();
        const t = setInterval(read, 60000);
        return () => clearInterval(t);
    }, []);

    if (!jobs?.length) return null;

    /* Each job takes its stated minutes; the queue is cumulative from the
       first one still running. Written as a reduce rather than a counter
       mutated inside map, because reassigning a variable during render is
       exactly the pattern that behaves differently on a re-render.
       Before hydration `now` is null and the board renders without times,
       which keeps the server and client markup identical. */
    const rows = jobs.reduce((acc, j) => {
        const startsAt = acc.length ? acc[acc.length - 1].endsAt : 0;
        acc.push({ ...j, startsAt, endsAt: startsAt + j.mins });
        return acc;
    }, []);

    const totalWait = rows.length ? rows[rows.length - 1].endsAt : 0;

    const waitFor = (row) => (now === null ? null : row.startsAt);

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <ol className="vd-board">
                    {rows.map((r, i) => {
                        const wait = waitFor(r);
                        return (
                            <li
                                key={r.what + i}
                                className={`vd-board__row${i === 0 ? ' vd-board__row--now' : ''}`}
                            >
                                <span className="vd-board__bay">
                                    {i === 0 ? 'On the ramp' : `Queue ${i}`}
                                </span>

                                <span className="vd-board__job">
                                    <span className="vd-board__what">{r.what}</span>
                                    <span className="vd-board__bike">{r.bike}</span>
                                </span>

                                <span className="vd-board__wait">
                                    {i === 0
                                        ? `about ${r.mins} min left`
                                        : wait === null
                                            ? `${r.mins} min job`
                                            : `starts in about ${wait} min`}
                                </span>
                            </li>
                        );
                    })}
                </ol>

                <p className="vd-board__foot">
                    {now === null
                        ? 'Walk in any time. The board shows what is ahead of you.'
                        : `If you walked in now you would be on a ramp by about ${clock(now + totalWait)}.`}
                </p>
            </div>
        </section>
    );
}
