'use client';

/**
 * The bottom dock: four sections, one control, small on a phone.
 *
 * WHAT CHANGED AND WHY
 *
 * Five 48px icons in a 6px-padded pill measured 290px wide by 66px tall
 * on a 390px phone: three quarters of the width, permanently over the
 * content. The owner asked for small and sweet. Four items now (the
 * examples are reachable from the header, the hero button and the
 * footer), 40px each on a phone and 48px from 900px up, read through a
 * media-query store so the server and the first client render agree
 * and nothing mismatches at hydration.
 *
 * THE ICONS ARE THE OWNER'S SVGs (public/SVGs/Footer-*.svg), drawn with
 * `fill="currentColor"`. An <img> cannot inherit a colour, so each glyph
 * is a CSS mask over `currentColor`: ink at rest, paper on the active
 * item's blue. Four files, one rule, no inline SVG paths.
 *
 * THE INTERACTION, AS ASKED: a tap shows the label and the whole dock
 * bounces up and settles back, then the page scrolls to the section.
 * The bounce is one motion keyframe on the bar; under reduced motion
 * only the label shows. The desktop mouse magnification from magicui's
 * Dock stays, since a mouse is the one pointer that can hover.
 *
 * `cl-dock` on the nav is still load-bearing: fixed bottom-centre with
 * the safe-area inset and the consent-bar lift, and the reserve under
 * every section. The scroll reader is ClDock.js's.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'motion/react';
import { Dock, DockIcon } from '@/registry/magicui/dock';

const ITEMS = [
    { id: 'top', href: '#top', label: 'Home', icon: '/SVGs/Footer-Home.svg' },
    { id: 'price', href: '#price', label: 'Pricing', icon: '/SVGs/rupee.svg' },
    { id: 'faq', href: '#faq', label: 'FAQ', icon: '/SVGs/Footer-FAQ.svg' },
    { id: 'talk', href: '#talk', label: 'Contact', icon: '/SVGs/Footer-Contact.svg' },
];

const SECTION_OWNER = {
    top: 'top',
    why: 'top',
    metrics: 'price',
    price: 'price',
    content: 'price',
    faq: 'faq',
    talk: 'talk',
    who: 'talk',
    examples: 'talk',
    follow: 'talk',
};

const WIDE = '(min-width: 900px)';
const subscribe = (cb) => {
    const mq = window.matchMedia(WIDE);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
};
const useIsWide = () => useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
);

/**
 * `home` is the page that owns the four sections. On the landing page it
 * is '' and the links are plain fragments; on /cloud and the service
 * pages it is the landing page's path, so "Pricing" from anywhere lands
 * on the landing page's price block. Off the landing page nothing lights
 * up, because none of the four sections is on the page you are reading.
 */
export default function Nl4Dock({ home = '' }) {
    /* Off the landing page nothing is current, and that is decided in the
       initial state rather than set inside the effect (React's
       set-state-in-effect rule, and this file's own CLAUDE.md note). */
    const [active, setActive] = useState(home ? null : 'top');
    const [pressed, setPressed] = useState(null);
    const wide = useIsWide();
    const reduce = useReducedMotion();
    const bounce = useAnimationControls();

    useEffect(() => {
        if (home) return undefined;
        const ids = Object.keys(SECTION_OWNER);
        let frame = 0;
        const read = () => {
            frame = 0;
            const line = window.innerHeight * 0.4;
            let owner = SECTION_OWNER[ids[0]];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (!el) continue;
                if (el.getBoundingClientRect().top <= line) owner = SECTION_OWNER[id] ?? owner;
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
    }, [home]);

    /* The label lingers long enough to be read, then clears. */
    useEffect(() => {
        if (pressed === null) return undefined;
        const t = setTimeout(() => setPressed(null), 900);
        return () => clearTimeout(t);
    }, [pressed]);

    const onTap = (id) => {
        setPressed(id);
        if (!reduce) {
            bounce.start({
                scale: [1, 1.12, 0.98, 1],
                transition: { duration: 0.45, times: [0, 0.35, 0.7, 1], ease: 'easeOut' },
            });
        }
    };

    const size = wide ? 48 : 40;

    return (
        <nav className="cl-dock nv4-dock" aria-label="Page sections">
            <motion.div animate={bounce} style={{ transformOrigin: '50% 100%' }}>
                <Dock
                    className="nv4-dock__bar"
                    iconSize={size}
                    iconMagnification={wide ? 66 : size}
                    iconDistance={110}
                    disableMagnification={!wide}
                >
                    {ITEMS.map(({ id, href, label, icon }) => {
                        const isActive = active === id;
                        return (
                            <DockIcon key={id} className={`nv4-dock__icon${isActive ? ' is-active' : ''}`}>
                                <a
                                    href={home + href}
                                    className={`nv4-dock__item${isActive ? ' is-active' : ''}${pressed === id ? ' is-pressed' : ''}`}
                                    aria-label={label}
                                    aria-current={isActive ? 'true' : undefined}
                                    onClick={() => onTap(id)}
                                >
                                    <span
                                        className="nv4-dock__glyph"
                                        style={{ '--icon': `url("${icon}")` }}
                                        aria-hidden="true"
                                    />
                                    <span className="nv4-dock__label" aria-hidden="true">{label}</span>
                                </a>
                            </DockIcon>
                        );
                    })}
                </Dock>
            </motion.div>
        </nav>
    );
}
