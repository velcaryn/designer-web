'use client';

/**
 * How a project runs, as a vertical rail with a line that draws itself as you
 * scroll past it.
 *
 * The drawn line is the one thing here that earns its animation: it is a
 * progress indicator for a sequence, so the motion is carrying meaning rather
 * than decorating a list.
 *
 * It is driven by `useScroll` into a `useTransform`, and the motion value is
 * bound straight to the style prop. That keeps the whole thing off React
 * state, so scrolling never re-renders the tree. A `window.addEventListener
 * ('scroll')` handler recalculating a percentage into `setState` is the same
 * feature with a frame-by-frame re-render attached, and it is banned.
 *
 * The step names are the labels. There is no "Stage 1 / Stage 2" scaffolding
 * bolted on top of a word that already says what happens.
 *
 * NO TIMELINE CLAIMS, DELIBERATELY. This section used to be headed "Eight
 * weeks from first call to live" with a week range on every step. Both are
 * gone. A duration published before scope is known is a promise made in
 * ignorance, and it is the first thing an unhappy client quotes back at you
 * when week nine arrives. The estimator further down gives an indicative
 * range against a scope the visitor actually selected, which is the honest
 * place for that number. This section describes what happens, not when.
 */
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import SectionLink from './SectionLink';

const STEPS = [
    {
        num: '01',
        title: 'Discover',
        body: 'We sit with you and get concrete about who buys, what they search for, what the competition already ranks on, and what the site actually has to achieve this year.',
    },
    {
        num: '02',
        title: 'Architect',
        body: 'Sitemap, page-by-page content plan and wireframes at phone width first. You approve the structure before anyone argues about a colour.',
    },
    {
        num: '03',
        title: 'Design',
        body: 'A design system built for your brand alone: type, colour, spacing, components and motion. Delivered as real screens, not a mood board.',
    },
    {
        num: '04',
        title: 'Build',
        body: 'Next.js, responsive from 320px up, tested on real devices. Analytics, consent, schema and sitemaps are part of the build, not a follow-up ticket.',
    },
    {
        num: '05',
        title: 'Launch',
        body: 'DNS, hosting, redirects from the old URLs, Search Console, and a Core Web Vitals pass we sign off on before we call it live.',
    },
    {
        num: '06',
        title: 'Grow',
        body: 'The part most agencies leave out. Content calendar, SEO iteration, social and paid distribution, and a monthly report that says plainly what worked.',
    },
];

export default function Process() {
    const rail = useRef(null);
    const reduce = useReducedMotion();

    /* The line starts drawing when the rail's top reaches the lower third of
       the viewport and finishes as its bottom leaves the upper third, so it
       tracks reading position rather than raw element position. */
    const { scrollYProgress } = useScroll({
        target: rail,
        offset: ['start 65%', 'end 35%'],
    });
    const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <section className="nv-section nv-ground--paper" id="process">
            <div className="nv-shell">
                <div className="nv-process__head">
                    <h2 className="nv-process__title">
                        How a project actually runs.
                    </h2>
                    <SectionLink target="process" label="How a project runs" />
                </div>

                <div className="nv-rail" ref={rail}>
                    <span className="nv-rail__track" aria-hidden="true" />
                    <motion.span
                        className="nv-rail__progress"
                        aria-hidden="true"
                        style={{
                            /* Under reduced motion the line is simply drawn
                               in full rather than tracking the scroll. */
                            height: reduce ? '100%' : '100%',
                            scaleY: reduce ? 1 : scaleY,
                        }}
                    />

                    <ol>
                        {STEPS.map(({ num, title, body }) => (
                            <li className="nv-step" key={num}>
                                <span className="nv-step__num" aria-hidden="true">{num}</span>
                                <h3 className="nv-step__title">{title}</h3>
                                <div>
                                    <p className="nv-step__body">{body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
