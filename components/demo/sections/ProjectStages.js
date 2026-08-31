/**
 * What an architect actually delivers, stage by stage.
 *
 * The bespoke piece for the architecture practice. The demo already has a
 * process section, and at first glance this looks like the same thing,
 * so the distinction matters: `process` is how you engage us, five steps
 * ending at a signature. This is what happens across the eighteen months
 * afterwards, and it answers the question that actually stops people
 * hiring an architect, which is "what am I paying for at each stage and
 * when do I see something".
 *
 * Each stage carries what is produced, who else gets involved, and what
 * the client has to decide. That last column is the honest one: an
 * architect's timeline slips because a client took six weeks over a
 * decision, and saying so up front is the difference between a brochure
 * and a practice that has run projects.
 *
 * WHY NOT A GANTT OR A PROGRESS BAR
 *
 * Both imply dates this page deliberately does not promise. The demo
 * corpus has a standing rule against timelines outside an estimator, and
 * a bar filling up is a timeline with extra steps.
 *
 * Server component, ordered list, no state.
 */
export default function ProjectStages({ stages, title = 'How a project runs', lede, note, id = 'stages' }) {
    if (!stages?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <ol className="vd-stage">
                    {stages.map((s, i) => (
                        <li key={s.name} className="vd-stage__item">
                            <span className="vd-stage__n" aria-hidden="true">
                                {String(i + 1).padStart(2, '0')}
                            </span>

                            <div className="vd-stage__body">
                                <h3 className="vd-stage__name">{s.name}</h3>
                                <p className="vd-stage__text">{s.text}</p>

                                <dl className="vd-stage__meta">
                                    {s.deliver && (
                                        <div className="vd-stage__pair">
                                            <dt>You receive</dt>
                                            <dd>{s.deliver}</dd>
                                        </div>
                                    )}
                                    {s.who && (
                                        <div className="vd-stage__pair">
                                            <dt>Also involved</dt>
                                            <dd>{s.who}</dd>
                                        </div>
                                    )}
                                    {/* The honest column. */}
                                    {s.decide && (
                                        <div className="vd-stage__pair vd-stage__pair--you">
                                            <dt>You decide</dt>
                                            <dd>{s.decide}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        </li>
                    ))}
                </ol>

                {note && <p className="vd-stage__note">{note}</p>}
            </div>
        </section>
    );
}
