'use client';

/**
 * What came in this morning, and what it cost.
 *
 * The bespoke piece for the grocery shop. The story says the fresh
 * section is restocked before seven every morning and that this is why
 * the vegetables are worth walking past two other shops for. The page
 * asserted it and never showed it.
 *
 * A vegetable price board is the most ordinary object in Indian retail
 * and exactly right here: prices move daily, the shop already writes
 * them on a slate, and a customer planning the week's cooking genuinely
 * wants them. It is also the thing no online marketplace does well,
 * which is the grocery shop's actual argument.
 *
 * WHY A CLIENT COMPONENT
 *
 * Only for the timestamp. The board and the prices are server rendered;
 * the client adds "restocked at 6.40 this morning" against the real
 * clock, and how long ago that was. Same pattern as JobBoard and
 * FilingCalendar, for the same reason: these pages are static and a
 * baked-in time would be wrong the next day.
 *
 * PRICES ARE MARKED AS MOVING. A grocery price board that looks
 * authoritative and is three weeks stale annoys the exact customer it
 * was meant to win.
 */
import { useSyncExternalStore } from 'react';

const RESTOCK_MINS = 6 * 60 + 40;

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

let cached = null;

function snapshot() {
    const m = minutesNow();
    if (cached !== m) cached = m;
    return cached;
}

function subscribe(onChange) {
    const t = setInterval(onChange, 60000);
    document.addEventListener('visibilitychange', onChange);
    return () => {
        clearInterval(t);
        document.removeEventListener('visibilitychange', onChange);
    };
}

const serverSnapshot = () => null;

export default function FreshToday({ produce, title = 'Fresh today', lede, note, id = 'fresh' }) {
    const now = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

    if (!produce?.length) return null;

    let since = null;
    if (now !== null) {
        /* Before the morning delivery, the board is still yesterday's. */
        if (now < RESTOCK_MINS) {
            since = "Today's vegetables are being unloaded now. Prices below are yesterday's.";
        } else {
            const mins = now - RESTOCK_MINS;
            const hrs = Math.floor(mins / 60);
            since = hrs === 0
                ? 'Restocked less than an hour ago.'
                : `Restocked about ${hrs} hour${hrs === 1 ? '' : 's'} ago, at 6.40 this morning.`;
        }
    }

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                {since && <p className="vd-fresh__since">{since}</p>}

                <ul className="vd-fresh__board">
                    {produce.map((p) => (
                        <li key={p.name} className="vd-fresh__row">
                            <span className="vd-fresh__name">{p.name}</span>
                            <span className="vd-fresh__price">
                                {p.price}
                                <span className="vd-fresh__unit">{p.unit}</span>
                            </span>
                            {p.tag && <span className="vd-fresh__tag">{p.tag}</span>}
                        </li>
                    ))}
                </ul>

                {note && <p className="vd-fresh__note">{note}</p>}
            </div>
        </section>
    );
}
