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
const SLUGS = [
    'typescript', 'javascript', 'react', 'nextdotjs', 'html5', 'css',
    'nodedotjs', 'express', 'prisma', 'postgresql', 'firebase', 'cloudflare',
    'vercel', 'nginx', 'docker', 'git', 'github', 'vite',
    'figma', 'tailwindcss',
];

const IMAGES = SLUGS.map((s) => `https://cdn.simpleicons.org/${s}/${s}`);

const CATEGORIES = [
    {
        Icon: Code,
        title: 'Modern Frontend & UI',
        tech: 'Next.js 16, React 19, TypeScript, TailwindCSS, Motion',
        desc: 'Pixel-perfect, sub-second renders optimized for all screen sizes.',
    },
    {
        Icon: Database,
        title: 'Secure Cloud & Database',
        tech: 'PostgreSQL, Node.js, Prisma ORM, Isolated Instances',
        desc: 'Rock-solid data storage with automated backups and encryption.',
    },
    {
        Icon: Cpu,
        title: 'Global Edge CDNs',
        tech: 'Vercel Edge Network, AWS CloudFront, Docker Containers',
        desc: 'Lightning-fast delivery across India and worldwide.',
    },
    {
        Icon: ShieldCheck,
        title: 'Security & Quality Assurance',
        tech: 'Automated CI/CD, Core Web Vitals Monitoring, DPDP Standards',
        desc: 'Zero broken links, zero security vulnerabilities.',
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
                            High-Performance Tech Suite
                        </span>
                        <h2 className="cl-h2">
                            Built on the world&apos;s fastest modern web
                            technologies.
                        </h2>
                        <p className="nv-lede">
                            No slow WordPress plugins or sluggish website
                            builders. We engineer custom web applications
                            using modern, production-grade open-source
                            technologies for maximum speed, security, and
                            Google ranking.
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
                        <span className="cl-chip">
                            <Lightning size={16} weight="fill" />
                            99+ Google PageSpeed Guarantee
                        </span>
                        <span className="cl-chip">
                            <ArrowsClockwise size={16} weight="bold" />
                            Zero Vendor or Platform Lock-in
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
                        <span>{SLUGS.length} Modern Frameworks</span>
                        <span>Production-Grade Only</span>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
