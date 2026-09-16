'use client';

/**
 * The first screen. The live homepage's hero (ClHero.js) with new copy,
 * the aurora word, and a typed line in place of the four chips.
 *
 * WHAT IS KEPT: the wave-grid background and the morphing device frame,
 * unchanged, and every piece of ClHero's motion including the asymmetric
 * reduced-motion branch. Read that file's header before touching
 * `initial` / `animate`: dropping both ships an invisible section.
 *
 * THE PROOF LINE TYPES ITSELF. The four pointers used to be four pill
 * chips, which on a phone was a block of four bordered boxes under two
 * bordered buttons. They are now one line that types each pointer,
 * pauses, deletes it and types the next (React Bits TextType, vendored
 * in registry/reactbits). The four strings are visible in the markup for
 * a screen reader as a plain list, since a line that rewrites itself is
 * not something to read out. Under reduced motion the first pointer
 * shows complete and still.
 *
 * "Small Businesses." is magicui's AuroraText, fed the site's own tokens.
 * Headings on this page are in Title Case at the owner's request.
 */
import { motion, useReducedMotion } from 'motion/react';
import { Check } from '@phosphor-icons/react/ssr';
import ClHeroWindow from '@/components/claudelanding/ClHeroWindow';
import { WaveGridBackground } from '@/registry/vengenceui/wave-grid-background';
import { AuroraText } from '@/registry/magicui/aurora-text';
import TextType from '@/registry/reactbits/TextType';
import { SparklesText } from '@/registry/magicui/sparkles-text';
import { waLink } from '@/config/site';
import { track } from '@/lib/analytics';

const rise = {
    hidden: { opacity: 0, y: 26 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] },
    }),
};

const PROOF = [
    '100% Code and Domain Ownership',
    'Live in 5-7 Days',
    'Built for the Phone First',
    'Gain Customer Trust and Google Visibility',
];

export default function Nl4Hero() {
    const reduce = useReducedMotion();
    const waHref = waLink('Hello. I would like to talk about a website for my business.');

    return (
        <section className="cl-hero" id="top">
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
                        <span className="cl-hero__line">We Build Websites For</span>
                        <span className="cl-hero__line">
                            <AuroraText>Small Businesses</AuroraText>.
                        </span>
                    </motion.h1>

                    <motion.p
                        className="nv-lede cl-hero__lede nv4-hero__lede"
                        initial={reduce ? false : 'hidden'}
                        animate="show"
                        variants={rise}
                        custom={1}
                    >
                        We design and build <strong>Websites</strong>, display your
                        {' '}
                        <strong>Products and Services</strong>, set up direct
                        {' '}
                        <strong>UPI and Card Payments</strong>, rank your business on
                        {' '}
                        <strong>Google Search</strong>, and set you up for
                        {' '}
                        <strong>Growth and Business Development</strong>.
                    </motion.p>

                    <motion.div
                        className="cl-actions"
                        initial={reduce ? false : 'hidden'}
                        animate="show"
                        variants={rise}
                        custom={2}
                    >
                        <a
                            href={waHref}
                            target="_blank"
                            rel="noreferrer"
                            className="nv-btn nv-btn--primary"
                            onClick={() => track('whatsapp_clicked', { source: 'hero' })}
                        >
                            Talk to us
                        </a>
                        {/* Not a pill: the second action is a sparkling text
                            link, so the two fit one line on a phone and the
                            primary button stays the only button. */}
                        <a href="#examples" className="nv4-hero__demo">
                            <SparklesText as="span" sparklesCount={6}>Explore live demo</SparklesText>
                        </a>
                    </motion.div>

                    <motion.div
                        className="nv4-hero__type"
                        initial={reduce ? false : 'hidden'}
                        animate="show"
                        variants={rise}
                        custom={3}
                    >
                        <span className="nv4-hero__typeMark" aria-hidden="true">
                            <Check size={16} weight="bold" />
                        </span>
                        <TextType
                            as="span"
                            className="nv4-hero__typeText"
                            text={PROOF}
                            typingSpeed={42}
                            deletingSpeed={22}
                            pauseDuration={1700}
                            cursorCharacter="|"
                            aria-hidden="true"
                        />
                        <ul className="sr-only">
                            {PROOF.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </motion.div>
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
