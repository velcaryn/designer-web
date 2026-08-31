/**
 * Services as a swipeable rail: how long it takes, what to do first.
 *
 * The bespoke piece for the salon demo. The price grid already lists cut,
 * colour and treatment with times and prices, so this is not another
 * table. What it adds is the thing a salon's customer actually needs and
 * no price list carries: the preparation. Do not wash your hair. Come
 * with the colour grown out. Eat something first.
 *
 * That is also the demo's own argument made concrete. The page keeps
 * saying the salon tells you what will happen before it happens; this is
 * the section where it does it.
 *
 * WHY A RAIL AND NOT A GRID
 *
 * Six cards in a column is a long scroll past things a reader is not
 * choosing between. A horizontal rail on a phone is the one interaction
 * a salon customer already performs constantly, and native CSS
 * scroll-snap does it with no JavaScript at all. Server component.
 *
 * The rail is a focusable region with an accessible name so a keyboard
 * user can reach and scroll it, which an overflow container does not get
 * for free.
 */
export default function LookBook({ looks, title = 'What to expect', lede, id = 'lookbook' }) {
    if (!looks?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}
            </div>

            {/* Outside the shell so the rail can bleed to the screen edge,
                which is what tells a thumb there is more to the right. */}
            <div className="vd-look" role="region" aria-label={title} tabIndex={0}>
                {looks.map((l) => (
                    <article key={l.name} className="vd-look__card">
                        <header className="vd-look__head">
                            <h3 className="vd-look__name">{l.name}</h3>
                            <p className="vd-look__time">{l.time}</p>
                        </header>

                        {l.before && (
                            <div className="vd-look__block">
                                <span className="vd-look__label">Before you come</span>
                                <p className="vd-look__text">{l.before}</p>
                            </div>
                        )}

                        {l.during && (
                            <div className="vd-look__block">
                                <span className="vd-look__label">On the day</span>
                                <p className="vd-look__text">{l.during}</p>
                            </div>
                        )}

                        {l.after && (
                            <div className="vd-look__block">
                                <span className="vd-look__label">Afterwards</span>
                                <p className="vd-look__text">{l.after}</p>
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}
