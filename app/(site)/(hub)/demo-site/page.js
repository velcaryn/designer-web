/**
 * The demo hub.
 *
 * WHY THIS PAGE WEARS VELBIZ'S BRAND AND THE DEMOS DO NOT
 *
 * This is our page, so it looks like us: the four locks, nv- classes,
 * claudelanding.css. The sixteen pages it links to each look like someone
 * else entirely, and that contrast IS the pitch. A prospect sees our
 * identity, taps a card, and lands somewhere that shares none of it. That
 * is the argument that we do not ship one template with the colours
 * swapped, made by demonstration rather than by claim.
 *
 * WHY IT LIVES IN A (hub) ROUTE GROUP
 *
 * The URL is still /demo-site. The parentheses are a route group, which
 * Next strips from the path, and the point of it is CSS isolation.
 *
 * While this file sat at app/demo-site/page.js it shared a route segment
 * with app/demo-site/[slug]/, so Next hoisted its claudelanding.css
 * import to the segment both routes share, and every one of the sixteen
 * demos silently loaded the 145KB landing stylesheet. Measured: a demo
 * route pulled four stylesheets and 30KB gzipped of CSS, against the 5KB
 * the whole architecture is built around, and it dragged VelBiz's four
 * locks into pages that exist to look nothing like VelBiz.
 *
 * The route group breaks that sharing. The hub keeps its stylesheet, the
 * demos keep only demo.css, and the URL is unchanged.
 *
 * Server component. The card grid, the filters and the loader are one
 * client island underneath.
 */
import '../../claudelanding.css';

import { brand } from '@/config/site';
import HubNav from '@/components/demo/HubNav';
import Nl4Footer from '@/components/newlanding-v4/Nl4Footer';
import Nl4Dock from '@/components/newlanding-v4/Nl4Dock';
import HubGrid from '@/components/demo/HubGrid';
import ClLab from '@/components/claudelanding/ClLab';
import ClProof from '@/components/claudelanding/ClProof';
import { LabProvider } from '@/components/claudelanding/LabContext';
import { DEMOS } from '@/content/demos';

export const metadata = {
    title: `See a Finished Site | ${brand.name}`,
    description:
        `Twenty-four complete example websites, one per trade, and a colour and typeface lab that repaints the page live. Pick yours and see what ${brand.shortName} builds.`,
    alternates: { canonical: '/demo-site' },
    openGraph: {
        title: `See a Finished Site | ${brand.name}`,
        description:
            `Twenty-four complete example websites, one per trade, and a colour and typeface lab that repaints the page live. Pick yours and see what ${brand.shortName} builds.`,
        url: '/demo-site',
        siteName: brand.name,
        locale: 'en_IN',
        type: 'website',
        images: [
            {
                url: '/opengraph-image',
                width: 1200,
                height: 630,
                alt: `See a finished site - ${brand.name}`,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `See a Finished Site | ${brand.name}`,
        description:
            `Twenty-four complete example websites, one per trade, and a colour and typeface lab that repaints the page live. Pick yours and see what ${brand.shortName} builds.`,
        images: ['/opengraph-image'],
    },
};

export default function DemoHubPage() {
    return (
        /* LabProvider is mandatory, not decorative: ClLab publishes its
           countdown through useLabPublish(), which reads ctx._publish, and
           the default context has no _publish. ClLab outside a provider
           throws on mount. ClMiniDock reads the same context to show the
           revert pill. */
        <LabProvider>
            <HubNav />

            <main>
                {/* A BAND, NOT A SCREEN.
                    This was a full-height hero: the headline claimed 58%
                    of the width and left the rest empty, and the first
                    card started 593px down a 900px viewport. On a
                    catalogue page whose entire job is getting somebody to
                    a trade, more than half the first screen was spent
                    before anything was on offer.
                    Now the copy sits left, the search sits right on the
                    same row, and the cards start immediately below. */}
                <section className="nv-section cl-hub__head">
                    <div className="nv-shell cl-hub__headRow">
                        <div className="cl-hub__headText">
                            <span className="nv-eyebrow">
                                {DEMOS.length} live examples
                            </span>
                            <h1 className="cl-hub__title">
                                See a finished one before
                                {' '}
                                <span className="nv-mark">you decide</span>
                                .
                            </h1>
                        </div>

                        <p className="cl-hub__lede">
                            Every one of these is a complete website for a
                            business like yours, built the way we would
                            build yours. The businesses are invented; the
                            work is not.
                        </p>
                    </div>
                </section>

                <HubGrid demos={DEMOS} />

                {/* THE LAB LIVES HERE NOW.
                    It was built for the home page, where it sat as the
                    sixth of eleven sections and was reached by almost
                    nobody. On the hub it sits under twenty-four designs
                    that already make the point it exists to make: pick a
                    palette and a typeface, and watch a page full of
                    different businesses hold together. */}
                <ClLab />

                {/* Real shipped client builds: Liha palm jaggery shop and
                    Velcaryn medical supplies, showing mobile and desktop
                    views in device frames. */}
                <ClProof />
            </main>

            <Nl4Footer home="/" />
            <Nl4Dock home="/" />
        </LabProvider>
    );
}
