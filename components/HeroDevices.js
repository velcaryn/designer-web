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
 * Three DIFFERENT page compositions, not one grid at three sizes: a hero
 * beside a text column on the desktop, a media grid on the tablet, a stacked
 * feed on the phone. Each reflows on its own timer. Showing the same six
 * boxes in all three would say "one layout scaled down", which is the
 * opposite of the argument.
 *
 * The parts are abstract on purpose. Building a fake product UI out of divs
 * and passing it off as a screenshot would be dishonest and, worse,
 * unconvincing.
 *
 * The whole thing is decorative and marked aria-hidden. The claim it
 * illustrates is made in words in the hero copy beside it, so nothing is
 * lost to a screen reader.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

/*
 * Wireframe contents.
 *
 * Each device shows a DIFFERENT page composition, not the same six boxes
 * three times. That is the point: identical grids at three sizes says "one
 * layout scaled", which is the opposite of the claim. A hero image over a
 * text column, a media grid, and a stacked feed are three real page shapes,
 * and seeing them reflow independently is what makes the scene read as three
 * live viewports.
 *
 * The parts are deliberately generic (image blocks, text lines, a button)
 * rather than an imitation of any real interface. This is a diagram of
 * layout, not a fake screenshot.
 */
function Line({ w = '100%', strong = false, dim = false }) {
    return (
        <span
            className={`nv-wf__line${strong ? ' is-strong' : ''}${dim ? ' is-dim' : ''}`}
            style={{ width: w }}
        />
    );
}

function TextBlock({ lines = 3, lead = false }) {
    return (
        <span className="nv-wf__text">
            {lead && <Line w="70%" strong />}
            {Array.from({ length: lines }).map((_, i) => (
                <Line key={i} w={i === lines - 1 ? '55%' : '100%'} dim />
            ))}
        </span>
    );
}

/* Desktop wide: hero media beside a text column, then a three-up row. */
function DesktopWide() {
    return (
        <div className="nv-wf nv-wf--deskWide">
            <span className="nv-wf__split">
                <span className="nv-wf__media" />
                <TextBlock lines={3} lead />
            </span>
            <span className="nv-wf__row nv-wf__row--3">
                <span className="nv-wf__tile" />
                <span className="nv-wf__tile" />
                <span className="nv-wf__tile" />
            </span>
        </div>
    );
}

/* Desktop narrow: the same page with the split collapsed and the row at two. */
function DesktopNarrow() {
    return (
        <div className="nv-wf nv-wf--deskNarrow">
            <span className="nv-wf__media nv-wf__media--wide" />
            <TextBlock lines={2} lead />
            <span className="nv-wf__row nv-wf__row--2">
                <span className="nv-wf__tile" />
                <span className="nv-wf__tile" />
            </span>
        </div>
    );
}

/* Tablet: a media grid with a caption under each, plus a button. */
function TabletGrid({ narrow }) {
    return (
        <div className="nv-wf nv-wf--tablet">
            <Line w="58%" strong />
            <span className={`nv-wf__row ${narrow ? 'nv-wf__row--1' : 'nv-wf__row--2'}`}>
                {Array.from({ length: narrow ? 2 : 4 }).map((_, i) => (
                    <span className="nv-wf__card" key={i}>
                        <span className="nv-wf__cardMedia" />
                        <Line w="80%" dim />
                    </span>
                ))}
            </span>
            <span className="nv-wf__btn" />
        </div>
    );
}

/* Phone portrait: a stacked feed. Landscape: two columns and a wider hero. */
function PhoneStack({ landscape }) {
    if (landscape) {
        return (
            <div className="nv-wf nv-wf--phoneLand">
                <span className="nv-wf__media nv-wf__media--wide" />
                <span className="nv-wf__row nv-wf__row--2">
                    <TextBlock lines={2} />
                    <TextBlock lines={2} />
                </span>
                <span className="nv-wf__btn" />
            </div>
        );
    }
    return (
        <div className="nv-wf nv-wf--phone">
            <Line w="64%" strong />
            <span className="nv-wf__media" />
            <TextBlock lines={2} />
            <span className="nv-wf__card nv-wf__card--row">
                <span className="nv-wf__thumb" />
                <span className="nv-wf__cardText">
                    <Line w="90%" dim />
                    <Line w="60%" dim />
                </span>
            </span>
            <span className="nv-wf__btn" />
        </div>
    );
}

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
                        {deskNarrow ? <DesktopNarrow /> : <DesktopWide />}
                    </div>
                </motion.div>

                <motion.div
                    className={`nv-dev nv-dev--tablet${tabletNarrow ? ' is-narrow' : ''}`}
                    {...float(0.9)}
                >
                    <div className="nv-dev__screen">
                        <TabletGrid narrow={tabletNarrow} />
                    </div>
                </motion.div>

                <motion.div
                    className={`nv-dev nv-dev--phone${landscape ? ' is-landscape' : ''}`}
                    {...float(1.8)}
                >
                    <div className="nv-dev__screen">
                        <PhoneStack landscape={landscape} />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
