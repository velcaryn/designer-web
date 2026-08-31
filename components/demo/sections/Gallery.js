/**
 * A scroll-snap filmstrip of the demo's own images.
 *
 * CSS SCROLL-SNAP, NOT A JS CAROUSEL.
 *
 * The playbook is explicit: native scroll-snap gets hardware
 * acceleration, real momentum and correct touch feel for free, and the
 * Liha build replaced a JS transform carousel with exactly this. On the
 * screen 98% of these visitors are using, that difference is the whole
 * experience.
 *
 * Server component, zero JS. It renders whichever of the demo's three
 * images exist, so a demo with only a hero shows one frame rather than
 * two broken ones.
 */
export default function Gallery({ images, title = 'A look around', lede, id = 'gallery' }) {
    const shots = (images ?? []).filter(Boolean);
    if (!shots.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}
            </div>

            {/* Full-bleed on purpose: a filmstrip that stops at the shell
                edge does not read as something you can push. */}
            <div className="vd-gal" role="region" aria-label={title} tabIndex={0}>
                {shots.map((src) => (
                    <figure key={src} className="vd-gal__item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            srcSet={`${src.replace(/\.webp$/, '')}-480.webp 480w, ${src.replace(/\.webp$/, '')}-800.webp 800w, ${src} 1200w`}
                            sizes="(min-width: 1080px) 31vw, (min-width: 760px) 46vw, 82vw"
                            alt=""
                            /* Intrinsic dimensions, so the browser reserves
                               the box before the file arrives. Without them
                               a lazy gallery collapses to zero height and
                               everything below it jumps as each image lands,
                               which is the layout shift a reviewer notices
                               first on a slow connection. The rendered size
                               comes from CSS; these only set the ratio. */
                            width={1200}
                            height={800}
                            loading="lazy"
                            decoding="async"
                            className="vd-gal__img"
                        />
                    </figure>
                ))}
            </div>
        </section>
    );
}
