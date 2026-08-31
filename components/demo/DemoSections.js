/**
 * The static sections of a demo, all server components.
 *
 * Pure functions of data, zero state, no client JavaScript. That is the
 * discipline components/cloud/panels/* already follows and it is what
 * keeps a demo route's JS budget spent on the one interactive module
 * rather than on prose that never changes.
 */
import DemoHours from './DemoHours';
import MapLink from './MapLink';

export function Story({ data, image, detailImage, business }) {
    return (
        <section id="story" className="vd-section vd-ground--paper">
            <div className="vd-shell vd-story">
                <h2 className="vd-h2">{data.title}</h2>
                {image && (
                    <div className="vd-story__media">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={image}
                        srcSet={`${image.replace(/\.webp$/, "")}-480.webp 480w, ${image.replace(/\.webp$/, "")}-800.webp 800w, ${image} 1200w`}
                        sizes="(min-width: 900px) 50vw, 100vw"
                            alt={`${business || 'Our'} story`}
                            width={800}
                            height={600}
                            loading="lazy"
                            decoding="async"
                            className="vd-story__img"
                        />
                    </div>
                )}
                {data.paragraphs.map((p) => (
                    <p key={p.slice(0, 24)} className="vd-story__p">{p}</p>
                ))}
                {detailImage && (
                    <div className="vd-detail__media">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={detailImage}
                            /* THE LARGEST ENTRY IS 800w, NOT 1200w.

                               Four detail images are 600 to 750px wide
                               and the srcset claimed 1200w for all of
                               them, so a wide screen could pick a file
                               that could not fill the slot. The browser
                               trusts the number; an overstated width is
                               worse than a small image honestly
                               described. Every detail image has a real
                               800 variant, and where the source is
                               smaller the variant is smaller too, so the
                               file never overstates itself: sharp does
                               not enlarge. The four short ones are 600
                               to 750px against a slot that needs about
                               716px at 2x, which is within a hair.

                               `sizes` was 50vw, which on a 1440 screen
                               claims 720px. The slot actually renders at
                               358 CSS px because the story column is
                               narrower than half the shell, so the
                               browser was fetching roughly twice the
                               pixels it needed on every demo. */
                            srcSet={`${detailImage.replace(/\.webp$/, '')}-480.webp 480w, ${detailImage.replace(/\.webp$/, '')}-800.webp 800w`}
                            sizes="(min-width: 900px) 380px, 100vw"
                            alt={`${business || 'Our'} craftsmanship`}
                            width={600}
                            height={600}
                            loading="lazy"
                            decoding="async"
                            className="vd-detail__img"
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

/* THE HEADING IS DATA.
   This was the literal string "What people say", so all sixteen demos
   said the same thing above their testimonials. A bakery's regulars, a
   freight customer's operations manager and a bride are not the same
   voice, and the heading is the cheapest place to say so. Same for the
   FAQ below. */
export function Voices({ quotes, title = 'What people say', lede }) {
    return (
        <section className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}
                <div className="vd-voices">
                    {quotes.map((q) => (
                        <figure key={q.who} className="vd-voice">
                            <blockquote className="vd-voice__text">{q.text}</blockquote>
                            <figcaption className="vd-voice__who">
                                {q.who}
                                <span>{q.where}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function Faq({ items, title = 'Questions', lede }) {
    return (
        <section id="faq" className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}
                <div className="vd-faq">
                    {items.map((it) => (
                        /* <details> rather than a JS accordion: it works
                           with no script at all, and on a page whose whole
                           promise is loading fast that is the right
                           trade. */
                        <details key={it.q} className="vd-faq__item">
                            <summary className="vd-faq__q">{it.q}</summary>
                            <p className="vd-faq__a">{it.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function Visit({ business, visit, map }) {
    /* The strip is full width and reads as its own band, so it sits after
       the address block rather than inside it. The other three belong
       with the address they annotate. */
    const inCard = map && map.variant !== 'strip';

    return (
        <section id="visit" className="vd-section vd-ground--ink">
            <div className="vd-shell vd-visit">
                <div>
                    <h2 className="vd-h2">{visit.title}</h2>
                    <p className="vd-visit__note">
                        {visit.note}
                        {/* Inline sits in the prose, which is the whole point
                            of that variant: location as an aside, not a
                            destination. */}
                        {map?.variant === 'inline' && (
                            <>
                                {' '}
                                <MapLink business={business} variant="inline" />
                            </>
                        )}
                    </p>
                </div>

                <address className="vd-visit__card">
                    <span className="vd-visit__line">{business.street}</span>
                    <span className="vd-visit__line">
                        {business.area}, {business.city} {business.pin}
                    </span>

                    {inCard && map.variant !== 'inline' && (
                        <MapLink
                            business={business}
                            variant={map.variant}
                            landmark={map.landmark}
                            direction={map.direction}
                        />
                    )}

                    <DemoHours hours={business.hours} />

                    {/* An email at .example, which RFC 2606 reserves as
                        permanently unroutable, and no phone number at all.
                        See content/demos/bakery.js for why. */}
                    <a href={`mailto:${business.email}`} className="vd-visit__email">
                        {business.email}
                    </a>
                </address>
            </div>

            {map?.variant === 'strip' && (
                <div className="vd-shell">
                    <MapLink
                        business={business}
                        variant="strip"
                        landmark={map.landmark}
                    />
                </div>
            )}
        </section>
    );
}

/**
 * A two-column list of facts: treatments and their cost, or a building
 * and its dimensions. Used by the clinical demos, where the thing a
 * visitor is scanning for is a number beside a name.
 */
export function Facts({ id, title, lede, rows, cols }) {
    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <ul className="vd-facts">
                    {rows.map((r) => (
                        <li key={r.name || r.label} className="vd-fact">
                            <span className="vd-fact__name">{r.name || r.label}</span>
                            {cols === 3 && r.time && (
                                <span className="vd-fact__mid">{r.time}</span>
                            )}
                            <span className="vd-fact__value">{r.price || r.value}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
