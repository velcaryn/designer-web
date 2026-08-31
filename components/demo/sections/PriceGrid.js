/**
 * What things cost, grouped, with the qualifier that stops a price being
 * a surprise.
 *
 * REPLACES `Facts cols={3}`, which was a flat unordered list with a
 * hairline under every row: the laziest layout in the system and the one
 * five demos were leaning on hardest. A price list is the thing a
 * prospect scrolls to first on a clinic or a salon, and it deserves more
 * than a table.
 *
 * Server component, no state.
 */
/**
 * Splits a price into the figure and its unit.
 *
 * Thirteen prices in this corpus carry a qualifier: "Rs 2,200 per tooth",
 * "From Rs 1,450 a tonne", "Quoted per matter". Set at the same display
 * weight as the figure, the qualifier is as loud as the number, and on a
 * phone it pushed the treatment name onto two lines while the price ran
 * the full width of the card.
 *
 * The unit is real information and is not being dropped: it is set
 * smaller and lighter by .vd-pg__unit, so "Rs 2,200" reads as the price
 * and "per tooth" reads as the condition on it. Prices with no qualifier
 * are returned unchanged and render exactly as before.
 */
function splitPrice(price) {
    if (typeof price !== 'string') return [price, null];
    /* Only ever splits at a unit word that FOLLOWS a digit, so
       "Quoted per matter" (no figure) stays whole rather than becoming a
       stray "Quoted". */
    const m = price.match(/^(.*\d.*?)\s+((?:per|a|an|each)\s+.+)$/i);
    return m ? [m[1], m[2]] : [price, null];
}

export default function PriceGrid({ groups, rows, title = 'What it costs', lede, note, id = 'prices' }) {
    /* Accepts either grouped data or a flat list, because five demos wrote
       their price data before this component existed and rewriting all of
       them to add a single group would be churn for nothing. */
    const sets = groups?.length
        ? groups
        : [{ label: null, items: rows ?? [] }];

    if (!sets[0]?.items?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-pg">
                    {sets.map((set, si) => (
                        <div key={set.label ?? si} className="vd-pg__set">
                            {set.label && <h3 className="vd-pg__label">{set.label}</h3>}

                            <div className="vd-pg__cards">
                                {set.items.map((it) => {
                                    const [figure, unit] = splitPrice(it.price);
                                    return (
                                        <div key={it.name} className="vd-pg__card">
                                            <span className="vd-pg__name">{it.name}</span>
                                            {it.time && <span className="vd-pg__time">{it.time}</span>}
                                            <span className="vd-pg__price">
                                                {figure}
                                                {unit && (
                                                    <span className="vd-pg__unit">{unit}</span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {note && <p className="vd-pg__note">{note}</p>}
            </div>
        </section>
    );
}
