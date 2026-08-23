/**
 * The rebuild offer, for people who already have a site and know it is dated.
 *
 * WHY IT IS A SECTION OF ITS OWN
 * The problem section names what goes wrong with a website. This names a
 * different buyer entirely: someone who is not shopping for a new site, is
 * quietly embarrassed by the one they have, and does not know that moving it
 * is straightforward. That person needs two things said out loud, and both
 * are the reason they have not called anyone yet:
 *
 *   1. Moving the domain does not mean losing it, and does not mean downtime.
 *   2. Their existing search ranking survives, because the redirects are
 *      planned rather than discovered afterwards.
 *
 * COPY DISCIPLINE. No claim here that we cannot stand behind. We do not
 * promise a ranking improvement, because that depends on their market and
 * their content, and it is the kind of promise that ends a relationship in
 * month three. What is promised is what we control: the transfer, the
 * redirects, the speed of the thing we build, and no gap in service.
 *
 * The word "lightning" and its relatives are deliberately absent. Everyone
 * claims fast. Naming the actual mechanism, static delivery from an edge
 * network with no server in the request path, is both true and more
 * convincing to the person who can tell the difference.
 */
import {
    ArrowsLeftRight,
    Gauge,
    MagnifyingGlass,
    ShieldCheck,
    ArrowUpRight,
} from '@phosphor-icons/react/ssr';
import Reveal from './Reveal';
import SectionLink from './SectionLink';

const MOVES = [
    {
        Icon: ArrowsLeftRight,
        title: 'Your domain stays yours',
        body: 'We move the registrar or just point the DNS, whichever you prefer. The domain remains in your name and your account throughout. We never hold a client domain hostage, and you can walk away with it at any point.',
    },
    {
        Icon: MagnifyingGlass,
        title: 'Your search ranking comes with it',
        body: 'Every old URL is mapped to its new home before launch, so links from Google, directories and other people stay working. Skipping this is the single most common way a rebuild loses traffic it already had.',
    },
    {
        Icon: Gauge,
        title: 'Built to load instantly',
        body: 'Static pages served from an edge network, with no server in the request path and no plugin stack to wait for. Most rebuilds we take on were slow because of what was bolted onto them, not because of what they had to do.',
    },
    {
        Icon: ShieldCheck,
        title: 'No gap in service',
        body: 'The new site is finished and reviewed on a staging URL before anything switches. The cutover happens when you approve it, and the old site stays up until that moment.',
    },
];

export default function Rescue() {
    return (
        <section className="nv-section nv-rescue nv-ground--soft" id="rebuild">
            <div className="nv-shell">
                <div className="nv-rescue__head">
                    <Reveal>
                        <h2 className="nv-rescue__title">
                            Already have a site, and quietly embarrassed by it?
                        </h2>
                    <SectionLink target="rebuild" label="Rebuilding an old site" />
                        <p className="nv-lede nv-rescue__lede">
                            If it was built years ago, loads slowly, or looks nothing like
                            the business you are now, it can be rebuilt without losing the
                            domain, the ranking or a single day of being online. Most
                            people put this off because they think it means starting again.
                            It does not.
                        </p>
                    </Reveal>
                </div>

                <div className="nv-rescue__grid">
                    {MOVES.map(({ Icon, title, body }, i) => (
                        <Reveal className="nv-rescue__item" key={title} delay={i * 0.05}>
                            <span className="nv-rescue__icon">
                                <Icon size={26} weight="bold" aria-hidden="true" />
                            </span>
                            <h3 className="nv-rescue__itemTitle">{title}</h3>
                            <p className="nv-rescue__itemBody">{body}</p>
                        </Reveal>
                    ))}
                </div>

                <Reveal className="nv-rescue__cta" delay={0.1}>
                    <p className="nv-rescue__ctaText">
                        Send us the address of the site you have. You get an honest read on
                        what is worth keeping and what is not, before you spend anything.
                    </p>
                    <a href="#contact" className="nv-btn nv-btn--primary">
                        Start a project
                        <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
                    </a>
                </Reveal>
            </div>
        </section>
    );
}
