'use client';

/**
 * A rate calculator for the B2B demos.
 *
 * The warehouse prices pallet positions per month; the home stay prices
 * room nights. Same component, different labels and rates from the data.
 *
 * WHY A RANGE INPUT AND NOT A NUMBER FIELD
 *
 * A number field on a phone opens a keypad and demands an exact figure
 * before it will show anything. A range slider gives a number
 * immediately and invites dragging, which is what makes a prospect
 * actually try it. The exact value is displayed as they drag, so nothing
 * is lost.
 *
 * The output is a real arithmetic result, not a placeholder. If a
 * prospect can multiply the rate by the quantity in their head and get
 * the same answer, the demo is trustworthy; if they cannot, it is worse
 * than showing nothing.
 */
import { useState } from 'react';
import { WhatsappLogo, X } from '@phosphor-icons/react';
import { rupees } from '@/content/demos/whatsapp';

export default function Tariff({ business, module: mod }) {
    const [qty, setQty] = useState(Math.round((mod.min + mod.max) / 6 / mod.step) * mod.step);
    const [choice, setChoice] = useState(mod.options[0].id);
    const [addons, setAddons] = useState([]);
    const [sheet, setSheet] = useState(false);

    const base = mod.options.find((o) => o.id === choice);
    const picked = mod.addons.filter((a) => addons.includes(a.id));
    const perUnit = base.rate + picked.reduce((s, a) => s + a.rate, 0);
    const total = perUnit * qty;

    const toggle = (id) =>
        setAddons((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

    const message = [
        `Hello ${business}, I would like a quote.`,
        '',
        `${qty} ${mod.unitLabel}`,
        `Type: ${base.label}`,
        picked.length ? `Also: ${picked.map((a) => a.label).join(', ')}` : null,
        '',
        `Indicative ${mod.ratePeriod ?? 'per month'}: Rs ${rupees(total)}`,
        'Name: ',
    ]
        .filter((l) => l !== null)
        .join('\n');

    return (
        <section id="rate" className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{mod.title}</h2>
                <p className="vd-lede">{mod.subtitle}</p>

                <div className="vd-tariff">
                    <div className="vd-tariff__controls">
                        <div className="vd-book__row">
                            <label className="vd-book__legend" htmlFor="tariff-qty">
                                How many {mod.unitLabel}
                            </label>
                            <input
                                id="tariff-qty"
                                type="range"
                                className="vd-range"
                                min={mod.min}
                                max={mod.max}
                                step={mod.step}
                                value={qty}
                                onChange={(e) => setQty(Number(e.target.value))}
                            />
                            <output className="vd-tariff__qty">{qty}</output>
                        </div>

                        <div className="vd-book__row">
                            <p className="vd-book__legend">Type</p>
                            <div className="vd-book__opts" role="group" aria-label="Type">
                                {mod.options.map((o) => (
                                    <button
                                        key={o.id}
                                        type="button"
                                        className={`vd-chip${o.id === choice ? ' vd-chip--active' : ''}`}
                                        aria-pressed={o.id === choice}
                                        onClick={() => setChoice(o.id)}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                            <p className="vd-tariff__note">{base.note}</p>
                        </div>

                        <div className="vd-book__row">
                            <p className="vd-book__legend">Add</p>
                            <div className="vd-book__opts" role="group" aria-label="Extras">
                                {mod.addons.map((a) => (
                                    <button
                                        key={a.id}
                                        type="button"
                                        className={`vd-chip${addons.includes(a.id) ? ' vd-chip--active' : ''}`}
                                        aria-pressed={addons.includes(a.id)}
                                        onClick={() => toggle(a.id)}
                                    >
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="vd-tariff__out">
                        {/* `unitLabel` is the quantity noun ("pallet
                            positions"); `ratePeriod` is what the rate is
                            per. Reusing unitLabel here would read
                            "Indicative, pallet positions". This was
                            hardcoded to "per month", which is wrong for
                            freight priced per consignment and for a home
                            stay priced per night. */}
                        <p className="vd-tariff__label">
                            Indicative, {mod.ratePeriod ?? 'per month'}
                        </p>
                        <p className="vd-tariff__total">Rs {rupees(total)}</p>
                        <p className="vd-tariff__break">
                            {qty} x Rs {rupees(perUnit)}
                        </p>
                        <button
                            type="button"
                            className="vd-btn vd-btn--primary"
                            onClick={() => setSheet(true)}
                        >
                            <WhatsappLogo size={18} weight="fill" aria-hidden="true" />
                            Send this for a quote
                        </button>
                    </div>
                </div>
            </div>

            {sheet && (
                <div className="vd-sheet" role="dialog" aria-modal="true" aria-label="Your enquiry">
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
                            On a real site this opens WhatsApp with the
                            enquiry already typed. Nothing has been sent
                            here: this business is invented.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}
