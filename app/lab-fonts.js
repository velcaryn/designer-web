/**
 * Every candidate typeface, loaded so the lab can switch between them live.
 *
 * WHY THEY ARE ALL DECLARED HERE
 * next/font requires literal, statically analysable calls: the families cannot
 * be built from the list in config/themes.js at runtime. So each one is
 * spelled out, and each exposes a CSS variable that the pairing entries in
 * that file refer to by name.
 *
 * THIS FILE IS SCAFFOLDING AND MUST BE DELETED.
 * Twelve families is a lot of font to ship, and it is only acceptable because
 * the lab exists to be looked at once and then removed. When a pairing is
 * chosen, its two families move into app/fonts.js and this file goes with the
 * rest of the lab. Leaving it in place would mean every visitor downloads ten
 * typefaces nobody chose.
 *
 * Weights are kept tight for the same reason: display faces get the two
 * weights the headings actually use, body faces get four. Loading every
 * weight of twelve families would make the lab itself too slow to judge
 * anything by.
 */
import {
    Outfit,
    Plus_Jakarta_Sans,
    Space_Grotesk,
    Inter,
    Fraunces,
    Archivo,
    Work_Sans,
    Lexend,
    Source_Sans_3,
    Bodoni_Moda,
    Jost,
    Geist,
    Geist_Mono,
    Bricolage_Grotesque,
    Figtree,
    DM_Serif_Display,
    Poppins,
    Instrument_Serif,
} from 'next/font/google';

/*
 * Every call is written out in full. next/font requires literal, statically
 * analysable object arguments: a shared `{...display}` spread fails the build
 * with "Unexpected spread", because the loader reads these at compile time
 * rather than executing them.
 *
 * Weights are kept tight on purpose. Display faces get only the weights the
 * headings use, body faces get four. Loading every weight of eleven families
 * would make the lab too slow to judge anything by.
 */
export const outfit = Outfit({
    subsets: ['latin'], display: 'swap', weight: ['600', '700', '800'], variable: '--f-outfit',
});
export const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700', '800'], variable: '--f-jakarta',
});
export const grotesk = Space_Grotesk({
    subsets: ['latin'], display: 'swap', weight: ['600', '700'], variable: '--f-grotesk',
});
export const inter = Inter({
    subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700'], variable: '--f-inter',
});
/* Fraunces is variable-weight with an optical-size axis, and the range is
   what gives the headings their character, so no weight list is pinned. */
export const fraunces = Fraunces({
    subsets: ['latin'], display: 'swap', variable: '--f-fraunces',
});
export const archivo = Archivo({
    subsets: ['latin'], display: 'swap', weight: ['600', '700', '800'], variable: '--f-archivo',
});
export const workSans = Work_Sans({
    subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700'], variable: '--f-work',
});
export const lexend = Lexend({
    subsets: ['latin'], display: 'swap', weight: ['600', '700', '800'], variable: '--f-lexend',
});
export const sourceSans = Source_Sans_3({
    subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700'], variable: '--f-source',
});
export const bodoni = Bodoni_Moda({
    subsets: ['latin'], display: 'swap', weight: ['600', '700', '800'], variable: '--f-bodoni',
});
export const jost = Jost({
    subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700'], variable: '--f-jost',
});

/*
 * Second wave, from the founders' reference list.
 *
 * SIX OF THE NAMED FONTS ARE NOT HERE, AND CANNOT BE:
 *   Satoshi, Clash Display   Fontshare. Free to use but self-hosted, and the
 *                            playbook's CSP forbids a third-party font host.
 *   Aeonik, Ogg,             Commercial. They need a purchased licence, which
 *   Neue Montreal            is a decision with a cost attached, not a default.
 *   SF Pro                   Apple's licence covers interfaces on Apple
 *                            platforms. A marketing site is not that.
 *
 * The substitutions below are the closest freely licensed equivalents and are
 * labelled honestly in config/themes.js rather than passed off as the
 * originals. If a paid family is bought later, swapping it in is one entry.
 */
export const geist = Geist({
    subsets: ['latin'], display: 'swap', weight: ['500', '600', '700', '800'], variable: '--f-geist',
});
export const geistMono = Geist_Mono({
    subsets: ['latin'], display: 'swap', weight: ['400', '500', '600'], variable: '--f-geistmono',
});
export const bricolage = Bricolage_Grotesque({
    subsets: ['latin'], display: 'swap', variable: '--f-bricolage',
});
export const figtree = Figtree({
    subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700'], variable: '--f-figtree',
});
export const dmSerif = DM_Serif_Display({
    subsets: ['latin'], display: 'swap', weight: ['400'], variable: '--f-dmserif',
});
export const poppins = Poppins({
    subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700'], variable: '--f-poppins',
});
export const instrument = Instrument_Serif({
    subsets: ['latin'], display: 'swap', weight: ['400'], variable: '--f-instrument',
});

export const labFontVariables = [
    outfit, jakarta, grotesk, inter, fraunces, archivo,
    workSans, lexend, sourceSans, bodoni, jost,
    geist, geistMono, bricolage, figtree, dmSerif, poppins, instrument,
].map((f) => f.variable).join(' ');
