/**
 * The credibility band: two to four numbers a business has earned.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT ON EVERY DEMO
 *
 * The demo corpus carried no quantified claims at all. Twenty-four
 * businesses, and not one of them said how long it had been trading or
 * how many people it had served. A visitor arriving from a WhatsApp link
 * had no way to read scale or history off the page.
 *
 * That was a deliberate position, written into content/demos/index.js,
 * against the "Over 10,000 happy customers" register that reads as
 * generated the moment you see it. The position has been narrowed rather
 * than abandoned, and the narrowed rule lives in that file's header. The
 * short version: specific and odd beats round and large, and every
 * number has to be plausible for one shop in one district town.
 *
 * NINE DEMOS RENDER THIS. FIFTEEN DO NOT.
 *
 * That is the design, not an omission. A freight company and a plot
 * seller are arguing scale, so a band of numbers is the argument. An
 * advocate and a family clinic are arguing judgement, and a wall of
 * figures on those pages reads as a firm that counts the wrong things.
 * Those demos carry their numbers in prose instead, and six more surface
 * them inside their own interactive section, where a count is evidence
 * rather than a claim.
 *
 * NO COUNT-UP ANIMATION.
 *
 * It would make this a client component with an IntersectionObserver on
 * nine routes, and on a mid-range Android over mobile data the effect
 * mostly lands as a flicker after the number is already readable. The
 * number is the point; the number arriving twice is not.
 *
 * Server component. Reads only --vd-* tokens, so it repaints per demo.
 */
export default function Proof({ stats, award, title, lede, id = 'proof' }) {
    if (!stats?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--ink vd-proof">
            <div className="vd-shell">
                {title && <h2 className="vd-h2">{title}</h2>}
                {lede && <p className="vd-lede">{lede}</p>}

                {/* A dl, because these are genuinely term-and-definition
                    pairs. A screen reader reads "430 plus, weddings shot"
                    rather than two unrelated fragments. */}
                <dl className="vd-proof__grid" data-count={stats.length}>
                    {stats.map((s) => (
                        <div key={s.label} className="vd-proof__cell">
                            <dt className="vd-proof__value">
                                {s.value}
                                {s.unit && (
                                    <span className="vd-proof__unit"> {s.unit}</span>
                                )}
                            </dt>
                            <dd className="vd-proof__label">{s.label}</dd>
                        </div>
                    ))}
                </dl>

                {/* Quiet caption, never a badge. A business that has won
                    something local mentions it once and moves on. */}
                {award && <p className="vd-proof__award">{award}</p>}
            </div>
        </section>
    );
}
