/**
 * VelBiz Cloud Theme System - Ready-made professional themes a tenant
 * (Cloud) or client (Connect) can choose. Colors here MUST match the
 * `[data-theme="..."]` blocks in src/app/globals.css exactly.
 */

export const THEMES = [
    {
        id: 'velvet',
        name: 'Velvet Midnight (Default)',
        tagline: 'Signature Blockbuster Dark Velvet',
        description: 'Deep obsidian purple glass with royal violet accents, glowing purple borders, and Cormorant/Inter typography.',
        displayFont: "var(--v2-font-cormorant), serif",
        colors: {
            primary: '#7c3aed',
            primaryLight: '#a78bfa',
            secondary: '#482683',
            textMain: '#ffffff',
            textMuted: '#a78bfa',
            bgWhite: '#120b26',
            bgLight: '#0b0619',
        },
    },
    {
        id: 'command',
        name: 'Command Navy',
        tagline: 'Cyber Indigo & Cobalt Glass',
        description: 'Dark midnight navy with electric cobalt highlights, icy blue shadows, and high-tech operational clarity.',
        displayFont: "'Inter', sans-serif",
        colors: {
            primary: '#3b82f6',
            primaryLight: '#60a5fa',
            secondary: '#1d4ed8',
            textMain: '#f8fafc',
            textMuted: '#93c5fd',
            bgWhite: '#0f172a',
            bgLight: '#090d16',
        },
    },
    {
        id: 'emerald',
        name: 'Obsidian Emerald',
        tagline: 'Clinical Mint & Deep Jade',
        description: 'Deep obsidian green with glowing mint emerald highlights and clinical precision data cards.',
        displayFont: "'Inter', sans-serif",
        colors: {
            primary: '#10b981',
            primaryLight: '#34d399',
            secondary: '#047857',
            textMain: '#ecfdf5',
            textMuted: '#6ee7b7',
            bgWhite: '#06231e',
            bgLight: '#041613',
        },
    },
    {
        id: 'gold',
        name: 'Imperial Gold',
        tagline: 'Luxury Jet Black & Amber Gold',
        description: 'Jet black background with glowing warm amber gold accents and executive boardroom prestige.',
        displayFont: "var(--v2-font-cormorant), serif",
        colors: {
            primary: '#f59e0b',
            primaryLight: '#fbbf24',
            secondary: '#b45309',
            textMain: '#fffbeb',
            textMuted: '#fcd34d',
            bgWhite: '#17140f',
            bgLight: '#0d0b08',
        },
    },
    {
        id: 'bedside',
        name: 'Bedside Pearl (Light)',
        tagline: 'Clinical Day Mode',
        description: 'Pearl-white pages under a deep violet rail. High-contrast copy for bright wards and older monitors.',
        displayFont: "var(--v2-font-cormorant), serif",
        colors: {
            primary: '#482683',
            primaryLight: '#6a3bb5',
            secondary: '#2d1752',
            textMain: '#1e293b',
            textMuted: '#64748b',
            bgWhite: '#ffffff',
            bgLight: '#f6f4fb',
        },
    },
    {
        id: 'meridian',
        name: 'Meridian Teal (Light)',
        tagline: 'Calm Clinical Daylight',
        description: 'Soft teal-tinted white with a deep jade rail. The classic clinical register, without the washed-out mint.',
        displayFont: "'Inter', sans-serif",
        colors: {
            primary: '#0f766e',
            primaryLight: '#14b8a6',
            secondary: '#115e59',
            textMain: '#12312e',
            textMuted: '#5c7a76',
            bgWhite: '#ffffff',
            bgLight: '#f2f8f7',
        },
    },
    {
        id: 'daylight',
        name: 'Daylight Slate (Light)',
        tagline: 'Neutral Records Mode',
        description: 'No brand hue in the page at all, for anyone who wants the interface to disappear behind the data.',
        displayFont: "'Inter', sans-serif",
        colors: {
            primary: '#1d4ed8',
            primaryLight: '#3b82f6',
            secondary: '#1e3a8a',
            textMain: '#0f172a',
            textMuted: '#64748b',
            bgWhite: '#ffffff',
            bgLight: '#f1f5f9',
        },
    },
];

export const THEME_IDS = THEMES.map(t => t.id);
export const DEFAULT_THEME = 'velvet';

export function isValidTheme(id) {
    return THEME_IDS.includes(id) || id === 'ledger';
}

export function getTheme(id) {
    return THEMES.find(t => t.id === id) || THEMES.find(t => t.id === DEFAULT_THEME);
}
