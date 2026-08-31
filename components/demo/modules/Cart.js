'use client';

/**
 * The counter, and the order it composes.
 *
 * THIS IS THE THING THE DEMO EXISTS TO DEMONSTRATE.
 *
 * A prospect who taps plus three times and watches a total add up is
 * being shown their own shop working. An earlier draft of the plan said
 * every CTA on a demo should be inert, which was over-cautious and wrong:
 * a page whose buttons do nothing feels broken, and broken is the
 * opposite of what is being sold.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It never posts anywhere. State lives in useState and the output is a
 * string. That is what keeps it clear of the CSP's form-action surface
 * and out of any credential handling: there is no server involved at all.
 *
 * And the send button does NOT open WhatsApp. There is no bakery behind
 * this, so a live wa.me link would either go nowhere or reach a real
 * person who owns that number, on a page built to be forwarded. Instead
 * the sheet shows the message the customer WOULD have sent, which
 * demonstrates the mechanic better than a dead link and lets the prospect
 * read what lands on their own phone.
 */
import { useMemo, useState } from 'react';
import { Plus, Minus, WhatsappLogo, X } from '@phosphor-icons/react';
import { orderMessage, rupees } from '@/content/demos/whatsapp';

export default function Cart({ groups, business, area, module: mod }) {
    const [qty, setQty] = useState({});
    const [sheet, setSheet] = useState(false);

    const lines = useMemo(() => {
        const out = [];
        groups.forEach((g) =>
            g.items.forEach((item) => {
                const n = qty[item.name] || 0;
                if (n > 0) out.push({ name: item.name, price: item.price, qty: n });
            }),
        );
        return out;
    }, [groups, qty]);

    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const count = lines.reduce((s, l) => s + l.qty, 0);

    const bump = (name, by) =>
        setQty((q) => {
            const next = Math.max(0, (q[name] || 0) + by);
            return { ...q, [name]: next };
        });

    return (
        <section id="counter" className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{mod.title}</h2>
                <p className="vd-lede">{mod.subtitle}</p>

                <div className="vd-menu">
                    {groups.map((g) => (
                        <div key={g.label} className="vd-menu__group">
                            <h3 className="vd-menu__label">{g.label}</h3>
                            <ul className="vd-menu__list">
                                {g.items.map((item) => {
                                    const n = qty[item.name] || 0;
                                    return (
                                        <li key={item.name} className="vd-menu__row">
                                            <span className="vd-menu__info">
                                                <span className="vd-menu__name">{item.name}</span>
                                                <span className="vd-menu__note">{item.note}</span>
                                            </span>

                                            <span className="vd-menu__price">
                                                Rs {rupees(item.price)}
                                            </span>

                                            <span className="vd-qty">
                                                <button
                                                    type="button"
                                                    className="vd-qty__btn"
                                                    onClick={() => bump(item.name, -1)}
                                                    disabled={n === 0}
                                                    aria-label={`One less ${item.name}`}
                                                >
                                                    <Minus size={15} weight="bold" />
                                                </button>
                                                <span
                                                    className="vd-qty__n"
                                                    aria-live="polite"
                                                    aria-label={`${n} ${item.name}`}
                                                >
                                                    {n}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="vd-qty__btn"
                                                    onClick={() => bump(item.name, 1)}
                                                    aria-label={`One more ${item.name}`}
                                                >
                                                    <Plus size={15} weight="bold" />
                                                </button>
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* The bar only exists once there is something in the basket,
                so it never sits over the page doing nothing. */}
            {count > 0 && (
                <div className="vd-basket">
                    <div className="vd-basket__inner">
                        <span className="vd-basket__count">
                            {count} item{count === 1 ? '' : 's'}
                            <strong>Rs {rupees(total)}</strong>
                        </span>
                        <button
                            type="button"
                            className="vd-btn vd-btn--primary"
                            onClick={() => setSheet(true)}
                        >
                            <WhatsappLogo size={18} weight="fill" aria-hidden="true" />
                            Send the order
                        </button>
                    </div>
                </div>
            )}

            {sheet && (
                <div className="vd-sheet" role="dialog" aria-modal="true" aria-label="Your order">
                    <button
                        type="button"
                        className="vd-sheet__scrim"
                        aria-label="Close"
                        onClick={() => setSheet(false)}
                    />
                    <div className="vd-sheet__panel">
                        <div className="vd-sheet__head">
                            <h3 className="vd-sheet__title">This is what the shop receives</h3>
                            <button
                                type="button"
                                className="vd-sheet__close"
                                onClick={() => setSheet(false)}
                                aria-label="Close"
                            >
                                <X size={18} weight="bold" />
                            </button>
                        </div>

                        <pre className="vd-sheet__msg">
                            {orderMessage({ business, lines, area })}
                        </pre>

                        <p className="vd-sheet__note">
                            On a real site this button opens WhatsApp with
                            the order already typed, addressed to the shop.
                            Nothing has been sent here: this business is
                            invented.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}
