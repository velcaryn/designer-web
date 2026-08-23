/**
 * How to buy: one lead engagement across the full width, then the two
 * supporting ones side by side.
 *
 * Deliberately NOT three equal cards. Three identical columns say "these are
 * interchangeable, pick one", which is the opposite of the argument: the
 * launch-plus-growth engagement is the one that works, and the other two
 * exist for people who already have half of it.
 *
 * NO PRICES. Every project here is scoped, and a number on this page would
 * either be a fiction or an anchor we would spend the first call arguing
 * against. The CTA gets them to a conversation where a real number exists.
 */
import { Check } from '@phosphor-icons/react/ssr';
import Reveal from './Reveal';
import SectionLink from './SectionLink';

const PLANS = [
    {
        key: 'lead',
        variant: 'nv-plan--lead',
        name: 'Launch and Grow',
        body: 'The full engagement, and the one we recommend. We design and build the site, take it live, and then run the growth work that makes it worth having. One team, one plan, one report.',
        items: [
            'Everything in the build: strategy, design system, Next.js development, launch',
            'SEO foundations, schema, Search Console and a rolling content calendar',
            'Instagram and LinkedIn content, plus paid distribution where it pays',
            'Velcaryn Cloud and ERP integration when you want the back office joined up',
            'Monthly reporting that names what worked and what we are changing',
        ],
    },
    {
        key: 'build',
        variant: 'nv-plan--support-a',
        name: 'Build Only',
        body: 'You have the marketing handled and need the site done properly. We design, build, launch and hand over clean code with documentation.',
        items: [
            'Strategy, architecture and a brand-specific design system',
            'Next.js build, responsive from 320px, Core Web Vitals signed off',
            'Launch, redirects and analytics, then a full handover',
        ],
    },
    {
        key: 'growth',
        variant: 'nv-plan--support-b',
        name: 'Growth Only',
        body: 'The site is fine and nobody is finding it. We take the one you have and do the work that brings people to it.',
        items: [
            'Technical SEO audit and the fixes, not just the PDF',
            'Content, social calendar and community, run monthly',
            'Paid media and business development support across India',
        ],
    },
];

export default function Engagements() {
    return (
        <section className="nv-section nv-ground--paper" id="engagements">
            <div className="nv-shell">
                <div className="nv-plans__head">
                    <h2 className="nv-plans__title">
                        Three ways to work with us. One of them is the right one.
                    </h2>
                    <SectionLink target="engagements" label="Ways to work with us" />
                </div>

                <div className="nv-plans__list">
                    {PLANS.map(({ key, variant, name, body, items }, i) => (
                        <Reveal
                            key={key}
                            delay={i * 0.06}
                            className={`nv-plan ${variant}`}
                        >
                            <div>
                                <h3 className="nv-plan__name">{name}</h3>
                                <p className="nv-plan__body">{body}</p>
                            </div>
                            <ul className="nv-plan__items">
                                {items.map((item) => (
                                    <li className="nv-plan__item" key={item}>
                                        <Check size={18} weight="bold" aria-hidden="true" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
