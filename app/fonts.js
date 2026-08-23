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
 *   Outfit            geometric sans, near-circular bowls, very wide
 *                     apertures. Holds its shape at 80px and still reads
 *                     cleanly at 20px, so one face covers every heading.
 *   Plus Jakarta Sans body face with a tall x-height and open counters,
 *                     which is what keeps 15px legible on a phone in
 *                     daylight. Distinctly not Inter.
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
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';

export const outfit = Outfit({
    subsets: ['latin'],
    weight: ['500', '600', '700', '800'],
    display: 'swap',
    variable: '--nv-font-outfit',
});

export const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--nv-font-jakarta',
});

export const nvFontVariables = [outfit.variable, jakarta.variable].join(' ');
