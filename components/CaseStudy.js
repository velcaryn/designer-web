/**
 * Work, currently one project shown properly rather than six shown as
 * thumbnails.
 *
 * Both images are real screenshots of the live site, captured at 1440px and
 * 414px, which is also the argument the section is making: one build, two
 * viewports, no separate mobile site.
 *
 * THE NUMBERS ARE BUILD FACTS, NOT RESULTS. Every figure here is something
 * checkable by opening lihashop.in. There are no traffic lifts or conversion
 * percentages, because we do not have the client's analytics and inventing a
 * number for a real, named, findable business is a lie with their name on it.
 * When Liha shares real figures, they replace these.
 */
import Image from 'next/image';
import Reveal from './Reveal';

const FACTS = [
    { value: '2', label: 'Languages served, with Tamil given its own type scale rather than a translation bolt-on' },
    { value: '1 tap', label: 'From the home page to a WhatsApp order, on the device the customer already has open' },
    { value: 'Edge', label: 'Static delivery, redeployed on every push, no server in the request path' },
    { value: '0', label: 'Templates, themes or page builders anywhere in the build' },
];

export default function CaseStudy() {
    return (
        <section className="nv-section nv-case nv-ground--warm" id="work">
            <div className="nv-shell nv-case__grid">
                <Reveal>
                    <h2 className="nv-case__title">
                        A heritage food brand, built for how people actually buy.
                    </h2>
                    <p className="nv-lede nv-case__body">
                        Liha&rsquo;s Karuppati sells traditional Palmyra palm jaggery from Tamil
                        Nadu. The buyers are split between people who read English and people
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
                    <div className="nv-case__shot-desktop">
                        <Image
                            src="/lihashop-desktop.png"
                            alt="Liha's Karuppati on a laptop, showing the bilingual product hero."
                            width={2880}
                            height={1800}
                            sizes="(max-width: 1023px) 100vw, 55vw"
                        />
                    </div>
                    <div className="nv-case__shot-mobile">
                        <Image
                            src="/lihashop-mobile.png"
                            alt="The same page on a phone, with the WhatsApp ordering button in reach of the thumb."
                            width={828}
                            height={1720}
                            sizes="(max-width: 767px) 42vw, 20vw"
                        />
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
