/**
 * The page's single marquee.
 *
 * One per site is the rule. This is it, and it earns the slot by doing the
 * job the hero is not allowed to do: state the breadth of the offer in one
 * glance, immediately under the fold, without a grid of tiles.
 *
 * MECHANICS. The list is rendered twice and the track translates by exactly
 * -50%. Those two numbers are a pair: change the duplication and the loop
 * seams. Pure CSS animation on a transform, so it runs on the compositor and
 * never touches the main thread. It pauses on hover, and parks entirely
 * under reduced motion, which costs nothing because every item here is
 * spelled out again in the capabilities section directly below.
 *
 * It is aria-hidden for the same reason: to a screen reader this is the same
 * content twice, and the real list follows.
 */
const ITEMS = [
    'Website design',
    'Launch and hosting',
    'Core Web Vitals',
    'SEO foundations',
    'Content and copy',
    'Instagram growth',
    'Performance marketing',
    'Brand systems',
    'ERP and cloud',
    'DPDP compliance',
    'Business development',
    'PAN-India reach',
];

export default function Marquee() {
    return (
        <div className="nv-marquee" aria-hidden="true">
            <div className="nv-marquee__track">
                {[0, 1].map((copy) => (
                    <div key={copy} className="nv-marquee__group" style={{ display: 'flex' }}>
                        {ITEMS.map((item) => (
                            <span key={item} className="nv-marquee__item">
                                {item}
                                <span className="nv-marquee__dot" />
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
