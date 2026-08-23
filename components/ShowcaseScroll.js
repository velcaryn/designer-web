'use client';

/**
 * Slowly pans a long screenshot inside its frame while it is on screen.
 *
 * WHY
 * The case study shows one desktop and one phone screenshot, cropped to the
 * top of the page. A static crop shows a header and stops. Panning slowly
 * down the page while the reader is looking at it shows the whole build,
 * which is the thing being sold, without asking anyone to click.
 *
 * HOW, AND WHY NOT WITH SCROLL POSITION
 * The image translates upward inside an overflow-hidden frame. It is a
 * transform on a composited layer, so it costs no layout and no repaint.
 *
 * It runs only while the section is actually in the viewport, via
 * IntersectionObserver. A CSS animation left running on an off-screen element
 * keeps the compositor busy for the whole page, which on the mid-range Android
 * phones this audience uses is a real frame-rate cost for something nobody can
 * see.
 *
 * It pauses on hover and on focus-within, so a reader who wants to study one
 * part of the page is not fighting it.
 *
 * Under reduced motion it never starts, and the crop stays at the top. The
 * pan is decorative: the case study makes its argument in words and in the
 * facts beside it, so nothing is lost.
 */
import { useEffect, useRef, useState } from 'react';

export default function ShowcaseScroll({ children, className = '', duration = 26 }) {
    const ref = useRef(null);
    const [run, setRun] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined;
        }

        const io = new IntersectionObserver(
            ([entry]) => setRun(entry.isIntersecting),
            /* A little of the frame is not enough to be worth animating for;
               wait until it is genuinely being looked at. */
            { threshold: 0.35 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`${className} nv-pan-shot${run ? ' is-running' : ''}`}
            style={{ '--nv-shot-duration': `${duration}s` }}
        >
            {children}
        </div>
    );
}
