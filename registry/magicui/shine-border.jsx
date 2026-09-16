'use client';

/**
 * ShineBorder, vendored from magicui (`shadcn add @magicui/shine-border`).
 *
 * Converted from TypeScript by hand. A masked radial gradient that sits
 * on top of a card's border ring and slides its background position, so
 * a highlight travels round the edge. It is `position: absolute; inset: 0`
 * and takes the parent's radius, so the parent must be positioned and
 * carry `overflow: hidden` or a radius of its own.
 *
 * The default colour is a token, not upstream's #000000. The animation is
 * `nv-shine` from app/globals.css (keyframes copied from the registry
 * item), rather than a Tailwind theme utility, so the reduced-motion
 * block there can switch it off.
 */
import { cn } from '@/lib/utils';

export function ShineBorder({
    borderWidth = 1,
    duration = 14,
    shineColor = 'var(--nv-lav)',
    className,
    style,
    ...props
}) {
    return (
        <div
            style={{
                '--border-width': `${borderWidth}px`,
                '--duration': `${duration}s`,
                backgroundImage: `radial-gradient(transparent,transparent, ${
                    Array.isArray(shineColor) ? shineColor.join(',') : shineColor
                },transparent,transparent)`,
                backgroundSize: '300% 300%',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                padding: 'var(--border-width)',
                ...style,
            }}
            className={cn(
                'nv-shine pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position]',
                className,
            )}
            aria-hidden="true"
            {...props}
        />
    );
}
