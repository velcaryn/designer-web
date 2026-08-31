/**
 * A food menu, which is not a list of products with prices.
 *
 * WHY THIS IS NOT `Facts` OR `Cart`
 *
 * Both of those render a name, a note and a number in a row, so a saree
 * catalogue and a plate of Chettinad chicken came out looking identical.
 * A menu has things neither of them has: a veg mark that Indian diners
 * scan for before they read anything else, a heat level, and the fact
 * that the good stuff sells out. Those three signals are most of what
 * makes a menu feel like a menu.
 *
 * Server component, no state. The dot and the chillies are drawn in CSS
 * from data rather than imported as icons, so this costs no bundle.
 */
export default function Menu({ groups, title = 'The menu', lede, id = 'menu' }) {
    if (!groups?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-mn">
                    {groups.map((g) => (
                        <div key={g.label} className="vd-mn__group">
                            <h3 className="vd-mn__course">{g.label}</h3>

                            <ul className="vd-mn__list">
                                {g.items.map((it) => (
                                    <li key={it.name} className="vd-mn__row">
                                        <span className="vd-mn__lead">
                                            {/* The square-in-a-square mark
                                                every Indian menu carries.
                                                Only rendered when the data
                                                says so, because a bakery
                                                does not mark every bun. */}
                                            {typeof it.veg === 'boolean' && (
                                                <span
                                                    className={`vd-mn__veg${it.veg ? '' : ' vd-mn__veg--non'}`}
                                                    role="img"
                                                    aria-label={it.veg ? 'Vegetarian' : 'Non vegetarian'}
                                                />
                                            )}
                                            <span className="vd-mn__name">{it.name}</span>
                                            {it.sold && (
                                                <span className="vd-mn__sold">{it.sold}</span>
                                            )}
                                        </span>

                                        {it.note && <span className="vd-mn__note">{it.note}</span>}

                                        <span className="vd-mn__right">
                                            {it.heat > 0 && (
                                                <span
                                                    className="vd-mn__heat"
                                                    role="img"
                                                    aria-label={`Heat ${it.heat} of 3`}
                                                >
                                                    {Array.from({ length: it.heat }, (_, i) => (
                                                        <span key={i} />
                                                    ))}
                                                </span>
                                            )}
                                            <span className="vd-mn__price">
                                                Rs {it.price}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
