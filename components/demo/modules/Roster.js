'use client';

/**
 * Who is consulting, and when.
 *
 * The clinic and the hospital share this. It is the single most looked-up
 * thing on a healthcare site and it is almost always a PDF or an image of
 * a table, which is unreadable on a phone and invisible to search.
 *
 * WHY THE FILTER IS BUTTONS AND NOT A SELECT
 *
 * A native select on Android opens a modal list. For four departments
 * that is a worse interaction than four buttons that are already on
 * screen, and it hides the options until tapped, so a visitor cannot see
 * what is available without committing to an interaction.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 * No medical council registration numbers. Those are real identifiers
 * belonging to real people and inventing one on a page built to be
 * forwarded is a claim about a regulated profession. Names,
 * qualifications and hours are what a patient is looking for anyway.
 */
import { useMemo, useState } from 'react';

export default function Roster({ module: mod }) {
    const roles = useMemo(() => {
        const seen = [];
        mod.doctors.forEach((d) => {
            if (!seen.includes(d.role)) seen.push(d.role);
        });
        return seen;
    }, [mod.doctors]);

    const [role, setRole] = useState('all');
    const shown = role === 'all' ? mod.doctors : mod.doctors.filter((d) => d.role === role);

    return (
        <section id="roster" className="vd-section vd-ground--soft">
            <div className="vd-shell">
                <h2 className="vd-h2">{mod.title}</h2>
                <p className="vd-lede">{mod.subtitle}</p>

                {roles.length > 1 && (
                    <div className="vd-book__opts vd-roster__filters" role="group" aria-label="Department">
                        <button
                            type="button"
                            className={`vd-chip${role === 'all' ? ' vd-chip--active' : ''}`}
                            aria-pressed={role === 'all'}
                            onClick={() => setRole('all')}
                        >
                            Everyone
                        </button>
                        {roles.map((r) => (
                            <button
                                key={r}
                                type="button"
                                className={`vd-chip${role === r ? ' vd-chip--active' : ''}`}
                                aria-pressed={role === r}
                                onClick={() => setRole(r)}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}

                {/* Announced so a screen reader hears the list change
                    rather than silently landing in a shorter one. */}
                <p className="vd-sr-only" role="status">
                    {shown.length} listed
                </p>

                <div className="vd-roster">
                    {shown.map((d) => (
                        <article key={d.name} className="vd-doc">
                            <h3 className="vd-doc__name">{d.name}</h3>
                            <p className="vd-doc__role">
                                {d.role}
                                <span>{d.qual}</span>
                            </p>
                            <ul className="vd-doc__days">
                                {d.days.map((s) => (
                                    <li key={s.day + s.time} className="vd-doc__slot">
                                        <span className="vd-doc__day">{s.day}</span>
                                        <span className="vd-doc__time">{s.time}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
