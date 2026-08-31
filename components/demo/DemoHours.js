'use client';

/**
 * The live open/closed pill.
 *
 * WHY IT IS CLIENT-SIDE AND WHY THE SERVER STILL RENDERS SOMETHING
 *
 * The answer depends on what time it is where the visitor is, which the
 * server cannot know at build time: these pages are static, generated
 * once, and served for weeks. So the status has to be computed in the
 * browser.
 *
 * But a component that renders nothing until it hydrates leaves a hole in
 * the layout that fills in a moment later, which is a layout shift on the
 * exact page whose pitch is that it loads properly. So the server renders
 * the plain opening hours, at the same size, and the client swaps in the
 * live status on top. Nothing moves.
 *
 * IST, not the visitor's clock. A shop in Indiranagar is open on
 * Bengaluru time regardless of where the person looking at it happens to
 * be, and a prospect showing this to someone abroad should not see it
 * claim to be shut.
 */
import { useEffect, useState } from 'react';

function nowInIndia() {
    /* en-GB gives 24-hour parts, which parse without am/pm handling. */
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());

    const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
    return {
        day: get('weekday'),
        hours: Number(get('hour')) + Number(get('minute')) / 60,
    };
}

function windowForToday(hours, day) {
    /* Sunday is the one that usually differs, so it is matched first and
       everything else falls back to the weekday entry. */
    const sunday = hours.find((h) => /sun/i.test(h.days));
    if (day === 'Sun' && sunday) return sunday;
    return hours.find((h) => !/^sun/i.test(h.days)) ?? hours[0];
}

function clock(v) {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    const suffix = h >= 12 ? 'pm' : 'am';
    const display = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${display} ${suffix}` : `${display}.${String(m).padStart(2, '0')} ${suffix}`;
}

export default function DemoHours({ hours }) {
    const [state, setState] = useState(null);

    useEffect(() => {
        const read = () => {
            const { day, hours: h } = nowInIndia();
            const today = windowForToday(hours, day);
            if (!today) return setState(null);
            const open = h >= today.open && h < today.close;
            return setState({
                open,
                label: open
                    ? `Open now, closes ${clock(today.close)}`
                    : `Closed, opens ${clock(today.open)}`,
            });
        };
        read();
        /* A minute is enough resolution for a shop's opening hours and
           costs nothing. */
        const id = setInterval(read, 60000);
        return () => clearInterval(id);
    }, [hours]);

    /* The server render, and the fallback if anything above fails. Same
       shape and roughly the same width as the live pill, so the swap does
       not move the page. */
    if (!state) {
        return (
            <span className="vd-hours">
                <span className="vd-hours__dot vd-hours__dot--idle" aria-hidden="true" />
                {hours[0].days}, {clock(hours[0].open)} to {clock(hours[0].close)}
            </span>
        );
    }

    return (
        <span className={`vd-hours${state.open ? ' vd-hours--open' : ''}`}>
            <span
                className={`vd-hours__dot${state.open ? ' vd-hours__dot--on' : ''}`}
                aria-hidden="true"
            />
            {state.label}
        </span>
    );
}
