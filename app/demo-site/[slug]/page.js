/**
 * One demo site.
 *
 * TWO SHAPES, ON PURPOSE. A slug with a full record in content/demos/
 * renders the complete business: hero, its interactive module, story,
 * voices, questions, address. A slug that only has its card-sized entry
 * in the registry renders a themed placeholder instead. That is what lets
 * the remaining demos land one at a time without any of the sixteen
 * routes 404ing in the meantime.
 *
 * WHY generateStaticParams
 *
 * Sixteen known routes, no user input, no database. Every one is rendered
 * at build time and served as a file, which is why a demo can be on
 * screen before a prospect gives up on the tap.
 *
 * WHY THERE IS NO STRUCTURED DATA HERE
 *
 * StructuredData was moved out of the root layout in the same change that
 * created this directory, precisely so VelBiz's real organisation graph,
 * carrying the real phone number and the real Tirunelveli address, cannot
 * wrap a page whose visible content is an invented business. Nothing here
 * emits any and nothing here should: structured data exists to be
 * indexed, and these pages are noindex by three separate mechanisms.
 */
import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { SLUGS, findDemo } from '@/content/demos';
import { loadDemo } from '@/content/demos/load';
import DemoCta from '@/components/demo/DemoCta';
import DemoLogo from '@/components/demo/DemoLogo';
import DemoHours from '@/components/demo/DemoHours';
import Cart from '@/components/demo/modules/Cart';
import Booking from '@/components/demo/modules/Booking';
import Tariff from '@/components/demo/modules/Tariff';
import BeforeAfter from '@/components/demo/modules/BeforeAfter';
import Roster from '@/components/demo/modules/Roster';
import DemoSwitcher from '@/components/demo/DemoSwitcher';
import { SECTION_ANCHOR, SECTION_LABEL } from '@/components/demo/sections';
import SectionSlot from '@/components/demo/sections/render';
import { brand } from '@/config/site';

export function generateStaticParams() {
    return SLUGS.map((slug) => ({ slug }));
}

/* `params` is a Promise in Next 16 and must be awaited. Reading
   `params.slug` off the Promise yields undefined, which sent every slug
   through notFound() and prerendered sixteen 404s while the route list
   still looked correct. The build gave no error; it only showed up on a
   real request. */
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const card = findDemo(slug);
    if (!card) return {};

    return {
        title: `${card.name} | Example site`,
        description: `${card.blurb} An example ${card.trade.toLowerCase()} website built by ${brand.name}.`,
        /* Set even though the page is noindex, so a regression in the
           robots rule cannot compound into these claiming to be `/`. */
        alternates: { canonical: `/demo-site/${card.slug}` },
    };
}

/* The scoped theme. Inline custom properties on the demo's own root,
   exactly the pattern ClHeroWindow.js proves with its --mw-* set: the
   page repaints itself without touching a global token, so sixteen
   palettes coexist with no switcher and no global state.
   radiusSm, radiusLg, borderW and shadow are per-demo here, which is
   precisely the SHAPE and EDGE lock being broken inside demo scope. */
/* Each module renders its own section id; the nav has to point at
   whichever one this demo actually has. */


/* ── Hero visual variants ──────────────────────────────────────────────
   Four distinct hero treatments so no two categories look alike:

   fullbleed  – image covers the entire hero, text overlaid with a
                gradient scrim. Best for lifestyle / hospitality.
   split      – side-by-side: text left, image right. Best for
                professional / clinical sites.
   banner     – wide image strip at top, text card overlapping upward
                from below. Best for catalogue / commerce.
   standard   – original layout: text stacked, image below in a card.
                Fallback for everything else.                          */


function themeVars(t) {
    return {
        '--vd-ink': t.ink,
        '--vd-paper': t.paper,
        '--vd-accent': t.accent,
        '--vd-support': t.support,
        '--vd-soft': t.soft,
        '--vd-on-accent': t.onAccent,
        '--vd-fill': t.fill,
        '--vd-on-fill': t.onFill,
        '--vd-radius-sm': t.radiusSm,
        '--vd-radius-lg': t.radiusLg,
        '--vd-border-w': t.borderW,
        '--vd-shadow': t.shadow,
        '--vd-font-display': t.display,
        '--vd-font-text': t.text,
    };
}

/* ── Hero sub-components ───────────────────────────────────────────── */

export default async function DemoPage({ params }) {
    const { slug } = await params;
    const card = findDemo(slug);
    if (!card) notFound();

    const demo = await loadDemo(slug);

    /* Not written yet. Themed from the card's swatch so the hub's colour
       bar still matches what the visitor lands on. */
    if (!demo) {
        const [ink, accent, paper] = card.swatch;
        const stub = {
            '--vd-ink': ink,
            '--vd-accent': accent,
            '--vd-paper': paper,
            '--vd-soft': `color-mix(in srgb, ${accent} 10%, ${paper})`,
            '--vd-support': `color-mix(in srgb, ${ink} 62%, ${paper})`,
            '--vd-on-accent': paper,
            '--vd-fill': ink,
            '--vd-on-fill': paper,
        };

        return (
            <div className="vd-root" style={stub}>
                <main>
                    <section className="vd-section vd-ground--paper">
                        <div className="vd-shell">
                            <p className="vd-stub__trade">{card.trade}</p>
                            <h1 className="vd-stub__title">{card.name}</h1>
                            <p className="vd-stub__blurb">{card.blurb}</p>
                            <p className="vd-stub__city">{card.city}</p>
                            <p className="vd-stub__note">
                                This example is still being built.
                            </p>
                        </div>
                    </section>
                </main>
                <DemoCta label={card.trade} trade={card.trade.toLowerCase()} />
            </div>
        );
    }

    const b = demo.business;
    const heroImageRel = `/demo/${demo.slug}/hero.webp`;
    const hasHeroImage = fs.existsSync(path.join(process.cwd(), 'public', heroImageRel));
    const heroSrc = hasHeroImage ? heroImageRel : null;

    const storyImageRel = `/demo/${demo.slug}/story.webp`;
    const storySrc = fs.existsSync(path.join(process.cwd(), 'public', storyImageRel))
        ? storyImageRel : null;

    const detailImageRel = `/demo/${demo.slug}/detail.webp`;
    const detailSrc = fs.existsSync(path.join(process.cwd(), 'public', detailImageRel))
        ? detailImageRel : null;

    /* The nav links a demo actually has. The primary interactive section
       first (labelled for what it does), then whichever of story, faq and
       visit are present. */
    const primary = demo.sections.find((x) => SECTION_LABEL[x.type]);
    const navLinks = [
        primary && {
            href: `#${SECTION_ANCHOR[primary.type]}`,
            label: SECTION_LABEL[primary.type],
        },
        demo.sections.some((x) => x.type === 'story') && { href: '#story', label: 'About' },
        demo.sections.some((x) => x.type === 'faq') && { href: '#faq', label: 'Questions' },
        demo.sections.some((x) => x.type === 'visit') && { href: '#visit', label: 'Visit' },
    ].filter(Boolean);

    return (
        <div
            className={`vd-root vd--${demo.layout}`}
            style={themeVars(demo.theme)}
        >

            <header className="vd-nav">
                <div className="vd-shell vd-nav__inner">
                    <DemoLogo {...demo.logo} name={b.name} />
                    {/* Built from the demo's own sections, so a demo
                        without a story section does not link to one.
                        Hidden below 760px, where the CTA beside it is the
                        only control that fits and the only one that
                        matters. */}
                    <nav className="vd-nav__links" aria-label="Sections">
                        {navLinks.slice(1).map((l) => (
                            <a key={l.href} href={l.href}>{l.label}</a>
                        ))}
                    </nav>

                    {primary && (
                        <a className="vd-nav__cta" href={`#${SECTION_ANCHOR[primary.type]}`}>
                            {SECTION_LABEL[primary.type]}
                        </a>
                    )}
                </div>
            </header>

            <main>
                {demo.sections.map((sec, i) => (
                    <SectionSlot
                        key={`${sec.type}-${i}`}
                        sec={sec}
                        demo={demo}
                        b={b}
                        media={{ heroSrc, storySrc, detailSrc }}
                    />
                ))}
            </main>

            <DemoSwitcher current={demo.slug} />
            <DemoCta label={card.trade} trade={card.trade.toLowerCase()} />
        </div>
    );
}
