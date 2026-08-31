/**
 * Which room types are free, what the rate includes.
 *
 * The bespoke piece for the hotel. The home stay demo already has a
 * rooms section and a season tariff, and the two stay demos were the
 * pair most at risk of reading as one template with different
 * photographs. The difference is real and worth drawing out: a home stay
 * has four rooms and you take what is free, while a hotel sells room
 * TYPES against a rate that changes with how you book.
 *
 * So this is not "rooms" again. It is the rate card a hotel actually
 * runs: same room, three prices, depending on whether you walk in, book
 * direct, or come through a travel site. Saying that out loud, including
 * that the travel site rate is higher and why, is the kind of candour
 * that makes a hotel worth booking direct with.
 *
 * WHY A SERVER COMPONENT
 *
 * A live availability calendar needs a booking system behind it, and a
 * fake one on a demo is a lie a visitor could act on. What is here is
 * the rate structure, which is true whatever the date, plus an honest
 * line about when the hotel is genuinely full.
 */
export default function RoomAvailability({ rooms, channels, title = 'Rooms and rates', lede, note, id = 'rooms' }) {
    if (!rooms?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-avail">
                    {rooms.map((r) => (
                        <article key={r.name} className="vd-avail__room">
                            <header className="vd-avail__head">
                                <h3 className="vd-avail__name">{r.name}</h3>
                                <p className="vd-avail__sleeps">{r.sleeps}</p>
                            </header>

                            <ul className="vd-avail__has">
                                {r.has.map((h) => (
                                    <li key={h} className="vd-avail__chip">
                                        {h}
                                    </li>
                                ))}
                            </ul>

                            {/* The same room at three prices, stated plainly. */}
                            <dl className="vd-avail__rates">
                                {channels.map((c) => (
                                    <div key={c.key} className="vd-avail__rate">
                                        <dt>{c.label}</dt>
                                        <dd
                                            className={
                                                c.best ? 'vd-avail__best' : undefined
                                            }
                                        >
                                            {r.rates[c.key]}
                                            {c.best && (
                                                <span className="vd-avail__bestTag">
                                                    Best rate
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            {r.note && <p className="vd-avail__note">{r.note}</p>}
                        </article>
                    ))}
                </div>

                {note && <p className="vd-avail__foot">{note}</p>}
            </div>
        </section>
    );
}
