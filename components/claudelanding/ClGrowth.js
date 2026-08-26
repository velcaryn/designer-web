'use client';

/**
 * The three beats, and the reason the page exists.
 *
 * A brochure site tells a visitor what the studio does. This section shows
 * the visitor their own business doing better, in three steps they already
 * understand: you get a site, people find you, the orders arrive. The
 * business name and type come from BusinessContext, so a person who typed
 * "Sundar Stores" watches Sundar Stores get a storefront, rank in a search
 * result and receive WhatsApp orders.
 *
 * Every device frame is a real vendored component, not a picture of one:
 * Safari, Iphone from registry/magicui, and the Open Peeps crowd canvas from
 * registry/skiper-ui. The crowd bails out entirely under reduced motion on
 * its own; the CSS animations here are switched off by the media query at
 * the bottom of app/claudelanding.css.
 */
import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import Safari from '@/registry/magicui/safari';
import Iphone from '@/registry/magicui/iphone';
import Reveal from '@/components/Reveal';
import { useBusiness, slugify, initials } from './BusinessContext';
import useReducedMotionPref from './useReducedMotionPref';
import ClBusinessSetup from './ClBusinessSetup';

/* ── Beat one ─────────────────────────────────────────────────────────── */

function Storefront() {
    const { displayName, type } = useBusiness();

    return (
        <div className="cl-store">
            <div className="cl-store__bar">
                <span className="cl-store__logo">{displayName}</span>
                <span className="cl-store__nav" aria-hidden="true">
                    <span>Home</span>
                    <span>{type.id === 'services' ? 'Work' : 'Menu'}</span>
                    <span>Contact</span>
                </span>
            </div>

            <div className="cl-store__hero">
                <span className="cl-store__kicker">{type.kicker}</span>
                <p className="cl-store__title">{type.headline}</p>
                <span className="cl-store__cta">{type.cta}</span>
            </div>

            <div className="cl-store__row">
                {type.items.map((item, i) => (
                    <div
                        /* Keyed by type as well as name: without it React
                           reuses the node across a type switch and the entry
                           animation never replays. */
                        key={`${type.id}-${item.name}`}
                        className="cl-store__item"
                        style={{ '--cl-delay': `${0.08 * i}s` }}
                    >
                        <div className="cl-store__swatch" />
                        <div className="cl-store__itemBody">
                            <span className="cl-store__itemName">
                                {item.name}
                            </span>
                            <span className="cl-store__itemPrice">
                                {item.price === '0'
                                    ? 'Free'
                                    : `Rs ${item.price}`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Beat two ─────────────────────────────────────────────────────────── */

function SearchResult() {
    const { displayName, type } = useBusiness();
    const domain = `${slugify(displayName)}.com`;

    return (
        <div className="cl-search">
            <div className="cl-search__bar">
                <MagnifyingGlass size={16} weight="bold" />
                <span className="cl-search__query">{type.query}</span>
            </div>

            <div
                className="cl-search__result cl-search__result--you"
                style={{ '--cl-delay': '0.1s' }}
            >
                <span className="cl-search__url">{domain}</span>
                <span className="cl-search__title">
                    {displayName}
                </span>
                <p className="cl-search__snippet">{type.snippet}</p>
                <span className="cl-search__tag">You</span>
            </div>

            {/* Two greyed results below, unnamed and generic rather than a
                named rival: naming a competitor, even a fictional one, is a
                swipe, and the house rule is to say what we do rather than
                what anyone else gets wrong. `directoryLabel` still makes
                these read as belonging to the visitor's own industry
                (a clinic finder site under Clinics, a freight directory
                under Logistics) rather than as one generic pair reused for
                every sector. */}
            <div
                className="cl-search__result"
                style={{ '--cl-delay': '0.25s' }}
                aria-hidden="true"
            >
                <span className="cl-search__url">a-directory-listing.in</span>
                <span className="cl-search__title">{type.directoryLabel}</span>
            </div>
            <div
                className="cl-search__result"
                style={{ '--cl-delay': '0.35s' }}
                aria-hidden="true"
            >
                <span className="cl-search__url">another-listing.in</span>
                <span className="cl-search__title">
                    Reviews for {type.noun}s nearby
                </span>
            </div>
        </div>
    );
}

/* ── Beat three ───────────────────────────────────────────────────────── */

/**
 * Five turns now, not two customer lines and a single reply: three or four
 * bubbles read as a stub once a visitor actually looked at the phone. Every
 * sector's `thread` alternates `them`/`you` and always closes on `you`.
 *
 * THE WHOLE BEAT ALREADY GATES ON SCROLL. THIS RE-ARMS IT PER MESSAGE.
 *
 * `Beat` wraps beat three's stage in `Reveal`, which mounts nothing until
 * the stage scrolls into view. But `Reveal` only reveals the STAGE once;
 * once that has happened, remounting the phone (a business-type switch) no
 * longer benefits from a fresh scroll trigger the way the very first
 * arrival did. This component adds its own IntersectionObserver so the
 * bubbles pop in exactly when the visitor scrolls down to this beat, every
 * time, not only on the beat's own first mount. Under reduced motion every
 * bubble is simply present at once, no observer needed.
 */
function OrderThread() {
    const { displayName, type } = useBusiness();
    const [observedInView, setObservedInView] = useState(false);
    const bodyRef = useRef(null);
    const reduceMotion = useReducedMotionPref();
    /* Under reduced motion every bubble is simply present, derived straight
       from the hook's own value rather than copied into state inside an
       effect: `reduceMotion` is already known at render time, so there is
       nothing to synchronise and no effect needed for that branch at all. */
    const inView = reduceMotion || observedInView;

    useEffect(() => {
        if (reduceMotion) return undefined;
        const el = bodyRef.current;
        if (!el) return undefined;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setObservedInView(true);
                    io.disconnect();
                }
            },
            { threshold: 0.4 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [reduceMotion]);

    return (
        <div className="cl-chat">
            <div className="cl-chat__head">
                <span className="cl-chat__avatar" aria-hidden="true">
                    {initials(displayName)}
                </span>
                <span className="cl-chat__who">{displayName}</span>
            </div>

            <div className="cl-chat__body" ref={bodyRef}>
                {inView &&
                    type.thread.map((turn, i) => {
                        const isLast = i === type.thread.length - 1;
                        return (
                            <div
                                key={`${type.id}-${i}`}
                                className={`cl-chat__msg cl-chat__msg--${turn.from}`}
                                style={{ '--cl-delay': `${0.1 + i * 0.45}s` }}
                            >
                                {turn.text}
                                {isLast && (
                                    <span className="cl-chat__meta">Read</span>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

/* ── The section ──────────────────────────────────────────────────────── */

function Beat({ n, title, body, flip, children }) {
    return (
        <div className={`cl-beat${flip ? ' cl-beat--flip' : ''}`}>
            <div className="nv-shell cl-beat__grid">
                <Reveal className="cl-beat__copy">
                    <span className="cl-beat__num" aria-hidden="true">
                        {n}
                    </span>
                    <h3 className="cl-h2">{title}</h3>
                    <p className="cl-beat__body">{body}</p>
                </Reveal>
                <Reveal className="cl-beat__stage" delay={0.08}>
                    {children}
                </Reveal>
            </div>
        </div>
    );
}

export default function ClGrowth() {
    const { displayName, type } = useBusiness();
    const domain = `${slugify(displayName)}.com`;

    return (
        <>
            {/* Round four: the business-name card moved out of the hero,
                which now shows a Mac window instead of a form. It renders
                here, directly before the growth story it drives, since
                naming your business and then immediately watching it
                appear in the three beats below is one continuous idea.
                "#start" is also where the hero's "Show me" button points. */}
            <ClBusinessSetup />

            <section id="grow" className="nv-section nv-ground--paper">
                <div className="nv-shell">
                    <div className="cl-head cl-head--wide">
                        <h2 className="cl-h2">Here is how that happens.</h2>
                        <p className="nv-lede">
                            Three steps. Nothing to install, nothing to
                            learn, and you can see all of it before you pay
                            us anything.
                        </p>
                    </div>
                </div>

            <Beat
                n="1"
                title="People can find you, and they trust what they see."
                body="A site that loads fast, reads well on a phone, and looks like a real business. Yours, on your own address."
            >
                <Safari url={domain}>
                    <Storefront />
                </Safari>
            </Beat>

            <Beat
                n="2"
                title="You show up when someone searches."
                body={`We write the pages, set up the listings and keep the posts going, so the people already looking for a ${type.noun} nearby find yours first.`}
                flip
            >
                <div className="cl-found">
                    <div className="cl-card">
                        <SearchResult />
                    </div>
                </div>
            </Beat>

            <Beat
                n="3"
                title="The orders come to your phone."
                body="No account to create, no cart to abandon. They tap once from the site and land in a chat that is already open on their phone, and yours."
            >
                <div className="cl-phoneWrap">
                    <Iphone className="cl-phone">
                        <OrderThread />
                    </Iphone>
                </div>
            </Beat>
            </section>
        </>
    );
}
