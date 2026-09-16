'use client';

/**
 * LineShadowText, vendored from magicui (`shadcn add @magicui/line-shadow-text`).
 *
 * A hatched shadow copy of the word sits behind it, offset down-right,
 * and its hatching slides on a loop. Upstream builds it from Tailwind
 * `after:` arbitrary-value utilities; those are exactly the classes a
 * scoped source scan can miss silently, and the dock once rendered
 * unstyled for that reason. So this is plain CSS: `.nv-lineShadow` and
 * its `::after` live in app/globals.css with the `nv-line-shadow`
 * keyframes (copied from the registry item), reachable by the
 * reduced-motion block there. The shadow colour is a token by default.
 */
export function LineShadowText({ children, shadowColor = 'var(--nv-lav)', className = '', as: Tag = 'span', ...props }) {
    return (
        <Tag
            className={`nv-lineShadow ${className}`}
            style={{ '--shadow-color': shadowColor }}
            data-text={children}
            {...props}
        >
            {children}
        </Tag>
    );
}
