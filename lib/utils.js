/**
 * `cn`: joins conditional classNames, skipping falsy values.
 *
 * The vendored registry/ components (magicui, vengenceui) all import this
 * from `@/lib/utils` by convention, so it exists here rather than being
 * inlined into each one. Plain `Boolean` filter and join, not `clsx` +
 * `tailwind-merge`: nothing here passes conflicting Tailwind classes that
 * need de-duping, so the extra dependency would buy nothing.
 */
export function cn(...inputs) {
    return inputs.flat(Infinity).filter(Boolean).join(' ');
}
