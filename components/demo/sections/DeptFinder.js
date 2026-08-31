/**
 * "Which department do I go to?"
 *
 * The bespoke piece for the hospital demo, and the thing that stops it
 * being the clinic page at a larger scale. A family clinic has one
 * doctor and the only question is when he is in. A hospital has fourteen
 * departments, and a person arriving with a symptom has to guess which
 * counter to join before anything else can happen.
 *
 * The directory section already lists the departments and what they do.
 * This inverts the index: it starts from what is wrong with you.
 *
 * WHY IT IS A SERVER COMPONENT AND NOT A SYMPTOM CHECKER
 *
 * Anything that takes a described symptom and returns a route is doing
 * triage, and triage from a static marketing page is the worst idea in
 * this whole plan. What is here is a signpost: common complaints, the
 * counter to walk to, the floor it is on. Exactly the laminated board
 * that hangs in a real hospital lobby.
 *
 * The emergency line is pinned outside the list and never scrolls away
 * inside it, because the one reader who cannot browse is the one who
 * needs it.
 */
export default function DeptFinder({ routes, emergency, title = 'Where to go', lede, id = 'where' }) {
    if (!routes?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                {/* Pinned first, deliberately. A person in an emergency is
                    not reading a table. */}
                {emergency && (
                    <p className="vd-where__urgent">
                        <span className="vd-where__urgentLabel">If it is an emergency</span>
                        {emergency}
                    </p>
                )}

                <div className="vd-where">
                    {routes.map((r) => (
                        <article key={r.complaint} className="vd-where__row">
                            <h3 className="vd-where__complaint">{r.complaint}</h3>
                            <p className="vd-where__dept">
                                <span aria-hidden="true" className="vd-where__arrow">
                                    &rarr;
                                </span>
                                {r.dept}
                            </p>
                            {r.at && <p className="vd-where__at">{r.at}</p>}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
