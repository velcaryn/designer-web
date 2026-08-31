'use client';

/**
 * Twenty-four examples: one grid, filtered in place by sector.
 *
 * WHAT THIS REPLACED, AND WHY
 *
 * The previous version grouped the demos into nine sector sections, each
 * with a heading, a lede, a count and its own bento composition. That was
 * the right answer at sixteen demos across six sectors. At twenty-four
 * across nine it stopped working: the compositions all collapsed to the
 * same shape, so the page read as nine near-identical banded rows, about
 * 3900px tall, and comparing a bakery against a hotel meant scrolling
 * past seven bands you did not want.
 *
 * The old header argued against filtering on the grounds that it hides
 * the catalogue behind a tap. That reasoning still holds, and it is why
 * "All" is the default and nothing starts hidden. The chips narrow a set
 * that is already fully visible, which is what a filter is for.
 *
 * WHY IT FILTERS IN PLACE RATHER THAN NAVIGATING
 *
 * A visitor comparing two trades taps between them repeatedly. A route
 * per sector would be a page load each time, and on the mobile data this
 * audience is on that is the difference between browsing and giving up.
 *
 * THE CARDS ARE REAL LINKS, AND THAT IS LOAD-BEARING
 *
 * Each card is an <a href>. If the JavaScript never arrives or throws, a
 * tap still navigates, and with no JS the grid shows all twenty-four
 * because that is the unfiltered state. The loader is an enhancement over
 * a working link, never the mechanism that makes it work.
 *
 * NO PHOTOGRAPHY ON THE TILES
 *
 * They carried each demo's hero image, which made this a wall of
 * twenty-four photographs: slower, heavier, and worse at the one thing
 * this page does, which is letting somebody find their own trade
 * quickly. The trade is the headline, the palette is the differentiator,
 * the mark is the glance. The photograph is the reward for tapping.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { CATEGORIES } from '@/content/demos';
import HubLoader from './HubLoader';
import { MarkGlyph } from './DemoLogo';

const ALL = 'all';

export default function HubGrid({ demos }) {
    const [sector, setSector] = useState(ALL);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(null);

    const q = query.trim().toLowerCase();

    /* Counts come from the unfiltered set, so a chip always says how many
       it would show. A chip reading "Food 2" that turns out to be empty
       once tapped is worse than no count. */
    const counts = useMemo(() => {
        const map = { [ALL]: demos.length };
        for (const c of CATEGORIES) {
            map[c.id] = demos.filter((d) => d.category === c.id).length;
        }
        return map;
    }, [demos]);

    const shown = useMemo(() => demos.filter((d) => {
        if (sector !== ALL && d.category !== sector) return false;
        if (!q) return true;
        return `${d.name} ${d.trade} ${d.city} ${d.blurb}`.toLowerCase().includes(q);
    }), [demos, sector, q]);

    /* The lede of whichever sector is showing, so the rail explains
       itself rather than being nine unlabelled words. */
    const current = CATEGORIES.find((c) => c.id === sector);

    /* Whether the visitor has narrowed anything. Unfiltered, the status
       line has nothing to add that the page head does not already say. */
    const filtered = sector !== ALL || q.length > 0;

    function open(e, d) {
        /* Modified and middle clicks do what the visitor asked: open a
           tab. Only a plain left click gets the overlay. */
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        setLoading(d);
    }

    return (
        <section className="cl-hub">
            <div className="nv-shell">
                {/* THE RAIL.

                    Sticky, so the sector you are in stays visible while
                    you scroll a long grid and switching does not mean
                    scrolling back up. It scrolls horizontally on a phone,
                    which is why the chips are in source order rather than
                    sorted by count: the order has to be stable between
                    visits or the one you tapped last time has moved. */}
                <div className="cl-rail">
                    <div className="cl-rail__chips" role="group" aria-label="Filter by sector">
                        <button
                            type="button"
                            className={`cl-rail__chip${sector === ALL ? ' is-on' : ''}`}
                            aria-pressed={sector === ALL}
                            onClick={() => setSector(ALL)}
                        >
                            All
                            <span className="cl-rail__n">{counts[ALL]}</span>
                        </button>

                        {CATEGORIES.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                className={`cl-rail__chip${sector === c.id ? ' is-on' : ''}`}
                                aria-pressed={sector === c.id}
                                onClick={() => setSector(c.id)}
                            >
                                {c.label}
                                <span className="cl-rail__n">{counts[c.id]}</span>
                            </button>
                        ))}
                    </div>

                    <label className="cl-rail__search">
                        <MagnifyingGlass size={17} weight="bold" aria-hidden="true" />
                        <span className="nv-sr-only">Search a trade</span>
                        <input
                            type="search"
                            value={query}
                            placeholder="Search a trade"
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button
                                type="button"
                                className="cl-rail__clear"
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                            >
                                <X size={14} weight="bold" />
                            </button>
                        )}
                    </label>
                </div>

                {/* SAYS SOMETHING ONLY WHEN THERE IS SOMETHING TO SAY.

                    This used to render "24 examples" plus a sentence
                    about the businesses being invented, on every visit.
                    Both were already on the screen: the badge above says
                    "24 LIVE EXAMPLES" and the page lede says the
                    invented-businesses line almost word for word. Three
                    statements of one fact, stacked down the left of the
                    page.

                    Unfiltered, the grid speaks for itself and this
                    renders nothing. Filtered, it says what was narrowed
                    to and why that sector exists, which is the one thing
                    no other element on the page carries.

                    The live region stays mounted either way, so a screen
                    reader hears the count change rather than landing
                    silently in a shorter page. */}
                <p
                    className={`cl-hub__status${filtered ? '' : ' is-quiet'}`}
                    role="status"
                    aria-live="polite"
                >
                    {filtered && (
                        <>
                            <strong>{shown.length}</strong>
                            {' '}
                            {shown.length === 1 ? 'example' : 'examples'}
                            {sector !== ALL && current
                                ? ` in ${current.label.toLowerCase()}`
                                : ' matching'}
                            {sector !== ALL && current && (
                                <span className="cl-hub__statusLede">
                                    {current.lede}
                                </span>
                            )}
                        </>
                    )}
                </p>

                {shown.length === 0 ? (
                    <p className="cl-hub__empty">
                        Nothing matches that. Try a different trade, or
                        {' '}
                        <button
                            type="button"
                            className="cl-hub__reset"
                            onClick={() => { setQuery(''); setSector(ALL); }}
                        >
                            show all twenty-four
                        </button>
                        .
                    </p>
                ) : (
                    <div className="cl-grid">
                        {shown.map((d) => (
                            <Link
                                key={d.slug}
                                href={`/demo-site/${d.slug}`}
                                /* PREFETCH OFF, DELIBERATELY.

                                   Next prefetches a <Link> on viewport
                                   entry, and each demo page preloads its
                                   own hero at fetchPriority=high. With
                                   twenty-four tiles that pulled all
                                   twenty-four full-size heroes onto the
                                   hub: measured at 1.5MB on a phone
                                   against 257KB for the tiles the page
                                   actually shows.

                                   HubLoader still calls router.prefetch
                                   on click and holds for 1.2s before
                                   navigating, so the route and the hero
                                   are warmed at the moment they are
                                   actually wanted rather than for
                                   twenty-three demos nobody opened. */
                                prefetch={false}
                                className="cl-tile"
                                onClick={(e) => open(e, d)}
                            >
                                {/* THE PALETTE IS THE PICTURE.

                                    The tile used to be a 42px glyph plate
                                    with a hairline swatch under it, and
                                    twenty-four of them read as a
                                    spreadsheet. This is the demo's own
                                    three theme colours filling a real
                                    panel, so the grid becomes twenty-four
                                    distinct objects at a glance and the
                                    tile agrees with the page it opens.

                                    Still no photography: a wall of
                                    twenty-four photos is slower, heavier
                                    and worse at the one thing this page
                                    does, which is letting somebody find
                                    their own trade quickly. */}
                                <span
                                    className="cl-tile__art"
                                    aria-hidden="true"
                                    style={{
                                        '--a': d.swatch[0],
                                        '--b': d.swatch[1],
                                        '--c': d.swatch[2],
                                    }}
                                >
                                    {/* THE HERO, OVER THE PALETTE.

                                        The gradient stays underneath as
                                        the ground: it is what shows while
                                        the photograph loads, and what
                                        shows if it never does. alt is
                                        empty because the tile's own text
                                        already names the trade, the
                                        business and the city.

                                        A crop made for this slot, not the
                                        hero's 480w variant. The heroes
                                        are a mix of 16:9, 4:5 and 21:9,
                                        so object-fit was discarding most
                                        of some of them after downloading
                                        all of it: 610KB across the grid
                                        against 300KB for these.
                                        See scripts/make-hub-tiles.mjs. */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`/demo/_tiles/${d.slug}.webp`}
                                        alt=""
                                        width={340}
                                        height={191}
                                        loading="lazy"
                                        decoding="async"
                                        className="cl-tile__photo"
                                    />

                                    <span className="cl-tile__glyph">
                                        <MarkGlyph mark={d.mark} size={17} />
                                    </span>
                                    <span className="cl-tile__sector">
                                        {(() => {
                                            const c = CATEGORIES.find((x) => x.id === d.category);
                                            /* `short` where a sector has one:
                                               "Professional Services" needs
                                               139px in a chip that is 111px
                                               wide on a 320px phone. */
                                            return c?.short ?? c?.label;
                                        })()}
                                    </span>
                                </span>

                                <span className="cl-tile__body">
                                    <span className="cl-tile__row">
                                        <span className="cl-tile__trade">{d.trade}</span>
                                        <span className="cl-tile__city">{d.city}</span>
                                    </span>
                                    <span className="cl-tile__blurb">{d.blurb}</span>
                                    <span className="cl-tile__name">{d.name}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {loading && (
                <HubLoader demo={loading} onCancel={() => setLoading(null)} />
            )}
        </section>
    );
}
