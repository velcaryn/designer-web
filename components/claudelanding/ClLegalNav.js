/**
 * The header for the three legal pages: /privacy, /terms, /credits.
 *
 * All three had the same hand-copied header carrying nothing but the
 * brand mark, which meant that once a visitor followed a footer link to
 * one of them the only way onward was the browser back button: the three
 * pages could not reach each other, and nothing on them pointed at the
 * site's own sections. This is the same `cl-topbar` chrome the landing
 * page uses, with the three legal routes as real links and the current
 * one marked, so the set navigates as a group.
 *
 * Deliberately not the landing page's ClHeader: that header's links are
 * all in-page fragments driven by an IntersectionObserver over sections
 * that do not exist here, so reusing it would ship a scroll-spy watching
 * for six ids that never appear.
 *
 * A client component only because it holds the open state of the
 * narrow-screen menu, which every header on the site now carries.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatCircle } from '@phosphor-icons/react';
import { brand } from '@/config/site';
import ClMenu from './ClMenu';

const LEGAL_LINKS = [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/credits', label: 'Credits' },
];

export default function ClLegalNav({ current }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="cl-topbar">
            <div className="nv-shell cl-topbar__inner">
                <Link href="/" className="cl-topbar__brand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/vb-mark.svg" alt="" className="cl-topbar__brandIcon" />
                    {brand.shortName}
                    <span className="cl-topbar__brandMark">Digital</span>
                </Link>

                <nav className="cl-topbar__links" aria-label="Legal">
                    {LEGAL_LINKS.map((link) => {
                        const isActive = link.href === current;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`cl-topbar__link${isActive ? ' is-active' : ''}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="cl-topbar__end">
                    <Link
                        href="/#talk"
                        className="cl-topbar__icon"
                        aria-label="Contact us"
                    >
                        <ChatCircle size={20} weight="bold" />
                    </Link>

                    <Link href="/#talk" className="nv-btn nv-btn--primary cl-topbar__cta">
                        Contact us
                    </Link>

                    <ClMenu
                        open={menuOpen}
                        onOpen={() => setMenuOpen(true)}
                        onClose={() => setMenuOpen(false)}
                        links={LEGAL_LINKS.map((l) => ({
                            ...l,
                            active: l.href === current,
                        }))}
                        cta={{ href: '/#talk', label: 'Contact us' }}
                    />
                </div>
            </div>
        </header>
    );
}
