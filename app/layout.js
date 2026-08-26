/**
 * Root layout for the VelBiz Digital site.
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
 * The site shipped under the working name "Velbrant Studios" while the real
 * name and domain were still being decided. Both are now settled: VelBiz
 * Digital, velbiz.com. `robots` is open now that there is a real name and
 * domain to index rather than a placeholder.
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
import { brand } from '@/config/site';

/* The title and description below used to belong to app/claudelanding's own
   layout.js, back when that was a separate route sitting next to the
   original homepage. Now that it IS the homepage, its metadata replaces
   the old homepage's generic brand tagline here, in the one root layout
   every route shares. The `template` still lets /cloud, /credits, /privacy
   and /terms each set their own page-specific `title` and have it appended
   to the brand name automatically. */
export const metadata = {
    metadataBase: new URL(`https://${brand.domain}`),
    title: {
        default: 'Grow your brand, grow your business',
        template: `%s | ${brand.name}`,
    },
    description: `${brand.shortName} builds the website, gets you found, and gives you one place to run the orders, the customers and the money.`,
    openGraph: {
        title: `${brand.name} | ${brand.tagline}`,
        description: brand.description,
        siteName: brand.name,
        locale: 'en_IN',
        type: 'website',
    },
    robots: { index: true, follow: true },
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
