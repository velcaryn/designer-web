'use client';

/**
 * How much space do I need, and roughly what does it cost.
 *
 * The bespoke piece for the warehouse. The spec table publishes the
 * building and the tariff module publishes the rates, and between them
 * they still do not answer the only question a prospect has, which is
 * "I have 300 pallets for four months, what am I looking at".
 *
 * Making them do that arithmetic themselves, on a phone, is how a
 * warehouse loses an enquiry to whoever answers it first.
 *
 * WHY A CLIENT COMPONENT
 *
 * Two numbers and a multiplication. It is genuinely a calculator and
 * there is no server-rendered version that helps, so the section renders
 * the rate card statically underneath: no JS still leaves a reader with
 * the per-pallet rate and the minimum term, which is enough to work it
 * out on paper.
 *
 * THE OUTPUT IS AN ESTIMATE AND SAYS SO TWICE. Warehousing quotes turn
 * on handling frequency, stacking and how long goods actually dwell,
 * none of which two inputs can know.
 */
import { useState } from 'react';

export default function SpaceCalculator({
    ratePerPallet,
    sqftPerPallet = 12,
    minMonths = 3,
    capacity,
    title = 'What would it cost',
    lede,
    note,
    id = 'space',
}) {
    const [pallets, setPallets] = useState('');
    const [months, setMonths] = useState('');

    if (!ratePerPallet) return null;

    const p = Number(String(pallets).replace(/[^\d]/g, ''));
    const m = Number(String(months).replace(/[^\d]/g, ''));
    const ready = p > 0 && m > 0;

    const overCapacity = capacity && p > capacity;
    const chargedMonths = ready ? Math.max(m, minMonths) : 0;
    const monthly = ready ? p * ratePerPallet : 0;
    const total = monthly * chargedMonths;
    const sqft = ready ? p * sqftPerPallet : 0;

    const money = (n) => `Rs ${n.toLocaleString('en-IN')}`;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-space__form">
                    <label className="vd-space__field">
                        <span className="vd-space__label">Pallets</span>
                        <input
                            className="vd-space__input"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="300"
                            value={pallets}
                            onChange={(e) => setPallets(e.target.value)}
                        />
                    </label>

                    <label className="vd-space__field">
                        <span className="vd-space__label">Months</span>
                        <input
                            className="vd-space__input"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="4"
                            value={months}
                            onChange={(e) => setMonths(e.target.value)}
                        />
                    </label>
                </div>

                <div className="vd-space__out" role="status" aria-live="polite">
                    {ready && (
                        <div className="vd-space__card">
                            {overCapacity ? (
                                <p className="vd-space__over">
                                    That is more than the {capacity.toLocaleString('en-IN')} pallet
                                    positions we hold. Ask anyway: overflow goes to the second
                                    block and we will quote it properly.
                                </p>
                            ) : (
                                <>
                                    <dl className="vd-space__figures">
                                        <div>
                                            <dt>Floor space</dt>
                                            <dd>{sqft.toLocaleString('en-IN')} sq ft</dd>
                                        </div>
                                        <div>
                                            <dt>Per month</dt>
                                            <dd>{money(monthly)}</dd>
                                        </div>
                                        <div>
                                            <dt>
                                                Over {chargedMonths} month
                                                {chargedMonths === 1 ? '' : 's'}
                                            </dt>
                                            <dd>{money(total)}</dd>
                                        </div>
                                    </dl>
                                    {m < minMonths && (
                                        <p className="vd-space__min">
                                            Charged at the {minMonths} month minimum term.
                                        </p>
                                    )}
                                    <p className="vd-space__caveat">
                                        An estimate, not a quote. Handling frequency and how
                                        goods stack change it in both directions.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Always rendered: the numbers behind the calculator, so it
                    is checkable and so no-JS still gets the rate. */}
                <dl className="vd-space__rates">
                    <div>
                        <dt>Rate</dt>
                        <dd>{money(ratePerPallet)} per pallet, per month</dd>
                    </div>
                    <div>
                        <dt>Space allowed</dt>
                        <dd>{sqftPerPallet} sq ft per pallet position</dd>
                    </div>
                    <div>
                        <dt>Minimum term</dt>
                        <dd>{minMonths} months</dd>
                    </div>
                </dl>

                {note && <p className="vd-space__note">{note}</p>}
            </div>
        </section>
    );
}
