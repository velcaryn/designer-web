/**
 * Work, currently one project shown properly rather than six shown as
 * thumbnails.
 *
 * Both images are real FULL-PAGE screenshots of the live site, captured at
 * 1440px and 414px, which is also the argument the section is making: one
 * build, two viewports, no separate mobile site.
 *
 * WHY NOT AN IFRAME OF THE LIVE SITE
 * The obvious idea is to embed lihashop.in in a small frame and let it scroll
 * for real. It cannot be done, and the reason is our own work: that site sends
 * `x-frame-options: DENY` and a CSP without a permissive `frame-ancestors`,
 * both straight out of docs/PLAYBOOK.md section 7. Every browser refuses to
 * render it in a frame, so the panel would be blank. Weakening the client's
 * security headers to decorate our marketing page would be an indefensible
 * trade. A full-page capture panning inside a frame shows the same thing.
 *
 * THE NUMBERS ARE BUILD FACTS, NOT RESULTS. Every figure here is something
 * checkable by opening lihashop.in. There are no traffic lifts or conversion
 * percentages, because we do not have the client's analytics and inventing a
 * number for a real, named, findable business is a lie with their name on it.
 * When Liha shares real figures, they replace these.
 */
import Image from 'next/image';
import Reveal from './Reveal';
import ShowcaseScroll from './ShowcaseScroll';

const FACTS = [
    { value: '2', label: 'Languages served, with Tamil given its own type scale rather than a translation bolt-on' },
    { value: '1 tap', label: 'From the home page to a WhatsApp order, on the device the customer already has open' },
    { value: 'Edge', label: 'Static delivery, redeployed on every push, no server in the request path' },
    { value: '9/17', label: 'Phone aspect the layout was designed against first, before any desktop view' },
];

export default function CaseStudy() {
    return (
        <section className="nv-section nv-case nv-ground--warm" id="work">
            <div className="nv-shell nv-case__grid">
                <Reveal>
                    <p className="nv-eyebrow">Our client</p>
                    <h2 className="nv-case__title">
                        A heritage food brand, built for how people actually buy.
                    </h2>
                    <p className="nv-lede nv-case__body">
                        One example, in full. Liha&rsquo;s Karuppati sells traditional
                        Palmyra palm jaggery from Tamil Nadu. The buyers are split between people who read English and people
                        who read Tamil, and almost all of them order on a phone through
                        WhatsApp. So the storefront was built around that, rather than around
                        a checkout funnel borrowed from a Western template.
                    </p>

                    <dl className="nv-case__facts">
                        {FACTS.map(({ value, label }) => (
                            <div key={value}>
                                <dt className="nv-fact__value">{value}</dt>
                                <dd className="nv-fact__label">{label}</dd>
                            </div>
                        ))}
                    </dl>
                </Reveal>

                <Reveal delay={0.1} className="nv-case__shots">
                    <ShowcaseScroll className="nv-case__shot-desktop" duration={30}>
                        <Image
                            src="/lihashop-desktop-full.webp"
                            alt="The full Liha's Karuppati home page on a laptop, from the bilingual hero down through products and heritage."
                            width={1000}
                            height={5757}
                            sizes="(max-width: 1023px) 100vw, 55vw"
                        />
                    </ShowcaseScroll>
                    <ShowcaseScroll className="nv-case__shot-mobile" duration={22}>
                        <Image
                            src="/lihashop-mobile-full.webp"
                            alt="The same page on a phone, stacked to one column with the WhatsApp ordering button in reach of the thumb."
                            width={560}
                            height={7000}
                            sizes="(max-width: 767px) 42vw, 20vw"
                        />
                    </ShowcaseScroll>
                </Reveal>
            </div>
        </section>
    );
}
