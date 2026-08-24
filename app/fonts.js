/**
 * Typefaces for Velbrant Studios, loaded locally to this route rather than in
 * src/lib/fonts.js.
 *
 * WHY LOCAL
 * This site ships to its own repo and its own domain once the name is locked.
 * Keeping the font objects, the CSS and the components under `newventure/`
 * means the migration is a folder move plus a route rename, with nothing left
 * behind in Velcaryn's shared font module for the next person to trip over.
 *
 * WHY THESE TWO
 * The first pass used Syne, which is a display face with deliberately odd
 * letterforms. It photographs well and reads badly, which is the wrong
 * trade for a page whose whole argument is that we make things people can
 * use.
 *
 *   Fraunces  a serif display with real personality: the optical-size axis
 *             makes it sharpen as it grows, so headlines have character
 *             without the body text inheriting it. It is the strongest
 *             signal on the page that design is the product here rather
 *             than a side effect.
 *   Inter     the most tested interface face there is, and deliberately
 *             plain underneath a display serif. The contrast between the
 *             two is the point of the pairing.
 *
 * Both are variable-weight on Google Fonts, so the weight range below costs
 * one file per family rather than one per weight.
 *
 * The variables are attached to the same element that carries `.nv-root`
 * (see layout.js). That is deliberate: a custom property is substituted in
 * the scope where it is DECLARED, so composing `--nv-font-display:
 * var(--nv-font-outfit)` inside `.nv-root` only resolves if the source
 * variable exists on that same element. Declaring the composition on :root
 * while next/font puts the source on a descendant is the exact bug in
 * docs/FRONTEND_RULES.md that silently fell every heading back to the body
 * font.
 */
import { Fraunces, Inter } from 'next/font/google';

/* Variable weight with an optical-size axis. The range is what gives the
   headings their character, so no weight list is pinned. */
export const fraunces = Fraunces({
    subsets: ['latin'],
    display: 'swap',
    variable: '--nv-font-fraunces',
});

export const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
    variable: '--nv-font-inter',
});

export const nvFontVariables = [fraunces.variable, inter.variable].join(' ');
