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
import ClFooter from '@/components/claudelanding/ClFooter';
import ClMiniDock from '@/components/claudelanding/ClMiniDock';
import HubGrid from '@/components/demo/HubGrid';
import { DEMOS } from '@/content/demos';

export const metadata = {
    title: 'See a finished site',
    description:
        `Sixteen complete example websites, one per trade. Pick yours and see what ${brand.shortName} builds.`,
    alternates: { canonical: '/demo-site' },
    /* The hub itself is ours and could be indexed, but it links to sixteen
       noindex pages and exists to be sent directly. Keeping it out of
       search means the sixteen cannot be reached through it by a crawler
       either. */
    robots: { index: false, follow: false },
};

export default function DemoHubPage() {
    return (
        <>
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
            </main>

            <ClMiniDock />
            <ClFooter />
        </>
    );
}
