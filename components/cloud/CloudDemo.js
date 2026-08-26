'use client';

/**
 * The product demo: five panels inside a real Safari frame, on a tab strip
 * that advances itself.
 *
 * THE ACCESSIBILITY CONTRACT IS COPIED, NOT REINVENTED
 *
 * This follows components/Triad.js line for line, because that component
 * already worked out what an auto-advancing tablist owes a keyboard and
 * screen-reader user:
 *
 *   - role="tablist" / role="tab" / aria-selected / aria-controls, so the
 *     control announces as a tab strip rather than five loose buttons.
 *   - Arrow keys move between tabs, which is what role="tablist" promises.
 *   - Rotation pauses on hover and on focus, and only unpauses when focus
 *     genuinely leaves the region.
 *   - Rotation stops entirely while the browser tab is hidden.
 *   - Rotation does not exist at all under reduced motion, and keeps
 *     checking: someone can change that setting without reloading.
 *
 * There are also real previous, pause and next buttons. An auto-advancing
 * region with no way to stop it fails WCAG 2.2.2 outright, and "hover to
 * pause" is not a control a keyboard or touch user has.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
import Safari from '@/registry/magicui/safari';
import Reveal from '@/components/Reveal';
import useReducedMotionPref from '@/components/claudelanding/useReducedMotionPref';
import { DEMO } from './panels/demoData';
import {
    BillingPanel,
    CustomersPanel,
    StockPanel,
    StaffPanel,
    MoneyPanel,
} from './panels';

const TABS = [
    { id: 'billing', label: 'Billing', hint: 'Invoices and GST', Panel: BillingPanel },
    { id: 'customers', label: 'Customers', hint: 'Enquiries to orders', Panel: CustomersPanel },
    { id: 'stock', label: 'Stock', hint: 'Shop and godown', Panel: StockPanel },
    { id: 'staff', label: 'Staff', hint: 'Attendance and pay', Panel: StaffPanel },
    { id: 'money', label: 'Money', hint: 'What came in and out', Panel: MoneyPanel },
];

const ROTATE_MS = 7000;

export default function CloudDemo() {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [manualPause, setManualPause] = useState(false);
    const region = useRef(null);

    /* Rotation does not exist at all under reduced motion, and the hook
       keeps watching: someone can change the setting without reloading. */
    const allowRotate = !useReducedMotionPref();

    useEffect(() => {
        const onVisibility = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () =>
            document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    useEffect(() => {
        if (!allowRotate || paused || manualPause) return undefined;
        const id = setInterval(
            () => setIndex((i) => (i + 1) % TABS.length),
            ROTATE_MS,
        );
        return () => clearInterval(id);
    }, [allowRotate, paused, manualPause]);

    const go = useCallback((next) => {
        setIndex((next + TABS.length) % TABS.length);
    }, []);

    const onKeyDown = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            go(index + 1);
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            go(index - 1);
        }
    };

    const active = TABS[index];
    const ActivePanel = active.Panel;

    return (
        <section id="demo" className="nv-section nv-ground--paper">
            <div className="nv-shell">
                <div className="cl-head cl-head--wide">
                    <h2 className="cl-h2">Have a look inside.</h2>
                    <p className="nv-lede">
                        This is {DEMO.business}, a shop we made up so you can
                        poke around. Everything here is one system, so the sale
                        on the first tab is the same sale on the last one.
                    </p>
                </div>

                <div
                    className="cld-demo__layout"
                    ref={region}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocusCapture={() => setPaused(true)}
                    onBlurCapture={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                            setPaused(false);
                        }
                    }}
                >
                    <div>
                        <div
                            className="cld-tabs"
                            role="tablist"
                            aria-label="What VelBiz Cloud does"
                            aria-orientation="vertical"
                            onKeyDown={onKeyDown}
                        >
                            {TABS.map((tab, i) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    id={`cld-tab-${tab.id}`}
                                    aria-selected={i === index}
                                    aria-controls="cld-demo-panel"
                                    /* Only the selected tab is in the tab
                                       order. Arrow keys move within the
                                       strip, which is the tablist contract;
                                       leaving all five focusable makes a
                                       keyboard user press Tab five times to
                                       get past the control. */
                                    tabIndex={i === index ? 0 : -1}
                                    className={`cld-tab${i === index ? ' is-active' : ''}`}
                                    onClick={() => {
                                        go(i);
                                        setManualPause(true);
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="cld-controls">
                            <button
                                type="button"
                                className="cld-control"
                                onClick={() => go(index - 1)}
                                aria-label="Previous"
                            >
                                <CaretLeft size={18} weight="bold" />
                            </button>
                            <button
                                type="button"
                                className="cld-control"
                                onClick={() => setManualPause((p) => !p)}
                                aria-label={
                                    manualPause
                                        ? 'Start cycling through the tabs'
                                        : 'Stop cycling through the tabs'
                                }
                            >
                                {manualPause ? (
                                    <Play size={18} weight="bold" />
                                ) : (
                                    <Pause size={18} weight="bold" />
                                )}
                            </button>
                            <button
                                type="button"
                                className="cld-control"
                                onClick={() => go(index + 1)}
                                aria-label="Next"
                            >
                                <CaretRight size={18} weight="bold" />
                            </button>
                        </div>
                    </div>

                    <Reveal>
                        <Safari url={`${DEMO.domain}/cloud`}>
                            <div
                                id="cld-demo-panel"
                                role="tabpanel"
                                aria-labelledby={`cld-tab-${active.id}`}
                                /* Polite, so a screen reader announces the
                                   new panel after an auto-advance rather
                                   than interrupting whatever is being read.
                                   `key` forces a remount so the entry
                                   animation replays per tab. */
                                aria-live="polite"
                                tabIndex={0}
                                key={active.id}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <ActivePanel />
                            </div>
                        </Safari>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
