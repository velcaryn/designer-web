/**
 * The crowd, on its own, near the very bottom of the page.
 *
 * ROUND THREE: MOVED OUT OF ClGrowth
 *
 * It used to sit inline between beat two and beat three of the growth
 * story, captioned with the Open Peeps and Skiper UI attribution directly
 * underneath it. Both changed: it is now a standalone, full-bleed section
 * on a blue ground just above the footer, and the attribution text is gone
 * from the page entirely. The credit the license requires still exists;
 * see /credits, linked from ClFooter, which is where it now lives.
 *
 * FULL-BLEED, DELIBERATELY
 *
 * `.cl-crowd--bleed` has no `.nv-shell` around the canvas, so the walking
 * figures run edge to edge of the viewport rather than stopping at the
 * page's 1320px content width. The heading above it still sits inside a
 * shell, because display type at full viewport width on a desktop monitor
 * stops being readable as a headline.
 *
 * A server component: the crowd canvas guards its own motion internally
 * (see registry/skiper-ui/skiper39.jsx), so nothing here needs to know
 * about reduced motion.
 */
import CrowdCanvas from '@/registry/skiper-ui/skiper39';

export default function ClCrowd() {
    return (
        <section className="nv-section cl-crowdSection nv-ground--lav-full">
            <div className="nv-shell">
                <h2 className="cl-h2 cl-crowdSection__title">
                    Stand out from the crowd. Be unique.
                </h2>
            </div>
            <div className="cl-crowd cl-crowd--bleed">
                <CrowdCanvas
                    src="/images/peeps/all-peeps.png"
                    rows={15}
                    cols={7}
                />
            </div>
        </section>
    );
}
