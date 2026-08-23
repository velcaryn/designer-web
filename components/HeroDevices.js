'use client';

/**
 * The hero visual: one layout, three devices, reflowing in 3D.
 *
 * WHY THIS AND NOT A SCREENSHOT
 * The hero previously showed a client's home page. That put someone else's
 * design in our most valuable space and said nothing about what we do to it.
 * The client work now lives in the case study section, where it can be
 * discussed properly. This says the thing the hero should say: whatever we
 * build, it is designed at every width, not designed once and squeezed.
 *
 * WHY CSS 3D AND NOT THREE.JS
 * three, @react-three/fiber and drei are all in this project, so a real WebGL
 * scene was available. It is the wrong tool here:
 *   - It is the largest thing on the page and sits above the fold, so it
 *     would own LCP. A WebGL context plus its bundle is a slow first paint on
 *     exactly the mid-range Android hardware most of this audience uses.
 *   - Text inside a canvas is rasterised. These frames hold crisp vector
 *     shapes at any zoom, and stay in the DOM for a screen reader to skip.
 *   - `prefers-reduced-motion` degrades a CSS scene to a static composition
 *     for free. A canvas has to be told, and usually is not.
 * CSS 3D transforms are composited on the GPU, cost nothing to load, and buy
 * the same depth.
 *
 * WHAT IS INSIDE THE FRAMES
 * Abstract layout blocks, deliberately. These are wireframes of a reflowing
 * grid, not an imitation of a real interface: three columns on the desktop,
 * two on the tablet, one stacked on the phone, which is the actual point
 * being made. Building a fake product UI out of divs and passing it off as a
 * screenshot would be dishonest and, worse, unconvincing.
 *
 * The whole thing is decorative and marked aria-hidden. The claim it
 * illustrates is made in words in the hero copy beside it, so nothing is
 * lost to a screen reader.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

/* Wireframe fills for one device. `cols` drives the reflow: the same six
   blocks arranged three-up, two-up, then stacked. */
function Wireframe({ cols }) {
    return (
        <div className={`nv-wf nv-wf--${cols}`}>
            <span className="nv-wf__bar nv-wf__bar--title" />
            <span className="nv-wf__bar nv-wf__bar--sub" />
            <div className="nv-wf__grid">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <span className="nv-wf__cell" key={i} />
                ))}
            </div>
            <span className="nv-wf__bar nv-wf__bar--foot" />
        </div>
    );
}

/*
 * Each device breathes between two widths on its own clock. The periods are
 * deliberately coprime-ish so the three never resize in lockstep: a synchronised
 * pulse reads as one animation applied three times, where staggered resizing
 * reads as three independent viewports, which is the actual claim.
 */
const CYCLES = {
    desktop: 5200,
    tablet: 6300,
    phone: 4100,
};

export default function HeroDevices() {
    const reduce = useReducedMotion();
    const scene = useRef(null);
    const [landscape, setLandscape] = useState(false);
    const [deskNarrow, setDeskNarrow] = useState(false);
    const [tabletNarrow, setTabletNarrow] = useState(false);

    /* Pointer parallax. Motion values, never state: a mouse move that goes
       through setState re-renders the tree on every frame and collapses the
       moment anything else on the page is doing work. */
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const sx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.6 });
    const sy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.6 });
    const rotateY = useTransform(sx, [-0.5, 0.5], [-20, -4]);
    const rotateX = useTransform(sy, [-0.5, 0.5], [10, -2]);

    useEffect(() => {
        if (reduce) return undefined;
        const el = scene.current;
        if (!el) return undefined;
        /* Pointer only. A touch drag on a phone must scroll the page, not
           tilt a decoration. */
        const onMove = (e) => {
            if (e.pointerType !== 'mouse') return;
            const r = el.getBoundingClientRect();
            px.set((e.clientX - r.left) / r.width - 0.5);
            py.set((e.clientY - r.top) / r.height - 0.5);
        };
        const onLeave = () => { px.set(0); py.set(0); };
        window.addEventListener('pointermove', onMove, { passive: true });
        el.addEventListener('pointerleave', onLeave);
        return () => {
            window.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerleave', onLeave);
        };
    }, [reduce, px, py]);

    /* Three independent timers, one per device. The phone turns to landscape,
       the desktop and tablet narrow and widen. Each is the same argument made
       three ways: the layout holds at whatever width it is given. All off
       entirely under reduced motion, where the scene is a static composition. */
    useEffect(() => {
        if (reduce) return undefined;
        const timers = [
            setInterval(() => setLandscape((v) => !v), CYCLES.phone),
            setInterval(() => setDeskNarrow((v) => !v), CYCLES.desktop),
            setInterval(() => setTabletNarrow((v) => !v), CYCLES.tablet),
        ];
        return () => timers.forEach(clearInterval);
    }, [reduce]);

    const float = (delay) => (reduce ? {} : {
        animate: { y: [0, -10, 0] },
        transition: { duration: 7, delay, repeat: Infinity, ease: 'easeInOut' },
    });

    return (
        <div className="nv-devices" ref={scene} aria-hidden="true">
            <motion.div
                className="nv-devices__stage"
                style={reduce ? undefined : { rotateY, rotateX }}
            >
                <motion.div
                    className={`nv-dev nv-dev--desktop${deskNarrow ? ' is-narrow' : ''}`}
                    {...float(0)}
                >
                    <div className="nv-dev__screen">
                        <Wireframe cols={deskNarrow ? 2 : 3} />
                    </div>
                </motion.div>

                <motion.div
                    className={`nv-dev nv-dev--tablet${tabletNarrow ? ' is-narrow' : ''}`}
                    {...float(0.9)}
                >
                    <div className="nv-dev__screen">
                        <Wireframe cols={tabletNarrow ? 1 : 2} />
                    </div>
                </motion.div>

                <motion.div
                    className={`nv-dev nv-dev--phone${landscape ? ' is-landscape' : ''}`}
                    {...float(1.8)}
                >
                    <div className="nv-dev__screen">
                        <Wireframe cols={1} />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
