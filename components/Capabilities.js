'use client';

/**
 * Capabilities, as a pinned horizontal pan on desktop.
 *
 * WHY THIS IS A PAN AND NOT A GRID
 * The five panels are one sequence: design, build, rank, reach, grow. A grid
 * says "pick one", a sideways track says "this is the order it happens in",
 * which is the actual argument the section is making. That is the whole
 * justification for the motion, and it is the only pinned section on the page.
 *
 * WHY IT IS NOT PINNED ON MOBILE
 * `gsap.matchMedia` builds the pin only above 1024px. Below that the same
 * markup is a native scroll-snap rail (see newventure.css), which the thumb
 * already knows how to drive. Pinning on a phone means intercepting the one
 * gesture the user has, and it is where premium desktop sites turn unusable
 * on the device most of the traffic arrives on. Reduced motion gets the rail
 * treatment too, at every width.
 *
 * `matchMedia().revert()` on unmount tears down the pin, the pin-spacer and
 * every ScrollTrigger together. Without it, a client-side route change leaves
 * a pinned wrapper with a fixed height behind on the next page.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    PenNib,
    RocketLaunch,
    MagnifyingGlass,
    InstagramLogo,
    TrendUp,
} from '@phosphor-icons/react/ssr';

gsap.registerPlugin(ScrollTrigger);

const PANELS = [
    {
        index: '01',
        Icon: PenNib,
        title: 'Design that stops the scroll',
        body: 'Custom layout, custom type, custom motion. Nothing from a template library, because a template is a promise that your competitor can buy the same one.',
        tags: ['Art direction', 'Design system', 'Motion', 'Copywriting'],
    },
    {
        index: '02',
        Icon: RocketLaunch,
        title: 'Built fast, shipped live',
        body: 'Next.js, image pipelines, edge hosting and a real launch checklist. We hold the site to Core Web Vitals before it goes out, not after someone complains.',
        tags: ['Next.js', 'Edge hosting', 'Web Vitals', 'Analytics'],
    },
    {
        index: '03',
        Icon: MagnifyingGlass,
        title: 'Found on the first page',
        body: 'Technical SEO, schema, sitemaps and a content plan aimed at the searches your buyers actually type. Ranking is engineering before it is writing.',
        tags: ['Technical SEO', 'Schema', 'Content plan', 'Local search'],
    },
    {
        index: '04',
        Icon: InstagramLogo,
        title: 'Reach that compounds',
        body: 'Instagram, LinkedIn and paid distribution run as one calendar. The site is the destination, and social is what keeps sending people to it.',
        tags: ['Social calendar', 'Creative', 'Paid media', 'Community'],
    },
    {
        index: '05',
        Icon: TrendUp,
        title: 'Growth, all the way to revenue',
        body: 'Lead routing, CRM, dealer and distributor onboarding, and the reporting that tells you which channel paid for itself this month.',
        tags: ['CRM', 'Lead routing', 'Business development', 'Reporting'],
    },
];

export default function Capabilities() {
    const wrap = useRef(null);
    const track = useRef(null);

    useEffect(() => {
        const mm = gsap.matchMedia();

        mm.add(
            {
                desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
            },
            () => {
                const trackEl = track.current;
                const wrapEl = wrap.current;
                if (!trackEl || !wrapEl) return undefined;

                /* Recomputed on refresh rather than captured once, so a resize
                   or a late-loading font cannot leave the pan short and strand
                   the last panel off screen. */
                const distance = () => Math.max(
                    0,
                    trackEl.scrollWidth - wrapEl.clientWidth,
                );

                const tween = gsap.to(trackEl, {
                    x: () => -distance(),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: wrapEl,
                        start: 'top top',
                        end: () => `+=${distance()}`,
                        pin: true,
                        scrub: 1,
                        invalidateOnRefresh: true,
                        anticipatePin: 1,
                    },
                });

                return () => tween.kill();
            },
        );

        return () => mm.revert();
    }, []);

    return (
        <section className="nv-pan" id="capabilities">
            <div className="nv-shell nv-pan__head">
                <p className="nv-eyebrow">What we do</p>
                <h2 className="nv-pan__title">Five things, in the order they happen.</h2>
            </div>

            <div className="nv-pan__viewport" ref={wrap}>
                <ul className="nv-pan__track" ref={track}>
                    {PANELS.map(({ index, Icon, title, body, tags }) => (
                        <li className="nv-panel" key={index}>
                            <span className="nv-panel__index">{index}</span>
                            <span className="nv-panel__icon">
                                <Icon size={28} weight="bold" aria-hidden="true" />
                            </span>
                            <h3 className="nv-panel__title">{title}</h3>
                            <p className="nv-panel__body">{body}</p>
                            <div className="nv-panel__list">
                                {tags.map((tag) => (
                                    <span className="nv-panel__tag" key={tag}>{tag}</span>
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
