/**
 * Departments, or course streams: a name, who runs it, when it runs.
 *
 * Three demos use it. A hospital's departments and a coaching centre's
 * streams are the same shape, so this is one component rather than two,
 * and the words come from data.
 *
 * Server component. No filter UI: at six to eight entries a filter is
 * more interaction than reading the list, and the audience is on a phone.
 */
export default function Directory({ items, title = 'What we do', lede, id = 'directory' }) {
    if (!items?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-dir">
                    {items.map((it) => (
                        <article key={it.name} className="vd-dir__item">
                            <h3 className="vd-dir__name">{it.name}</h3>
                            {it.lead && <p className="vd-dir__lead">{it.lead}</p>}
                            <p className="vd-dir__text">{it.text}</p>
                            {it.when && (
                                <p className="vd-dir__when">
                                    <span aria-hidden="true" className="vd-dir__dot" />
                                    {it.when}
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
