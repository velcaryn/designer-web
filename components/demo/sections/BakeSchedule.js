'use client';

/**
 * What is out of the oven, right now.
 *
 * The bespoke piece for the bakery, and the one thing on that page a
 * prospect will actually screenshot. A bakery's whole rhythm is the day,
 * and a site that knows the time of day is a site that feels alive.
 *
 * WHY IT IS A CLIENT COMPONENT WHEN EIGHT OF NINE SECTIONS ARE NOT
 *
 * The answer depends on the clock, and these pages are static: generated
 * once, served for weeks. The same reasoning as DemoHours, and the same
 * safeguard: the server renders the full timetable with nothing marked,
 * and the client marks the current slot on top. Nothing moves, nothing
 * shifts, and a visitor with no JS still gets the schedule.
 *
 * IST, not the visitor's clock. A bakery in Indiranagar bakes on
 * Bengaluru time no matter who is looking.
 */
import { useEffect, useState } from 'react';

function hourNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());
    const get = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return get('hour') + get('minute') / 60;
}

export default function BakeSchedule({ slots, title = 'Out of the oven', lede, id = 'schedule' }) {
    const [now, setNow] = useState(null);

    useEffect(() => {
        const read = () => setNow(hourNow());
        read();
        const t = setInterval(read, 60000);
        return () => clearInterval(t);
    }, []);

    if (!slots?.length) return null;

    /* The slot whose window contains the current hour. Null on the server
       and until the first tick, which is what keeps hydration identical. */
    const activeIndex = now === null
        ? -1
        : slots.findIndex((s) => now >= s.from && now < s.to);

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <ol className="vd-bake">
                    {slots.map((s, i) => (
                        <li
                            key={s.time}
                            className={`vd-bake__slot${i === activeIndex ? ' vd-bake__slot--now' : ''}`}
                        >
                            <span className="vd-bake__time">{s.time}</span>
                            <span className="vd-bake__what">
                                <span className="vd-bake__name">{s.what}</span>
                                {s.note && <span className="vd-bake__note">{s.note}</span>}
                            </span>
                            {i === activeIndex && (
                                <span className="vd-bake__now">Now</span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
