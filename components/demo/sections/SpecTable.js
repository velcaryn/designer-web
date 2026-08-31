/**
 * A real specification table for the two B2B demos.
 *
 * A semantic <table>, because that is what this is: a buyer comparing
 * numbers wants rows and columns, and a screen reader wants to announce
 * them as such. The previous `Facts cols={2}` rendered a flat list, which
 * loses the relationship between a label and its unit.
 *
 * MOBILE: the table scrolls horizontally inside its own container with
 * `overscroll-behavior-x: contain`, because without that a horizontal
 * drag at the end of the table triggers back-navigation on iOS, which is
 * a genuinely awful thing to do to someone reading a spec sheet.
 *
 * Server component, no state.
 */
export default function SpecTable({ groups, title = 'The numbers', lede, id = 'specs' }) {
    if (!groups?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                {groups.map((g) => (
                    <div key={g.label} className="vd-spec">
                        <h3 className="vd-spec__label">{g.label}</h3>

                        <div className="vd-spec__scroll">
                            <table className="vd-spec__table">
                                <caption className="vd-sr-only">{g.label}</caption>
                                <tbody>
                                    {g.rows.map((r) => (
                                        <tr key={r.name}>
                                            <th scope="row">{r.name}</th>
                                            <td>{r.value}</td>
                                            {r.note !== undefined && (
                                                <td className="vd-spec__note">{r.note}</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
