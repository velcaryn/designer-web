/**
 * Capabilities, as a continuously rolling ribbon.
 *
 * WHY IT IS NOT A SCROLL CONTAINER ANY MORE
 * The previous version was an `overflow-x: auto` rail. On a trackpad or a
 * mouse wheel that traps the page: once the pointer is over a horizontally
 * scrollable element the browser routes the wheel to it, and the page stops
 * moving until the rail reaches its end. Reported as "vertical scroll getting
 * stuck if the pointer is inside the elements there", which is exactly what
 * it is. The version before that was a GSAP ScrollTrigger pin, which hijacked
 * scroll in a louder way and released with a visible jump.
 *
 * Both were the same mistake: the panels are a sequence to be seen, not a
 * list to be operated. The ribbon now rolls on its own and the page keeps
 * every scroll gesture. Nothing here consumes wheel, touch or key input, and
 * there is no scroll container to get caught in.
 *
 * HOW THE LOOP WORKS
 * The five panels are rendered twice and the track translates by exactly
 * -50%. Those two numbers are a pair: change the duplication and the loop
 * seams. It is a CSS animation on a transform, so it runs on the compositor
 * and costs no main-thread work. The second copy is `aria-hidden`, so a
 * screen reader hears five panels rather than ten.
 *
 * It pauses on hover and on focus-within, so anyone reading a panel can
 * finish. Under reduced motion it does not move at all and the track becomes
 * a wrapping grid, which keeps every panel reachable without animation.
 *
 * No GSAP. Per the playbook's performance section that is roughly 70KB
 * gzipped, only worth carrying when an interaction genuinely needs it. This
 * one never did.
 */
import {
    PenNib,
    RocketLaunch,
    MagnifyingGlass,
    InstagramLogo,
    TrendUp,
} from '@phosphor-icons/react/ssr';
import SectionLink from './SectionLink';

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

function Panel({ index, Icon, title, body, tags }) {
    return (
        <>
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
        </>
    );
}

export default function Capabilities() {
    return (
        <section className="nv-pan" id="capabilities">
            <div className="nv-shell nv-pan__head">
                <p className="nv-eyebrow">What we do</p>
                <h2 className="nv-pan__title">Five things, in the order they happen.</h2>
                    <SectionLink target="capabilities" label="What we do" />
            </div>

            <div className="nv-ribbon">
                <ul className="nv-ribbon__track">
                    {PANELS.map((panel) => (
                        <li className="nv-panel" key={panel.index}>
                            <Panel {...panel} />
                        </li>
                    ))}
                    {PANELS.map((panel) => (
                        <li className="nv-panel" key={`dup-${panel.index}`} aria-hidden="true">
                            <Panel {...panel} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
