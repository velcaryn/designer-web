'use client';

/**
 * AuroraText, vendored from magicui (`shadcn add @magicui/aurora-text`).
 *
 * Converted from TypeScript by hand. The upstream defaults are a pink,
 * purple and blue gradient; nothing here uses them, because a colour in a
 * component is a raw value. The caller passes tokens as `var(...)`
 * strings, which a CSS gradient resolves at paint time.
 *
 * The animation is `nv-aurora`, declared in app/globals.css, rather than
 * the `animate-aurora` utility magicui adds to Tailwind's theme: the
 * keyframes were copied from the registry item's `css` field so the
 * motion is the same, and living in the stylesheet they are reachable by
 * the reduced-motion block there.
 */
import { memo } from 'react';

export const AuroraText = memo(function AuroraText({
    children,
    className = '',
    colors = ['var(--nv-lav)', 'var(--nv-lav-deep)', 'var(--nv-ink)', 'var(--nv-lav)'],
    speed = 1,
}) {
    const gradientStyle = {
        backgroundImage: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animationDuration: `${10 / speed}s`,
    };

    return (
        <span className={`relative inline-block ${className}`}>
            <span className="sr-only">{children}</span>
            <span
                className="nv-aurora relative bg-clip-text text-transparent"
                style={gradientStyle}
                aria-hidden="true"
            >
                {children}
            </span>
        </span>
    );
});
