'use client';

/**
 * Sticky navigation and the mobile drawer.
 *
 * Two pieces of real behaviour here, both cheap:
 *
 * 1. The hairline under the bar only appears once the page has scrolled, so
 *    the nav dissolves into the hero at rest and separates from content the
 *    moment it starts overlapping it. Driven by IntersectionObserver on a
 *    sentinel, not by a scroll listener: a scroll handler fires on every
 *    frame and is the standard way this pattern becomes jank.
 *
 * 2. The active link tracks the section in view, again by observer.
 *
 * The drawer locks body scroll while open, restores it on close and on
 * unmount, and closes on Escape.
 */
import { useEffect, useRef, useState } from 'react';
import { List, X, ArrowUpRight } from '@phosphor-icons/react/ssr';

const LINKS = [
    { href: '#capabilities', label: 'What we do' },
    { href: '#work', label: 'Work' },
    { href: '#process', label: 'Process' },
    { href: '#cloud', label: 'Cloud and ERP' },
    { href: '#engagements', label: 'Engagements' },
];

export default function Nav() {
    const [stuck, setStuck] = useState(false);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState('');
    const sentinel = useRef(null);

    /* Hairline: observe a zero-height sentinel sitting above the nav. */
    useEffect(() => {
        const el = sentinel.current;
        if (!el) return undefined;
        const io = new IntersectionObserver(
            ([entry]) => setStuck(!entry.isIntersecting),
            { rootMargin: '0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    /* Active link. rootMargin pulls the trigger line to roughly a third down
       the viewport so a section counts as "current" when it is being read,
       not when its last pixel scrolls past the top. */
    useEffect(() => {
        const targets = LINKS
            .map(({ href }) => document.querySelector(href))
            .filter(Boolean);
        if (!targets.length) return undefined;

        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (visible) setActive(`#${visible.target.id}`);
            },
            { rootMargin: '-30% 0px -60% 0px' },
        );
        targets.forEach((t) => io.observe(t));
        return () => io.disconnect();
    }, []);

    /* Scroll lock plus Escape, and an unconditional restore on unmount so a
       route change while the drawer is open cannot leave the body locked. */
    useEffect(() => {
        if (!open) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const wordmark = (
        <a href="#top" className="nv-wordmark" aria-label="Velbrant Studios, home">
            <span className="nv-wordmark__mark">Velbrant</span>
            <span className="nv-wordmark__sub">Studios</span>
        </a>
    );

    return (
        <>
            <div ref={sentinel} aria-hidden="true" />
            <header className={`nv-nav${stuck ? ' is-stuck' : ''}`}>
                <div className="nv-shell nv-nav__inner">
                    {wordmark}

                    <nav className="nv-nav__links" aria-label="Primary">
                        {LINKS.map(({ href, label }) => (
                            <a
                                key={href}
                                href={href}
                                className={`nv-nav__link${active === href ? ' is-active' : ''}`}
                                aria-current={active === href ? 'true' : undefined}
                            >
                                {label}
                            </a>
                        ))}
                    </nav>

                    <a href="#contact" className="nv-btn nv-btn--primary nv-nav__cta">
                        Start a project
                        <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
                    </a>

                    <button
                        type="button"
                        className="nv-nav__toggle"
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                    >
                        {open
                            ? <X size={20} weight="bold" aria-hidden="true" />
                            : <List size={20} weight="bold" aria-hidden="true" />}
                    </button>
                </div>
            </header>

            {open && (
                <div className="nv-drawer" role="dialog" aria-modal="true" aria-label="Menu">
                    {LINKS.map(({ href, label }) => (
                        <a
                            key={href}
                            href={href}
                            className="nv-drawer__link"
                            onClick={() => setOpen(false)}
                        >
                            {label}
                        </a>
                    ))}
                    <a
                        href="#contact"
                        className="nv-btn nv-btn--primary"
                        onClick={() => setOpen(false)}
                    >
                        Start a project
                        <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
                    </a>
                </div>
            )}
        </>
    );
}
