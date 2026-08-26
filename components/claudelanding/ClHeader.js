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
import Link from 'next/link';
import { ChatCircle } from '@phosphor-icons/react';
import { brand } from '@/config/site';
import ClMenu from './ClMenu';

const LINKS = [
    { href: '#top', label: 'Home' },
    { href: '#grow', label: 'How it works' },
    { href: '#tech', label: 'Tech' },
    { href: '#lab', label: 'Lab' },
    { href: '#work', label: 'Work' },
];

export default function ClHeader() {
    const pathname = usePathname();
    const [active, setActive] = useState('top');
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const ids = ['top', 'grow', 'tech', 'lab', 'work', 'talk'];
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

    return (
        <header className="cl-topbar">
            <div className="nv-shell cl-topbar__inner">
                <Link href="/" className="cl-topbar__brand">
                    {/* The wordmark image, not just the type: the header
                        had been text-only since it was first built, and the
                        actual mark that /Nav.js and every other header on
                        the site uses was never wired in here. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/vb-mark.svg"
                        alt=""
                        className="cl-topbar__brandIcon"
                    />
                    {brand.shortName}
                    <span className="cl-topbar__brandMark">Digital</span>
                </Link>

                <nav className="cl-topbar__links" aria-label="Main">
                    {LINKS.map((link) => {
                        const isActive = active === link.href.slice(1);
                        return (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`cl-topbar__link${isActive ? ' is-active' : ''}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {link.label}
                            </a>
                        );
                    })}
                    <Link
                        href="/cloud"
                        className={`cl-topbar__link${pathname === '/cloud' ? ' is-active' : ''}`}
                    >
                        Cloud
                    </Link>
                </nav>

                <div className="cl-topbar__end">
                    {/* Always visible, at every width. On a phone the
                        text CTA is hidden to make room for the menu, and
                        a visitor who wants to get in touch should not
                        have to open a menu to find out how. */}
                    <a
                        href="#talk"
                        className="cl-topbar__icon"
                        aria-label="Contact us"
                    >
                        <ChatCircle size={20} weight="bold" />
                    </a>

                    <a href="#talk" className="nv-btn nv-btn--primary cl-topbar__cta">
                        Contact us
                    </a>

                    <ClMenu
                        open={menuOpen}
                        onOpen={() => setMenuOpen(true)}
                        onClose={() => setMenuOpen(false)}
                        links={[
                            ...LINKS.map((l) => ({
                                ...l,
                                active: active === l.href.slice(1),
                            })),
                            { href: '/cloud', label: 'Cloud', active: pathname === '/cloud' },
                        ]}
                        cta={{ href: '#talk', label: 'Contact us' }}
                    />
                </div>
            </div>
        </header>
    );
}
