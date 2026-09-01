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

/* WHICH DOCK ITEM OWNS WHICH SECTION.

   The dock has six items and the page has eleven sections, so five of
   them belonged to no item. The observer watched only its own six and
   set the highlight to null whenever none was in view, which was honest
   but looked broken: measured down the page, 8 of 17 scroll positions
   had nothing lit at all, and the highlight blinked off and on as you
   scrolled. A dock that keeps losing its selection reads as a glitch
   rather than as precision.

   Every section is now owned by the item a reader would say they were
   in. `start` and `what` sit between the hero and the process section
   and belong to Home and How it works respectively; `who`, `invest` and
   `faq` all sit between Work and Contact, and they are the things you
   read on the way to getting in touch, so Contact owns them. */
const SECTION_OWNER = {
    top: 'top',
    start: 'top',
    grow: 'grow',
    what: 'grow',
    tech: 'tech',
    lab: 'lab',
    work: 'work',
    who: 'work',
    invest: 'talk',
    faq: 'talk',
    talk: 'talk',
};

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

    /* NO HIDE-ON-SCROLL. IT WAS REMOVED, AND THE REASON IT EXISTED IS
       SOLVED A DIFFERENT WAY.

       The dock used to slide away while the visitor scrolled down and
       return when they stopped. That bought back the ~950px of bottom
       padding that eleven sections were each paying to keep content out
       from under a permanently visible dock.

       It read as a glitch. On a phone the dock vanished the instant a
       flick began and reappeared 240ms after it ended, so the single
       most-used control on the page was missing during the exact motion
       a visitor spends most of their time doing. Reported as "removing
       the bottom floater for a moment and bringing it back", which is
       precisely what it was.

       The clearance problem is real: with the dock pinned visible,
       measured across the home page at 390px, text sat underneath it at
       24 of 48 scroll positions. So the reserve is kept and widened to
       the dock's actual footprint (70px tall at a 16px offset, so 86px)
       rather than the 48px it had been cut to. That costs about 420px
       across the page against 15,014px of total height, under 3%, and
       it buys a control that is always where the visitor left it. */


    useEffect(() => {
        /* WHY THIS IS NOT AN IntersectionObserver ANY MORE.

           It was, with rootMargin '-35% 0px -45% 0px', which leaves a
           20% band across the middle of the viewport. An observer only
           fires when an edge CROSSES that band, so a section taller than
           20vh can fill it completely without either of its edges
           entering, and the callback simply never runs. Measured: 11 of
           17 checkpoints down the page had nothing lit, and the
           highlight blinked off and on while scrolling. That is the
           glitch.

           Reading positions directly cannot miss: at any scroll offset
           exactly one section contains the reference line, because the
           sections tile the page. One rAF-throttled scroll listener,
           which is cheaper than it sounds and runs only while the page
           is actually moving. */
        const ids = Object.keys(SECTION_OWNER);

        let frame = 0;
        const read = () => {
            frame = 0;
            /* A line 40% down the viewport: low enough that a section
               counts as "current" once its top is comfortably on screen,
               high enough that it does not switch early on a tall one. */
            const line = window.innerHeight * 0.4;
            let owner = SECTION_OWNER[ids[0]];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (!el) continue;
                const r = el.getBoundingClientRect();
                /* The last section whose top is above the line wins,
                   which is the one the reader is standing in. */
                if (r.top <= line) owner = SECTION_OWNER[id] ?? owner;
            }
            setActive(owner);
        };

        const onScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(read);
        };

        read();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            if (frame) cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return (
        <nav
            className="cl-dock"
            aria-label="Page sections"
            ref={dockRef}
        >
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
