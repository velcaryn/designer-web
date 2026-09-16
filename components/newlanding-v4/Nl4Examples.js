/**
 * Real websites, for trades the reader recognises.
 *
 * Twenty-four complete demo sites live in content/demos, each a route a
 * visitor can open. A bakery owner taps "Bakery" and lands on a finished
 * bakery website. That is a stronger argument than any mock, it takes
 * one tap, and none of it is a claim that needs defending.
 *
 * Eight here, spanning the trades most people asking us for a site run;
 * the link at the bottom goes to the rest. Read from DEMOS rather than
 * retyped, so a renamed demo cannot leave a dead card.
 *
 * The heading is the owner's, in Title Case; "how ... can look like"
 * became "what ... can look like", which is the only edit.
 *
 * Cards are plain links, not wrapped in Reveal (see Nl4Why.js), and work
 * with no JavaScript at all. Server component.
 */
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { DEMOS } from '@/content/demos';
import Reveal from '@/components/Reveal';

const SHOWN = [
    'bakery',
    'online-shop',
    'clinic',
    'restaurant',
    'small-business',
    'car-service',
    'home-stay',
    'accountant',
];

export default function Nl4Examples() {
    const demos = SHOWN
        .map((slug) => DEMOS.find((d) => d.slug === slug))
        .filter(Boolean);

    return (
        <section className="nv-section nv-ground--paper" id="examples">
            <div className="nv-shell">
                <Reveal className="nv4-examples__head">
                    <h2 className="nv4-h2 nv4-examples__title">
                        We Have Made Some <span className="nv-mark">Examples</span> For You To See
                    </h2>
                    <p className="nv-lede">
                        These are complete, finished websites, not pictures of
                        websites. Open the one nearest to what you do and look
                        around it properly.
                    </p>
                </Reveal>

                <ul className="nv4-examples__grid">
                    {demos.map((demo) => (
                        <li key={demo.slug} className="nv4-examples__cell">
                            <Link href={`/demo-site/${demo.slug}`} className="nv4-example">
                                {/* The palette is what shows these are
                                    twenty-four designs rather than one
                                    template repainted. */}
                                <span
                                    className="nv4-example__swatch"
                                    aria-hidden="true"
                                    style={{
                                        '--sw-a': demo.swatch[0],
                                        '--sw-b': demo.swatch[1],
                                        '--sw-c': demo.swatch[2],
                                    }}
                                />
                                <span className="nv4-example__trade">{demo.trade}</span>
                                <span className="nv4-example__blurb">{demo.blurb}</span>
                                <span className="nv4-example__go">
                                    <span>Open it</span>
                                    <ArrowRight size={15} weight="bold" aria-hidden="true" />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="nv4-examples__more">
                    <Link href="/demo-site" className="nv-btn nv-btn--ghost">
                        See more Examples
                    </Link>
                </div>
            </div>
        </section>
    );
}
