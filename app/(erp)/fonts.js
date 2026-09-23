/**
 * Fonts for VelBiz Cloud (the ERP and its admin area).
 *
 * The ERP's stylesheets compose their families from these variables, so they
 * are declared on <html> in app/(erp)/layout.js, where erp.css resolves them
 * at :root. Declared on anything lower, a theme block at :root would find the
 * variable undefined and the text would silently fall back.
 */
import { Inter, Cormorant_Garamond, Instrument_Serif } from 'next/font/google';

export const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--v2-font-inter',
});

export const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    style: ['normal', 'italic'],
    display: 'swap',
    variable: '--v2-font-cormorant',
});

/** Only painted when a tenant picks the "Modern" typography setting. */
export const instrumentSerif = Instrument_Serif({
    subsets: ['latin'],
    weight: '400',
    display: 'swap',
    variable: '--font-instrument-serif',
});

export const erpFontVariables = [inter.variable, cormorant.variable, instrumentSerif.variable].join(' ');
