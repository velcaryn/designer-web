/**
 * Numbered steps: what happens after someone gets in touch.
 *
 * The question a prospect actually has, and the one most sites answer
 * last or not at all. Five demos use it, which is why it is a shared type
 * rather than a bespoke one.
 *
 * Server component. The connecting rule between steps is a CSS
 * pseudo-element, so the markup is a plain ordered list and reads
 * correctly with no styles at all.
 */
export default function Process({ steps, title = 'How it works', lede, id = 'process' }) {
    if (!steps?.length) return null;

    return (
        <section id={id} className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{title}</h2>
                {lede && <p className="vd-lede">{lede}</p>}

                <ol className="vd-steps">
                    {steps.map((s, i) => (
                        <li key={s.title} className="vd-step">
                            <span className="vd-step__n" aria-hidden="true">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="vd-step__body">
                                <span className="vd-step__title">{s.title}</span>
                                <span className="vd-step__text">{s.text}</span>
                                {s.when && <span className="vd-step__when">{s.when}</span>}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
