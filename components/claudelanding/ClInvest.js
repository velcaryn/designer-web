/**
 * The price band.
 *
 * WHY A NUMBER APPEARS ON THE PAGE AT ALL
 *
 * Price is the objection that ends most enquiries before they start. A
 * shop owner who cannot guess whether a site costs twenty thousand or
 * two lakh assumes the worse number and never writes. Answering it in
 * public costs a few price-shoppers and saves every enquiry that would
 * otherwise not have happened.
 *
 * WHY IT IS A BAND AND NOT A TABLE
 *
 * A pricing table invites line-item comparison against whoever is
 * cheapest, and turns a conversation into a procurement exercise. A band
 * plus the three things that actually move it answers the question
 * without starting that.
 *
 * NO TIMELINE. CLAUDE.md permits delivery estimates only inside the
 * estimator, where the number is clamped against a scope the visitor
 * selected. There is no estimator, so there is no number of weeks here.
 *
 * Server component: nothing on it moves, and the numbers come from
 * config at build time.
 */
import { Check } from '@phosphor-icons/react/ssr';
import { pricing } from '@/config/site';
import Reveal from '@/components/Reveal';

export default function ClInvest() {
    return (
        <section id="invest" className="nv-section nv-ground--paper">
            <div className="nv-shell">
                <Reveal className="cl-invest">
                    <div className="cl-invest__head">
                        <span className="nv-eyebrow">What it costs</span>
                        <h2 className="cl-h2">
                            Most sites land between
                            {' '}
                            <span className="cl-invest__figure">
                                {pricing.currency}
                                {' '}
                                {pricing.from}
                            </span>
                            {' '}
                            and
                            {' '}
                            <span className="cl-invest__figure">
                                {pricing.currency}
                                {' '}
                                {pricing.to}
                            </span>
                            .
                        </h2>
                        <p className="nv-lede">
                            You get a fixed number before anything starts,
                            not an hourly rate that moves while you watch.
                        </p>
                    </div>

                    <div className="cl-invest__body">
                        <p className="cl-invest__label">
                            What moves it inside that range
                        </p>
                        <ul className="cl-invest__factors">
                            {pricing.factors.map((factor) => (
                                <li key={factor} className="cl-invest__factor">
                                    <Check size={18} weight="bold" aria-hidden="true" />
                                    <span>{factor}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="cl-invest__note">{pricing.cloudNote}</p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
