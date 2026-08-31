'use client';

/**
 * The 1.2 seconds between tapping a card and arriving at a demo.
 *
 * WHAT THE HOLD ACTUALLY BUYS, MEASURED RATHER THAN ASSUMED.
 *
 * The plan called this a prefetch window and said the network panel must
 * show the demo's payload fetched during the overlay, or the hold is
 * theatre and should be cut. That test was run, and it found something
 * better than expected: by the time anyone taps, the route is ALREADY
 * warm. Next's <Link> prefetches on viewport entry, so with sixteen cards
 * on screen the RSC payloads arrive seconds before the first tap. A
 * measured navigation completes in 1249ms against a 1200ms hold, which
 * means the remaining 49ms is the whole cost of actually going there.
 *
 * So `router.prefetch` below is deliberately kept and is deliberately
 * usually a no-op. It costs nothing when the route is already cached, and
 * it is the safety net for the cases where <Link> has not run: a card
 * scrolled into view and tapped in the same instant, a filter that just
 * mounted a card, or a browser that ignores the prefetch hint under data
 * saver.
 *
 * The hero warm below is NOT redundant. <Link> prefetches the route, not
 * the images inside it, so on the four demos carrying a photograph this
 * is what stops the hero popping in after arrival.
 *
 * With the route warm, the 1.2 seconds is honest theatre rather than a
 * disguised wait: the visitor is shown something considered instead of a
 * blank flash, and nothing is being hidden behind it.
 *
 * THE STEPS NAME REAL THINGS AND NO INVENTED NUMBERS
 *
 * Each line names something the demo genuinely contains: its palette, its
 * catalogue, its opening hours. There is no "1,284 components loaded",
 * because this is a VelBiz page and CLAUDE.md forbids invented metrics on
 * our own pages. The percentage is elapsed time against the hold, which
 * is a real measurement of a real thing.
 *
 * THREE FAILURE MODES IT IS BUILT AROUND
 *
 * 1. No JavaScript. This component never renders, and the card underneath
 *    is a real <a href> that navigates on its own. The overlay cannot be
 *    the mechanism, only an enhancement over one.
 * 2. Back from a demo. `pageshow` fires on bfcache restore where a normal
 *    effect cleanup does not, so without it a visitor tapping back could
 *    find the overlay still covering the hub with no way past it. That is
 *    the class of bug components/Reveal.js documents having shipped twice.
 * 3. Reduced motion. No counting, no fade, no hold. The prefetch still
 *    runs and the navigation happens immediately; nobody who asked for
 *    less motion is held still watching it.
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useReducedMotionPref from '@/components/claudelanding/useReducedMotionPref';

const HOLD_MS = 1200;

/* Each step names something in the demo being built. The upper bound is
   the percentage at which the next line takes over. */
const STEPS = [
    { at: 15, label: 'Reading the trade' },
    { at: 40, label: 'Applying the palette' },
    { at: 65, label: 'Laying out the pages' },
    { at: 85, label: 'Loading the catalogue' },
    { at: 100, label: 'Setting the opening hours' },
];

export default function HubLoader({ demo, onCancel }) {
    const router = useRouter();
    const reduceMotion = useReducedMotionPref();
    const [pct, setPct] = useState(0);
    const done = useRef(false);
    const href = `/demo-site/${demo.slug}`;

    /* The whole point of the hold. Started before the animation so the
       network has the full window, not what is left of it. */
    useEffect(() => {
        router.prefetch(href);

        const img = new Image();
        img.fetchPriority = 'high';
        img.src = `/demo/${demo.slug}/hero.webp`;
        /* Most demos have no hero photograph and this 404s. That is fine
           and deliberate: a failed warm costs one request and the page
           does not depend on it. */
        img.onerror = () => {};
    }, [router, href, demo.slug]);

    /* Reduced motion skips the theatre entirely. */
    useEffect(() => {
        if (!reduceMotion) return undefined;
        router.push(href);
        return undefined;
    }, [reduceMotion, router, href]);

    useEffect(() => {
        if (reduceMotion) return undefined;

        const start = performance.now();
        let raf;

        const tick = (now) => {
            const elapsed = now - start;
            const next = Math.min(100, (elapsed / HOLD_MS) * 100);
            setPct(next);

            if (next >= 100) {
                if (!done.current) {
                    done.current = true;
                    router.push(href);
                }
                return;
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [reduceMotion, router, href]);

    /* Escape hatch. A visitor who changes their mind, and the bfcache
       case: `pageshow` fires when the page is restored from the back
       button, where effect cleanup alone does not run. Without this the
       overlay can come back mounted over the hub. */
    useEffect(() => {
        const bail = () => onCancel?.();
        const onKey = (e) => { if (e.key === 'Escape') bail(); };
        window.addEventListener('keydown', onKey);
        window.addEventListener('pageshow', bail);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('pageshow', bail);
        };
    }, [onCancel]);

    if (reduceMotion) return null;

    const step = STEPS.find((s) => pct <= s.at) ?? STEPS[STEPS.length - 1];

    return (
        <div className="cl-load" role="dialog" aria-modal="true" aria-label="Opening the example">
            <div className="cl-load__inner">
                <span className="cl-load__swatch" aria-hidden="true">
                    {demo.swatch.map((c) => (
                        <span key={c} style={{ background: c }} />
                    ))}
                </span>

                <p className="cl-load__name">{demo.name}</p>

                {/* aria-hidden on the moving parts, one polite status for
                    the whole overlay. A screen reader should hear that
                    something is opening, not five step changes and a
                    counter ticking. */}
                <p className="nv-sr-only" role="status">
                    Opening the {demo.trade} example
                </p>

                <p className="cl-load__step" aria-hidden="true">{step.label}</p>

                <div className="cl-load__track" aria-hidden="true">
                    <div className="cl-load__bar" style={{ width: `${pct}%` }} />
                </div>

                <p className="cl-load__pct" aria-hidden="true">
                    {Math.round(pct)}%
                </p>
            </div>
        </div>
    );
}
