'use client';

/**
 * The page's one entry-animation primitive.
 *
 * THE RULE THIS ENFORCES: content is visible by default, and animation is
 * something JavaScript opts into. Never the other way round.
 *
 * WHY IT IS BUILT THIS WAY, WHICH IS THE WHOLE POINT OF THE FILE
 *
 * The first two attempts used Motion's `whileInView` with an `initial` of
 * `opacity: 0`. Both shipped sections that were permanently invisible, and
 * the second attempt is the instructive one:
 *
 *   - `useReducedMotion()` is false during the server render, so the server
 *     emitted `style="opacity:0;transform:translateY(28px)"` into the HTML.
 *   - On the client it became true, so the component switched to its static
 *     branch and stopped managing those properties.
 *   - Nothing cleared the inline style that was already in the document, and
 *     the animation that would have cleared it never ran.
 *
 * The case study, the whole cloud section and every engagement card rendered
 * at opacity 0 in production because of it. The same trap catches any
 * `whileInView` whose observer does not fire: a slow hydration, a scroll
 * container the observer cannot see, a print stylesheet, a crawler.
 *
 * So the hidden state is never in the server HTML at all. `useEffect` runs
 * only in a browser, and only there does the element get the class that
 * hides it, immediately followed by an IntersectionObserver that reveals it.
 * That gives, for free:
 *
 *   - No JavaScript, or JavaScript that fails: everything is simply visible.
 *   - Reduced motion: the effect returns before arming, so again visible.
 *   - A crawler or a print: visible.
 *
 * The transition is CSS, so it composites on the GPU and costs no React
 * render. `delay` is passed as a custom property rather than as a style
 * object Motion has to diff.
 */
import { useEffect, useRef } from 'react';

export default function Reveal({
    children,
    delay = 0,
    as: Tag = 'div',
    className,
    ...rest
}) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        /* Read the preference here rather than through a hook, so that the
           decision is made once, in the browser, after the markup already
           exists in its visible state. */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined;
        }

        /* Arm. Up to this line the element has always been visible. */
        el.classList.add('nv-reveal');

        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                el.classList.add('is-in');
                io.disconnect();
            },
            { threshold: 0.15 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            className={className}
            style={delay ? { '--nv-reveal-delay': `${delay}s` } : undefined}
            {...rest}
        >
            {children}
        </Tag>
    );
}
