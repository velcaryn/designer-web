'use client';

/**
 * Asymmetric split hero.
 *
 * The right-hand asset is a 3D scene of one layout reflowing across desktop,
 * tablet and phone, including the phone turning to landscape. It replaced a
 * screenshot of a client's home page, which was the wrong thing to put in the
 * most valuable space on the site: it showed someone else's design and said
 * nothing about ours. The client work now appears in the case study section,
 * where there is room to say what we actually did to it.
 *
 * Three text elements: headline, subtext, actions. The parent-company line
 * that used to sit above the headline is gone. It was doing no work at the
 * top of the page, where a first-time visitor has not yet learned who we are
 * and so cannot care whose unit we are. The footer states it properly.
 */
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ArrowDown } from '@phosphor-icons/react/ssr';
import HeroDevices from './HeroDevices';

/* One curve, one stagger, shared by the four elements so they arrive as a
   single gesture rather than four independent fades. */
const rise = {
    hidden: { opacity: 0, y: 26 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] },
    }),
};

export default function Hero() {
    const reduce = useReducedMotion();
    /* `animate` is always present. Only `initial` is conditional: dropping
       both under reduced motion leaves behind the inline opacity:0 that the
       server render already applied, and the hero copy never appears. */
    const anim = (i) => ({
        variants: rise,
        custom: i,
        initial: reduce ? false : 'hidden',
        animate: 'show',
    });

    return (
        <section className="nv-hero" id="top">
            <div className="nv-shell nv-hero__grid">
                <div className="nv-hero__copy">
                    <motion.h1 className="nv-hero__title" {...anim(1)}>
                        Your website should<br />
                        <span className="nv-mark">earn its keep</span>.
                    </motion.h1>

                    <motion.p className="nv-lede nv-hero__lede" {...anim(2)}>
                        We design it, build it, launch it, then run the SEO and social
                        that brings people to it.
                    </motion.p>

                    <motion.div className="nv-hero__actions" {...anim(3)}>
                        <a href="#contact" className="nv-btn nv-btn--primary">
                            Start a project
                            <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
                        </a>
                        <a href="#work" className="nv-btn nv-btn--ghost">
                            See the work
                            <ArrowDown size={18} weight="bold" aria-hidden="true" />
                        </a>
                    </motion.div>
                </div>

                <motion.div
                    className="nv-hero__asset"
                    initial={reduce ? false : { opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <HeroDevices />
                    <p className="nv-hero__caption">
                        <strong>Designed at every width.</strong>
                        <span>Desktop, tablet, phone, portrait and landscape.</span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
