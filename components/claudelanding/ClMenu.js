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
 */
import { useEffect, useRef } from 'react';
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

            {open && (
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
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
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
                </div>
            )}
        </>
    );
}
