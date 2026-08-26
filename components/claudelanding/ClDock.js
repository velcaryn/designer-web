'use client';

/**
 * The bottom dock: every navigation link on the page, in one control that
 * behaves the same on a phone as on a desk.
 *
 * REPLACES ClNav'S LINKS ENTIRELY
 *
 * ClNav hid `.cl-nav__links` below 900px and had no drawer to fall back to,
 * so a phone visitor could not navigate the page at all except by scrolling.
 * The dock does not hide anything at any width: six icons, always visible,
 * always the same six targets.
 *
 * ICON ONLY, NO LABEL, AND A FIXED-WIDTH DOCK
 *
 * The dock used to grow a text label under the active or hovered icon.
 * That label change resized the flex row it sat in, and because the dock is
 * centred with `left: 50%; transform: translateX(-50%)`, a change in the
 * bar's total width shifted the WHOLE dock sideways to stay centred on the
 * new width, on every hover and on every section change. That read as the
 * dock sliding around rather than icons magnifying in place. There is no
 * label at all now, in the bar or under the active item, so the bar's
 * width is constant from first paint to last and centring never moves it.
 * `aria-label` still names every item for a screen reader; the label was
 * only ever a sighted-user affordance.
 *
 * MAGNIFICATION IS MOUSE-ONLY, AND DELIBERATELY LARGE
 *
 * Each item gets its own spring-driven scale (`useMotionValue` +
 * `useSpring`, the same primitives HeroDevices.js uses for its pointer
 * parallax), pushed by the pointer's distance from that item's centre on
 * `pointermove`, and eased back to 1 on `pointerleave`. The guard is the
 * same one HeroDevices uses: `e.pointerType !== 'mouse'` returns
 * immediately, because a touch drag along the dock must scroll or tap, not
 * magnify under a finger it cannot see coming. The peak scale and falloff
 * radius are large enough that the hovered icon is unmistakably the
 * biggest thing in the bar, macOS-dock style, rather than a subtle nudge.
 * Scale only, never a width or margin change, so magnifying still cannot
 * move the dock itself: only `transform` is touched.
 *
 * On touch, and under reduced motion, there is no per-item scale logic at
 * all: the section currently in view gets `.is-active` from one
 * IntersectionObserver over the six targets (the same pattern the old
 * ClNav used for its own active-link tracking), which enlarges it by CSS
 * transform. Every item still gets `:active` press feedback.
 *
 * THE LAB COUNTDOWN LIVES HERE, NOT IN ClLab
 *
 * ClLab publishes to LabContext on every tick; this reads it. The pill only
 * renders while `!isDefault`, so the dock does not change width at rest.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import {
    House,
    Storefront,
    Cube,
    Palette,
    Images,
    ChatCircle,
    ArrowClockwise,
} from '@phosphor-icons/react/ssr';
import useReducedMotionPref from './useReducedMotionPref';
import { useLabStatus } from './LabContext';

const ITEMS = [
    { id: 'top', label: 'Home', Icon: House },
    { id: 'grow', label: 'How it works', Icon: Storefront },
    { id: 'tech', label: 'Tech', Icon: Cube },
    { id: 'lab', label: 'Lab', Icon: Palette },
    { id: 'work', label: 'Work', Icon: Images },
    { id: 'talk', label: 'Contact', Icon: ChatCircle },
];

/* Peaks at 1.7x directly under the pointer, back to 1x by 130px away. Big
   enough that the hovered icon is unambiguously the focal point of the bar,
   the effect the "a little bigger" request asks for; still capped rather
   than an uncapped curve, because past this an icon starts overlapping its
   neighbours' hit areas. */
const PEAK_SCALE = 1.7;
const FALLOFF_PX = 130;

/** One dock icon. Owns its own spring so a hover on one item never causes
    the others to re-render. */
function DockItem({ id, label, Icon, isActive, reduceMotion, dockRef }) {
    const scale = useMotionValue(1);
    const spring = useSpring(scale, { stiffness: 320, damping: 22, mass: 0.5 });
    const itemRef = useRef(null);

    useEffect(() => {
        if (reduceMotion) return undefined;
        const dock = dockRef.current;
        const item = itemRef.current;
        if (!dock || !item) return undefined;

        function onMove(e) {
            if (e.pointerType !== 'mouse') return;
            const r = item.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const dist = Math.abs(e.clientX - cx);
            const next = Math.max(
                1,
                PEAK_SCALE - (dist / FALLOFF_PX) * (PEAK_SCALE - 1),
            );
            scale.set(next);
        }
        function onLeave() {
            scale.set(1);
        }
        dock.addEventListener('pointermove', onMove);
        dock.addEventListener('pointerleave', onLeave);
        return () => {
            dock.removeEventListener('pointermove', onMove);
            dock.removeEventListener('pointerleave', onLeave);
        };
    }, [reduceMotion, dockRef, scale]);

    return (
        <a
            href={`#${id}`}
            ref={itemRef}
            className={`cl-dock__item${isActive ? ' is-active' : ''}`}
            aria-label={label}
            aria-current={isActive ? 'true' : undefined}
        >
            <motion.span
                className="cl-dock__bubble"
                style={reduceMotion ? undefined : { scale: spring }}
            >
                <Icon size={20} weight="bold" />
            </motion.span>
        </a>
    );
}

export default function ClDock() {
    const [active, setActive] = useState('top');
    const dockRef = useRef(null);
    const reduceMotion = useReducedMotionPref();
    const { secondsLeft, isDefault, themeName, reset } = useLabStatus();

    useEffect(() => {
        const nodes = ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean);
        if (nodes.length === 0) return undefined;
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible) setActive(visible.target.id);
            },
            { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
        );
        nodes.forEach((n) => io.observe(n));
        return () => io.disconnect();
    }, []);

    return (
        <nav className="cl-dock" aria-label="Page sections" ref={dockRef}>
            <div className="cl-dock__bar">
                {ITEMS.map((item) => (
                    <DockItem
                        key={item.id}
                        {...item}
                        isActive={active === item.id}
                        reduceMotion={reduceMotion}
                        dockRef={dockRef}
                    />
                ))}
            </div>

            {!isDefault && (
                <button
                    type="button"
                    className="cl-dock__lab"
                    onClick={reset}
                    aria-label={`Previewing ${themeName}. Reset now.`}
                >
                    <ArrowClockwise size={14} weight="bold" />
                    {secondsLeft}s
                </button>
            )}
        </nav>
    );
}
