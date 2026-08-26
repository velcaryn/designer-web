'use client';

/**
 * Highlight Grid
 *
 * A grid of labelled cells with a single coloured highlight that glides
 * to sit behind whichever cell the pointer is over, morphing its
 * position, size and colour with a CSS transition. No animation library.
 *
 * VENDORED FROM vengenceui
 * `npx shadcn add https://www.vengenceui.com/r/highlight-grid.json`.
 * This repo has no shadcn `components.json` and vendors every registry
 * component by hand (see registry/magicui/*), so the upstream file was
 * converted from TSX to JSX and its `cn()` import replaced with plain
 * template literals. Tailwind utilities resolve here because
 * `registry/vengenceui/**` is one of the two `@source` paths declared in
 * app/globals.css; they would not resolve anywhere under components/.
 *
 * TWO CHANGES FROM UPSTREAM, BOTH DELIBERATE
 *
 * 1. `onFocus` alongside `onMouseEnter`, so the highlight follows
 *    keyboard focus and not only the mouse. Upstream is pointer-only,
 *    which leaves a keyboard user with no indication of where they are.
 * 2. A `reduceMotion` prop that sets the transition to 0ms. The
 *    highlight still moves, so nothing is lost, it just stops sliding.
 *    The blanket reduced-motion rule in globals.css cannot reach this
 *    because the duration is written as an inline style.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_COLORS = [
    '#E24E1B', '#4381C1', '#F79824', '#04A777',
    '#5B8C5A', '#2176FF', '#818D92', '#22AAA1',
];

export function HighlightGrid({
    rows = [],
    colors = DEFAULT_COLORS,
    transitionDuration = 250,
    highlightFirst = true,
    reduceMotion = false,
    renderCell,
    className = '',
}) {
    const gridRef = useRef(null);
    const highlightRef = useRef(null);
    const cellRefs = useRef(new Map());
    const [active, setActive] = useState(highlightFirst ? 0 : null);

    /* Flatten rows into cells carrying a running global index and a
       resolved colour, so a cell can be addressed by one number. */
    const gridRows = useMemo(() => {
        let gi = 0;
        return rows.map((row) => row.map((item) => {
            const idx = gi;
            gi += 1;
            return {
                ...item,
                color: item.color ?? colors[idx % colors.length],
                gi: idx,
            };
        }));
    }, [rows, colors]);

    const moveTo = useCallback((gi, color) => {
        const grid = gridRef.current;
        const highlight = highlightRef.current;
        const cell = cellRefs.current.get(gi);
        if (!grid || !highlight || !cell) return;

        const crect = grid.getBoundingClientRect();
        const rect = cell.getBoundingClientRect();
        highlight.style.transform =
            `translate(${rect.left - crect.left}px, ${rect.top - crect.top}px)`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.backgroundColor = color;
    }, []);

    /* Park the highlight on the first cell, and keep it aligned when the
       grid is resized or reflowed: the position is measured in pixels,
       so a layout change would otherwise strand it. */
    useEffect(() => {
        if (!highlightFirst) return undefined;
        const first = gridRows[0]?.[0];
        if (!first) return undefined;

        const place = () => moveTo(first.gi, first.color);
        place();

        const ro = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(place)
            : null;
        if (ro && gridRef.current) ro.observe(gridRef.current);
        window.addEventListener('resize', place);

        return () => {
            ro?.disconnect();
            window.removeEventListener('resize', place);
        };
    }, [gridRows, highlightFirst, moveTo]);

    return (
        <div className={`relative w-full ${className}`}>
            <div
                ref={gridRef}
                className="relative flex w-full flex-col overflow-hidden"
            >
                {/* The sliding highlight: a solid accent that fades between
                    cells, with a fixed gradient sheen layered over it. */}
                <div
                    ref={highlightRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 z-0"
                    style={{
                        backgroundImage:
                            'radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.30), rgba(255,255,255,0) 52%), linear-gradient(180deg, rgba(255,255,255,0) 55%, rgba(0,0,0,0.18))',
                        transitionProperty: 'transform, width, height, background-color',
                        transitionDuration: `${reduceMotion ? 0 : transitionDuration}ms`,
                        transitionTimingFunction: 'ease',
                    }}
                />

                {gridRows.map((row, r) => (
                    <div
                        key={r}
                        className={`flex ${r < gridRows.length - 1 ? 'border-b-2 border-[#0a0a0c]' : ''}`}
                    >
                        {row.map((cell, c) => (
                            <div
                                key={cell.gi}
                                ref={(el) => {
                                    if (el) cellRefs.current.set(cell.gi, el);
                                    else cellRefs.current.delete(cell.gi);
                                }}
                                onMouseEnter={() => {
                                    setActive(cell.gi);
                                    moveTo(cell.gi, cell.color);
                                }}
                                onFocus={() => {
                                    setActive(cell.gi);
                                    moveTo(cell.gi, cell.color);
                                }}
                                className={`relative z-10 flex flex-1 min-w-0 ${c < row.length - 1 ? 'border-r-2 border-[#0a0a0c]' : ''}`}
                            >
                                {renderCell
                                    ? renderCell(cell, active === cell.gi)
                                    : (
                                        <p className="w-full p-4 text-center text-sm font-semibold">
                                            {cell.label}
                                        </p>
                                    )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default HighlightGrid;
