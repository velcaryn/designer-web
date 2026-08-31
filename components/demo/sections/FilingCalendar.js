'use client';

/**
 * The statutory calendar, with the next deadline picked out.
 *
 * The bespoke piece for the accountant demo. A CA's client does not
 * browse services; they arrive with one question, usually late at night,
 * which is "have I missed something". This answers it in one glance.
 *
 * WHY IT IS A CLIENT COMPONENT, AND WHAT THE SERVER RENDERS
 *
 * These pages are static: built once, served for weeks. A "next due"
 * marker baked in at build time would be wrong within days, and wrong
 * about deadlines is worse than absent. Same pattern as JobBoard and
 * DemoHours: the server renders the full calendar with every date
 * visible and no highlight; the client marks which one is next and how
 * many days away it is. Nothing reflows, and a visitor with JS disabled
 * still gets the complete, correct calendar.
 *
 * THE DATES ARE REAL, THE FIRM IS NOT.
 *
 * GSTR-1 on the 11th, GSTR-3B on the 20th, TDS on the 7th: these are the
 * actual statutory dates every business in India works to. Inventing
 * them would make the page useless to the one reader most likely to
 * check. What is invented is the firm, and there is no membership
 * number anywhere near this file.
 *
 * Recurring monthly dates only. Annual ones (ITR, audit) shift with
 * extensions almost every year, and a demo that states a stale annual
 * deadline as fact is worse than one that omits it.
 */
import { useSyncExternalStore } from 'react';

/* Day of the month in IST, and the month length, so "days away" is
   computed against the reader's actual calendar rather than the build. */
function istToday() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).formatToParts(new Date());
    const get = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return { day: get('day'), month: get('month'), year: get('year') };
}

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

/* The clock is an external store, so it is read with the hook built for
   external stores rather than with setState inside an effect. That is not
   a lint workaround: a date set from an effect renders once with the
   wrong value and then corrects itself, which is the cascading render the
   rule is warning about.

   getSnapshot must be referentially stable or React re-renders forever,
   so the formatted day string is cached and only rebuilt when it changes. */
let cached = null;

function snapshot() {
    const t = istToday();
    const key = `${t.year}-${t.month}-${t.day}`;
    if (!cached || cached.key !== key) cached = { key, ...t };
    return cached;
}

function subscribe(onChange) {
    /* Once a minute is plenty for a date, and it catches midnight. The
       visibility listener catches a phone waking after being left open
       overnight, which is the common case for a page kept in a tab. */
    const t = setInterval(onChange, 60000);
    document.addEventListener('visibilitychange', onChange);
    return () => {
        clearInterval(t);
        document.removeEventListener('visibilitychange', onChange);
    };
}

/* The server has no clock the client will agree with, so it renders the
   calendar with no marker at all and the client adds it. */
const serverSnapshot = () => null;

export default function FilingCalendar({ filings, title = 'The calendar', lede, note, id = 'calendar' }) {
    /* null on the server and on the first client render, so the two
       agree; the marker appears on the next tick. */
    const today = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

    if (!filings?.length) return null;

    /* Which filing is next, and how far away. Anything already past this
       month rolls to next month, which is what a reader means by "next". */
    let nextDay = null;
    let awayText = null;
    if (today) {
        const upcoming = filings
            .map((f) => f.day)
            .filter((d) => d >= today.day)
            .sort((a, b) => a - b);

        if (upcoming.length) {
            nextDay = upcoming[0];
            const away = nextDay - today.day;
            awayText = away === 0 ? 'today' : away === 1 ? 'tomorrow' : `in ${away} days`;
        } else {
            const first = Math.min(...filings.map((f) => f.day));
            nextDay = first;
            const away = daysInMonth(today.month, today.year) - today.day + first;
            awayText = `in ${away} days`;
        }
    }

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <ol className="vd-cal">
                    {filings.map((f) => {
                        const isNext = nextDay === f.day;
                        return (
                            <li
                                key={`${f.day}-${f.name}`}
                                className={`vd-cal__row${isNext ? ' is-next' : ''}`}
                            >
                                <span className="vd-cal__day" aria-hidden="true">
                                    {f.day}
                                </span>
                                <span className="vd-cal__body">
                                    <span className="vd-cal__name">
                                        {/* Visible date is decorative above; this
                                            carries it for a screen reader. */}
                                        <span className="vd-sr-only">Day {f.day} of the month. </span>
                                        {f.name}
                                    </span>
                                    <span className="vd-cal__who">{f.who}</span>
                                </span>
                                {isNext && (
                                    <span className="vd-cal__next">Next, {awayText}</span>
                                )}
                            </li>
                        );
                    })}
                </ol>

                {note && <p className="vd-cal__note">{note}</p>}
            </div>
        </section>
    );
}
