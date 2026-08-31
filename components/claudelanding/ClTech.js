'use client';

/**
 * The tech section, ported from /newlanding and now the page's icon sphere.
 *
 * Content is carried over verbatim from components/newlanding/TechStack.js:
 * the headline, the lede, the four categories and their tech lists, the two
 * guarantee pills, the 20 icon slugs. What changed is the styling, which
 * uses this page's `cl-` primitives rather than `nl-tech__*` (that prefix is
 * scoped to newlanding's part of globals.css and has no rules in
 * app/claudelanding.css), and the interaction: hovering a category card
 * lifts it and tints its icon pill. Hovering a category does not light
 * anything on the sphere itself; the sphere is a canvas from the vendored
 * IconCloud component and cannot be selectively lit without rewriting it,
 * so the section does not claim that it can.
 *
 * THIS SECTION ABSORBS ClStack.js, WHICH IS DELETED
 *
 * Two icon spheres on one page said the same thing twice with a weaker
 * frame around the second one. This keeps ClStack's job (the sphere, and
 * its reduced-motion fallback) and gives it the framing the tech story
 * deserves. The reduced-motion guard is unchanged from ClStack: IconCloud
 * runs a permanent requestAnimationFrame loop with no guard of its own, so
 * the check has to happen here, in JavaScript, before the component ever
 * mounts.
 */
import {
    Code,
    Cpu,
    Database,
    ShieldCheck,
    ArrowsClockwise,
    Lightning,
} from '@phosphor-icons/react/ssr';
import IconCloud from '@/registry/magicui/icon-cloud';
import Reveal from '@/components/Reveal';
import useReducedMotionPref from './useReducedMotionPref';

/* Slugs are resolved against cdn.simpleicons.org at runtime, so a slug
   that Simple Icons renames or removes silently becomes a broken image in
   the sphere rather than a build error. Three did exactly that and were
   rendering as empty tiles: `css3` is now `css`, and `amazonaws` and
   `visualstudiocode` were dropped from the set entirely (both were
   removed over brand-usage policy, and neither has a replacement slug).
   They are swapped for `cloudflare`, which is a truthful stand-in for the
   edge delivery the section already claims, and `vite`. Check a new slug
   returns 200 from https://cdn.simpleicons.org/<slug>/<slug> before
   adding it here. */
/* Only things this studio actually builds with. Every slug verified to
   return 200 before being added; check
   https://cdn.simpleicons.org/<slug>/<slug> first, because a renamed or
   withdrawn slug becomes a blank tile in the sphere rather than a build
   error. Three did exactly that once: `css3` became `css`, and
   `amazonaws` and `visualstudiocode` were withdrawn entirely.

   Deliberately removed rather than replaced: typescript, postgresql,
   prisma, express, firebase, nginx, docker. The card copy beside this
   sphere used to claim them and none is used here. A logo wall is a
   claim like any other sentence, and a prospect who asks about the
   Postgres logo deserves a better answer than a shrug. */
const SLUGS = [
    'nextdotjs', 'react', 'javascript', 'html5', 'css', 'tailwindcss',
    'nodedotjs', 'netlify', 'cloudflare', 'vercel', 'vite',
    'git', 'github', 'figma',
];

const IMAGES = SLUGS.map((s) => `https://cdn.simpleicons.org/${s}/${s}`);

/* WHAT THIS SECTION IS ALLOWED TO SAY
 *
 * Everything here is checkable. That is not a stylistic preference: this
 * section sells technical credibility, so a single claim a prospect can
 * disprove in one minute costs more than the whole section earns.
 *
 * The previous version was carried over verbatim from a deleted
 * component and claimed, in order: TypeScript (not a dependency, and
 * there is not one .ts file in the repo), PostgreSQL, Prisma and
 * isolated database instances (there is no database), AWS CloudFront and
 * the Vercel Edge Network (this site deploys to Netlify), a "99+ Google
 * PageSpeed Guarantee" (an unverifiable promise about a third party's
 * score) and "zero security vulnerabilities" (nobody can promise this;
 * an audit had already found six issues in one route).
 *
 * It also opened by calling other people's tools slow, which CLAUDE.md
 * forbids: say what we do, not what other people get wrong.
 *
 * If a claim here stops being true, it comes out. That is the rule.
 */
const CATEGORIES = [
    {
        Icon: Code,
        title: 'The site itself',
        tech: 'Next.js 16, React 19, Motion',
        desc: 'Rendered ahead of time and served as files, so a page is on screen before a slower site has finished asking a database what to show.',
    },
    {
        Icon: Cpu,
        title: 'Built for the phone',
        tech: 'Designed at 320px first, fluid to any width',
        desc: 'Laid out at the narrowest screen first and widened from there, because that is the device your customers are actually holding.',
    },
    {
        Icon: Database,
        title: 'Delivered close to the visitor',
        tech: 'Netlify edge hosting, automatic HTTPS',
        desc: 'Served from wherever the visitor is, with certificates renewed automatically so nothing quietly expires.',
    },
    {
        Icon: ShieldCheck,
        title: 'Kept honest',
        tech: 'Content Security Policy, HSTS, automated guards on every build',
        desc: 'Security headers enforced, and a set of checks that fail the build rather than let a mistake ship.',
    },
];

export default function ClTech() {
    const reduceMotion = useReducedMotionPref();

    return (
        <section id="tech" className="nv-section nv-ground--warm">
            <div className="nv-shell cl-tech__split">
                <div className="cl-tech__info">
                    <Reveal>
                        <span className="nv-eyebrow">
                            What it is built on
                        </span>
                        <h2 className="cl-h2">
                            The fast part is not an accident.
                        </h2>
                        <p className="nv-lede">
                            Your site is built as code and served as
                            finished pages, not assembled by a page builder
                            every time somebody visits. That is most of why
                            it loads quickly, and quick is what Google
                            rewards and what a customer on mobile data
                            notices.
                        </p>
                    </Reveal>

                    <div className="cl-tech__grid">
                        {CATEGORIES.map(({ Icon, title, tech, desc }, i) => (
                            <Reveal
                                key={title}
                                delay={i * 0.06}
                                className="cl-tech__card"
                            >
                                <div className="cl-tech__cardHead">
                                    <span className="cl-tech__pill">
                                        <Icon size={18} weight="bold" />
                                    </span>
                                    <h3 className="cl-tech__cardTitle">
                                        {title}
                                    </h3>
                                </div>
                                <p className="cl-tech__cardTech">{tech}</p>
                                <p className="cl-tech__cardDesc">{desc}</p>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal delay={0.25} className="cl-tech__guarantees">
                        {/* Both of these are things we control and can be
                            held to. The pair they replaced were a promise
                            about Google's score and a promise of zero
                            vulnerabilities, neither of which is ours to
                            make. */}
                        <span className="cl-chip">
                            <Lightning size={16} weight="fill" />
                            Built to score well, and measured every build
                        </span>
                        <span className="cl-chip">
                            <ArrowsClockwise size={16} weight="bold" />
                            No lock-in. The code and accounts are yours
                        </span>
                    </Reveal>
                </div>

                <Reveal delay={0.08} className="cl-tech__sphereCard">
                    <div className="cl-tech__sphereHead">
                        <span className="cl-tech__livePill" aria-hidden="true">
                            <span className="cl-tech__liveDot" />
                        </span>
                        <span className="cl-tech__hint">
                            Drag or swipe to rotate to experience 3D effect
                        </span>
                    </div>

                    <div className="cl-stack__sphere cl-tech__sphereBox">
                        {reduceMotion ? (
                            <div className="cl-stack__flat">
                                {SLUGS.map((slug, i) => (
                                    <span key={slug} className="cl-stack__flatItem">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={IMAGES[i]}
                                            alt={slug}
                                            width={26}
                                            height={26}
                                            loading="lazy"
                                        />
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <IconCloud images={IMAGES} />
                        )}
                    </div>

                    <div className="cl-tech__sphereFoot">
                        {/* Not "{n} Modern Frameworks": the set includes
                            Git, GitHub and Figma, none of which is a
                            framework. Counting logos and calling the
                            total frameworks is the kind of small
                            inaccuracy that costs credibility for nothing. */}
                        <span>The tools we build with</span>
                        <span>Open source, no licence to renew</span>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
