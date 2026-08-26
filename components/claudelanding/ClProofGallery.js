'use client';

/**
 * The three device frames in ClProof, each shuffling through real
 * screenshots of BOTH client builds rather than each being pinned to one
 * project.
 *
 * WHY THE POOL IS PER ORIENTATION, NOT PER PROJECT
 *
 * The first version gave each frame one project: the iPhone only ever
 * showed lihashop, the Safari frame only ever showed velcaryn, and the
 * lihashop desktop captures were never shown at all. That wasted half the
 * screenshots and made the section read as two fixed exhibits. Each frame
 * now draws from every capture of the right SHAPE, across both projects,
 * so the Android frame might show a lihashop page while the Safari frame
 * shows velcaryn and the iPhone shows velcaryn again, and the next tick
 * deals a different hand. The phone frames share the portrait pool and
 * the Safari frame takes the landscape pool, because a desktop capture
 * letterboxed into a 9:19 frame looks broken rather than random.
 *
 * WHY THE SHUFFLE IS SEEDED IN AN EFFECT, NOT AT RENDER
 *
 * `Math.random()` during render disagrees between the server pass and the
 * client pass and React throws a hydration mismatch. Every frame starts
 * on a deterministic index derived from its own `seed` prop, and the
 * randomness only begins once the first interval tick fires on the
 * client.
 *
 * THE THREE FRAMES ARE DELIBERATELY NOT SYNCHRONISED
 *
 * Each runs its own interval with a small per-frame offset, so they do
 * not all flip on the same frame like a slideshow. Nothing here responds
 * to hover, focus or click: the cycle is the same for everyone and keeps
 * running regardless of where the pointer is, which is what was asked
 * for and also means there is no pointer state to get stuck on a touch
 * device.
 *
 * WHY THIS IS LAZY
 *
 * There are 29 screenshots (public/previews/, converted from
 * public/Screenshots/ by scripts/convert-screenshots.py). Loading all of
 * them the moment the page mounts, for a section that sits last, would
 * compete with the hero for bandwidth on exactly the connections this
 * site cares most about. An IntersectionObserver starts the cycling only
 * once the section is approaching the viewport.
 *
 * WHY CYCLING IS A CSS OPACITY CROSS-FADE, NOT A REMOUNT
 *
 * Two images are stacked absolutely and only their opacity swaps. A
 * `key`-forced remount would tear down and reload the incoming <Image>
 * every cycle, defeating Next's own caching. Holding the outgoing shot
 * mounted for the length of the fade keeps the frame from ever going
 * blank mid-transition.
 */
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import useReducedMotionPref from './useReducedMotionPref';

const CYCLE_MS = 3000;

/* Every capture, grouped by the shape of frame it can sit in. Counts
   match the files on disk; see the `ls public/previews` grouping in
   scripts/convert-screenshots.py's output. */
function build(prefix, count) {
    return Array.from({ length: count }, (_, i) => `/previews/${prefix}_${i + 1}.webp`);
}

export const PORTRAIT_SHOTS = [
    ...build('lihashop-mobile', 7),
    ...build('velcaryn-mobile', 8),
];

export const LANDSCAPE_SHOTS = [
    ...build('lihashop-web', 7),
    ...build('velcaryn-web', 7),
];

export default function ClProofGallery({
    Frame,
    frameProps,
    shots,
    alt,
    sizes,
    active,
    seed = 0,
    ratio = '9 / 19',
}) {
    /* Deterministic first frame: same on the server and the client. */
    const [index, setIndex] = useState(seed % shots.length);
    const [prev, setPrev] = useState(null);
    const reduceMotion = useReducedMotionPref();

    useEffect(() => {
        if (!active || reduceMotion || shots.length <= 1) return undefined;

        let id = null;

        const tick = () => {
            setIndex((current) => {
                setPrev(current);
                /* Pick any shot except the one already showing, so a
                   random draw never looks like a dropped frame. */
                let next = current;
                while (next === current) {
                    next = Math.floor(Math.random() * shots.length);
                }
                return next;
            });
        };

        /* The offset keeps the three frames from flipping in lockstep. */
        const start = window.setTimeout(() => {
            tick();
            id = window.setInterval(tick, CYCLE_MS);
        }, seed * 450);

        return () => {
            window.clearTimeout(start);
            if (id) window.clearInterval(id);
        };
    }, [active, reduceMotion, shots.length, seed]);

    /* The outgoing shot stays mounted underneath so the incoming one
       fades in over a picture rather than over an empty frame. */
    const layers = prev === null || prev === index ? [index] : [prev, index];

    return (
        <Frame {...frameProps}>
            <div className="cl-proofGallery" style={{ '--pg-ratio': ratio }}>
                {layers.map((i) => (
                    <Image
                        key={shots[i]}
                        src={shots[i]}
                        alt={i === index ? alt : ''}
                        aria-hidden={i === index ? undefined : true}
                        fill
                        sizes={sizes}
                        className={`cl-proofGallery__img${i === index ? ' is-shown' : ''}`}
                        priority={i === seed % shots.length}
                    />
                ))}
            </div>
        </Frame>
    );
}

export function useNearViewport() {
    const ref = useRef(null);
    const [near, setNear] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setNear(true);
                    io.disconnect();
                }
            },
            { rootMargin: '400px 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return [ref, near];
}
