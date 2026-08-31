'use client';

/**
 * The drag-to-compare slider.
 *
 * WHY IT IS A RANGE INPUT UNDERNEATH
 *
 * Every hand-rolled comparison slider I have seen reimplements dragging
 * with pointer events and gets one of these wrong: it does not work with a
 * keyboard, it does not announce a value, it captures the pointer and
 * breaks page scroll, or it fights a touch drag that was meant to scroll.
 *
 * A native <input type=range> is already draggable, already keyboard
 * operable with arrows and Home and End, already announced correctly, and
 * already understood by every assistive technology. It is made invisible
 * and stretched over the image; the visible handle is drawn by CSS from
 * the same value. Nothing is reimplemented.
 *
 * DRAWN SHAPES BY DEFAULT, REAL PHOTOGRAPHS WHEN A DEMO HAS THEM
 *
 * The dental demo compares clinical results, and real photographs of real
 * patients are not something that can be invented: a stock smile would be
 * obviously stock. So that demo gets an SVG diagram of a tooth arch,
 * crowded on one side and aligned on the other, which demonstrates the
 * interaction honestly without pretending to be a clinical result.
 *
 * Colour grading is different. A photographer's before and after is the
 * photographer's own work, there is nothing to fabricate, and a diagram
 * of a grade is meaningless: the entire thing being sold is what the
 * image actually looks like. So when a demo supplies `beforeSrc` and
 * `afterSrc` this renders those instead, and falls back to the drawn
 * shape when it does not.
 */
import { useState } from 'react';

/* THE SHAPE IS DATA, NOT A CONSTANT.
   This drew eight tooth rectangles unconditionally, and photo-studio uses
   this module, so a wedding photographer's page rendered a dental arch.
   The shape now comes from `module.shape` and defaults to `plain`, which
   is the honest default: a generic comparison, not somebody else's
   anatomy.

   Eight teeth. The `spread` argument moves them from crowded and rotated
   to evenly spaced and upright, so one function draws both states. */
function Arch({ spread, fill, stroke }) {
    const teeth = [];
    for (let i = 0; i < 8; i += 1) {
        const t = (i / 7) * Math.PI;
        const crowdOffset = (i % 2 === 0 ? -1 : 1) * (1 - spread) * 7;
        const x = 30 + Math.cos(Math.PI - t) * 78 + crowdOffset;
        const y = 96 - Math.sin(t) * 46;
        const rot = (1 - spread) * (i % 2 === 0 ? -16 : 14);
        teeth.push(
            <rect
                key={i}
                x={x}
                y={y}
                width="17"
                height="24"
                rx="5"
                fill={fill}
                stroke={stroke}
                strokeWidth="1.5"
                transform={`rotate(${rot} ${x + 8.5} ${y + 12})`}
            />,
        );
    }
    return <>{teeth}</>;
}

/* A photographic frame opening up: the "before" is a tight crop, the
   "after" is the full frame. For photo-studio, where the thing being
   compared is a grade, not a jaw. */
function Frame({ spread, fill, stroke }) {
    const inset = 18 + (1 - spread) * 34;
    return (
        <>
            <rect
                x={inset}
                y={inset * 0.7}
                width={216 - inset * 2}
                height={140 - inset * 1.4}
                rx="4"
                fill={fill}
                stroke={stroke}
                strokeWidth="2"
            />
            <circle cx="108" cy="70" r={10 + spread * 8} fill={stroke} opacity="0.28" />
        </>
    );
}

/* Two stacked bars, one growing. The neutral fallback for any comparison
   that is not a jaw and not a photograph. */
function Plain({ spread, fill, stroke }) {
    return (
        <>
            <rect x="24" y="46" width="168" height="18" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
            <rect x="24" y="46" width={168 * (0.34 + spread * 0.66)} height="18" rx="4" fill={stroke} />
            <rect x="24" y="80" width="168" height="18" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
            <rect x="24" y="80" width={168 * (0.2 + spread * 0.5)} height="18" rx="4" fill={stroke} opacity="0.6" />
        </>
    );
}

const SHAPES = { arch: Arch, frame: Frame, plain: Plain };

/* A real photograph.

   Both images are eager, not lazy. The whole section is one interaction
   and a lazily-loaded "after" would show an empty panel at the exact
   moment somebody drags to see it. Two 480w webps is about 114KB on a
   phone, which is the price of the section working at all.

   No lazy, no fetchPriority: this sits below the fold, so it should not
   compete with the hero, but it must be there before the drag. */
function Shot({ src, alt, sizes }) {
    const base = src.replace(/\.webp$/, '');
    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={src}
            srcSet={`${base}-480.webp 480w, ${base}-800.webp 800w, ${src} 1200w`}
            sizes={sizes}
            alt={alt}
            width={1448}
            height={1086}
            decoding="async"
            className="vd-ba__img"
        />
    );
}

function Panel({ spread, label, shape }) {
    const Shape = SHAPES[shape] ?? SHAPES.plain;
    return (
        <svg viewBox="0 0 216 140" className="vd-ba__svg" aria-hidden="true">
            <rect width="216" height="140" fill="var(--vd-soft)" />
            <Shape spread={spread} fill="var(--vd-paper)" stroke="var(--vd-accent)" />
            <text
                x="12"
                y="130"
                fontSize="11"
                fontWeight="700"
                fill="var(--vd-support)"
            >
                {label}
            </text>
        </svg>
    );
}

export default function BeforeAfter({ module: mod }) {
    const [pos, setPos] = useState(50);

    /* Photographs when the demo has them, drawn shapes otherwise. */
    const photo = Boolean(mod.beforeSrc && mod.afterSrc);
    const sizes = '(min-width: 900px) 720px, 100vw';

    return (
        <section id="compare" className="vd-section vd-ground--paper">
            <div className="vd-shell">
                <h2 className="vd-h2">{mod.title}</h2>
                <p className="vd-lede">{mod.subtitle}</p>

                <div className="vd-ba">
                    <div className={`vd-ba__stage${photo ? ' vd-ba__stage--photo' : ''}`}>
                        {/* After sits underneath, before is clipped over
                            it, so dragging right reveals the result. */}
                        <div className="vd-ba__layer">
                            {photo ? (
                                <Shot src={mod.afterSrc} alt={mod.afterAlt ?? ''} sizes={sizes} />
                            ) : (
                                <Panel spread={1} label={mod.afterLabel} shape={mod.shape} />
                            )}
                        </div>
                        <div
                            className="vd-ba__layer vd-ba__layer--top"
                            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
                        >
                            {photo ? (
                                <Shot src={mod.beforeSrc} alt={mod.beforeAlt ?? ''} sizes={sizes} />
                            ) : (
                                <Panel spread={0} label={mod.beforeLabel} shape={mod.shape} />
                            )}
                        </div>

                        {/* On photographs the label has to sit ON the
                            image, because there is no drawn panel to
                            carry it. Each is pinned to its own side and
                            fades out as the slider covers it. */}
                        {photo && (
                            <>
                                <span
                                    className="vd-ba__tag vd-ba__tag--before"
                                    style={{ opacity: pos > 14 ? 1 : 0 }}
                                    aria-hidden="true"
                                >
                                    {mod.beforeLabel}
                                </span>
                                <span
                                    className="vd-ba__tag vd-ba__tag--after"
                                    style={{ opacity: pos < 86 ? 1 : 0 }}
                                    aria-hidden="true"
                                >
                                    {mod.afterLabel}
                                </span>
                            </>
                        )}

                        <span
                            className="vd-ba__handle"
                            style={{ left: `${pos}%` }}
                            aria-hidden="true"
                        />

                        <label className="vd-ba__srlabel" htmlFor="ba-range">
                            Drag to compare {mod.beforeLabel} and {mod.afterLabel}
                        </label>
                        <input
                            id="ba-range"
                            type="range"
                            className="vd-ba__input"
                            min="0"
                            max="100"
                            value={pos}
                            onChange={(e) => setPos(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
