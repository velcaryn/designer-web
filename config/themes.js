/**
 * Candidate colour themes and font pairings for the studio site.
 *
 * WHY THIS EXISTS
 * The palette is not settled. Rather than argue about it in the abstract, the
 * lab at /lab renders the real site under each option so the decision is made
 * by looking at it. Once one is chosen, its values move into the token block
 * at the top of app/globals.css and this file, the lab route and the switcher
 * are deleted. It is scaffolding, and it is meant to be thrown away.
 *
 * HOW A THEME IS DEFINED
 * Every theme overrides the same five tokens and nothing else:
 *
 *   ink       all text, all outlines, the primary button fill
 *   paper     the page ground
 *   accent    highlights, active states, the swipe behind a word
 *   support   secondary text and figures
 *   soft      section grounds and panel fills
 *
 * Everything else in globals.css derives from those, which is why a theme is
 * five lines rather than fifty. That constraint is also the test: a palette
 * that cannot express itself in five tokens is not a palette, it is a set of
 * one-off decisions.
 *
 * CONTRAST IS VERIFIED, NOT ASSUMED
 * Every combination below was measured against WCAG before being included.
 * The worst pairing in the whole set is 4.3:1 for an accent against paper,
 * which clears AA for the large bold type it is used on, and ink-on-paper
 * never drops below 13:1. No theme ships that cannot carry the copy.
 *
 * WHAT IS DELIBERATELY ABSENT
 * No dark mode, and nothing purple or violet. Both were ruled out: the
 * dark-plus-purple combination is the default look of every AI-generated site
 * and reads as generic on sight. The brief is a palette that will still look
 * professional in a client directory years from now, which argues for
 * restrained, well-tested colour rather than whatever is current.
 */

export const THEMES = [
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
        },
    },
    {
        id: 'sage',
        name: 'Sage',
        note: 'Forest green on warm paper with a clay accent. Calm and grown-up, and the one that looks least like a technology company, which may be an advantage with the food and craft clients.',
        tokens: {
            ink: '#1d2e23',
            paper: '#f7f7f1',
            accent: '#c2410c',
            support: '#2f6b4f',
            soft: '#e4ebe2',
        },
    },
    {
        id: 'terracotta',
        name: 'Terracotta',
        note: 'Warm rust against cool slate. The most distinctive of the six and the most Indian in feel without being literal about it. Handles photography of physical products well.',
        tokens: {
            ink: '#2b2019',
            paper: '#fbf7f2',
            accent: '#b4451f',
            support: '#4a6572',
            soft: '#f0e4da',
        },
    },
    {
        id: 'ink',
        name: 'Ink',
        note: 'Near-black on off-white with a single blue accent. The highest contrast in the set at 17:1. Nothing here will ever date, and it puts all the emphasis on the type and the work.',
        tokens: {
            ink: '#18181b',
            paper: '#fafafa',
            accent: '#1d4ed8',
            support: '#52525b',
            soft: '#eaeaec',
        },
    },
    {
        id: 'bloom',
        name: 'Bloom',
        note: 'Soft rose with a deep teal accent. The playful pastel option, kept professional by a near-black text colour rather than a coloured one. Warmest of the six.',
        tokens: {
            ink: '#26202b',
            paper: '#fdf8f7',
            accent: '#be4a6e',
            support: '#0f766e',
            soft: '#f6e7ec',
        },
    },
    {
        id: 'citrus',
        name: 'Citrus',
        note: 'Deep teal with a tangerine accent on a cool paper. The most energetic option, and the one that photographs best on a phone in daylight.',
        tokens: {
            ink: '#14312f',
            paper: '#f6faf9',
            accent: '#c2560e',
            support: '#0d7a72',
            soft: '#dcece9',
        },
    },
];

/**
 * Font pairings, all from Google Fonts so they self-host through next/font
 * with no third-party request at runtime.
 *
 * Each entry names the CSS variables the lab loads. The families themselves
 * are declared in app/lab/fonts.js: next/font requires literal, statically
 * analysable calls, so they cannot be built from this list at runtime.
 */
export const FONTS = [
    {
        id: 'outfit',
        name: 'Outfit + Plus Jakarta Sans',
        note: 'The current pairing. Geometric display with a tall-x-height body. Neutral, highly legible, and slightly generic, which is the reason for looking at alternatives.',
        display: 'var(--f-outfit)',
        text: 'var(--f-jakarta)',
    },
    {
        id: 'clash',
        name: 'Space Grotesk + Inter',
        note: 'Space Grotesk has genuine character in its widths without being difficult. Inter underneath is the most tested UI face there is. Reads as a studio that ships software.',
        display: 'var(--f-grotesk)',
        text: 'var(--f-inter)',
    },
    {
        id: 'editorial',
        name: 'Fraunces + Inter',
        note: 'A serif display with real personality against a plain sans. The most editorial of the set, and the strongest signal that design is the product rather than a side effect.',
        display: 'var(--f-fraunces)',
        text: 'var(--f-inter)',
    },
    {
        id: 'archivo',
        name: 'Archivo + Work Sans',
        note: 'Grotesque display with a humanist body. Quiet, sturdy and slightly institutional in a good way. The pairing that will look least dated in five years.',
        display: 'var(--f-archivo)',
        text: 'var(--f-work)',
    },
    {
        id: 'lexend',
        name: 'Lexend + Source Sans 3',
        note: 'Lexend is drawn specifically to improve reading speed. The most accessible option in the set, and a defensible choice for a studio that argues for accessibility.',
        display: 'var(--f-lexend)',
        text: 'var(--f-source)',
    },
    {
        id: 'bodoni',
        name: 'Bodoni Moda + Jost',
        note: 'High-contrast serif with a geometric sans. The most premium and the most fashion-adjacent. Beautiful at large sizes, and demands generous spacing to work.',
        display: 'var(--f-bodoni)',
        text: 'var(--f-jost)',
    },
];

export const DEFAULT_THEME = 'harbour';
export const DEFAULT_FONT = 'outfit';
