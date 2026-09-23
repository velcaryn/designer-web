/**
 * The shell every demo route wears.
 *
 * THREE THINGS THIS EXISTS TO MAKE UNAVOIDABLE
 *
 * 1. NOINDEX. Sixteen fictional businesses must never appear in search.
 *    A fake bakery ranking for a real query is thin content, and someone
 *    landing on one cold has none of the context that it is a sample.
 *    Layout metadata merges down, so this one declaration covers every
 *    route beneath it. Two other mechanisms say the same thing on
 *    purpose: an X-Robots-Tag header in next.config.mjs and a disallow in
 *    app/robots.js. Disallow alone is not enough, because a disallowed
 *    page can still be indexed if something links to it.
 *
 * 2. THE LEGAL FRAME, top and bottom. Rendered here rather than by each
 *    page, so forgetting it is not possible.
 *
 *    That sentence was false until now. This layout returned bare
 *    `children` and both banners were called from
 *    app/demo-site/[slug]/page.js, which means the guarantee on a legal
 *    disclaimer was a comment rather than a mechanism: a new route under
 *    this directory would have shipped a fictional business with nothing
 *    saying so. The banners now render here and the pages no longer call
 *    them.
 *
 *    The frame can live outside `.vd-root` because it deliberately uses
 *    fixed colours rather than --vd-* tokens: it is VelBiz chrome around
 *    someone else's brand. The one token it does need is
 *    --vd-frame-offset, which sets its height, so that is declared on the
 *    wrapper here as well as on .vd-root.
 *
 * 3. NO JSON-LD. StructuredData was moved out of the root layout in the
 *    same change that added this directory, precisely so that VelBiz's
 *    real organisation graph, with the real phone number and the real
 *    Tirunelveli address, cannot wrap a page whose visible content is an
 *    invented business. Nothing here emits structured data and nothing
 *    under here should.
 *
 * WHY THE STYLESHEET IS IMPORTED HERE
 *
 * app/claudelanding.css is imported per page across the rest of the site,
 * so it never reaches these routes. demo.css is the only stylesheet a
 * demo loads. That is what keeps a demo page lighter than the studio's
 * own home page, and it is what lets the demos live outside the four
 * locks without touching globals.css.
 */
import './demo.css';
import DemoBanner from '@/components/demo/DemoBanner';

export const metadata = {
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false },
    },
};

export default function DemoSiteLayout({ children }) {
    return (
        <div className="vd-frame-scope">
            <DemoBanner position="top" />
            {children}
            <DemoBanner position="bottom" />
        </div>
    );
}
