/**
 * Room cards with what is in them and what they cost by season.
 *
 * The bespoke piece for the home stay. Without it, home-stay and lodging
 * are the same page: both are `tariff` plus `gallery`, and two demos in
 * the same sector reading identically is the failure this whole phase
 * exists to fix.
 *
 * Server component, no state.
 */
export default function Rooms({ rooms, seasons, title = 'The rooms', lede, id = 'rooms' }) {
    if (!rooms?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-rooms">
                    {rooms.map((r) => (
                        <article key={r.name} className="vd-room">
                            <div className="vd-room__top">
                                <h3 className="vd-room__name">{r.name}</h3>
                                <span className="vd-room__sleeps">{r.sleeps}</span>
                            </div>

                            <p className="vd-room__text">{r.text}</p>

                            <ul className="vd-room__has">
                                {r.has.map((h) => (
                                    <li key={h} className="vd-room__hasItem">{h}</li>
                                ))}
                            </ul>

                            <p className="vd-room__rate">
                                <span>{r.rate}</span>
                                <span className="vd-room__per">{r.per}</span>
                            </p>
                        </article>
                    ))}
                </div>

                {seasons?.length > 0 && (
                    <div className="vd-seasons">
                        <p className="vd-seasons__label">Through the year</p>
                        <ul className="vd-seasons__list">
                            {seasons.map((s) => (
                                <li key={s.when} className="vd-season">
                                    <span className="vd-season__when">{s.when}</span>
                                    <span className="vd-season__what">{s.what}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}
