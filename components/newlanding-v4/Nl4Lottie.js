'use client';

/**
 * One Lottie animation, loaded lazily and played only while on screen.
 *
 * lottie-react 3 exports named components and no default, which is why
 * the dynamic import unwraps `LottieLight` explicitly: `dynamic(() =>
 * import('lottie-react'))` resolves to the module object and React
 * throws "Lazy element type must resolve to a class or function". That
 * shipped once and took the whole page down at hydration.
 *
 * LottieLight is the svg-only build with no expression engine, the
 * smallest of the three, and every animation in public/Lottie-JSON is
 * plain keyframes. It is still around 60KB gzipped, so it arrives with
 * ssr off and after the fold, and the box reserves its size meanwhile.
 *
 * The engine draws frame 0 on load and suppresses autoplay under
 * prefers-reduced-motion by itself. This leaf only adds the in-view
 * gate: an IntersectionObserver plays while the card is on screen and
 * pauses it otherwise, through the ref's own play/pause, so four loops
 * are not running under the footer. Decorative, hence aria-hidden.
 */
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const LottieLight = dynamic(
    () => import('lottie-react').then((m) => m.LottieLight),
    { ssr: false },
);

export default function Nl4Lottie({ animationData, size = 72, wide = false }) {
    /* `wide` fits a landscape animation (the speech bubbles are 1000 by
       350) into a box of `size` wide and the matching height. */
    const w = size;
    const h = wide ? Math.round(size * 0.35) : size;
    const box = useRef(null);
    const player = useRef(null);

    useEffect(() => {
        const el = box.current;
        if (!el) return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const io = new IntersectionObserver(
            ([entry]) => {
                const p = player.current;
                if (!p) return;
                if (entry.isIntersecting) p.play();
                else p.pause();
            },
            { threshold: 0.3 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div
            ref={box}
            className="nv4-lottie"
            style={{ width: w, height: h }}
            aria-hidden="true"
        >
            <LottieLight
                lottieRef={player}
                src={animationData}
                loop
                autoplay={false}
                className="nv4-lottie__svg"
                style={{ width: w, height: h }}
            />
        </div>
    );
}
