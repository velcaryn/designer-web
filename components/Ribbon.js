'use client';

/**
 * The capabilities ribbon: rolls on its own, and is also a real scroller.
 *
 * WHY THIS IS JAVASCRIPT AND NOT A CSS ANIMATION
 * The previous version animated `transform` on the track, which cannot also
 * be scrolled: a transform moves the painted result, it does not move the
 * scroll position, so the two mechanisms fight. Hovering paused it, and the
 * pause looked like the component had died. Reported as feeling broken, and
 * that is a fair description of "it stops and does not obviously restart".
 *
 * Driving `scrollLeft` instead makes the roll and the user's own scroll the
 * SAME mechanism. Grabbing it, swiping it, or flicking a trackpad moves the
 * exact value the animation moves, so there is no conflict to resolve and no
 * jump when control passes between them.
 *
 * BEHAVIOUR
 *   - Rolls continuously, left to right.
 *   - Pointer over it: eases to a stop so the panel can be read.
 *   - Pointer leaves: eases straight back up to speed. No delay, no restart
 *     stutter. The easing is what stops it feeling like a switch being
 *     flipped.
 *   - Drag, swipe or wheel scrolls it directly, and the roll resumes from
 *     wherever it was left.
 *
 * The seam is handled by rendering the list twice and wrapping `scrollLeft`
 * at the halfway point, which is invisible because both halves are identical.
 *
 * `requestAnimationFrame` with a delta-time step, not a fixed increment per
 * frame: a fixed increment runs at double speed on a 120Hz display.
 */
import { useEffect, useRef } from 'react';

/* Pixels per second. Fast enough to read as deliberate motion rather than
   drift, slow enough to read the panel titles as they pass. */
const SPEED = 46;
/* How quickly the roll reaches full speed or comes to rest, per second. A
   higher number is snappier; this lands at roughly a quarter-second glide. */
const EASE = 4.5;

export default function Ribbon({ children }) {
    const rail = useRef(null);
    const speed = useRef(0);
    const target = useRef(SPEED);
    const frame = useRef(0);
    const last = useRef(0);

    useEffect(() => {
        const el = rail.current;
        if (!el) return undefined;

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reduce.matches) return undefined;

        /* Start from a standstill and ease up, so the first paint is not a
           jump. */
        speed.current = 0;
        target.current = SPEED;

        const step = (now) => {
            const dt = last.current ? Math.min((now - last.current) / 1000, 0.05) : 0;
            last.current = now;

            /* Exponential approach to the target speed. Framerate-independent
               because the factor is derived from the elapsed time. */
            speed.current += (target.current - speed.current) * (1 - Math.exp(-EASE * dt));

            if (Math.abs(speed.current) > 0.05) {
                el.scrollLeft += speed.current * dt;
                /* The list is rendered twice, so wrapping at the halfway mark
                   is invisible. */
                const half = el.scrollWidth / 2;
                if (el.scrollLeft >= half) el.scrollLeft -= half;
                else if (el.scrollLeft <= 0) el.scrollLeft += half;
            }
            frame.current = requestAnimationFrame(step);
        };
        frame.current = requestAnimationFrame(step);

        const slow = () => { target.current = 0; };
        const go = () => { target.current = SPEED; };

        /* Pointer only. A touch user scrolling the page past the ribbon
           should not stop it, and a touch drag on the rail is handled by the
           browser's own scrolling. */
        const onEnter = (e) => { if (e.pointerType === 'mouse') slow(); };
        const onLeave = (e) => { if (e.pointerType === 'mouse') go(); };

        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointerleave', onLeave);
        /* Keyboard focus inside the rail pauses it too, so tabbing through
           the tags does not chase them across the screen. */
        el.addEventListener('focusin', slow);
        el.addEventListener('focusout', go);

        /* While a finger or the wheel is driving it, the roll steps aside and
           resumes shortly after the gesture ends. */
        let idle;
        const onScrollInput = () => {
            slow();
            clearTimeout(idle);
            idle = setTimeout(() => {
                if (!el.matches(':hover')) go();
            }, 700);
        };
        el.addEventListener('wheel', onScrollInput, { passive: true });
        el.addEventListener('touchstart', onScrollInput, { passive: true });
        el.addEventListener('touchend', onScrollInput, { passive: true });

        const onMotionChange = () => {
            if (reduce.matches) {
                cancelAnimationFrame(frame.current);
                target.current = 0;
                speed.current = 0;
            }
        };
        reduce.addEventListener('change', onMotionChange);

        return () => {
            cancelAnimationFrame(frame.current);
            clearTimeout(idle);
            el.removeEventListener('pointerenter', onEnter);
            el.removeEventListener('pointerleave', onLeave);
            el.removeEventListener('focusin', slow);
            el.removeEventListener('focusout', go);
            el.removeEventListener('wheel', onScrollInput);
            el.removeEventListener('touchstart', onScrollInput);
            el.removeEventListener('touchend', onScrollInput);
            reduce.removeEventListener('change', onMotionChange);
        };
    }, []);

    return (
        <div className="nv-ribbon" ref={rail}>
            <ul className="nv-ribbon__track">{children}</ul>
        </div>
    );
}
