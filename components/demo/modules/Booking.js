'use client';

/**
 * Book a table, a room, a slot, a seat.
 *
 * Four demos share this: the restaurant books a table, the hotel a room,
 * the salon an appointment, the coaching centre a seat at an entrance
 * test. The labels come from the demo's data, so the component knows
 * nothing about what is being booked.
 *
 * WHY IT IS A SET OF BUTTONS AND NOT A DATE PICKER
 *
 * A native date input on Android opens a full-screen calendar, which on a
 * demo is three taps and a dismissal before anything happens. Real
 * restaurant booking flows use exactly this: today, tomorrow, or pick a
 * day, then a row of times. It is faster on a phone and it demonstrates
 * better, which on this page are the same requirement.
 *
 * NOTHING IS SENT. State lives in useState, the output is a string, and
 * the confirm button opens a sheet showing the message rather than a
 * chat: there is no restaurant behind this and a live wa.me link would
 * reach whoever really owns that number. Same reasoning as Cart.js.
 */
import { useState } from 'react';
import { WhatsappLogo, X, Check } from '@phosphor-icons/react';
import { bookingMessage } from '@/content/demos/whatsapp';

/* Today and tomorrow named rather than dated, plus the two days after by
   weekday. Computed in the browser so the demo never shows a date that
   has already passed, which is the tell that kills a demo's credibility. */
function upcomingDays() {
    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
    });
    const out = [];
    for (let i = 0; i < 4; i += 1) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmt.format(d).split(' ')[0];
        out.push({ id: `d${i}`, label, full: fmt.format(d) });
    }
    return out;
}

export default function Booking({ business, module: mod }) {
    const [days] = useState(upcomingDays);
    const [day, setDay] = useState(days[0]);
    const [slot, setSlot] = useState(mod.slots[0]);
    const [size, setSize] = useState(mod.sizes[0]);
    const [pref, setPref] = useState(mod.preferences[0]);
    const [sheet, setSheet] = useState(false);

    const message = bookingMessage({
        business,
        what: mod.what,
        when: `${day.full}, ${slot}`,
        party: size,
        note: pref === mod.preferences[0] ? null : pref,
    });

    return (
        <section id="book" className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{mod.title}</h2>
                <p className="vd-lede">{mod.subtitle}</p>

                <div className="vd-book">
                    {/* Legends from data. A dental slot, a restaurant
                        table and a coaching-centre assessment do not ask
                        the same question. */}
                    <Choice
                        legend={mod.legends?.day ?? 'Which day'}
                        options={days.map((d) => ({ id: d.id, label: d.label }))}
                        value={day.id}
                        onPick={(id) => setDay(days.find((d) => d.id === id))}
                    />
                    <Choice
                        legend={mod.legends?.time ?? 'What time'}
                        options={mod.slots.map((s) => ({ id: s, label: s }))}
                        value={slot}
                        onPick={setSlot}
                    />
                    <Choice
                        legend={mod.legends?.size ?? 'How many'}
                        options={mod.sizes.map((s) => ({ id: s, label: s }))}
                        value={size}
                        onPick={setSize}
                    />
                    <Choice
                        legend={mod.legends?.note ?? 'Anything to note'}
                        options={mod.preferences.map((s) => ({ id: s, label: s }))}
                        value={pref}
                        onPick={setPref}
                    />
                </div>

                <div className="vd-book__foot">
                    <p className="vd-book__summary">
                        {day.full}
                        {' at '}
                        {slot}
                        {', '}
                        {size.toLowerCase()}
                    </p>
                    <button
                        type="button"
                        className="vd-btn vd-btn--primary"
                        onClick={() => setSheet(true)}
                    >
                        <WhatsappLogo size={18} weight="fill" aria-hidden="true" />
                        Confirm the booking
                    </button>
                </div>
            </div>

            {sheet && (
                <div className="vd-sheet" role="dialog" aria-modal="true" aria-label="Your booking">
                    <button
                        type="button"
                        className="vd-sheet__scrim"
                        aria-label="Close"
                        onClick={() => setSheet(false)}
                    />
                    <div className="vd-sheet__panel">
                        <div className="vd-sheet__head">
                            <h3 className="vd-sheet__title">This is what they receive</h3>
                            <button
                                type="button"
                                className="vd-sheet__close"
                                onClick={() => setSheet(false)}
                                aria-label="Close"
                            >
                                <X size={18} weight="bold" />
                            </button>
                        </div>
                        <pre className="vd-sheet__msg">{message}</pre>
                        <p className="vd-sheet__note">
                            On a real site this button opens WhatsApp with
                            the booking already typed. Nothing has been
                            sent here: this business is invented.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

/* A radio group in behaviour but buttons in markup, because a styled
   native radio at this size is more trouble than the semantics are worth
   here. aria-pressed carries the state to a screen reader. */
function Choice({ legend, options, value, onPick }) {
    return (
        <div className="vd-book__row">
            <p className="vd-book__legend">{legend}</p>
            <div className="vd-book__opts" role="group" aria-label={legend}>
                {options.map((o) => {
                    const on = o.id === value;
                    return (
                        <button
                            key={o.id}
                            type="button"
                            className={`vd-chip${on ? ' vd-chip--active' : ''}`}
                            aria-pressed={on}
                            onClick={() => onPick(o.id)}
                        >
                            {on && <Check size={14} weight="bold" aria-hidden="true" />}
                            {o.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
