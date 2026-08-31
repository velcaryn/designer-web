'use client';

/**
 * The token board: which number is being seen right now.
 *
 * The bespoke piece for the family clinic. The clinic and the hospital
 * both had a roster, which made two very different places look like the
 * same page: a list of doctors and their hours. But nobody chooses a
 * family clinic by consultant. They already know the doctor. The only
 * live question, standing in a doorway at ten in the morning, is how
 * long the wait is.
 *
 * Sister to JobBoard on the bike-service demo, and deliberately so: the
 * same insight (a queue is the honest thing to show) applied to a
 * completely different trade, which is what makes both pages feel built
 * rather than templated.
 *
 * WHY A CLIENT COMPONENT
 *
 * The current token depends on the clock and these pages are static.
 * Same pattern as JobBoard and FilingCalendar: the server renders the
 * session structure with no live number, the client fills it in. A
 * visitor with no JS still sees the sessions and the average time per
 * patient, which is most of the value.
 *
 * NOTHING HERE IS A PROMISE. The wait is described as an estimate in the
 * copy, because a clinic that guarantees a time and misses it is worse
 * than one that never said.
 */
import { useSyncExternalStore } from 'react';

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

/* getSnapshot has to be referentially stable, so the value is cached and
   only replaced when the minute actually changes. */
let cached = null;

function snapshot() {
    const m = minutesNow();
    if (cached !== m) cached = m;
    return cached;
}

function subscribe(onChange) {
    const t = setInterval(onChange, 30000);
    document.addEventListener('visibilitychange', onChange);
    return () => {
        clearInterval(t);
        document.removeEventListener('visibilitychange', onChange);
    };
}

const serverSnapshot = () => null;

function clock(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.round(mins % 60);
    const suffix = h >= 12 ? 'pm' : 'am';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}.${String(m).padStart(2, '0')} ${suffix}`;
}

export default function TokenQueue({ sessions, perPatient = 8, title = 'The queue', lede, note, id = 'queue' }) {
    const now = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

    if (!sessions?.length) return null;

    /* Which session is running, and how far into it we are. */
    const live = now === null
        ? null
        : sessions.find((s) => now >= s.from && now < s.to);

    let token = null;
    let waitText = null;
    if (live) {
        /* Tokens are issued from the start of the session at a steady
           rate. Deliberately simple arithmetic: a fake queue that
           simulates randomness would be lying with more effort. */
        token = Math.max(1, Math.floor((now - live.from) / perPatient) + 1);
        const ahead = Math.max(0, live.cap - token);
        waitText = ahead === 0
            ? 'The last token for this session has been called.'
            : `Walk in now and you would be about number ${token + 1}, seen by roughly ${clock(now + perPatient * 2)}.`;
    }

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                {/* The live panel. Absent entirely before hydration and
                    outside consulting hours, rather than showing a zero. */}
                {live && (
                    <div className="vd-token__live">
                        <span className="vd-token__label">Now being seen</span>
                        <span className="vd-token__num">{token}</span>
                        <span className="vd-token__wait">{waitText}</span>
                    </div>
                )}
                {now !== null && !live && (
                    <p className="vd-token__closed">
                        No session running at the moment. The next one is listed below.
                    </p>
                )}

                <ol className="vd-token__sessions">
                    {sessions.map((s) => {
                        const isLive = live && live.label === s.label;
                        return (
                            <li
                                key={s.label}
                                className={`vd-token__session${isLive ? ' is-live' : ''}`}
                            >
                                <span className="vd-token__sname">{s.label}</span>
                                <span className="vd-token__stime">
                                    {clock(s.from)} to {clock(s.to)}
                                </span>
                                <span className="vd-token__scap">{s.cap} tokens</span>
                            </li>
                        );
                    })}
                </ol>

                {note && <p className="vd-token__note">{note}</p>}
            </div>
        </section>
    );
}
