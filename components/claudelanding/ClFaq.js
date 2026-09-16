'use client';

/**
 * The questions people ask before they get in touch.
 *
 * LAYOUT ADAPTED FROM watermelon `faq-3`
 * `npx shadcn add https://registry.watermelon.sh/r/faq-3.json`.
 *
 * The layout is the good idea and it is what was taken: a centred header
 * with an eyebrow above it, then a single column of rows each numbered
 * 01, 02, 03 down the left, a plus that becomes a minus, and the answer
 * indented to align under the question rather than the number.
 *
 * NONE OF ITS CODE IS HERE, AND THAT IS DELIBERATE.
 *
 * The upstream file needs four things this repo does not have: Radix
 * Accordion, react-icons, a shadcn Badge, and shadcn's own theme
 * variables (`bg-muted`, `text-foreground`). Installing Radix to render
 * eight rows of text is a dependency for nothing, and the playbook
 * records that lucide/react-icons were deliberately excluded in favour
 * of Phosphor.
 *
 * Its styling also breaks all four locks at once: `bg-gradient-to-r` on
 * the open state, `shadow-sm` (blurred), a 1px border, and no radius at
 * all. Adapting those away leaves the layout, which is what this is.
 *
 * THE TEXT LIVES IN config/site.js, NOT HERE.
 *
 * StructuredData emits the same array as an FAQPage node. On an earlier
 * build the rendered FAQ and the JSON-LD were typed separately, drifted,
 * and Google was served answers that were no longer on the page. One
 * array, two consumers, no possibility of drift.
 *
 * WHY THIS IS NOT <details> AND NOT AN ACCORDION LIBRARY
 *
 * <details>/<summary> works with no JavaScript, which is genuinely
 * better, but it does not animate open reliably and its marker is
 * awkward to style at this border weight. The pattern is small enough to
 * own: a button carrying aria-expanded, a region with the matching id,
 * one open at a time.
 *
 * One open at a time is deliberate. Ten answers open at once is a wall
 * of text nobody reads, and it makes the page jump under the visitor
 * when they open something near the bottom.
 *
 * TWO COLUMNS ON A WIDE SCREEN, SPLIT IN THE MARKUP
 *
 * Ten questions in one 780px column inside a 1440px shell left most of
 * the width empty and made the section 1196px tall. It is now two
 * halves side by side above 900px, and one column below.
 *
 * The split is two explicit <div>s, NOT CSS `columns`. A multi-column
 * list reflows its items between columns whenever one changes height,
 * so opening question 3 would shunt question 6 from the left column
 * into the right one under the reader's cursor. With two halves, an
 * answer opening on the left can only move things below it on the left.
 *
 * THE `faqs` PROP
 *
 * Added so a per-vertical landing page (app/for/[slug]/page.js) can pass
 * its own three or four trade-specific questions instead of the home
 * page's ten. Defaults to config/site.js's array, so every existing
 * caller is unaffected. The FAQPage JSON-LD for a vertical page is built
 * from the SAME array it is given here, for the reason stated above:
 * one array, two consumers, no drift.
 */
import { useState } from 'react';
import { Plus, Minus } from '@phosphor-icons/react';
import { faqs as siteFaqs } from '@/config/site';
import Reveal from '@/components/Reveal';

export default function ClFaq({
    faqs = siteFaqs,
    /* The heading and lede, overridable per page for the same reason
       `faqs` is: the landing drafts ask the same ten questions under a
       different heading. Defaults are the home page's, so every existing
       caller renders exactly as before. */
    title = 'The questions we get most.',
    lede = 'The cost, who owns what, and whether you need a shop or just a way to be found. If yours is not here, ask us.',
}) {
    const [open, setOpen] = useState(null);

    /* Math.ceil, so an odd count puts the extra question in the LEFT
       column, which is the one a reader scans first. */
    const half = Math.ceil(faqs.length / 2);

    /* One row. Takes its real index so the numbering runs 01 to 10 down
       the left column and then down the right, rather than restarting. */
    const renderItem = (item, i) => {
        const isOpen = open === i;
        /* 01, 02, 03. Padded so the column does not jog when the list
           crosses ten. */
        const num = String(i + 1).padStart(2, '0');

        return (
            <div
                key={item.q}
                className={`cl-faq__item${isOpen ? ' is-open' : ''}`}
            >
                <h3 className="cl-faq__qWrap">
                    <button
                        type="button"
                        className="cl-faq__q"
                        aria-expanded={isOpen}
                        aria-controls={`faq-a-${i}`}
                        id={`faq-q-${i}`}
                        onClick={() => setOpen(isOpen ? null : i)}
                    >
                        {/* aria-hidden: the number is a visual index, and
                            a screen reader announcing "zero one" before
                            every question is noise. The list order is
                            already conveyed. */}
                        <span className="cl-faq__num" aria-hidden="true">
                            {num}
                        </span>

                        <span className="cl-faq__qText">{item.q}</span>

                        <span className="cl-faq__icon" aria-hidden="true">
                            {isOpen
                                ? <Minus size={16} weight="bold" />
                                : <Plus size={16} weight="bold" />}
                        </span>
                    </button>
                </h3>

                {/* Rendered only when open rather than hidden with CSS: an
                    answer that is in the DOM but visually collapsed is
                    still reachable by a screen reader and by find-in-page,
                    which makes the control a lie. */}
                {isOpen && (
                    <div
                        className="cl-faq__a"
                        id={`faq-a-${i}`}
                        role="region"
                        aria-labelledby={`faq-q-${i}`}
                    >
                        <p>{item.a}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <section id="faq" className="nv-section nv-ground--warm">
            <div className="nv-shell">
                <Reveal className="cl-faq__head">
                    <span className="nv-eyebrow">Before you ask</span>
                    <h2 className="cl-h2">{title}</h2>
                    <p className="nv-lede">{lede}</p>
                </Reveal>

                {/* A plain div, not a second Reveal. The list IS the section;
                    wrapped in Reveal it depends on an IntersectionObserver
                    firing, and measured in a headless scroll pass on the
                    v4 draft it did not, leaving ten questions invisible.
                    Reveal's own header states the rule: content is visible
                    by default, animation is what JavaScript opts into. The
                    heading above keeps its Reveal; failing there costs an
                    animation, not the FAQ. */}
                <div className="cl-faq">
                    <div className="cl-faq__col">
                        {faqs.slice(0, half).map((item, i) => renderItem(item, i))}
                    </div>
                    <div className="cl-faq__col">
                        {faqs.slice(half).map((item, i) => renderItem(item, i + half))}
                    </div>
                </div>
            </div>
        </section>
    );
}
