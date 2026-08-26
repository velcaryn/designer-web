'use client';

/**
 * The first screen, round four: a two-column hero rather than one column
 * with a card underneath it.
 *
 * TEXT LEFT, WINDOW RIGHT
 *
 * The copy (headline, lede, actions) sits in the left column, reading
 * order first; a Safari "Mac window" frame sits in the right column
 * showing a small live preview. The business-name setup card that used to
 * live directly under the lede moved out of the hero entirely, into its
 * own section further down the page (ClBusinessSetup is now rendered by
 * ClGrowth's opening, not here) so the first screen reads as a single
 * confident statement rather than a statement plus a form.
 *
 * THE WINDOW'S COLOUR CYCLES EVERY 3 SECONDS. NOTHING ELSE DOES.
 *
 * Only the small preview UI inside the window cycles through the site's
 * five lab palettes (config/themes.js) every three seconds. The live page
 * itself does not repaint: that is what the manual colour lab further down
 * the page is for, on its own 10-second countdown, and running two
 * different auto-cycling colour systems on the same page at two different
 * speeds would fight each other and read as broken rather than lively. The
 * window's cycle is local state inside ClHeroWindow, entirely independent
 * of LabContext.
 *
 * THE REDUCED-MOTION BRANCH IS NOT SYMMETRIC AND THAT IS DELIBERATE
 *
 * Under reduced motion we drop `initial` and keep `animate`. Dropping both
 * looks correct and is the bug: `useReducedMotion` is false during the
 * server render, so the server emits `style="opacity:0"` into the HTML, and
 * if the client then renders a static element nothing ever clears it. The
 * section stays invisible forever. Keeping `animate` guarantees something
 * writes `opacity: 1` on the client no matter which branch runs. The
 * window's own colour cycle is switched off separately, in
 * ClHeroWindow itself, under the same preference.
 */
import { motion, useReducedMotion } from 'motion/react';
import { Check } from '@phosphor-icons/react/ssr';
import ClHeroWindow from './ClHeroWindow';
import { WaveGridBackground } from '@/registry/vengenceui/wave-grid-background';

const rise = {
    hidden: { opacity: 0, y: 26 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] },
    }),
};

const PROOF = [
    'You own the site and the code',
    'Built for the phone first',
    'One place for orders and customers',
];

export default function ClHero() {
    const reduce = useReducedMotion();

    return (
        <section className="cl-hero" id="top">
            {/* The vendored Three.js wave grid. It paints its own opaque
                scene background rather than compositing over the page, so
                the colours are handed the site's own paper and accent
                (as literals: this is a WebGL clear colour and a shader
                uniform, neither of which can read a CSS custom property)
                and the whole canvas is masked and dimmed in CSS so the
                hero's display type stays the brightest thing on screen. */}
            <div className="cl-hero__bg" aria-hidden="true">
                <WaveGridBackground
                    reduceMotion={!!reduce}
                    gridSize={34}
                    colorBase="#faf8f7"
                    colorHigh="#0066cc"
                    waveAmplitude={0.35}
                />
            </div>

            <div className="nv-shell cl-hero__split">
                <div className="cl-hero__copy">
                    <motion.h1
                        className="cl-hero__title"
                        initial={reduce ? false : 'hidden'}
                        animate="show"
                        variants={rise}
                        custom={0}
                    >
                        <span className="cl-hero__line">Grow your brand.</span>
                        <span className="cl-hero__line">
                            Grow your <span className="cl-aurora">business</span>.
                        </span>
                    </motion.h1>

                    <motion.p
                        className="nv-lede cl-hero__lede"
                        initial={reduce ? false : 'hidden'}
                        animate="show"
                        variants={rise}
                        custom={1}
                    >
                        We build the website, get you found, and give you one
                        place to run the orders, the customers and the money.
                    </motion.p>

                    <motion.div
                        className="cl-actions"
                        initial={reduce ? false : 'hidden'}
                        animate="show"
                        variants={rise}
                        custom={2}
                    >
                        <a href="#talk" className="nv-btn nv-btn--primary">
                            Talk to us
                        </a>
                    </motion.div>

                    <motion.ul
                        className="cl-hero__proof"
                        initial={reduce ? false : 'hidden'}
                        animate="show"
                        variants={rise}
                        custom={3}
                    >
                        {PROOF.map((item) => (
                            <li key={item} className="cl-chip">
                                <Check size={16} weight="bold" />
                                {item}
                            </li>
                        ))}
                    </motion.ul>
                </div>

                <motion.div
                    className="cl-hero__window"
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                    <ClHeroWindow />
                </motion.div>
            </div>
        </section>
    );
}
