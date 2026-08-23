'use client';

/**
 * Capabilities, as a horizontal rail.
 *
 * WHY THIS IS A RAIL AND NOT A GRID
 * The five panels are one sequence: design, build, rank, reach, grow. A grid
 * says "pick one", a sideways track says "this is the order it happens in",
 * which is the argument the section is making.
 *
 * THE PIN IS GONE, AND THAT WAS A BUG FIX.
 * This was a GSAP ScrollTrigger pin that converted vertical scroll into
 * horizontal pan on desktop. It felt wrong in exactly the way scroll hijacking
 * always does: the page stopped moving when the user expected it to move, and
 * clicking a panel or scrolling away produced a jump as the pin released and
 * the pin-spacer collapsed. Reported as "gives a weird move when clicked or
 * moved away from this system", which is the correct diagnosis.
 *
 * It is now a native CSS scroll-snap rail at every width, which the playbook
 * already prescribes: native gets hardware acceleration, real momentum and
 * correct touch feel for free, and it never takes the scroll gesture away from
 * the person using it. Arrow buttons drive it on desktop, where there is no
 * thumb to swipe with.
 *
 * That also removes GSAP from the bundle entirely. Per the playbook's
 * performance section, GSAP is roughly 70KB gzipped and is only worth carrying
 * when an interaction genuinely needs it. This one did not.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    PenNib,
    RocketLaunch,
    MagnifyingGlass,
    InstagramLogo,
    TrendUp,
    CaretLeft,
    CaretRight,
} from '@phosphor-icons/react/ssr';

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
    const track = useRef(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    /* The arrows are disabled at the ends rather than wrapping, so a control
       that cannot do anything says so instead of silently no-opping. */
    const sync = useCallback(() => {
        const el = track.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setAtStart(el.scrollLeft <= 2);
        setAtEnd(el.scrollLeft >= max - 2);
    }, []);

    useEffect(() => {
        const el = track.current;
        if (!el) return undefined;
        sync();
        el.addEventListener('scroll', sync, { passive: true });
        window.addEventListener('resize', sync);
        return () => {
            el.removeEventListener('scroll', sync);
            window.removeEventListener('resize', sync);
        };
    }, [sync]);

    /* Scroll by one panel, measured from the real rendered width rather than
       a hardcoded number, so it stays correct across every breakpoint. */
    const nudge = (dir) => {
        const el = track.current;
        if (!el) return;
        const panel = el.querySelector('.nv-panel');
        const step = panel ? panel.getBoundingClientRect().width + 26 : el.clientWidth * 0.8;
        el.scrollBy({ left: dir * step, behavior: 'smooth' });
    };

    return (
        <section className="nv-pan" id="capabilities">
            <div className="nv-shell nv-pan__head">
                <p className="nv-eyebrow">What we do</p>
                <div className="nv-pan__headRow">
                    <h2 className="nv-pan__title">Five things, in the order they happen.</h2>
                    <div className="nv-pan__nav">
                        <button
                            type="button"
                            className="nv-pan__arrow"
                            onClick={() => nudge(-1)}
                            disabled={atStart}
                            aria-label="Previous capability"
                        >
                            <CaretLeft size={20} weight="bold" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="nv-pan__arrow"
                            onClick={() => nudge(1)}
                            disabled={atEnd}
                            aria-label="Next capability"
                        >
                            <CaretRight size={20} weight="bold" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

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
        </section>
    );
}
