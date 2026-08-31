'use client';

/**
 * The floating pill that opens the other fifteen.
 *
 * WHY IT EXISTS
 *
 * A prospect gets sent one link. If they also run a bakery, or their
 * brother runs a workshop, or they simply want to see whether the range
 * is real, the alternative to this is closing the page and going back to
 * the chat to ask for another link. Most people will not.
 *
 * WHY IT IS SMALL AND SITS IN THE CORNER
 *
 * It is not the point of the page. The demo is. A prominent switcher
 * would tell the visitor they are looking at a catalogue of samples,
 * which is exactly the framing that stops the demo doing its job of
 * feeling like a real business's website.
 *
 * THE DIALOG CONTRACT
 *
 * Escape, backdrop click, focus into the sheet on open and back to the
 * trigger on close, focus trapped while open, body scroll locked.
 * components/claudelanding/ClMenu.js implements exactly this and is the
 * reference; the behaviour is copied rather than the markup, because
 * ClMenu is cl- classed against a stylesheet these routes never load.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GridFour, X } from '@phosphor-icons/react';
import { DEMOS, CATEGORIES } from '@/content/demos';

export default function DemoSwitcher({ current }) {
    const [open, setOpen] = useState(false);
    const [cat, setCat] = useState('all');
    const sheet = useRef(null);
    const trigger = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    /* The page behind must not scroll: on iOS a touch drag over the
       backdrop otherwise moves the page and the visitor loses their
       place in the demo they were reading. */
    useEffect(() => {
        if (!open) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    useEffect(() => {
        if (open) sheet.current?.querySelector('a, button')?.focus();
        else trigger.current?.focus({ preventScroll: true });
    }, [open]);

    function onSheetKeyDown(e) {
        if (e.key !== 'Tab') return;
        const items = sheet.current?.querySelectorAll('a[href], button:not([disabled])');
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    const shown = cat === 'all' ? DEMOS : DEMOS.filter((d) => d.category === cat);

    return (
        <>
            <button
                ref={trigger}
                type="button"
                className="vd-switch__pill"
                onClick={() => setOpen(true)}
                aria-label="More examples"
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                {/* The label is hidden below 640px so the pill becomes a
                    circle. A block of floating text over the content is
                    the wrong trade on a 390px screen, and the button
                    keeps its accessible name from aria-label. */}
                <GridFour size={20} weight="bold" aria-hidden="true" />
                <span className="vd-switch__label">More examples</span>
            </button>

            {open && (
                <div className="vd-switch" role="dialog" aria-modal="true" aria-label="Other examples">
                    <button
                        type="button"
                        className="vd-switch__scrim"
                        aria-label="Close"
                        onClick={() => setOpen(false)}
                    />

                    <div className="vd-switch__sheet" ref={sheet} onKeyDown={onSheetKeyDown}>
                        <div className="vd-switch__head">
                            <p className="vd-switch__title">Sixteen examples</p>
                            <button
                                type="button"
                                className="vd-switch__close"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                            >
                                <X size={18} weight="bold" />
                            </button>
                        </div>

                        <div className="vd-switch__filters" role="group" aria-label="Filter by trade">
                            <button
                                type="button"
                                className={`vd-switch__filter${cat === 'all' ? ' vd-switch__filter--active' : ''}`}
                                aria-pressed={cat === 'all'}
                                onClick={() => setCat('all')}
                            >
                                All
                            </button>
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`vd-switch__filter${cat === c.id ? ' vd-switch__filter--active' : ''}`}
                                    aria-pressed={cat === c.id}
                                    onClick={() => setCat(c.id)}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        <ul className="vd-switch__list">
                            {shown.map((d) => (
                                <li key={d.slug}>
                                    <Link
                                        href={`/demo-site/${d.slug}`}
                                        className="vd-switch__item"
                                        aria-current={d.slug === current ? 'page' : undefined}
                                        onClick={() => setOpen(false)}
                                    >
                                        <span className="vd-switch__swatch" aria-hidden="true">
                                            {d.swatch.map((c) => (
                                                <span key={c} style={{ background: c }} />
                                            ))}
                                        </span>
                                        {/* Trade first, same reasoning as
                                            the hub grid: someone jumping
                                            between examples is choosing a
                                            line of work, not a shop
                                            name. */}
                                        <span className="vd-switch__meta">
                                            <span className="vd-switch__name">
                                                {d.trade}
                                                {d.slug === current ? ', you are here' : ''}
                                            </span>
                                            <span className="vd-switch__trade">{d.name}</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <Link href="/demo-site" className="vd-switch__all" onClick={() => setOpen(false)}>
                            See all of them side by side
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
