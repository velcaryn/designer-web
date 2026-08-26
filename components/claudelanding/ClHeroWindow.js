'use client';

/**
 * The device mock in the hero: one frame that smoothly morphs through
 * three shapes, phone, tablet, desktop, while the storefront inside
 * cycles through a different sector's theme, font pairing and copy on
 * every step.
 *
 * WHY THIS DOES NOT TOUCH THE LIVE PAGE
 *
 * `ClLab`, further down the page, repaints the ENTIRE site by writing
 * `--t-*` custom properties onto `.nv-root`, on a manual pick with a
 * 10-second auto-revert. This component does not call that machinery at
 * all: the colours and font here are applied as plain inline styles scoped
 * to the small mock UI inside the frame, on their own interval. Two
 * different auto-cycling systems running on the same page at two
 * different speeds, one repainting everything and one repainting a
 * phone-sized mock, would read as the page fighting itself rather than as
 * two intentional demonstrations.
 *
 * ROUND TWO: ONE FRAME THAT MORPHS, NOT TWO FRAMES THAT SWAP
 *
 * The previous version unmounted the whole subtree and mounted a
 * different one (Iphone-shaped vs Mac-window-shaped), which is a hard cut
 * with no animatable path between an aspect-ratio-9/19 box and one that is
 * 16/9. This version keeps a single `motion.div` outer frame alive for the
 * whole cycle and animates its `width` and `aspectRatio` between three
 * device presets with a spring, which is what makes the resize itself the
 * animation rather than a chrome swap plus a fade. The chrome around the
 * screen (traffic lights vs a plain tablet bar vs a phone notch) still has
 * to change per step, since a notch and a URL bar are not the same
 * element; those cross-fade in place with `AnimatePresence` while the
 * outer frame is mid-morph, which reads as one continuous transformation
 * rather than three separate effects layered on top of each other.
 *
 * WHAT CYCLES, AND HOW OFTEN
 *
 * Every CYCLE_MS the mock advances one step: the device preset, the
 * sector (kicker, headline, CTA copy) and the theme and font pairing all
 * change together, reading off the same `step` counter so one interval
 * drives every change in sync rather than independent timers drifting
 * apart. Content and theme are seeded from the same SECTORS and
 * THEMES/FONTS lists the rest of the page already uses, imported rather
 * than duplicated.
 *
 * REDUCED MOTION STOPS THE CYCLE ON THE FIRST STEP
 *
 * A device, a theme and a headline that all change under someone every
 * few seconds without their input is exactly the category of motion
 * `prefers-reduced-motion` exists to suppress. Under that preference the
 * frame renders its first preset with no interval running and no motion
 * transition (`transition={{ duration: 0 }}`), rather than relying on the
 * CSS blanket rule alone: `layout`-driven motion values are computed by
 * Framer itself and can bypass a CSS transition-duration override.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowClockwise, CaretLeft, CaretRight, Share, WifiHigh, BatteryFull, Circle } from '@phosphor-icons/react';
import { THEMES, FONTS } from '@/config/themes';
import { SECTORS } from './sectors';
import useReducedMotionPref from './useReducedMotionPref';

const CYCLE_MS = 3800;

const MOCK_SECTORS = SECTORS.filter((s) => s.common);

/* Three device presets the frame morphs between. `frameWidth` is a CSS
   value (not a number) because it has to differ by viewport, handled in
   claudelanding.css via a custom property the frame reads; the aspect
   ratio is what actually drives the frame's shape and is set inline since
   it is the one thing motion needs to animate. */
const DEVICES = [
    { id: 'mobile', ratio: 9 / 19, chrome: 'phone' },
    { id: 'tablet', ratio: 4 / 3, chrome: 'tablet' },
    { id: 'desktop', ratio: 16 / 9, chrome: 'desktop' },
];

export default function ClHeroWindow() {
    const [step, setStep] = useState(0);
    const reduceMotion = useReducedMotionPref();

    useEffect(() => {
        if (reduceMotion) return undefined;
        const id = window.setInterval(() => {
            setStep((s) => s + 1);
        }, CYCLE_MS);
        return () => window.clearInterval(id);
    }, [reduceMotion]);

    const device = DEVICES[step % DEVICES.length];
    const theme = THEMES[step % THEMES.length].tokens;
    const font = FONTS[step % FONTS.length];
    const sector = MOCK_SECTORS[step % MOCK_SECTORS.length];

    const screenStyle = {
        '--mw-ink': theme.ink,
        '--mw-paper': theme.paper,
        '--mw-accent': theme.accent,
        '--mw-support': theme.support,
        '--mw-soft': theme.soft,
        '--mw-on-accent': theme.onAccent,
        '--mw-font': font.display,
    };

    return (
        <div className="cl-heroDevice" aria-hidden="true">
            <motion.div
                className={`cl-heroFrame cl-heroFrame--${device.chrome}`}
                animate={{ aspectRatio: device.ratio }}
                transition={
                    reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 120, damping: 20, mass: 1 }
                }
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={device.chrome}
                        className="cl-heroFrame__chrome"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {device.chrome === 'desktop' && <DesktopBar />}
                        {device.chrome === 'tablet' && <TabletBar />}
                        {device.chrome === 'phone' && <PhoneChrome />}
                    </motion.div>
                </AnimatePresence>

                <StoreScreen
                    sector={sector}
                    style={screenStyle}
                    compact={device.chrome !== 'desktop'}
                />
            </motion.div>
        </div>
    );
}

function DesktopBar() {
    return (
        <div className="cl-macwin__bar">
            <div className="cl-macwin__lights">
                <span className="cl-macwin__light cl-macwin__light--red" />
                <span className="cl-macwin__light cl-macwin__light--amber" />
                <span className="cl-macwin__light cl-macwin__light--green" />
            </div>
            <div className="cl-macwin__nav">
                <CaretLeft size={13} weight="bold" />
                <CaretRight size={13} weight="bold" />
            </div>
            <div className="cl-macwin__url">
                <Lock size={11} weight="bold" />
                <span>yourbusiness.com</span>
                <ArrowClockwise size={11} weight="bold" className="cl-macwin__reload" />
            </div>
            <Share size={13} weight="bold" className="cl-macwin__share" />
        </div>
    );
}

function TabletBar() {
    return (
        <div className="cl-macwin__bar cl-macwin__bar--tablet">
            <Circle size={9} weight="fill" className="cl-macwin__tabletDot" />
            <div className="cl-macwin__url">
                <Lock size={11} weight="bold" />
                <span>yourbusiness.com</span>
            </div>
        </div>
    );
}

function PhoneChrome() {
    return (
        <>
            <div className="cl-heroPhone__notch" />
            <div className="cl-heroPhone__status">
                <span>9:41</span>
                <span className="cl-heroPhone__statusIcons">
                    <WifiHigh size={12} weight="bold" />
                    <BatteryFull size={14} weight="bold" />
                </span>
            </div>
        </>
    );
}

function StoreScreen({ sector, style, compact }) {
    return (
        <div
            className={`cl-macwin__screen${compact ? ' cl-macwin__screen--compact' : ''}`}
            style={{ ...style, fontFamily: 'var(--mw-font)' }}
        >
            <div className="cl-macwin__nav2">
                <span className="cl-macwin__brandDot" />
                <span className="cl-macwin__navLinks">
                    <span>Home</span>
                    <span>Shop</span>
                    <span>Contact</span>
                </span>
            </div>

            <div className="cl-macwin__heroBlock">
                <span className="cl-macwin__kicker">{sector.kicker}</span>
                <span className="cl-macwin__heroTitle">{sector.headline}</span>
                <span className="cl-macwin__cta">{sector.cta}</span>
            </div>

            <div className="cl-macwin__cards">
                <span className="cl-macwin__card" />
                <span className="cl-macwin__card" />
                <span className="cl-macwin__card" />
            </div>
        </div>
    );
}
