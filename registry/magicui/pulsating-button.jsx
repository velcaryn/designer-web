'use client';

/**
 * PulsatingButton, vendored from magicui (`shadcn add @magicui/pulsating-button`).
 *
 * Converted from TypeScript by hand, with two changes that matter:
 *
 *   1. It renders an <a> when given `href`, a <button> otherwise. The one
 *      place it is used is a WhatsApp link, and a link that is really a
 *      button with an onClick navigation is invisible to a screen reader's
 *      link list and to a long-press.
 *   2. Upstream reads the button's computed background colour into a
 *      custom property with a MutationObserver, so the pulse matches a
 *      theme toggle. This site has no runtime theme toggle on the button
 *      and the pulse colour is a token: `pulseColor` defaults to the
 *      accent, and the observer machinery is gone with it.
 *
 * The animation is `nv-pulse` from app/globals.css (the registry item's
 * `pulse` keyframes, a growing then fading box-shadow ring), rather than
 * Tailwind's own `animate-pulse`, which is an opacity fade and not the
 * effect asked for. Every colour comes from the caller's class.
 */
import { cn } from '@/lib/utils';

export function PulsatingButton({
    className,
    children,
    pulseColor = 'var(--nv-lav)',
    duration = '1.5s',
    distance = '8px',
    href,
    ...props
}) {
    const Tag = href ? 'a' : 'button';
    return (
        <Tag
            href={href}
            type={href ? undefined : 'button'}
            className={cn('relative inline-flex items-center justify-center', className)}
            style={{
                '--pulse-color': pulseColor,
                '--duration': duration,
                '--distance': distance,
            }}
            {...props}
        >
            <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
            <span
                aria-hidden="true"
                className="nv-pulse pointer-events-none absolute inset-0 rounded-[inherit]"
            />
        </Tag>
    );
}
