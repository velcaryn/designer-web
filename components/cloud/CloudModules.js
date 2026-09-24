/**
 * The real module list.
 *
 * This is the substance of the migration. The groupings below are the
 * product's own: they follow the sidebar of the running application rather
 * than a marketing invention, so a visitor who signs up finds the software
 * arranged the way this page said it would be. Nothing here is aspirational,
 * and nothing is a module that does not exist.
 *
 * WHAT CHANGED IN THE MOVE
 *
 * The source page was written for hospital procurement officers and sold
 * eight of these modules in that language: "multi-warehouse stock ledger
 * with batch tracking", "audit-ready trial balance". The capability is
 * identical; the words are not. A person running a shop needs to be told
 * "what is on the shelf, in both places, and what to reorder", and will
 * never search for a trial balance.
 *
 * The source page also had a headline claiming ten modules above a grid of
 * six. Eight are listed here and eight are rendered.
 *
 * ROUND TWO: A HIGHLIGHT GRID, NOT EIGHT STACKED CARDS
 *
 * Eight cards each listing four items meant thirty-two bullets in a
 * column, which on a phone ran to roughly 2600px of scroll for one
 * section: the reader had to travel a long way to learn something they
 * could have skimmed. The eight parts are now cells in a
 * registry/vengenceui highlight grid, and only the SELECTED part shows
 * its four items, in a panel beneath. Everything that was on the page is
 * still on the page; it is one tap or one hover away instead of all at
 * once.
 *
 * A client component now, because the grid tracks which cell is active.
 * The detail panel is driven by the same index, so keyboard focus moves
 * the highlight and changes the panel together.
 */
'use client';

import {
    Users,
    Receipt,
    Package,
    ShoppingCart,
    Coins,
    IdentificationCard,
    PaintBrush,
    Export,
    Check,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Reveal from '@/components/Reveal';
import { HighlightGrid } from '@/registry/vengenceui/highlight-grid';
import useReducedMotionPref from '@/components/claudelanding/useReducedMotionPref';

const MODULES = [
    {
        Icon: Users,
        name: 'Sales',
        items: [
            'Every enquiry in one pipeline, with an owner and a follow-up date',
            'Quotes that turn into orders without retyping anything',
            'A customer list with what each one has bought before',
            'Tasks, notes and a timeline of every call and message',
        ],
    },
    {
        Icon: Receipt,
        name: 'Billing',
        items: [
            'GST invoices and quotes, numbered in sequence, on your letterhead',
            'Repeat invoices that raise themselves on a schedule',
            'Credit and debit notes against an invoice already issued',
            'A link you can send so a customer sees the bill without an app',
        ],
    },
    {
        Icon: Package,
        name: 'Stock',
        items: [
            'Items and their codes, prices and units, in one list',
            'Balances across the shop and the godown, separately',
            'Every movement recorded, so a shortfall has a trail',
            'A reorder level per item, and an alert when you cross it',
        ],
    },
    {
        Icon: ShoppingCart,
        name: 'Buying',
        items: [
            'Purchase orders from draft through to paid',
            'A vendor list with terms, GSTIN and what you owe each one',
            'Goods receipt against the order, so short deliveries show up',
            'Bulk import from a spreadsheet you already keep',
        ],
    },
    {
        Icon: Coins,
        name: 'Money',
        items: [
            'Proper double-entry accounts, kept without you thinking about it',
            'Chart of accounts, vouchers, daybook and ledger statements',
            'Expenses with an approval step before anything is paid',
            'Tax rates per item code and a GST filing summary at quarter end',
        ],
    },
    {
        Icon: IdentificationCard,
        name: 'People',
        items: [
            'Employee records and departments',
            'Attendance marked daily',
            'Leave requests and approvals',
            'A monthly payroll run with deductions worked out',
        ],
    },
    {
        Icon: PaintBrush,
        name: 'Your brand on it',
        items: [
            'A template designer for invoices and quotes',
            'Your logo, your colours, your footer',
            'Control over the letterhead and what prints where',
            'Documents that look like they came from you, not from software',
        ],
    },
    {
        Icon: Export,
        name: 'Yours to keep',
        items: [
            'Runs against your own instance, not a shared pool',
            'Full export in open formats, whenever you ask',
            'No lock-in clause and no export fee',
            'A system you cannot leave is not a system, it is a hostage',
        ],
    },
];

/* The grid's row shape is structural, not styling: it is passed as data,
   so a media query cannot change it. This watches the same breakpoint the
   stylesheet uses. Starts false so the server and client first render
   agree, then corrects on mount. */
function useNarrow() {
    const [narrow, setNarrow] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 599px)');
        const sync = () => setNarrow(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    return narrow;
}

/* How long each part stays selected before the next one takes over. */
const ADVANCE_MS = 5000;

/* The highlight's colours: the component's own eight hues, deepened until
   the white label on each clears 4.5:1 (4.9 to 7.3). The stock set ran from
   2.2 to 4.0, so the selected label was hard to read on half of them. */
const HIGHLIGHT_COLORS = [
    '#C2410C', '#2F5F99', '#B45309', '#047857',
    '#3F6B3E', '#1D4ED8', '#4B5563', '#0F766E',
];

export default function CloudModules() {
    const [active, setActive] = useState(0);
    /* Bumped on every deliberate choice, so choosing the part that is
       already selected still restarts its five seconds. */
    const [cycle, setCycle] = useState(0);
    /* True when the visitor chose the part, so a screen reader announces
       it; the automatic advance every five seconds stays silent. */
    const [userChose, setUserChose] = useState(false);
    const [inView, setInView] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [keyboardFocus, setKeyboardFocus] = useState(false);
    const [tabHidden, setTabHidden] = useState(false);
    const reduceMotion = useReducedMotionPref();
    const rootRef = useRef(null);

    /*
     * AUTOMATIC ADVANCE, every five seconds: Sales, Billing, Stock and on
     * round. It runs only while the block is on screen and the tab is
     * visible, pauses while a mouse is over it or keyboard focus is inside
     * it (content that moves by itself must be stoppable), and never runs
     * under reduced motion. A tap on a phone is NOT a pause: it selects
     * that part and the five seconds start again from there.
     */
    const running = inView && !hovered && !keyboardFocus && !tabHidden && !reduceMotion;

    useEffect(() => {
        if (!running) return undefined;
        const t = setTimeout(() => {
            setUserChose(false);
            setActive((i) => (i + 1) % MODULES.length);
        }, ADVANCE_MS);
        return () => clearTimeout(t);
    }, [running, active, cycle]);

    useEffect(() => {
        const el = rootRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        const sync = () => setTabHidden(document.hidden);
        document.addEventListener('visibilitychange', sync);
        return () => document.removeEventListener('visibilitychange', sync);
    }, []);

    const choose = useCallback((i) => {
        setUserChose(true);
        setActive(i);
        setCycle((n) => n + 1);
    }, []);

    /* The grid takes rows, not a flat list, so the shape is stated here
       rather than left to a wrapping algorithm. Two rows of four on a
       wide screen; four rows of two on a phone, where four cells across
       leaves about 80px each and truncates every label. */
    const narrow = useNarrow();
    const perRow = narrow ? 2 : 4;
    const rows = [];
    for (let i = 0; i < MODULES.length; i += perRow) {
        rows.push(MODULES.slice(i, i + perRow));
    }

    return (
        <section id="modules" className="nv-section nv-ground--warm">
            <div className="nv-shell">
                <div className="cl-head cl-head--wide">
                    <h2 className="cl-h2">What is actually in it.</h2>
                    <p className="nv-lede">
                        Eight parts, all included. You will not use every one on
                        day one, and nothing is priced separately when you do.
                    </p>
                </div>

                <Reveal className="cld-grid">
                    <div
                        ref={rootRef}
                        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}
                        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovered(false); }}
                        onFocus={(e) => setKeyboardFocus(e.target.matches(':focus-visible'))}
                        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardFocus(false); }}
                    >
                    <HighlightGrid
                        rows={rows.map((row) => row.map((m) => ({
                            label: m.name,
                            Icon: m.Icon,
                            index: MODULES.indexOf(m),
                        })))}
                        highlightFirst
                        reduceMotion={reduceMotion}
                        colors={HIGHLIGHT_COLORS}
                        activeIndex={active}
                        onActiveChange={choose}
                        renderCell={(cell, isActive) => (
                            <button
                                type="button"
                                className={`cld-grid__cell${isActive ? ' is-active' : ''}`}
                                aria-pressed={isActive}
                                onClick={() => choose(cell.index)}
                            >
                                <cell.Icon size={20} weight="bold" />
                                <span className="cld-grid__label">{cell.label}</span>
                            </button>
                        )}
                    />

                    {/* A thin bar across the top of the panel that fills over the
                        five seconds, so it is plain the block moves on by itself.
                        Keyed on the selection, so it restarts with every change,
                        and absent whenever the advance is paused. */}
                    <div className="cld-grid__timer" aria-hidden="true">
                        {running && <span key={`${active}-${cycle}`} className="cld-grid__timerFill" />}
                    </div>

                    {/* Every part's detail is rendered, stacked in one grid cell,
                        and only the selected one is visible. The block is always
                        as tall as the longest list, so the page below does not
                        jump every five seconds while someone is reading it. */}
                    <div className="cld-grid__panels" aria-live={userChose ? 'polite' : 'off'}>
                        {MODULES.map((m, i) => (
                            <div
                                key={m.name}
                                className={`cld-grid__panel${i === active ? ' is-on' : ''}`}
                                aria-hidden={i !== active}
                            >
                                <h3 className="cld-grid__panelName">
                                    <m.Icon size={18} weight="bold" />
                                    {m.name}
                                </h3>
                                <ul className="cld-grid__items">
                                    {m.items.map((item) => (
                                        <li key={item} className="cld-grid__item">
                                            <Check size={15} weight="bold" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
