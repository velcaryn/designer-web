'use client';

/**
 * A copy-link control for one section, so a specific part of the page can be
 * sent to a specific person.
 *
 * WHY
 * The site is one long page, which is right for reading and wrong for
 * sharing: sending someone "the compliance bit" currently means sending the
 * whole thing and telling them to scroll. Every section now has a stable
 * anchor and a control that copies the full URL to it.
 *
 * TOUCH FIRST, WHICH CHANGES THE DESIGN
 * The common pattern is a link icon that appears on hover next to a heading.
 * That is invisible on a phone, where hover does not exist, and a phone is
 * where a link is most likely to be shared from. So this is a real, always
 * visible, 44px control rather than a hover affordance. On a pointer device
 * it dims until the section is hovered, which keeps it quiet without ever
 * making it unreachable.
 *
 * `navigator.clipboard` needs a secure context, so it is absent over plain
 * HTTP on a LAN address, which is exactly how this gets tested on a phone.
 * The fallback selects a temporary textarea and runs `execCommand`, which is
 * deprecated but still works everywhere and is the difference between the
 * button working on your phone and silently doing nothing.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { LinkSimple, Check } from '@phosphor-icons/react/ssr';

export default function SectionLink({ target, label }) {
    const [copied, setCopied] = useState(false);
    const timer = useRef(null);

    /* Clearing on unmount stops a pending timeout calling setState on a
       component that has gone. */
    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = useCallback(async () => {
        const url = `${window.location.origin}${window.location.pathname}#${target}`;

        let ok = false;
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(url);
                ok = true;
            } catch {
                ok = false;
            }
        }

        if (!ok) {
            /* Insecure context, or the write was refused. */
            const el = document.createElement('textarea');
            el.value = url;
            el.setAttribute('readonly', '');
            /* Off-screen rather than hidden: a display:none element cannot be
               selected, and on iOS the page scrolls to a focused field unless
               it is positioned out of the way. */
            el.style.cssText = 'position:absolute;left:-9999px;top:0';
            document.body.appendChild(el);
            el.select();
            try { document.execCommand('copy'); ok = true; } catch { ok = false; }
            document.body.removeChild(el);
        }

        /* The address bar updates either way, so even if copying failed the
           reader can copy it themselves from there. */
        if (window.history?.replaceState) {
            window.history.replaceState(null, '', `#${target}`);
        }

        if (ok) {
            setCopied(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2000);
        }
    }, [target]);

    return (
        <button
            type="button"
            className={`nv-seclink${copied ? ' is-copied' : ''}`}
            onClick={copy}
            /* The name says what it does and what it points at, which is what
               a screen reader user needs from a row of identical buttons. */
            aria-label={copied ? `Link to ${label} copied` : `Copy link to ${label}`}
        >
            {copied
                ? <Check size={16} weight="bold" aria-hidden="true" />
                : <LinkSimple size={16} weight="bold" aria-hidden="true" />}
            <span className="nv-seclink__text">{copied ? 'Copied' : 'Copy link'}</span>
        </button>
    );
}
