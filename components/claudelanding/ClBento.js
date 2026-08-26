'use client';

/**
 * What we actually do, as six cells rather than six paragraphs.
 *
 * Each cell ends with a small live figure instead of a static icon. That is
 * the brief in miniature: simple text, rich motion. All six figures are CSS
 * keyframes on transform and opacity, so they cost nothing per frame and are
 * switched off wholesale by the reduced-motion block in
 * app/claudelanding.css.
 *
 * Only the last cell is a link, and only the last cell lifts on hover. A
 * card that moves under the pointer and then does nothing when clicked is a
 * worse lie than a card that sits still.
 */
import Link from 'next/link';
import { ArrowRight, Key } from '@phosphor-icons/react';
import Reveal from '@/components/Reveal';

/* ── The six figures ──────────────────────────────────────────────────── */

function Bars() {
    return (
        <div className="cl-fig__bars" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
                <span
                    key={i}
                    className="cl-fig__bar"
                    style={{ '--cl-delay': `${i * 0.18}s` }}
                />
            ))}
        </div>
    );
}

function Radar() {
    return (
        <div className="cl-fig__radar" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="cl-fig__ring"
                    style={{ '--cl-delay': `${i}s` }}
                />
            ))}
            <span className="cl-fig__dot" />
        </div>
    );
}

function Posts() {
    return (
        <div className="cl-fig__stack" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="cl-fig__post"
                    style={{ top: '23px', '--cl-delay': `${i * 1.33}s` }}
                />
            ))}
        </div>
    );
}

/* Three device outlines that actually resize between a desktop, a tablet
   and a phone proportion, on a loop. The old version only bobbed each box
   up and down at a fixed size, which illustrated nothing: the claim is
   "the layout reshapes itself", so the figure now has to reshape rather
   than just move. Each `<span>` cycles its own width and height on the
   `cl-reshape` keyframe (declared per-variant in CSS, since the three
   shapes are different enough that one shared keyframe with three
   `animation-delay`s, the old approach, cannot express three different
   target sizes). */
function Widths() {
    return (
        <div className="cl-fig__widths" aria-hidden="true">
            <span className="cl-fig__screen cl-fig__screen--a" />
            <span className="cl-fig__screen cl-fig__screen--b" />
            <span className="cl-fig__screen cl-fig__screen--c" />
        </div>
    );
}

function Own() {
    return (
        <div className="cl-fig__own" aria-hidden="true">
            <Key size={30} weight="bold" />
            <span className="cl-fig__ownText">100%</span>
        </div>
    );
}

/* ── The cells ────────────────────────────────────────────────────────── */

const CELLS = [
    {
        title: 'Design and build',
        body: 'A site made for your business, not a template with your logo dropped in the corner.',
        figure: <Bars />,
    },
    {
        title: 'Get found',
        body: 'Search, maps and the listings that matter locally, set up properly and kept current.',
        figure: <Radar />,
    },
    {
        title: 'Content and social',
        body: 'The words on the site and the posts that point back to it, written and scheduled.',
        figure: <Posts />,
    },
    {
        title: 'Works on any phone',
        body: 'Designed at the narrowest width first, so it holds up on the device your customers actually hold.',
        figure: <Widths />,
    },
    {
        title: 'You own all of it',
        body: 'The domain, the code, the content and the accounts are in your name. 100% control lies with you.',
        figure: <Own />,
    },
];

export default function ClBento() {
    return (
        <section id="what" className="nv-section nv-ground--warm">
            <div className="nv-shell">
                <div className="cl-head cl-head--wide">
                    <h2 className="cl-h2">
                        Everything it takes, in one place.
                    </h2>
                    <p className="nv-lede">
                        You talk to one team. Nobody gets handed off, and
                        nothing falls between two suppliers.
                    </p>
                </div>

                <div className="cl-bento">
                    {CELLS.map((cell, i) => (
                        <Reveal
                            key={cell.title}
                            className="cl-bento__cell"
                            delay={i * 0.04}
                        >
                            <h3 className="cl-bento__title">{cell.title}</h3>
                            <p className="cl-bento__body">{cell.body}</p>
                            <div className="cl-bento__figure">
                                {cell.figure}
                            </div>
                        </Reveal>
                    ))}

                    <Reveal delay={CELLS.length * 0.04}>
                        <Link href="/cloud" className="cl-bento__cell">
                            <h3 className="cl-bento__title">
                                One place for the back office
                            </h3>
                            <p className="cl-bento__body">
                                Orders, customers, stock, staff and the money,
                                in a single system instead of a notebook and
                                three apps that disagree.
                            </p>
                            <span className="cl-bento__more">
                                See VelBiz Cloud
                                <ArrowRight size={16} weight="bold" />
                            </span>
                        </Link>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
