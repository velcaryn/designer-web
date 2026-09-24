'use client';

/**
 * The questions, as a conversation that alternates sides.
 *
 * Built to the description of React Bits Pro's faq-2 (paywalled, no key
 * configured) on the house tokens, at the owner's choice.
 *
 * HOW IT READS. Rows alternate: the first question sits on the right
 * with its mascot, the next on the left, and so on down each column, so
 * a column reads as two people talking rather than as a list. Tapping a
 * question opens the reply on the OPPOSITE side, in the accent, with the
 * VB mark. Only the reply is blue.
 *
 * THE REPLY FILLS IN. The bubble fades and rises over a quarter second,
 * and its words appear one after another, twenty milliseconds apart,
 * so the answer reads as being typed rather than as a block that
 * appears. Under reduced motion it simply appears.
 *
 * Kept: the sparkle heading and its illustration, the category chips,
 * five and five at 900px and up, one open at a time, the text from
 * v4Faqs in config/site.js (the SAME array StructuredData receives).
 * Rows are plain elements (Trap A). The question is a real <button>
 * with aria-expanded; the reply is a region labelled by it.
 *
 * EVERY ANSWER IS IN THE HTML. A closed answer is rendered with the
 * `hidden` attribute rather than left out, so the text a crawler or an
 * answer engine reads on the page matches the FAQPage structured data built
 * from the same array. Opening a question swaps it for the typed reply.
 *
 * Reusable: the home page passes nothing and gets v4Faqs with its category
 * chips; /cloud passes its own `items` and no `groups`, and the chips row
 * is left out when there are no groups.
 */
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, Minus } from '@phosphor-icons/react';
import { v4Faqs, v4FaqGroups } from '@/config/site';
import { SparklesText } from '@/registry/magicui/sparkles-text';

const ALL = 'all';

const MASCOTS = [
    'bulldog', 'cactus', 'camel', 'chicken', 'cloud',
    'dachshund', 'elephant', 'friendly-boxy', 'gorilla', 'octopus',
].map((name) => encodeURI(
    `/SVGs/Symbols for FAQs/inkbrush-${name}-${name === 'friendly-boxy' ? 'robot-question' : 'mascot-holding-question'}.svg`,
));

function Reply({ text, id, labelledBy, reduce }) {
    const words = text.split(' ');
    return (
        <motion.div
            className="nv4-faq__a"
            id={id}
            role="region"
            aria-labelledby={labelledBy}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
            <p>
                {words.map((w, k) => (
                    <motion.span
                        key={`${k}-${w}`}
                        className="nv4-faq__word"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.18, delay: reduce ? 0 : 0.12 + k * 0.02 }}
                    >
                        {w}
                        {k < words.length - 1 ? ' ' : ''}
                    </motion.span>
                ))}
            </p>
        </motion.div>
    );
}

const DEFAULT_LEDE = 'The cost, who owns what, and whether you need a shop or just a way to be found. Tap a question and the answer arrives like a reply.';

export default function Nl4Faq({
    items = v4Faqs,
    groups = v4FaqGroups,
    sectionId = 'faq',
    idPrefix = 'v4faq',
    title = 'Questions People Actually Ask.',
    lede = DEFAULT_LEDE,
} = {}) {
    const [open, setOpen] = useState(null);
    const [group, setGroup] = useState(ALL);
    const reduce = useReducedMotion();

    const active = groups.find((g) => g.id === group);
    const shown = items
        .map((item, i) => ({ item, i }))
        .filter(({ i }) => !active || active.questions.includes(i));
    const half = Math.ceil(shown.length / 2);

    /* `pos` is the row's position in its column, so the alternation is
       by what the eye sees, not by the question's index in config. */
    const row = ({ item, i }, pos) => {
        const isOpen = open === i;
        const flip = pos % 2 === 1;
        return (
            <div key={item.q} className={`nv4-faq__item${isOpen ? ' is-open' : ''}${flip ? ' nv4-faq__item--flip' : ''}`}>
                <div className="nv4-faq__turn nv4-faq__turn--you">
                    <button
                        type="button"
                        className="nv4-faq__q"
                        aria-expanded={isOpen}
                        aria-controls={`${idPrefix}-a-${i}`}
                        id={`${idPrefix}-q-${i}`}
                        onClick={() => setOpen(isOpen ? null : i)}
                    >
                        <span className="nv4-faq__qText">{item.q}</span>
                        <span className="nv4-faq__icon" aria-hidden="true">
                            {isOpen ? <Minus size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
                        </span>
                    </button>
                    <span className="nv4-faq__avatar nv4-faq__avatar--you" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={MASCOTS[i % MASCOTS.length]} alt="" width={44} height={44} loading="lazy" />
                    </span>
                </div>

                {!isOpen && (
                    <p id={`${idPrefix}-a-${i}`} hidden>{item.a}</p>
                )}
                {isOpen && (
                    <div className="nv4-faq__turn nv4-faq__turn--us">
                        <span className="nv4-faq__avatar nv4-faq__avatar--us" aria-hidden="true">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/vb-mark-light.svg" alt="" width={22} height={17} />
                        </span>
                        <Reply text={item.a} id={`${idPrefix}-a-${i}`} labelledBy={`${idPrefix}-q-${i}`} reduce={!!reduce} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <section id={sectionId} className="nv-section nv-ground--warm">
            <div className="nv-shell">
                <div className="nv4-faq__head">
                    <div className="nv4-faq__headText">
                        <SparklesText as="h2" className="nv4-h2 nv4-faq__title" sparklesCount={8}>
                            {title}
                        </SparklesText>
                        <p className="nv-lede">{lede}</p>
                    </div>
                    <div className="nv4-faq__figure" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/SVGs/inkbrush-person-answering-question.svg"
                            alt=""
                            width={285}
                            height={285}
                            loading="lazy"
                            className="nv4-faq__img"
                        />
                    </div>
                </div>

                {groups.length > 0 && (
                <div className="nv4-faq__chips" role="group" aria-label="Filter questions">
                    {[{ id: ALL, label: 'All' }, ...groups].map((g) => {
                        const on = g.id === group;
                        return (
                            <button
                                key={g.id}
                                type="button"
                                className={`nv4-chip${on ? ' is-active' : ''}`}
                                aria-pressed={on}
                                onClick={() => { setGroup(g.id); setOpen(null); }}
                            >
                                {g.label}
                            </button>
                        );
                    })}
                </div>
                )}

                <div className="nv4-faq">
                    <div className="nv4-faq__col">{shown.slice(0, half).map(row)}</div>
                    <div className="nv4-faq__col">{shown.slice(half).map(row)}</div>
                </div>
            </div>
        </section>
    );
}
