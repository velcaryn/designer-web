'use client';

/**
 * Built for speed, customer trust, and repeat orders.
 *
 * Ported from components/newlanding/NlMetrics.js WITH ITS CONTENT
 * UNCHANGED, including the four figures. Those figures are not build
 * facts and CLAUDE.md's rule against invented metrics would normally
 * remove them; the owner decided on 2026-09-15 to keep them as written,
 * and that decision is recorded in CLAUDE.md under the same rule. Do not
 * remove or "correct" them here without asking.
 *
 * Each card carries a small Lottie animation (public/Lottie-JSON) and a
 * magicui ShineBorder, a highlight that travels round the edge. The
 * shine sits inside the card's own ink border, so the edge lock holds.
 * A client component because the Lottie leaf and the shine are; the
 * text itself is static.
 */
import { TrendUp } from '@phosphor-icons/react';
import Reveal from '@/components/Reveal';
import { ShineBorder } from '@/registry/magicui/shine-border';
import Nl4Lottie from './Nl4Lottie';
import loading from '@/public/Lottie-JSON/loading.json';
import emptyCart from '@/public/Lottie-JSON/Empty Cart.json';
import target from '@/public/Lottie-JSON/Target.json';
import briefcase from '@/public/Lottie-JSON/Briefcase.json';

const METRICS = [
    {
        anim: loading,
        num: '0.8s',
        label: 'Mobile load time',
        sub: 'Tested on Indian 4G/5G mobile networks',
        title: 'Fast before they even start reading.',
        desc: 'Over 85% of your customers browse on a phone. We render pages ahead of time as static files rather than building them on every visit. Your products load in under a second, keeping bounce rates close to zero.',
        highlight: '100% Google Performance Score',
    },
    {
        anim: emptyCart,
        num: '2.4x',
        label: 'Higher checkout completion',
        sub: 'Dual-channel buying architecture',
        title: 'Two ways to buy, for two types of customers.',
        desc: 'Shoppers who know what they want tap once for instant UPI, Google Pay, PhonePe, or Cards. Customers with a question tap once to chat on WhatsApp with the product already pre-filled. You never lose a sale to checkout friction.',
        highlight: 'Instant UPI + 1-Tap WhatsApp',
    },
    {
        anim: target,
        num: '99.4%',
        label: 'Fulfillment accuracy',
        sub: 'Direct from dashboard to customer',
        title: 'One place for orders, stock and billing.',
        desc: 'Orders land in a live queue on your phone. Inventory decreases automatically when an item sells, automated WhatsApp tracking links go out, and a computer-generated GST tax invoice is ready in one tap.',
        highlight: 'Zero spreadsheets or order notebooks',
    },
    {
        anim: briefcase,
        num: '100%',
        label: 'Outright ownership',
        sub: 'No recurring platform commission',
        title: 'Yours from day one. No monthly app tax.',
        desc: 'Your domain, code, customer database, and payments are registered in your name. You never pay a 2% cut per sale or expensive monthly plugin subscriptions that drain your profit margin.',
        highlight: 'Zero platform commission taken by us',
    },
];

export default function Nl4Metrics() {
    return (
        <section className="nv-section nv-ground--paper" id="metrics">
            <div className="nv-shell">
                <Reveal className="nv4-metrics__head">
                    {/* The owner's three Build-*.svg glyphs, set close as one
                        mark: speed, trust, orders, with trust in the accent.
                        Masks over currentColor, like the dock's icons. */}
                    <div className="nv4-metrics__mark" aria-hidden="true">
                        <span className="nv4-metrics__glyph" style={{ '--icon': 'url("/SVGs/Build-Speed.svg")' }} />
                        <span className="nv4-metrics__glyph nv4-metrics__glyph--trust" style={{ '--icon': 'url("/SVGs/Build-Trust.svg")' }} />
                        <span className="nv4-metrics__glyph" style={{ '--icon': 'url("/SVGs/Build-Order.svg")' }} />
                    </div>
                    <h2 className="nv4-h2">
                        Built For <span className="nv4-glow">Speed</span>, Customer
                        {' '}
                        <span className="nv4-glow">Trust</span>, And Repeat
                        {' '}
                        <span className="nv4-glow">Orders</span>.
                    </h2>
                    <p className="nv-lede">
                        A slow site loses half its visitors before they read
                        the first line. A clunky checkout loses the sale at
                        the finish line. Here is what happens when both are
                        engineered properly.
                    </p>
                </Reveal>

                <div className="nv4-metrics__grid">
                    {METRICS.map((m) => (
                        <article key={m.title} className="nv4-metric">
                            <ShineBorder borderWidth={2} duration={10} />
                            <div className="nv4-metric__head">
                                <Nl4Lottie animationData={m.anim} size={64} />
                                <div className="nv4-metric__headText">
                                    <span className="nv4-metric__num">{m.num}</span>
                                    <span className="nv4-metric__label">{m.label}</span>
                                    <span className="nv4-metric__sub">{m.sub}</span>
                                </div>
                            </div>

                            <h3 className="nv4-metric__title">{m.title}</h3>
                            <p className="nv4-metric__desc">{m.desc}</p>

                            <div className="nv4-metric__foot">
                                <span className="nv4-metric__pill">
                                    <TrendUp size={15} weight="bold" aria-hidden="true" />
                                    {m.highlight}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
