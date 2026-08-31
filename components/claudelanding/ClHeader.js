'use client';

/**
 * The top header: full-width, brand on the left, section links in the
 * middle, one Contact us button on the right.
 *
 * ROUND THREE REPLACES THE SMALL FLOATING PILL
 *
 * The pill sat only in the top-left corner and carried no navigation at
 * all, which read as too small and too little on both mobile and desktop.
 * This is a conventional full-width bar instead: it and the bottom dock now
 * both carry navigation on purpose, rather than the header being reduced
 * to a logo. The header gives sighted desktop and tablet visitors real text
 * labels for every section; the dock at the bottom stays the icon-only,
 * always-in-thumb-reach control the same six targets are also reachable
 * from, particularly useful once a visitor has scrolled well past the top.
 *
 * The six links track the current section exactly the way the old ClNav
 * did: one IntersectionObserver over the section ids, matched against
 * `active`.
 *
 * ON A NARROW SCREEN THE TEXT LINKS ARE HIDDEN, NOT THE BAR ITSELF
 *
 * There is no hamburger and no drawer here. Below the width where six text
 * links plus a brand plus a button stop fitting, the links disappear and
 * the bar keeps only the brand and the Contact us button, both real
 * always-visible controls; the dock at the bottom is what carries
 * navigation on that width, and it already does, at every width, without
 * needing a menu to open first.
 */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ClTopbar from './ClTopbar';

/* THREE IN THE BAR. EVERYTHING ELSE IN THE MENU.

   This was nine links, which is a site map rather than navigation and is
   what pushed the bar to the full width of the viewport. The three that
   stay are the ones a reader would not find by scrolling: Tech and Lab
   are sections they would not know to look for, and Cloud is a separate
   product. */
const LINKS = [
    { href: '#tech', label: 'Tech' },
    { href: '#lab', label: 'Lab' },
    { href: '/cloud', label: 'Cloud' },
];

/* The full set, for the menu sheet, ordered as the page is ordered so it
   reads as a table of contents rather than a leftovers list. */
const MENU_LINKS = [
    { href: '#top', label: 'Home' },
    { href: '#grow', label: 'How it works' },
    { href: '#tech', label: 'Tech' },
    { href: '#lab', label: 'Lab' },
    { href: '#work', label: 'Work' },
    { href: '/services/websites', label: 'Services' },
    { href: '#invest', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
    { href: '/cloud', label: 'Cloud' },
];

/* WHICH BAR LINK OWNS WHICH SECTION.

   The bar shows three links and the page has eleven sections, so a link
   owns only the sections it actually covers. A first attempt mapped every
   section to the nearest link above it, which kept something lit but left
   "Lab" highlighted across Work, Pricing, FAQ and Contact: 12 of 24
   scroll positions claiming a section the reader had long since left. A
   highlight that lies is worse than none.

   Everything else maps to the lockup, which lights a small dot meaning
   "on this page, not in one of these three". That is true everywhere, and
   the dock at the bottom carries the finer-grained position. */
const SECTION_OWNER = {
    top: null,
    start: null,
    grow: null,
    what: null,
    tech: '#tech',
    lab: '#lab',
    work: null,
    who: null,
    invest: null,
    faq: null,
    talk: null,
};

export default function ClHeader() {
    const pathname = usePathname();
    const [active, setActive] = useState('top');

    useEffect(() => {
        /* Every section is observed, not just the ones with a link. This
           used to derive the list from LINKS, which was right while the
           bar carried nine of them; once it was cut to three, two thirds
           of the page went unobserved and the highlight simply went out. */
        const ids = Object.keys(SECTION_OWNER);
        const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
        if (nodes.length === 0) return undefined;
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible) setActive(visible.target.id);
            },
            { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
        );
        nodes.forEach((n) => io.observe(n));
        return () => io.disconnect();
    }, []);

    const owner = SECTION_OWNER[active];

    const withActive = (list) =>
        list.map((l) => ({
            ...l,
            active: l.href.startsWith('#') ? owner === l.href : pathname === l.href,
        }));

    return (
        <ClTopbar
            qualifier="Digital"
            links={withActive(LINKS)}
            menuLinks={withActive(MENU_LINKS)}
            home="#top"
        />
    );
}
