/**
 * "What do I need to bring?"
 *
 * The one question a person actually has before walking into a lawyer's
 * chambers for the first time, and the one nothing else on the page
 * answers. The practice-areas directory says what the chamber does; the
 * process section says what happens. Neither tells somebody sorting
 * through a folder at home which papers matter.
 *
 * WHY THIS IS NOT A CALCULATOR, A CHATBOT OR A CASE CHECKER
 *
 * Every other bespoke section in this set is interactive: filter the
 * plots, enter the odometer, watch the queue. That register is wrong
 * here. A widget that takes a description of somebody's dispute and
 * returns anything resembling an assessment is practising law, and it is
 * the exact thing Bar Council advertising rules exist to prevent. A
 * legal practice that gamifies intake reads as one that needs the work.
 *
 * So this is a reference table: matter type, papers to bring, what the
 * first meeting covers. Static, printable, useful. Deliberately the
 * quietest section in the whole corpus.
 *
 * Server component. No state, no client JS.
 */
export default function ConsultDesk({ matters, title = 'What to bring', lede, note, id = 'consult' }) {
    if (!matters?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <div className="vd-consult">
                    {matters.map((m) => (
                        <article key={m.matter} className="vd-consult__item">
                            <h3 className="vd-consult__matter">{m.matter}</h3>

                            {/* A real list, because a person reads this
                                standing at a cupboard ticking things off. */}
                            <ul className="vd-consult__papers">
                                {m.bring.map((paper) => (
                                    <li key={paper} className="vd-consult__paper">
                                        {paper}
                                    </li>
                                ))}
                            </ul>

                            {m.covers && (
                                <p className="vd-consult__covers">
                                    <span className="vd-consult__label">The first meeting</span>
                                    {m.covers}
                                </p>
                            )}

                            {/* Says plainly when papers are missing, because
                                the honest answer is usually "come anyway". */}
                            {m.missing && (
                                <p className="vd-consult__missing">{m.missing}</p>
                            )}
                        </article>
                    ))}
                </div>

                {note && <p className="vd-consult__note">{note}</p>}
            </div>
        </section>
    );
}
