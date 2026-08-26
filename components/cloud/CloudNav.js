/**
 * The header for /cloud and /cloud/onboarding.
 *
 * ROUND TWO: THE SHARED CHROME, NOT A SEPARATE BAR
 *
 * This used to be its own sticky `cl-nav` bar with its own brand
 * treatment, which meant /cloud looked like a different site from /. It
 * now uses the same `cl-topbar` chrome the landing page and the legal
 * pages use, so the header is identical everywhere.
 *
 * A server component, and deliberately not the landing page's ClHeader,
 * for exactly the reason ClLegalNav is not: ClHeader drives its five
 * links from an IntersectionObserver over the ids
 * ['top','grow','tech','lab','work','talk'], and its links are bare
 * fragments. On this route those sections do not exist, so the observer
 * would bail, "Home" would sit permanently active, and all five links
 * would be dead anchors.
 *
 * The links here are therefore split by target: the two that point back
 * at the landing page are ABSOLUTE (`/#grow`, `/#work`) so they navigate
 * and then scroll, while the two in-page ones are plain fragments. The
 * Cloud link is a real route and marks itself active from the `current`
 * prop rather than from a scroll position.
 *
 * A client component only because it holds the open state of the
 * narrow-screen menu. Below 1080px `.cl-topbar__links` is hidden, and
 * without ClMenu this page had no navigation at all on a phone.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatCircle } from '@phosphor-icons/react';
import { brand } from '@/config/site';
import ClMenu from '@/components/claudelanding/ClMenu';

const LINKS = [
    { href: '/#grow', label: 'How it works' },
    { href: '#demo', label: 'Have a look' },
    { href: '/#work', label: 'Work' },
];

export default function CloudNav({ current = '/cloud' }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="cl-topbar">
            <div className="nv-shell cl-topbar__inner">
                <Link href="/" className="cl-topbar__brand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/vb-mark.svg" alt="" className="cl-topbar__brandIcon" />
                    {brand.shortName}
                    <span className="cl-topbar__brandMark">Cloud</span>
                </Link>

                <nav className="cl-topbar__links" aria-label="Main">
                    {LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="cl-topbar__link"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/cloud"
                        className={`cl-topbar__link${current === '/cloud' ? ' is-active' : ''}`}
                        aria-current={current === '/cloud' ? 'page' : undefined}
                    >
                        Cloud
                    </Link>
                </nav>

                <div className="cl-topbar__end">
                    <Link
                        href="/#talk"
                        className="cl-topbar__icon"
                        aria-label="Contact us"
                    >
                        <ChatCircle size={20} weight="bold" />
                    </Link>

                    <Link
                        href="/cloud/onboarding"
                        className="nv-btn nv-btn--primary cl-topbar__cta"
                    >
                        Get started
                    </Link>

                    <ClMenu
                        open={menuOpen}
                        onOpen={() => setMenuOpen(true)}
                        onClose={() => setMenuOpen(false)}
                        links={[
                            ...LINKS,
                            { href: '/cloud', label: 'Cloud', active: current === '/cloud' },
                        ]}
                        cta={{ href: '/cloud/onboarding', label: 'Get started' }}
                    />
                </div>
            </div>
        </header>
    );
}
