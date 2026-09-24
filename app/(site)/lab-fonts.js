/**
 * Every candidate typeface, loaded so the lab can switch between them live.
 *
 * WHY THEY ARE ALL DECLARED HERE
 * next/font requires literal, statically analysable calls: the families cannot
 * be built from the list in config/themes.js at runtime. So each one is
 * spelled out, and each exposes a CSS variable that the pairing entries in
 * that file refer to by name.
 *
 * THE FILES ARE BUNDLED, NOT FETCHED FROM GOOGLE AT BUILD TIME.
 * These families used to go through next/font/google, which downloads each
 * one during the build. Google Fonts intermittently answers with a font URL
 * that has no file extension (/l/font?kit=...&...), and both bundlers fail
 * on it: Turbopack with "next/font/google queries have exactly one entry",
 * webpack with a null read in the loader. Roughly one clean build in five
 * failed, on whichever family was unlucky, including before the site moved
 * into app/(site). The files in assets/fonts/lab are Google's own Latin
 * subsets (the same subset every call here asked for), one variable file
 * per family where Google serves one, per-weight files where it does not.
 * All are SIL Open Font License, which permits bundling them.
 *
 * THIS FILE WAS SCAFFOLDING. IT IS NOW LOAD-BEARING, AND HERE IS WHY.
 * The header used to say this file must be deleted once a pairing was
 * chosen. That was right while the lab was the only consumer. It is no
 * longer true: the sixteen demo sites under /demo-site each pick two
 * families from this list, so the declarations have a second, permanent
 * reason to exist.
 *
 * The cost is smaller than the old header feared. Every family here is
 * declared `preload: false`, so next/font emits the @font-face rules but
 * no <link rel=preload>. A page downloads only the faces it actually
 * paints: the home page pulls the two in app/fonts.js, and a demo pulls
 * the two its own theme names. The other sixteen families cost a few
 * hundred bytes of CSS and no font requests at all.
 *
 * What would break the arrangement is adding preload back, or referencing
 * a family from a component that renders on every route.
 *
 * Weights are kept tight for the same reason: display faces get the two
 * weights the headings actually use, body faces get four. Loading every
 * weight of twelve families would make the lab itself too slow to judge
 * anything by.
 */
import localFont from 'next/font/local';

/*
 * Every call is written out in full. next/font requires literal, statically
 * analysable object arguments: a shared `{...display}` spread fails the build
 * with "Unexpected spread", because the loader reads these at compile time
 * rather than executing them.
 *
 * Weights are kept tight on purpose. Display faces get only the weights the
 * headings use, body faces get four. Loading every weight of eleven families
 * would make the lab too slow to judge anything by.
 *
 * `preload: false` ON EVERY ONE, AND IT MATTERS
 *
 * next/font preloads by default, so these fourteen families were emitting
 * twenty-one <link rel="preload"> font files into the head of EVERY page,
 * about 500KB of render-blocking weight. Two of those faces are the site's
 * own; the rest exist so a visitor can repaint the page in the lab, which
 * most visitors never touch. /cloud and the legal pages carry no lab at all
 * and were paying the same cost.
 *
 * They still work: the CSS variables are still declared on <html>, and the
 * browser fetches a face the moment the lab actually applies it. What is
 * gone is the promise to fetch all of them up front. This is the largest
 * single performance win available on this site, and page speed is a
 * ranking factor.
 *
 * app/fonts.js keeps its default preload, because those two ARE the page.
 */
export const outfit = localFont({
    src: '../../assets/fonts/lab/outfit-latin-variable.woff2', weight: '600 800',
    display: 'swap', preload: false, variable: '--f-outfit',
});
export const jakarta = localFont({
    src: '../../assets/fonts/lab/plus-jakarta-sans-latin-variable.woff2', weight: '400 800',
    display: 'swap', preload: false, variable: '--f-jakarta',
});
export const grotesk = localFont({
    src: '../../assets/fonts/lab/space-grotesk-latin-variable.woff2', weight: '600 700',
    display: 'swap', preload: false, variable: '--f-grotesk',
});
/* INTER AND FRAUNCES ARE NOT DECLARED HERE. THEY ARE ALIASED.

   They used to be, and because app/fonts.js declares the same two
   families for the main site, next/font emitted each font file TWICE:
   once as the preloaded copy (the `.p.` filename) that fonts.js asks for,
   and once as a plain copy that this file's @font-face referenced. Both
   URLs are byte-identical and both were downloaded, on every page.
   Measured on a demo route: 83KB of the 215KB font payload was the same
   two files fetched a second time.

   Aliasing instead means the demos and the theme preview point at the
   copy that is already preloaded. One download, and --f-inter and
   --f-fraunces keep working everywhere they are used, including
   config/themes.js. */
export const archivo = localFont({
    src: '../../assets/fonts/lab/archivo-latin-variable.woff2', weight: '600 800',
    display: 'swap', preload: false, variable: '--f-archivo',
});
export const workSans = localFont({
    src: '../../assets/fonts/lab/work-sans-latin-variable.woff2', weight: '400 700',
    display: 'swap', preload: false, variable: '--f-work',
});
export const lexend = localFont({
    src: '../../assets/fonts/lab/lexend-latin-variable.woff2', weight: '600 800',
    display: 'swap', preload: false, variable: '--f-lexend',
});
export const sourceSans = localFont({
    src: '../../assets/fonts/lab/source-sans-3-latin-variable.woff2', weight: '400 700',
    display: 'swap', preload: false, variable: '--f-source',
});
export const bodoni = localFont({
    src: '../../assets/fonts/lab/bodoni-moda-latin-variable.woff2', weight: '600 800',
    display: 'swap', preload: false, variable: '--f-bodoni',
});
export const jost = localFont({
    src: '../../assets/fonts/lab/jost-latin-variable.woff2', weight: '400 700',
    display: 'swap', preload: false, variable: '--f-jost',
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
export const geist = localFont({
    src: '../../assets/fonts/lab/geist-latin-variable.woff2', weight: '500 800',
    display: 'swap', preload: false, variable: '--f-geist',
});
export const geistMono = localFont({
    src: '../../assets/fonts/lab/geist-mono-latin-variable.woff2', weight: '400 600',
    display: 'swap', preload: false, variable: '--f-geistmono',
});
export const bricolage = localFont({
    src: '../../assets/fonts/lab/bricolage-grotesque-latin-variable.woff2', weight: '200 800',
    display: 'swap', preload: false, variable: '--f-bricolage',
});
export const figtree = localFont({
    src: '../../assets/fonts/lab/figtree-latin-variable.woff2',
    weight: '400 700', display: 'swap', preload: false, variable: '--f-figtree',
});
export const dmSerif = localFont({
    src: '../../assets/fonts/lab/dm-serif-display-latin-variable.woff2', weight: '400',
    display: 'swap', preload: false, variable: '--f-dmserif',
});
export const poppins = localFont({
    src: [
        { path: '../../assets/fonts/lab/poppins-latin-400.woff2', weight: '400', style: 'normal' },
        { path: '../../assets/fonts/lab/poppins-latin-500.woff2', weight: '500', style: 'normal' },
        { path: '../../assets/fonts/lab/poppins-latin-600.woff2', weight: '600', style: 'normal' },
        { path: '../../assets/fonts/lab/poppins-latin-700.woff2', weight: '700', style: 'normal' },
    ],
    display: 'swap', preload: false, variable: '--f-poppins',
});
export const instrument = localFont({
    src: '../../assets/fonts/lab/instrument-serif-latin-variable.woff2', weight: '400',
    display: 'swap', preload: false, variable: '--f-instrument',
});

export const labFontVariables = [
    outfit, jakarta, grotesk, archivo,
    workSans, lexend, sourceSans, bodoni, jost,
    geist, geistMono, bricolage, figtree, dmSerif, poppins, instrument,
].map((f) => f.variable).join(' ');


