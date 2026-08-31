/**
 * The hero treatments and the section resolver.
 *
 * WHY THESE LEFT page.js
 *
 * The route file was 409 lines and most of it was four hero variants plus
 * a switch. A route should say what a page IS, not carry the
 * implementation of every block it might contain. With these lifted,
 * page.js reads as: resolve the slug, resolve the media, map the
 * sections. Everything about how a section renders lives with the
 * sections.
 *
 * All four hero treatments call the same HeroText and HeroImage; only the
 * wrapper differs. That is deliberate: the hero CONTENT contract is one
 * thing across sixteen demos, and only its arrangement changes.
 */
import { Facts } from '../DemoSections';
import DemoHours from '../DemoHours';
import { SECTION_REGISTRY, SECTION_ANCHOR } from './index';

function HeroText({ demo, b }) {
    return (
        <>
            <p className="vd-hero__kicker">{demo.hero.kicker}</p>
            <h1 className="vd-hero__title">{demo.hero.headline}</h1>
            <p className="vd-hero__sub">{demo.hero.sub}</p>
            <div className="vd-hero__actions">
                <a
                    href={`#${SECTION_ANCHOR[demo.module.type]}`}
                    className="vd-btn vd-btn--primary"
                >
                    {demo.hero.primaryCta}
                </a>
                <a href="#visit" className="vd-btn vd-btn--ghost">
                    {demo.hero.secondaryCta}
                </a>
            </div>
            <div className="vd-hero__meta">
                <DemoHours hours={b.hours} />
                <ul className="vd-trust">
                    {b.trust.map((t) => (
                        <li key={t} className="vd-trust__item">{t}</li>
                    ))}
                </ul>
            </div>
        </>
    );
}

/* THE HERO IS THE LCP ELEMENT AND THE HEAVIEST THING ON THE PAGE.
 *
 * A raw img rather than next/image, deliberately: these are statically
 * known local files and next/image would add a component to every demo
 * route to do work `scripts/make-demo-srcset.mjs` already did at build.
 *
 * But a raw img with no srcset sends the 1200px file to a 390px phone,
 * and 98% of this audience is on a 390px phone over mobile data. The
 * variants are generated beside each original; the browser picks.
 *
 * `sizes` differs per treatment because the hero occupies a different
 * fraction of the viewport in each: fullbleed and banner are edge to
 * edge, split is half the width above 740px. */
function HeroImage({ src, alt, sizes = '100vw', eager = true }) {
    const base = src.replace(/\.webp$/, '');
    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={src}
            srcSet={`${base}-480.webp 480w, ${base}-800.webp 800w, ${src} 1200w`}
            sizes={sizes}
            alt={alt}
            width={1200}
            height={669}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
            decoding="async"
            className="vd-hero__img"
        />
    );
}

/* ── Hero layouts ──────────────────────────────────────────────────── */

function HeroFullbleed({ demo, b, heroSrc }) {
    return (
        <section className="vd-section vd-hero vd-hero--fullbleed">
            <div className="vd-hero__backdrop">
                <HeroImage src={heroSrc} alt={`${b.name} ambience`} />
            </div>
            <div className="vd-hero__scrim" />
            <div className="vd-shell vd-hero__overlay">
                <HeroText demo={demo} b={b} />
            </div>
        </section>
    );
}

function HeroSplit({ demo, b, heroSrc }) {
    return (
        <section className="vd-section vd-hero vd-hero--split">
            <div className="vd-shell vd-hero__split-grid">
                <div className="vd-hero__split-text">
                    <HeroText demo={demo} b={b} />
                </div>
                <div className="vd-hero__split-media">
                    <HeroImage
                        src={heroSrc}
                        alt={`${b.name} facility`}
                        sizes="(min-width: 740px) 50vw, 100vw"
                    />
                </div>
            </div>
        </section>
    );
}

function HeroBanner({ demo, b, heroSrc }) {
    return (
        <section className="vd-section vd-hero vd-hero--banner">
            <div className="vd-hero__banner-media">
                <HeroImage src={heroSrc} alt={`${b.name} showcase`} />
            </div>
            <div className="vd-shell vd-hero__banner-card">
                <HeroText demo={demo} b={b} />
            </div>
        </section>
    );
}

function HeroStandard({ demo, b, heroSrc }) {
    return (
        <section className="vd-section vd-hero vd-hero--standard">
            <div className="vd-shell">
                <HeroText demo={demo} b={b} />
                {heroSrc && (
                    <div className="vd-hero__media">
                        <HeroImage src={heroSrc} alt={`${b.name} showcase`} />
                    </div>
                )}
            </div>
        </section>
    );
}


/* One entry in a demo's `sections` array, resolved to a component.
 *
 * Every section gets the demo's data and its media; each one takes what
 * it needs. The alternative, a per-type prop schema, is the layout DSL
 * the plan explicitly rules out: it would be more code than the sixteen
 * pages it serves.
 *
 * `facts` is the one type that reads a named source off the demo
 * (`menu`, `treatments`, `specs`), because those three are the same
 * two-or-three-column list of a name and a number and always were. */
const HEROES = {
    fullbleed: HeroFullbleed,
    split: HeroSplit,
    banner: HeroBanner,
    standard: HeroStandard,
};

export default function SectionSlot({ sec, demo, b, media }) {
    if (sec.type === 'hero') {
        /* A missing image collapses any treatment to `standard`, which
           is the only variant that renders without one. */
        const style = media.heroSrc ? (sec.variant || 'standard') : 'standard';
        const Hero = HEROES[style] || HeroStandard;
        return <Hero demo={demo} b={b} heroSrc={media.heroSrc} />;
    }

    if (sec.type === 'facts') {
        const src = demo[sec.source];
        if (!src) return null;
        const rows = sec.source === 'menu'
            ? src.flatMap((g) => g.items).map((i) => ({
                name: i.name, time: i.note, price: `Rs ${i.price}`,
            }))
            : src;
        const title = sec.source === 'menu'
            ? (demo.menuTitle ?? 'The menu')
            : sec.source === 'specs'
                ? (demo.specsTitle ?? 'The building')
                : (demo.factsTitle ?? 'What it costs');
        return (
            <Facts
                id={sec.id || sec.source}
                title={sec.title ?? title}
                lede={sec.lede ?? (sec.source === 'treatments' ? demo.factsLede : undefined)}
                rows={rows}
                cols={sec.cols ?? 3}
            />
        );
    }

    const Component = SECTION_REGISTRY[sec.type];
    if (!Component) return null;

    switch (sec.type) {
        case 'cart':
            return (
                <Component
                    groups={demo.menu}
                    business={b.name}
                    area={`${b.area}, ${b.city}`}
                    module={demo.module}
                />
            );
        case 'booking':
        case 'tariff':
            return <Component business={b.name} module={demo.module} />;
        case 'beforeafter':
        case 'roster':
            return <Component module={demo.module} />;
        case 'story':
            return (
                <Component
                    data={demo.story}
                    image={media.storySrc}
                    detailImage={media.detailSrc}
                    business={b.name}
                />
            );
        case 'voices':
            return <Component quotes={demo.voices} title={sec.title ?? demo.voicesTitle} lede={sec.lede} />;
        case 'faq':
            return <Component items={demo.faqs} title={sec.title ?? demo.faqTitle} lede={sec.lede} />;
        case 'visit':
            return <Component business={b} visit={demo.visit} map={demo.map} />;

        /* The Phase 4 palette. Each reads a named block off the demo, so
           the data says what it is and the section says how it looks. */
        case 'menu':
            return <Component groups={demo.menu} title={sec.title} lede={sec.lede} />;
        case 'process':
            return <Component steps={demo.process} title={sec.title} lede={sec.lede} />;
        case 'pricegrid':
            return (
                <Component
                    groups={demo.prices}
                    rows={demo.treatments}
                    title={sec.title ?? demo.factsTitle}
                    lede={sec.lede ?? demo.factsLede}
                    note={sec.note}
                />
            );
        case 'weavers':
            return (
                <Component
                    pieces={demo.pieces}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'specs':
            return (
                <Component
                    products={demo.specProducts}
                    rows={demo.specRows}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'fresh':
            return (
                <Component
                    produce={demo.produce}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'batches':
            return (
                <Component
                    batches={demo.batches}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'space':
            return (
                <Component
                    {...demo.space}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'stock':
            return (
                <Component
                    items={demo.catalogue}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'avail':
            return (
                <Component
                    rooms={demo.roomTypes}
                    channels={demo.channels}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'due':
            return (
                <Component
                    intervals={demo.intervals}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'compare':
            return (
                <Component
                    stock={demo.stock}
                    rows={demo.compareRows}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'plots':
            return (
                <Component
                    plots={demo.plots}
                    budgets={demo.budgets}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'stages':
            return (
                <Component
                    stages={demo.stages}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'dispatch':
            return (
                <Component
                    trades={demo.trades}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'where':
            return (
                <Component
                    routes={demo.routes}
                    emergency={demo.emergency}
                    title={sec.title}
                    lede={sec.lede}
                />
            );
        case 'queue':
            return (
                <Component
                    sessions={demo.sessions}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'lookbook':
            return <Component looks={demo.looks} title={sec.title} lede={sec.lede} />;
        case 'consult':
            return (
                <Component
                    matters={demo.matters}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'calendar':
            return (
                <Component
                    filings={demo.filings}
                    title={sec.title}
                    lede={sec.lede}
                    note={sec.note}
                />
            );
        case 'proof':
            return (
                <Component
                    stats={demo.proof?.stats}
                    award={demo.proof?.award}
                    title={sec.title}
                    lede={sec.lede}
                />
            );
        case 'directory':
            return <Component items={demo.directory} title={sec.title} lede={sec.lede} />;
        case 'gallery':
            return (
                <Component
                    images={[media.heroSrc, media.storySrc, media.detailSrc]}
                    title={sec.title}
                    lede={sec.lede}
                />
            );
        case 'spectable':
            return <Component groups={demo.specGroups} title={sec.title} lede={sec.lede} />;
        case 'bakeschedule':
            return <Component slots={demo.bakeSlots} title={sec.title} lede={sec.lede} />;
        case 'tracker':
            return <Component consignments={demo.consignments} title={sec.title} lede={sec.lede} />;
        case 'rooms':
            return <Component rooms={demo.rooms} seasons={demo.seasons} title={sec.title} lede={sec.lede} />;
        case 'jobboard':
            return <Component jobs={demo.jobs} title={sec.title} lede={sec.lede} />;
        default:
            return null;
    }
}

