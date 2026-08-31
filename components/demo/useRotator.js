'use client';

/**
 * The auto-rotation contract, once, as a headless hook.
 *
 * WHY THIS EXISTS SEPARATELY FROM THE THING THAT ROTATES
 *
 * WCAG 2.2.2 says any content that moves, blinks or scrolls automatically
 * for more than five seconds must be pausable by the user. Meeting that
 * properly is more than a `setInterval`: it needs a real pause control,
 * pause on hover and on focus, pause when the tab is hidden, and no
 * rotation at all for a visitor who has asked for reduced motion.
 *
 * All of that was written once, correctly, inside CloudDemo. The demo
 * sites need the same behaviour for their galleries and testimonial
 * rails, and the alternative to extracting it was reimplementing it from
 * memory sixteen times. A contract reimplemented from memory is a
 * contract that is met four times out of five.
 *
 * So the behaviour lives here and the markup lives with each consumer.
 * This hook renders nothing and knows nothing about tabs, panels or
 * slides: it owns an index and the rules for when that index may change.
 *
 * WHAT THE CALLER STILL HAS TO DO
 *
 * The roles and ARIA wiring, because those depend on what is rotating: a
 * tablist wants `role="tab"` and `aria-selected`, a carousel wants
 * `aria-roledescription`. The hook hands back `pause`, `resume` and
 * `paused` so the caller can wire a real button, and spreading
 * `hoverProps` onto the rotating region covers hover and focus.
 */
import { useCallback, useEffect, useState } from 'react';
import useReducedMotionPref from '@/components/claudelanding/useReducedMotionPref';

export default function useRotator(count, intervalMs = 7000) {
    const [index, setIndex] = useState(0);
    /* Two separate pause reasons, deliberately not merged. `auto` is the
       page deciding (tab hidden, pointer over the region); `manual` is the
       visitor deciding. Merging them means a visitor who pressed pause has
       their choice silently undone the moment the pointer leaves. */
    const [autoPaused, setAutoPaused] = useState(false);
    const [manualPaused, setManualPaused] = useState(false);

    /* Rotation does not exist at all under reduced motion, and the hook
       keeps watching: someone can change the setting without reloading. */
    const allowRotate = !useReducedMotionPref();

    useEffect(() => {
        const onVisibility = () => setAutoPaused(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () =>
            document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    useEffect(() => {
        if (!allowRotate || autoPaused || manualPaused || count < 2) {
            return undefined;
        }
        const id = setInterval(
            () => setIndex((i) => (i + 1) % count),
            intervalMs,
        );
        return () => clearInterval(id);
    }, [allowRotate, autoPaused, manualPaused, count, intervalMs]);

    /* Wraps in both directions, so the caller can pass index - 1 without
       guarding for a negative. */
    const go = useCallback(
        (next) => setIndex((next + count) % count),
        [count],
    );

    /* Arrow keys in both orientations, because a horizontal tablist and a
       vertical list should both work and the caller should not have to
       decide which. Returns true when it handled the key, so a caller can
       fall through to its own handling. */
    const onKeyDown = useCallback(
        (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex((i) => (i + 1) % count);
                return true;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex((i) => (i - 1 + count) % count);
                return true;
            }
            return false;
        },
        [count],
    );

    return {
        index,
        go,
        onKeyDown,
        /* The visitor's own pause state, for labelling a real control. */
        paused: manualPaused,
        pause: () => setManualPaused(true),
        resume: () => setManualPaused(false),
        toggle: () => setManualPaused((p) => !p),
        /* Whether rotation could run at all. A caller uses this to hide
           pause controls entirely under reduced motion, where there is
           nothing to pause. */
        canRotate: allowRotate && count > 1,
        /* Spread onto the rotating REGION, not onto individual items.
           Focus is included because a keyboard user tabbing through must
           not have the content move underneath them.
           Capture-phase focus, and the relatedTarget check on blur, are
           both load-bearing. `onFocus`/`onBlur` in the bubble phase would
           resume rotation every time focus moved from one child to the
           next INSIDE the region, because a blur fires before the
           matching focus. Checking that the new focus target is outside
           the region is what makes "paused while the visitor is in here"
           actually true. Copied from CloudDemo, which got this right
           first. */
        hoverProps: {
            onMouseEnter: () => setAutoPaused(true),
            onMouseLeave: () => setAutoPaused(false),
            onFocusCapture: () => setAutoPaused(true),
            onBlurCapture: (e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setAutoPaused(false);
                }
            },
        },
    };
}
