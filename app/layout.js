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
import Script from 'next/script';
import './globals.css';
import { nvFontVariables } from './fonts';
import { labFontVariables } from './lab-fonts';
import { brand } from '@/config/site';
import CookieBanner from '@/components/CookieBanner';

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
        /* The brand name is IN the default title, not only in the
           template. The template appends it to child pages, but the home
           page uses `default` and so carried no brand name at all: it
           listed as "Grow your brand, grow your business", which is a
           slogan nobody searches for and which nothing ties to VelBiz. */
        default: `${brand.name} | ${brand.tagline}`,
        template: `%s | ${brand.name}`,
    },
    description: `${brand.shortName} builds the website, gets you found, and gives you one place to run the orders, the customers and the money. Based in ${brand.base}.`,
    /* Tells a crawler which URL is the real one for a page it can reach
       by more than one address (trailing slash, query string, the
       *.netlify.app host). Without it, duplicates compete with each
       other and the ranking is split between them. `alternates` on a
       child page is relative to metadataBase. */
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: `${brand.name} | ${brand.tagline}`,
        description: brand.description,
        siteName: brand.name,
        url: `https://${brand.domain}`,
        locale: 'en_IN',
        type: 'website',
    },
    /* Geo meta, per the playbook's SEO section. These are not a ranking
       factor on their own, but they are cheap, they are read by several
       local directories and aggregators, and they say the same thing the
       LocalBusiness JSON-LD says. Two places agreeing is the point: a
       crawler that cannot parse one still gets the other. */
    other: {
        'geo.region': 'IN-TN',
        'geo.placename': 'Tirunelveli',
        'geo.position': '8.7139;77.7567',
        ICBM: '8.7139, 77.7567',
    },
    robots: {
        index: true,
        follow: true,
        /* Let Google show a full text snippet, a large image preview and
           any video length. Left unset, Google picks conservatively and
           the result gets a shorter snippet and a thumbnail rather than
           the OG card. */
        googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
        },
    },
};

export const viewport = {
    /* Matches --nv-paper, so the browser chrome on Android and the area behind
       a notch do not flash a colour the page never uses. */
    themeColor: '#faf8f7',
};

export default function RootLayout({ children }) {
    const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
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
     * They are inert on the live page: nothing references `--f-*` unless
     * the lab switcher points at one, or a /demo-site route names one in
     * its theme. Every family is declared `preload: false`, so this costs
     * @font-face rules rather than font downloads: a page fetches only the
     * faces it paints. Measured on / after the SEO pass, that is two.
     *
     * They stay on <html>, ABOVE .nv-root, and that position is not
     * negotiable for the reason given above. An earlier attempt to move
     * them onto a wrapper inside <body> is what put them below .nv-root
     * and silently rendered every heading in Times.
     */
    return (
        <html lang="en" className={labFontVariables}>
            <body className={`${nvFontVariables} nv-root`}>
                {/* GA4, loaded with consent DENIED and page views OFF.
                    Both matter. Denied by default means a visitor who
                    never answers the banner is never tracked, which is
                    the DPDP Act 2023 position. `send_page_view: false`
                    means the automatic view does not fire before consent
                    can possibly have been read: an automatic view is
                    sent the moment the tag initialises, which is always
                    earlier than a human can answer. CookieBanner sends
                    the withheld view itself on accept, so accepting does
                    not lose the visit it was accepted during.

                    Rendered only when the measurement id is set, so a
                    local checkout with no env file ships no tag at all.

                    lib/analytics.js re-checks consent before every
                    event, so a bug here cannot start collection. */}
                {GA_ID && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                            strategy="afterInteractive"
                        />
                        <Script id="ga4-init" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('consent', 'default', { analytics_storage: 'denied' });
                                gtag('config', '${GA_ID}', { send_page_view: false });
                            `}
                        </Script>
                    </>
                )}
                {/* <StructuredData /> is deliberately NOT here.
                    It emits VelBiz's ProfessionalService graph: the real
                    phone number, the real Tirunelveli address, the real
                    organisation identity. In the root layout that graph
                    wrapped EVERY route, which was fine while every route
                    was VelBiz's own.
                    The demo sites under /demo-site are fictional
                    businesses. Emitting our identity around a page whose
                    visible content is an invented bakery is structured
                    data contradicting the page, which is a manual-action
                    risk rather than merely a wasted signal.
                    You cannot escape a root layout in the App Router, so
                    the fix is to stop putting it in one: the five real
                    pages import it themselves, the same per-page pattern
                    this repo already uses for claudelanding.css, and the
                    demo routes become structurally incapable of carrying
                    it. */}
                {children}
                <CookieBanner />
            </body>
        </html>
    );
}
