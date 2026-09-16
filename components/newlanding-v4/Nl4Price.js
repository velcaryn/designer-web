/**
 * The three prices, with the middle one leading.
 *
 * The owner asked for watermelon's pricing-5 with the middle plan
 * highlighted, the monthly/yearly toggle removed, and our content and
 * currency. The registry returns 404 for it (as for every watermelon
 * item tried except the tooltip navbar), so this is the described design
 * on the house tokens: three cards, the Advanced plan in the middle
 * filled with the accent and lifted, no period switch, one price each.
 *
 * EVERY NUMBER COMES FROM config/site.js, as before. The dashboard line
 * on the Advanced plan carries three sub-points, kept in
 * `plans[1].details` keyed by the line's text so the older drafts, which
 * render `gets` as plain strings, are untouched.
 *
 * The rupee illustration sits beside the heading, tilted a few degrees
 * like everything else on this site that is slightly off-square, and
 * above the heading on a phone. Decorative; empty alt. Server component.
 */
import Link from 'next/link';
import { Check, RocketLaunch, ArrowRight } from '@phosphor-icons/react/ssr';
import { brand, plans, planPrice, waLink } from '@/config/site';
import Reveal from '@/components/Reveal';
import CurrencyRupeeIcon from '@/registry/itshover/currency-rupee-icon';

export default function Nl4Price() {
    return (
        <section className="nv-section nv-ground--paper" id="price">
            <div className="nv-shell">
                <Reveal className="nv4-price__head">
                    <div className="nv4-price__headText">
                        <h2 className="nv4-h2 nv4-price__title">
                            What It Costs?
                            <span className="nv4-price__rupee">
                                <CurrencyRupeeIcon size={40} strokeWidth={2.4} />
                            </span>
                        </h2>
                        <p className="nv-lede">
                            There is no monthly fee to keep the website switched
                            on. One fixed charge, paid once, agreed before anything
                            starts.
                        </p>
                    </div>
                    <div className="nv4-price__figure" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/SVGs/rupee.svg"
                            alt=""
                            width={262}
                            height={262}
                            loading="lazy"
                            className="nv4-price__img"
                        />
                    </div>
                </Reveal>

                <div className="nv4-price__grid">
                    {plans.map((plan, i) => {
                        const lead = i === 1;
                        return (
                            <article
                                key={plan.id}
                                className={`nv4-plan${lead ? ' nv4-plan--lead' : ''}`}
                            >
                                <h3 className="nv4-plan__name">{plan.name}</h3>
                                <p className="nv4-plan__who">{plan.who}</p>

                                <p className="nv4-plan__figure">
                                    <span className="nv4-plan__amount">{planPrice(plan)}</span>
                                </p>
                                <p className="nv4-plan__days">Live in {plan.days} days</p>

                                <ul className="nv4-plan__list">
                                    {plan.lead && (
                                        <li className="nv4-plan__item nv4-plan__item--lead">
                                            <Check size={17} weight="bold" aria-hidden="true" />
                                            <span>{plan.lead}</span>
                                        </li>
                                    )}
                                    {plan.gets.map((item) => {
                                        const subs = plan.details?.[item];
                                        return (
                                            <li key={item} className="nv4-plan__item">
                                                <Check size={17} weight="bold" aria-hidden="true" />
                                                <span>
                                                    {item}
                                                    {subs && (
                                                        <ul className="nv4-plan__sub">
                                                            {subs.map((s) => <li key={s}>{s}</li>)}
                                                        </ul>
                                                    )}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <a
                                    href={waLink(
                                        `Hello. I would like to talk about the ${plan.name} for my business.`,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`nv-btn nv4-plan__cta${lead ? ' nv-btn--ghost' : ' nv-btn--primary'}`}
                                >
                                    Talk to us
                                </a>
                            </article>
                        );
                    })}
                </div>

                {/* The announcement, built to the shape of watermelon's
                    announcement-1 (404 from the registry, like the rest):
                    one band in the accent, a rocket, one line, one link
                    to the Cloud page. */}
                <Link href="/cloud" className="nv4-announce">
                    <span className="nv4-announce__icon" aria-hidden="true">
                        <RocketLaunch size={22} weight="fill" />
                    </span>
                    <span className="nv4-announce__text">
                        <strong>{brand.name} has a comprehensive Cloud CRM and ERP software.</strong>
                        {' '}
                        It can be integrated with your website on request.
                    </span>
                    <span className="nv4-announce__cta">
                        Explore Now
                        <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </span>
                </Link>
            </div>
        </section>
    );
}
