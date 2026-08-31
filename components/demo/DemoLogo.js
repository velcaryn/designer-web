/**
 * A generated wordmark, drawn rather than fetched.
 *
 * WHY IT IS INLINE SVG AND NOT A FILE
 *
 * The CSP allows images from 'self', data: and blob: only, so there is no
 * placeholder service and no CDN to pull sixteen logos from. Drawing them
 * costs about four hundred bytes each, needs no request, cannot shift the
 * layout while it loads, and inherits the demo's own palette through
 * currentColor, so a logo is automatically on-brand for whichever
 * business it belongs to.
 *
 * Twelve marks and four container treatments give forty-eight
 * combinations for sixteen businesses. They are assigned BY HAND in each
 * demo's data file, not randomly: the wheat belongs to the bakery and the
 * tooth to the dental clinic. "Random" in the brief means varied, not
 * arbitrary.
 */

export const MARKS = {
    wheat: (
        <>
            <path d="M12 21V9" />
            <path d="M12 9c0-2 1.6-3.6 3.6-3.6C15.6 7.4 14 9 12 9Z" />
            <path d="M12 9c0-2-1.6-3.6-3.6-3.6C8.4 7.4 10 9 12 9Z" />
            <path d="M12 13.5c0-2 1.6-3.6 3.6-3.6 0 2-1.6 3.6-3.6 3.6Z" />
            <path d="M12 13.5c0-2-1.6-3.6-3.6-3.6 0 2 1.6 3.6 3.6 3.6Z" />
        </>
    ),
    cup: (
        <>
            <path d="M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9Z" />
            <path d="M16 10h1.8a2.2 2.2 0 0 1 0 4.4H16" />
            <path d="M8 6V4.5M11.5 6V4M15 6V4.5" />
        </>
    ),
    tooth: (
        <>
            <path d="M12 4c2 0 2.6-1 4.4-1C18.4 3 20 4.6 20 7c0 3.2-1.2 4.6-1.8 8-.4 2.4-.8 4-2 4s-1.4-2.4-1.8-4.4C14.1 13 13.3 12 12 12s-2.1 1-2.4 2.6C9.2 16.6 9 19 7.8 19s-1.6-1.6-2-4C5.2 11.6 4 10.2 4 7c0-2.4 1.6-4 3.6-4C9.4 3 10 4 12 4Z" />
        </>
    ),
    leaf: (
        <>
            <path d="M5 19c0-8 5-13 14-13 0 9-5 13-14 13Z" />
            <path d="M5 19c3-5 6-7 10-8.5" />
        </>
    ),
    arch: (
        <>
            <path d="M4 20V11a8 8 0 0 1 16 0v9" />
            <path d="M9 20v-8a3 3 0 0 1 6 0v8" />
        </>
    ),
    box: (
        <>
            <path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Z" />
            <path d="M3 8.5 12 13l9-4.5M12 13v7" />
        </>
    ),
    lens: (
        <>
            <circle cx="12" cy="12" r="7.5" />
            <circle cx="12" cy="12" r="3.2" />
            <path d="M17.5 6.5 19 5" />
        </>
    ),
    mortar: (
        <>
            <path d="M4.5 10h15l-1.6 6.4A3 3 0 0 1 15 18.7H9a3 3 0 0 1-2.9-2.3L4.5 10Z" />
            <path d="M4 10h16M14 6.5 17.5 4" />
        </>
    ),
    thread: (
        <>
            <path d="M6 4v10a6 6 0 0 0 12 0V4" />
            <path d="M6 8h12M6 12h12" />
        </>
    ),
    wave: (
        <>
            <path d="M3 9c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4-1.7 4.8-.6" />
            <path d="M3 14c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4-1.7 4.8-.6" />
        </>
    ),
    cross: (
        <>
            <path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6v-6Z" />
        </>
    ),
    /* Added for the property and build sector. A compass for the
       architect, a spanner for the trades, a plot boundary for the land
       seller. Drawn to the same 24-box, same stroke weight, same joins as
       the original twelve. */
    compass: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="m14.8 9.2-1.9 4.6-4.7 1.9 1.9-4.6 4.7-1.9Z" />
        </>
    ),
    spanner: (
        <>
            <path d="M15.5 4.5a4.5 4.5 0 0 0-5.4 5.8L4 16.4 7.6 20l6.1-6.1a4.5 4.5 0 0 0 5.8-5.4l-2.6 2.6-2.6-.7-.7-2.6 2.6-2.6Z" />
        </>
    ),
    plot: (
        <>
            <path d="M3.5 7.5 12 4l8.5 3.5v9L12 20l-8.5-3.5v-9Z" />
            <path d="M12 4v16M3.5 7.5h17" strokeDasharray="2.5 2" />
        </>
    ),
    /* Added for the professional and automobile sectors. Same 24-box,
       same stroke weight, same joins as the rest. */
    ledger: (
        <>
            <path d="M5 4.5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2v-13Z" />
            <path d="M5 4.5a2 2 0 0 0-2 2v11h2M9 9h5M9 12.5h5" />
        </>
    ),
    scales: (
        <>
            <path d="M12 4.5v15M7 19.5h10M12 7 5 9M12 7l7 2" />
            <path d="M2.6 14.2 5 9l2.4 5.2a2.6 2.6 0 0 1-4.8 0ZM16.6 14.2 19 9l2.4 5.2a2.6 2.6 0 0 1-4.8 0Z" />
        </>
    ),
    gauge: (
        <>
            <path d="M4 16.5a8.5 8.5 0 1 1 16 0" />
            <path d="M12 16.5 15.5 11" />
            <circle cx="12" cy="16.5" r="1.4" />
        </>
    ),
    sprocket: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
        </>
    ),
    key: (
        <>
            <circle cx="8" cy="8" r="4" />
            <path d="M10.9 10.9 20 20M17 17l-2 2M20 14l-2 2" />
        </>
    ),
    spark: (
        <>
            <path d="M12 3.5 13.9 9l5.6 1.9L13.9 13 12 18.5 10.1 13 4.5 10.9 10.1 9 12 3.5Z" />
        </>
    ),
};

/* Just the glyph, no wrapper. The hub draws sixteen of these as tile
   art; a demo page draws one inside DemoLogo's container treatment. Both
   read the same table so a mark cannot mean one thing in the catalogue
   and another on the page it links to. */
export function MarkGlyph({ mark = 'spark', size = 24, strokeWidth = 1.6 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {MARKS[mark] ?? MARKS.spark}
        </svg>
    );
}

export default function DemoLogo({ mark = 'spark', style = 'bare', name, size = 34 }) {
    const glyph = MARKS[mark] ?? MARKS.spark;

    return (
        <span className={`vd-logo vd-logo--${style}`}>
            <span className="vd-logo__mark" aria-hidden="true">
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {glyph}
                </svg>
            </span>
            {name && <span className="vd-logo__name">{name}</span>}
        </span>
    );
}
