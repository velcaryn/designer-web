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
 * Every theme sets the same handful of tokens and nothing else:
 *
 *   ink       all text and all outlines
 *   paper     the page ground
 *   accent    highlights, active states, the swipe behind a word
 *   support   secondary text and figures
 *   soft      section grounds and panel fills
 *   fill      the primary button background
 *   onFill    the label on that button
 *
 * Everything else in globals.css derives from those. That constraint is also
 * the test: a palette that cannot express itself in seven values is not a
 * palette, it is a set of one-off decisions.
 *
 * WHY `fill` AND `onFill` ARE STATED, NOT DERIVED
 * For a light theme the primary button is ink with a paper label, and the
 * pair could be inferred. Two things break that. A dark theme inverts the
 * relationship, so inferring would produce a pale button with pale text. And
 * several dark palettes use deliberately high-luminance accents: acid lime
 * measures 1.2:1 against white and 18:1 against black, so the only readable
 * label is the dark canvas colour. Stating both removes the guesswork.
 *
 * CONTRAST IS VERIFIED, NOT ASSUMED
 * Every value below was measured against WCAG before being included. Text on
 * its ground never drops below 13:1, and the weakest primary button in the
 * set is 4.8:1. Nothing ships that cannot carry the copy.
 *
 * ON DARK THEMES
 * The first six were light only, because the dark-plus-purple combination is
 * the default look of every AI-generated site. Six dark options are now
 * included at the founders' request, drawn from what Linear, Ramp, Vercel and
 * Raycast actually do. They are held to the same contrast bar as the rest.
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
            onAccent: '#f7f8fa',
            fill: '#0f2436',
            onFill: '#f7f8fa',
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
            onAccent: '#f7f7f1',
            fill: '#1d2e23',
            onFill: '#f7f7f1',
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
            onAccent: '#fbf7f2',
            fill: '#2b2019',
            onFill: '#fbf7f2',
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
            onAccent: '#fafafa',
            fill: '#18181b',
            onFill: '#fafafa',
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
            /* Darkened from #0F766E. Measured 4.30:1 against the derived
               storm tint in the rendered page, just under AA. */
            support: '#0d6660',
            soft: '#f6e7ec',
            onAccent: '#fdf8f7',
            fill: '#26202b',
            onFill: '#fdf8f7',
        },
    },
    {
        id: 'citrus',
        name: 'Citrus',
        note: 'Deep teal with a tangerine accent on a cool paper. The most energetic option, and the one that photographs best on a phone in daylight.',
        tokens: {
            ink: '#14312f',
            /* Tangerine darkened one step from #C2560E. As an accent-FILLED
               surface with paper text it measured 4.31:1 and missed AA; this
               holds the same colour at 5.10:1. */
            paper: '#f6faf9',
            accent: '#b04d0c',
            support: '#0b6a63',
            soft: '#dcece9',
            onAccent: '#f6faf9',
            fill: '#14312f',
            onFill: '#f6faf9',
        },
    },

    /* ── DARK ──────────────────────────────────────────────────────────
       These invert the relationship the light themes assume: `ink` is the
       light text colour and `paper` is the near-black canvas. Every one sets
       `fill` and `onFill` explicitly, because the primary button can no
       longer be "ink with a paper label".

       The accents here are deliberately high-luminance, which is the whole
       look. It also means white button text fails: acid lime against white
       measures 1.2:1. Each `onFill` is therefore the dark canvas colour, the
       same solution Linear and Ramp use, and every pair below was measured
       before being included. */
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
        id: 'onyx',
        name: 'Matte Onyx',
        dark: true,
        note: 'Heavy matte black with a cyber teal pulse. Reads as backend engine power. The teal is bright enough that its buttons carry dark labels, not white.',
        tokens: {
            ink: '#f4f4f5',
            paper: '#121212',
            accent: '#00ffb2',
            support: '#a1a1aa',
            soft: '#1c1c1e',
            onAccent: '#121212',
            fill: '#00ffb2',
            onFill: '#121212',
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
    {
        id: 'deepspace',
        name: 'Deep Space',
        dark: true,
        note: 'An almost-black blue with an ultraviolet accent. The default look of AI and data platforms right now, which is both its strength and the reason it may date fastest.',
        tokens: {
            ink: '#f8fafc',
            paper: '#030712',
            accent: '#8b5cf6',
            support: '#94a3b8',
            soft: '#0f172a',
            onAccent: '#030712',
            /* One step darker than the accent. The bright #8B5CF6 stays as the
               highlight colour, where it sits on the dark canvas at 4.8:1, but
               as a BUTTON fill under ice-white text it measures 4.0:1 and
               fails AA. #7C3AED holds the same ultraviolet character at
               5.45:1. Measured in the browser, not estimated: an earlier
               calculation put the original at 4.2 and the real render
               disagreed. */
            fill: '#7c3aed',
            onFill: '#f8fafc',
        },
    },
    {
        id: 'executive',
        name: 'Executive Command',
        dark: true,
        note: 'Warm espresso with soft gold. Avoids the blue and black tech default entirely and feels like an invite-only dashboard. The best dark fit for white-glove customer success work.',
        tokens: {
            ink: '#f4ece6',
            paper: '#171311',
            accent: '#e5a93d',
            support: '#c4b5a6',
            soft: '#221c18',
            onAccent: '#171311',
            fill: '#e5a93d',
            onFill: '#171311',
        },
    },
    {
        id: 'charcoal',
        name: 'Deep Charcoal',
        dark: true,
        note: 'Apple-grade charcoal with an amber glow. Warmer and less severe than pure black, and the easiest of the dark set to read long-form copy on.',
        tokens: {
            ink: '#f5f5f7',
            paper: '#1c1c1e',
            accent: '#ff9f0a',
            support: '#d1d1d6',
            soft: '#2c2c2e',
            onAccent: '#1c1c1e',
            fill: '#ff9f0a',
            onFill: '#1c1c1e',
        },
    },

    /* ── LIGHT, ENTERPRISE ─────────────────────────────────────────── */
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
        id: 'oatmilk',
        name: 'Oat Milk',
        note: 'Warm parchment with vermilion. The high-end consulting look: inviting rather than sterile, with an accent that demands action.',
        tokens: {
            ink: '#0f172a',
            paper: '#f2efe9',
            accent: '#ff3b30',
            support: '#57534e',
            soft: '#e7e2d8',
            onAccent: '#0f172a',
            fill: '#0f172a',
            onFill: '#f2efe9',
        },
    },
    {
        id: 'stark',
        name: 'Stark Apple',
        note: 'Pure white, pure black, one coral accent. No greys anywhere, so the layout and the typography have to carry everything. The most demanding option and the most impressive when it works.',
        tokens: {
            ink: '#000000',
            paper: '#ffffff',
            accent: '#ff4d4d',
            support: '#52525b',
            soft: '#f4f4f5',
            onAccent: '#000000',
            fill: '#000000',
            onFill: '#ffffff',
        },
    },
    {
        id: 'fintech',
        name: 'Modern Fintech',
        note: 'Glacial blue with vivid cyan on midnight navy text. Reads as secure, clean and optimistic. The safest choice if regulated clients are the priority.',
        tokens: {
            ink: '#0f172a',
            paper: '#f0f9ff',
            accent: '#06b6d4',
            support: '#475569',
            soft: '#dff1fb',
            onAccent: '#0f172a',
            fill: '#0f172a',
            onFill: '#f0f9ff',
        },
    },
    {
        id: 'editorial',
        name: 'Quirky Editorial',
        note: 'Warm parchment with safety orange. Human rather than corporate, the direction Raycast and PostHog have taken, and a natural fit for the customer success side of the offer.',
        tokens: {
            ink: '#18181b',
            paper: '#f9f9f6',
            accent: '#ea580c',
            support: '#52525b',
            soft: '#eeeee8',
            onAccent: '#18181b',
            fill: '#18181b',
            onFill: '#f9f9f6',
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
    {
        id: 'geist',
        name: 'Geist + Inter',
        note: 'Vercel\u2019s own typeface with the most tested UI face there is. The current default of serious developer tooling, and the closest freely licensed equivalent to the Satoshi look.',
        display: 'var(--f-geist)',
        text: 'var(--f-inter)',
    },
    {
        id: 'geistmono',
        name: 'Geist + Geist Mono',
        note: 'The high-performance engineering look: geometric headlines with a strict data font for labels and figures. Signals that the ERP and the builds are made for operators.',
        display: 'var(--f-geist)',
        text: 'var(--f-geistmono)',
    },
    {
        id: 'clash',
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
        id: 'instrument',
        name: 'Instrument Serif + Inter',
        note: 'A lighter, more contemporary serif than DM Serif: authoritative without being formal. The nearest freely licensed relative of the Ogg direction.',
        display: 'var(--f-instrument)',
        text: 'var(--f-inter)',
    },
];

export const DEFAULT_THEME = 'harbour';
export const DEFAULT_FONT = 'outfit';
