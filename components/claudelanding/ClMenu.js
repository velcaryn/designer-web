'use client';

/**
 * The narrow-screen menu, shared by every header on the site.
 *
 * WHY THIS EXISTS
 *
 * `.cl-topbar__links` hides below 1080px and there was nothing behind
 * it. On a phone the header was a logo and one button, and the only way
 * to reach a section was the dock, which exists on the home page and
 * nowhere else. So on /cloud and the legal pages there was no navigation
 * at all on a phone. This is the fallback: a button that opens the same
 * links as a sheet, used by ClHeader, CloudNav and ClLegalNav so the
 * behaviour is identical wherever you are.
 *
 * WHAT IT HAS TO GET RIGHT
 *
 * A menu that traps a keyboard user is worse than no menu. This one:
 * closes on Escape and on a backdrop click, moves focus into the sheet
 * on open and back to the toggle on close, keeps focus inside the sheet
 * while it is open, and locks the page behind it from scrolling. The
 * toggle carries `aria-expanded` and `aria-controls`, and the sheet is a
 * labelled dialog. Every link closes it on the way out, including the
 * in-page fragments, which otherwise scroll the page underneath a sheet
 * that is still covering it.
 *
 * Links come in as a prop rather than being defined here, because the
 * three headers do not carry the same ones.
 *
 * WHY THE SHEET IS A PORTAL
 *
 * .cl-topbar carries a backdrop-filter, and a filter makes an element
 * the containing block for its position: fixed descendants. Rendered
 * inside the bar, the "full-screen" .cl-menu was in fact confined to the
 * bar's own box: measured 344px wide on a 390px phone, and its backdrop
 * never dimmed the page. Portalling to document.body puts it where the
 * CSS always said it was. The sheet then sits under the bar with the
 * bar's own left/right/shell arithmetic, and its top edge is measured
 * from the bar's real bottom (64 to 72px plus the stroke, depending on
 * the width) in a layout effect that writes the style directly, so it
 * lands before paint and no state changes inside an effect.
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { List, X } from '@phosphor-icons/react';

export default function ClMenu({ open, onOpen, onClose, links, cta }) {
    const sheet = useRef(null);
    const toggle = useRef(null);

    /* Escape from anywhere, not just from a focused child. */
    useEffect(() => {
        if (!open) return undefined;
        function onKey(e) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    /* The page behind a sheet must not scroll: on iOS in particular a
       touch drag over the backdrop otherwise moves the page underneath
       and the visitor loses their place. */
    useEffect(() => {
        if (!open) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    /* Focus in on open, and back to the toggle on close, so a keyboard
       user is never left with focus on a hidden element. */
    useEffect(() => {
        if (open) {
            sheet.current?.querySelector('a, button')?.focus();
        } else {
            toggle.current?.focus({ preventScroll: true });
        }
    }, [open]);

    /* The sheet's top edge is the bar's bottom edge minus one stroke, so
       the two borders overlap into a single line and the sheet reads as
       the bar unfolding. Measured, not assumed: the bar is 70px tall at
       390px and 74 at 640px, with the stroke. */
    useLayoutEffect(() => {
        if (!open) return undefined;
        const bar = toggle.current?.closest('.cl-topbar');
        const el = sheet.current;
        if (!bar || !el) return undefined;
        const place = () => {
            const stroke = parseFloat(getComputedStyle(bar).borderTopWidth) || 3;
            el.style.top = `${Math.round(bar.getBoundingClientRect().bottom - stroke)}px`;
        };
        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [open]);

    function onSheetKeyDown(e) {
        if (e.key !== 'Tab') return;
        const items = sheet.current?.querySelectorAll('a[href], button:not([disabled])');
        if (!items || items.length === 0) return;
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

    return (
        <>
            <button
                ref={toggle}
                type="button"
                className="cl-topbar__burger"
                aria-expanded={open}
                aria-controls="cl-menu-sheet"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => (open ? onClose() : onOpen())}
            >
                {open
                    ? <X size={20} weight="bold" />
                    : <List size={20} weight="bold" />}
            </button>

            {open && createPortal(
                <div className="cl-menu" role="dialog" aria-modal="true" aria-label="Menu">
                    <button
                        type="button"
                        className="cl-menu__backdrop"
                        aria-label="Close menu"
                        onClick={onClose}
                    />
                    <div
                        id="cl-menu-sheet"
                        ref={sheet}
                        className="cl-menu__sheet"
                        onKeyDown={onSheetKeyDown}
                    >
                        <nav className="cl-menu__links" aria-label="Main">
                            {links.map((link, i) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    style={{ '--i': i }}
                                    className={`cl-menu__link${link.active ? ' is-active' : ''}`}
                                    aria-current={link.active ? 'page' : undefined}
                                    onClick={onClose}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {cta && (
                            <Link
                                href={cta.href}
                                className="nv-btn nv-btn--primary cl-menu__cta"
                                onClick={onClose}
                            >
                                {cta.label}
                            </Link>
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}
