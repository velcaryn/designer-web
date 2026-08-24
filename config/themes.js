/**
 * The palettes and typeface pairings offered in the live theme preview.
 *
 * THIS IS A CUSTOMER-FACING FEATURE, NOT SCAFFOLDING ANY MORE.
 * It began as an internal lab for choosing the site's own look. That decision
 * is made: Pearl White with Fraunces and Inter, locked into the token block
 * at the top of app/globals.css and into app/fonts.js.
 *
 * What remains is the demonstration. A visitor deciding whether to hire us
 * can repaint this entire site in their own direction and watch it hold
 * together. That is a far better argument than a paragraph claiming we build
 * to a brand: it shows the design system doing the work, live, on the page
 * they are already reading.
 *
 * WHY THESE FIVE AND THESE FOUR
 * Deliberately not everything we built. The set has to span the range in one
 * glance: a restrained enterprise blue, a warm navy, a fintech green, a
 * developer-tool indigo and an aggressive acid black. Two of them are dark,
 * so the point that this is not just a light site with a filter is made
 * immediately. Eighteen options was a decision tool; five is a demonstration.
 *
 * WHAT A THEME SETS
 *
 *   ink       all text and all outlines
 *   paper     the page ground
 *   accent    highlights, active states, the swipe behind a word
 *   support   secondary text and figures
 *   soft      section grounds and panel fills
 *   fill      the primary button background
 *   onFill    the label on that button
 *   onAccent  text sitting on any accent-filled surface
 *
 * Everything else in globals.css derives from those.
 *
 * `fill`, `onFill` and `onAccent` are STATED, NOT DERIVED. Whether black or
 * white is readable on an accent depends on that accent's luminance, not on
 * whether the theme is light or dark: acid lime measures 1.2:1 against white
 * and 18:1 against black, and both live in dark themes. Deriving them was
 * tried and shipped an unreadable button.
 *
 * CONTRAST IS VERIFIED, NOT ASSUMED. Every value here is measured against the
 * rendered page by `npm run check:contrast`, which drives this list through
 * the preview and checks every text node against the background actually
 * painted behind it. Nothing is added to this file without it passing.
 */

export const THEMES = [
    {
        id: 'pearl',
        name: 'Pearl White',
        note: 'Off-white with a rich sapphire. The frictionless enterprise default: reduces eye strain over long sessions and drives trust without any styling opinion of its own.',
        tokens: {
            ink: '#1d1d1f',
            paper: '#fbfbfd',
            accent: '#0066cc',
            support: '#5c5c61',
            soft: '#eef0f4',
            onAccent: '#fbfbfd',
            fill: '#0066cc',
            onFill: '#fbfbfd',
        },
    },
    {
        id: 'harbour',
        name: 'Harbour',
        note: 'Deep navy with an amber accent. The safest of the six and the most obviously professional: navy reads as competence in almost every market, and the amber keeps it from being cold.',
        tokens: {
            ink: '#0f2436',
            paper: '#f7f8fa',
            accent: '#b45309',
            support: '#1e5f8c',
            soft: '#e3eaf1',
            onAccent: '#f7f8fa',
            fill: '#0f2436',
            onFill: '#f7f8fa',
        },
    },
    {
        id: 'alabaster',
        name: 'Alabaster',
        note: 'Soft grey with forest emerald. Emerald reads as growth and revenue, which is why every fintech has moved to it. Its buttons carry dark labels: emerald against white is only 2.3:1.',
        tokens: {
            ink: '#09090b',
            paper: '#f4f4f5',
            accent: '#10b981',
            support: '#52525b',
            soft: '#e4e4e7',
            onAccent: '#09090b',
            fill: '#10b981',
            onFill: '#09090b',
        },
    },
    {
        id: 'obsidian',
        name: 'Midnight Obsidian',
        dark: true,
        note: 'Near-black canvas with an electric indigo that appears to glow off the screen. The modern developer-tool look, and the most conventional of the dark set.',
        tokens: {
            ink: '#fafafa',
            paper: '#0a0a0a',
            accent: '#5e5ce6',
            support: '#a1a1aa',
            soft: '#18181b',
            onAccent: '#fafafa',
            fill: '#5e5ce6',
            onFill: '#fafafa',
        },
    },
    {
        id: 'vantablack',
        name: 'Vantablack Acid',
        dark: true,
        note: 'Pure black with acid lime. The most aggressive option and the most current: borderless, high velocity, unmistakably a software company.',
        tokens: {
            ink: '#fafafa',
            paper: '#000000',
            accent: '#d4ff00',
            support: '#a1a1aa',
            soft: '#0f0f0f',
            onAccent: '#000000',
            fill: '#d4ff00',
            onFill: '#000000',
        },
    },
];

/**
 * Typeface pairings.
 *
 * The families themselves are declared in app/lab-fonts.js, because next/font
 * needs literal, statically analysable calls and cannot build them from this
 * list at runtime. Each entry names the CSS variables that file exposes.
 *
 * Four of the pairings a founder asked for could not ship: Satoshi and Clash
 * Display are Fontshare, free to use but self-hosted, and the playbook's CSP
 * forbids a third-party font host; Aeonik, Ogg and Neue Montreal are
 * commercial; SF Pro is licensed for interfaces on Apple platforms, which a
 * marketing site is not. The closest freely licensed equivalents are used and
 * described as themselves rather than passed off as the originals.
 */

export const FONTS = [
    {
        id: 'editorial',
        name: 'Fraunces + Inter',
        note: 'A serif display with real personality against a plain sans. The most editorial of the set, and the strongest signal that design is the product rather than a side effect.',
        display: 'var(--f-fraunces)',
        text: 'var(--f-inter)',
    },
    {
        id: 'bricolage',
        name: 'Bricolage Grotesque + Figtree',
        note: 'A stylised, slightly brutalist display against a soft body face. Fast and energetic, and the freely licensed stand-in for the Clash Display direction.',
        display: 'var(--f-bricolage)',
        text: 'var(--f-figtree)',
    },
    {
        id: 'dmserif',
        name: 'DM Serif Display + Poppins',
        note: 'Editorial luxury. A high-contrast serif for headlines that reads as a consulting firm rather than a software vendor, with a friendly modern sans underneath.',
        display: 'var(--f-dmserif)',
        text: 'var(--f-poppins)',
    },
    {
        id: 'geistmono',
        name: 'Geist + Geist Mono',
        note: 'The high-performance engineering look: geometric headlines with a strict data font for labels and figures. Signals that the ERP and the builds are made for operators.',
        display: 'var(--f-geist)',
        text: 'var(--f-geistmono)',
    },
];

/* The site's own look. Anything the visitor picks reverts to this. */
export const DEFAULT_THEME = 'pearl';
export const DEFAULT_FONT = 'editorial';

/* How long a preview lasts before it reverts, in seconds. Long enough to
   scroll up and look at a section properly, short enough that nobody is left
   wondering whether the site is stuck in someone else's palette. */
export const PREVIEW_SECONDS = 10;
