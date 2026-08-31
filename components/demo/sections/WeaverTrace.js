/**
 * Which loom, which weaver, how long it took.
 *
 * The bespoke piece for the Kanchipuram silk shop. The hero makes a very
 * specific promise, that every piece names its weaver, and until now
 * nothing on the page kept it. A cart and a process section could belong
 * to any of the three retail demos.
 *
 * This is the section that could only exist on a handloom site. A silk
 * saree buyer is paying a large sum for something whose value is
 * entirely in provenance: who wove it, on which loom, how many days it
 * took, whether the zari is genuine. That is not a product listing, it
 * is a certificate, and printing it on the page is how a weaver's shop
 * distinguishes itself from a mill selling powerloom copies.
 *
 * WHY A SERVER COMPONENT
 *
 * It is a set of records. Nothing to filter at six entries, and nothing
 * to calculate.
 *
 * NO SILK MARK NUMBERS OR HALLMARK IDS. Silk Mark is a real certification
 * scheme run by a real board, and inventing a registration under it is a
 * false claim against a real certifier. The page describes the test it
 * performs instead, which is the honest version.
 */
export default function WeaverTrace({ pieces, title = 'Who wove it', lede, note, id = 'weavers' }) {
    if (!pieces?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-weave">
                    {pieces.map((p) => (
                        <article key={p.piece} className="vd-weave__card">
                            <header className="vd-weave__head">
                                <h3 className="vd-weave__piece">{p.piece}</h3>
                                <p className="vd-weave__price">{p.price}</p>
                            </header>

                            <dl className="vd-weave__facts">
                                <div>
                                    <dt>Woven by</dt>
                                    <dd>{p.weaver}</dd>
                                </div>
                                <div>
                                    <dt>Loom</dt>
                                    <dd>{p.loom}</dd>
                                </div>
                                <div>
                                    <dt>On the loom</dt>
                                    <dd>{p.days}</dd>
                                </div>
                                <div>
                                    <dt>Zari</dt>
                                    <dd>{p.zari}</dd>
                                </div>
                            </dl>

                            {p.note && <p className="vd-weave__note">{p.note}</p>}
                        </article>
                    ))}
                </div>

                {note && <p className="vd-weave__foot">{note}</p>}
            </div>
        </section>
    );
}
