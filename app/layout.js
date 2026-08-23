/**
 * Root layout for the Velbrant Studios site.
 *
 * This repo was extracted from the Velcaryn application, where the site lived
 * at /newventure behind Velcaryn's own root layout. Two things changed in the
 * move and both matter:
 *
 *   1. There is no longer a globals.css from another product reaching in. The
 *      old stylesheet carried a block whose only job was to undo Velcaryn's
 *      element-level typography colours, which had been repainting every
 *      headline in Velcaryn purple. That block is gone, replaced by a real
 *      base reset in app/globals.css.
 *
 *   2. There is no consent banner, no analytics and no providers inherited
 *      from a parent layout. Anything this site needs, it declares here.
 *
 * NOINDEX IS STILL ON, deliberately. The brand name has not been cleared: the
 * MCA company-name check and the IP India trademark search (class 42 for
 * software, class 35 for business consulting) have not been run against
 * "Velbrant". Indexing a name that may have to change means the eventual real
 * name launches competing with a dead one. Flip `robots` below once the name
 * is cleared and the domain is live.
 *
 * The font variables and `.nv-root` sit on the SAME element. That is required,
 * not stylistic: a custom property is substituted in the scope where it is
 * declared, so `--nv-font-display: var(--nv-font-outfit)` inside `.nv-root`
 * only resolves if next/font's variable exists on that element too. Splitting
 * them silently drops every heading back to the body font.
 */
import './globals.css';
import { nvFontVariables } from './fonts';
import { labFontVariables } from './lab-fonts';

export const metadata = {
    metadataBase: new URL('https://velbrant.studio'),
    title: {
        default: 'Velbrant Studios | Websites, launched and grown',
        template: '%s | Velbrant Studios',
    },
    description:
        'We design and build websites, take them live, and run the SEO, content and social work that brings people to them. A unit of Velcaryn LLP.',
    openGraph: {
        title: 'Velbrant Studios | Websites, launched and grown',
        description:
            'We design and build websites, take them live, and run the SEO, content and social work that brings people to them.',
        siteName: 'Velbrant Studios',
        locale: 'en_IN',
        type: 'website',
    },
    robots: { index: false, follow: false },
};

export const viewport = {
    /* Matches --nv-paper, so the browser chrome on Android and the area behind
       a notch do not flash a colour the page never uses. */
    themeColor: '#faf8f7',
};

export default function RootLayout({ children }) {
    /*
     * The lab font variables go on <html>, ABOVE the element that carries
     * `.nv-root`.
     *
     * This is the scoping rule from docs/FRONTEND_RULES.md, and getting it
     * wrong is not theoretical: declaring them on a wrapper inside <body>
     * put them BELOW `.nv-root`, so when the switcher set
     * `--nv-font-display: var(--f-grotesk)` on <body> the variable did not
     * exist in that scope, the declaration was invalid, and every heading
     * silently rendered in Times. Custom properties inherit downward only.
     *
     * They are inert on the live page: nothing references `--f-*` unless the
     * lab switcher points at one. They cost eleven font preloads, which is
     * why this import and `labFontVariables` are deleted along with the rest
     * of the lab once a combination is chosen.
     */
    return (
        <html lang="en" className={labFontVariables}>
            <body className={`${nvFontVariables} nv-root`}>
                {children}
            </body>
        </html>
    );
}
