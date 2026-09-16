'use client';

/**
 * The floating header. ONE component, every page.
 *
 * WHY THIS EXISTS
 *
 * There were five: ClHeader, ClServiceNav, CloudNav, HubNav and
 * ClLegalNav. Each hand-assembled the same lockup, the same nav row and
 * the same end group, which is exactly the arrangement where they drift
 * apart without anybody editing them together. Measured across four
 * pages before this file existed:
 *
 *   - the brand lockup ended at 251, 271, 307 and 327px, a 76px spread,
 *     because the qualifier word after "VelBiz" differs per page and
 *     justify-content: space-between let its width push the nav;
 *   - the CTA sat at 1189px on two pages and 1253px on the other two,
 *     for the same reason;
 *   - the CTA said "Contact us" on three pages and "Get started" on the
 *     fourth.
 *
 * Nothing about that is visible while you look at one page at a time. It
 * is obvious the moment you navigate between them, which is what a
 * visitor actually does.
 *
 * HOW IT IS HELD STILL
 *
 * A three-column grid, not a flex row with space-between. The centre
 * track is the only one that flexes, so the lockup sits at the same x on
 * every page and the end group sits at the same x on every page,
 * whatever the qualifier says and however many links there are. The nav
 * centres itself in whatever is left.
 *
 * WHAT EACH PAGE SUPPLIES
 *
 * A qualifier ("Digital", "Cloud", "Examples"), its links, and which one
 * is current. Everything else is fixed here on purpose: the CTA label,
 * where it points, the menu, and the order of the end group.
 */
import { useState } from 'react';
import Link from 'next/link';
import { ChatCircle } from '@phosphor-icons/react';
import { brand } from '@/config/site';
import ClMenu from './ClMenu';

export default function ClTopbar({
    /* The word after "VelBiz". Digital on the main site, Cloud on the
       cloud product, Examples on the demo hub. */
    qualifier = 'Digital',
    /* Shown in the bar itself. Keep it to three or four: nine links is a
       site map, and it is what pushed this bar to full width. */
    links = [],
    /* The full set, for the menu sheet. Falls back to `links` when a
       page has nothing extra to offer. */
    menuLinks,
    /* Where the lockup points. "/" everywhere except the home page,
       where it is the top of the page it is already on. */
    home = '/',
    /* Where the CTA points. "/#talk" everywhere, so a visitor on /cloud or
       a service page lands on the home page's contact section. A page
       that carries its own #talk (the landing drafts) passes "#talk", or
       "Contact us" would navigate away from the page being read. The
       LABEL stays fixed; see the note below. */
    ctaHref = '/#talk',
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    /* Fixed, not a prop. A CTA whose words change between pages is the
       same defect as a lockup whose width changes: the eye tracks it as
       a different control. It said "Get started" on /cloud and
       "Contact us" everywhere else. */
    const CTA = { href: ctaHref, label: 'Contact us' };

    return (
        <header className={`cl-topbar${menuOpen ? ' is-open' : ''}`}>
            <div className="cl-topbar__inner">
                <Link href={home} className="cl-topbar__brand">
                    {/* TWO FILES, ONE SHOWN.

                        The mark is an <img>, so it is a separate document
                        and inherits nothing: a black glyph disappeared
                        completely on the two dark lab themes, Midnight
                        Obsidian and Vantablack Acid. Both are rendered
                        and CSS picks, keyed off the data-dark attribute
                        ClLab sets, so any dark theme added later works
                        without touching this file. The white file is the
                        same one the footer already uses. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/vb-mark.svg"
                        alt=""
                        width={44}
                        height={34}
                        className="cl-topbar__brandIcon cl-topbar__brandIcon--ink"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/vb-mark-light.svg"
                        alt=""
                        width={44}
                        height={34}
                        className="cl-topbar__brandIcon cl-topbar__brandIcon--light"
                    />
                    {brand.shortName}
                    <span className="cl-topbar__brandMark">{qualifier}</span>
                </Link>

                <nav className="cl-topbar__links" aria-label="Main">
                    {links.map((l) => {
                        const cls = `cl-topbar__link${l.active ? ' is-active' : ''}`;
                        /* A fragment on the current page has to be a real
                           anchor: next/link would push a route. */
                        return l.href.startsWith('#') ? (
                            <a
                                key={l.href}
                                href={l.href}
                                className={cls}
                                aria-current={l.active ? 'page' : undefined}
                            >
                                {l.label}
                            </a>
                        ) : (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={cls}
                                aria-current={l.active ? 'page' : undefined}
                            >
                                {l.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="cl-topbar__end">
                    {/* The icon shortcut is the phone-width stand-in for
                        the text CTA, which is hidden there for room. */}
                    <Link
                        href={CTA.href}
                        className="cl-topbar__icon"
                        aria-label={CTA.label}
                    >
                        <ChatCircle size={20} weight="bold" />
                    </Link>

                    <ClMenu
                        open={menuOpen}
                        onOpen={() => setMenuOpen(true)}
                        onClose={() => setMenuOpen(false)}
                        links={menuLinks ?? links}
                        cta={CTA}
                    />

                    <Link href={CTA.href} className="nv-btn nv-btn--primary cl-topbar__cta">
                        {CTA.label}
                    </Link>
                </div>
            </div>
        </header>
    );
}
