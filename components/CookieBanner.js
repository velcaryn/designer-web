'use client';

/**
 * The consent banner.
 *
 * WHY CONSENT IS THE DEFAULT AND NOT AN AFTERTHOUGHT
 *
 * GA4 is loaded in app/layout.js with `analytics_storage: 'denied'`
 * already set and `send_page_view: false`, so the tag is present but
 * stores nothing and reports nothing until someone here says yes. A
 * visitor who ignores this banner forever is never tracked. A visitor
 * who declines is never tracked. That is the DPDP Act 2023 position and
 * it is also the honest one.
 *
 * lib/analytics.js enforces the same rule independently, so a bug in
 * this component cannot start collection on its own.
 *
 * ADAPTED FROM THE VELCARYN IMPLEMENTATION, WITH THE STYLING THROWN AWAY
 *
 * The consent LOGIC there is good and is kept: denied-by-default,
 * localStorage as the store, and useSyncExternalStore to read it. The
 * PRESENTATION there is 120 lines of inline styles, a hex violet, a
 * 14px radius and a blurred drop shadow, every one of which breaks a
 * lock in this repo. So this is rebuilt on tokens: the one 3px stroke,
 * the one zero-blur pop, one of the two allowed radii.
 *
 * Two content changes as well. No cookie emoji, and no "Accept All":
 * there is exactly one category of processing here, so "all" is a word
 * that implies a choice nobody is being offered. Decline carries the
 * same visual weight as accept, because a decline button styled as an
 * afterthought is a dark pattern whatever the copy says.
 *
 * WHY useSyncExternalStore RATHER THAN useState IN AN EFFECT
 *
 * localStorage is an external store and this is the API React provides
 * for reading one. A `setState` inside `useEffect` renders once with the
 * wrong value and immediately re-renders, which React cannot tell apart
 * from an accidental loop, and which trips react-hooks/set-state-in-effect.
 *
 * The server cannot read localStorage, so getServerSnapshot returns a
 * sentinel that is not null. That keeps the banner out of the server HTML
 * entirely and means the hydration pass renders exactly what the server
 * sent. React then re-reads the client snapshot and shows the banner if
 * consent is genuinely absent.
 *
 * The subscription covers both directions: the `storage` event for
 * another tab accepting or declining, and a local listener set because
 * `storage` deliberately does not fire in the document that wrote the
 * value, so same-tab clicks need their own notification.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { CONSENT_KEY } from '@/lib/analytics';

const SERVER_SNAPSHOT = 'unknown';

const localListeners = new Set();

function notifyConsentChanged() {
    for (const listener of localListeners) listener();
}

function subscribe(listener) {
    localListeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
        localListeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

/* Returns a string or null, both primitives, so React's Object.is
   comparison is stable across calls and this cannot loop. Private mode
   and blocked site data throw on access rather than returning null, and
   an unreadable store is treated as "no answer yet". */
function getSnapshot() {
    try {
        return window.localStorage.getItem(CONSENT_KEY);
    } catch {
        return null;
    }
}

function getServerSnapshot() {
    return SERVER_SNAPSHOT;
}

function write(value) {
    try {
        window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
        /* If the write fails the banner simply reappears next time,
           which is the correct failure direction: no silent consent. */
    }
    notifyConsentChanged();
}

/* Set when the bar times out, so it does not reappear on every route
   change within the same tab. sessionStorage rather than localStorage:
   it dies with the tab, which is exactly the lifetime "ask me again next
   visit" describes. */
const SNOOZE_KEY = 'velbiz_analytics_snooze';

/* How long the bar waits before deciding for itself.

   Longer on a desktop because the bar is a small thing in a far corner
   and a reader's eye may not reach it for a while; shorter on a phone
   where it sits across the bottom of the screen and is genuinely in the
   way. Both are long enough to read one short sentence and decide. */
const AUTO_MS_DESKTOP = 15000;
const AUTO_MS_MOBILE = 7000;

/* Long enough to read as a dissolve, short enough that the dock does not
   feel like it is waiting. Matches the site's own transition timing. */
const FADE_MS = 260;

export default function CookieBanner() {
    const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    /* `leaving` runs the dissolve; the choice is written only when it
       finishes, so the bar cannot unmount mid-animation. */
    const [leaving, setLeaving] = useState(false);
    /* Read once at mount via a lazy initialiser rather than in an
       effect: it is external state that is already settled by the time
       we render, and setting it from an effect would cost a second
       render pass for no reason.

       The initialiser runs on the server too, where sessionStorage does
       not exist, so it must return false there and let the client's
       first render correct it. That is the same server/client split
       getServerSnapshot() handles for the consent value itself. */
    const [snoozed, setSnoozed] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return window.sessionStorage.getItem(SNOOZE_KEY) !== null;
        } catch {
            return false;
        }
    });
    const timers = useRef([]);

    /* Every exit goes through here: Allow, No, and the timeout. One
       animation, one place, so the three cannot drift apart. */
    const dismiss = useCallback((commit) => {
        setLeaving(true);
        const t = window.setTimeout(commit, FADE_MS);
        timers.current.push(t);
    }, []);

    useEffect(() => () => {
        timers.current.forEach((t) => window.clearTimeout(t));
    }, []);

    useEffect(() => {
        if (consent !== null) return undefined;

        /* SILENCE IS NOT CONSENT, AND IT IS NOT A PERMANENT NO EITHER.

           Ignoring the bar switches analytics off for this visit exactly
           as tapping No does: nothing is measured and no cookie is set.
           What it does NOT do is record a decision, so the bar asks
           again next visit. A visitor who scrolled past it once has not
           told us anything, and treating that as a permanent refusal
           throws away the answer they might give tomorrow.

           sessionStorage, not localStorage: it dies with the tab, which
           is exactly the lifetime "ask me again next visit" describes. */
        if (snoozed) return undefined;

        const wide = typeof window !== 'undefined'
            && window.matchMedia('(min-width: 1200px)').matches;

        const t = window.setTimeout(
            () => dismiss(() => {
                try {
                    window.sessionStorage.setItem(SNOOZE_KEY, '1');
                } catch { /* nothing to do */ }
                /* Unmounts the bar. Not notifyConsentChanged(): nothing
                   was written to localStorage, so the store's snapshot is
                   still null and re-reading it would leave the bar up. */
                setSnoozed(true);
            }),
            wide ? AUTO_MS_DESKTOP : AUTO_MS_MOBILE,
        );
        timers.current.push(t);
        return () => window.clearTimeout(t);
    }, [consent, dismiss, snoozed]);

    function accept() {
        dismiss(() => {
        write('accepted');
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            window.gtag('consent', 'update', { analytics_storage: 'granted' });
            /* The page view that was withheld at load. Sent now rather
               than on the next navigation, so accepting does not lose
               the visit it was accepted during. */
            window.gtag('event', 'page_view', {
                page_path: window.location.pathname,
                page_location: window.location.href,
                page_title: document.title,
            });
        }
        });
    }

    function decline() {
        dismiss(() => write('declined'));
    }

    /* Absent consent is the only state that shows the banner. */
    if (consent !== null) return null;

    /* Snoozed this session by the timeout: gone until the tab closes. */
    if (snoozed) return null;

    return (
        /* ONE LINE, NOT A CARD.

           This was a 218px block with a heading and three sentences,
           which is 26% of a 390px phone screen: a quarter of the first
           impression spent on a question nobody came here to answer.

           The consent itself is kept. It gates Google Analytics, which
           sets cookies and sends an IP to Google, and the privacy page
           states plainly that nothing is collected unless the visitor
           agrees. Removing the gate would make that sentence false.

           What is cut is the explanation, not the choice. The full
           account lives on the privacy page, linked from here, which is
           where somebody who actually wants the detail will read it
           properly rather than skim it over a hero image. */
        <div
            className={`cl-consent${leaving ? ' is-leaving' : ''}`}
            role="region"
            aria-label="Analytics consent"
        >
            {/* Two lengths, one row. The bar is nowrap so it stays a
                single line at every width, and the long sentence does
                not fit a 320px phone: rather than let it ellipsis into
                nonsense, the short form is shown there and the full one
                from 480px up. CSS picks, so there is no layout shift and
                no JS measuring anything. */}
            <p className="cl-consent__body">
                <span className="cl-consent__long">
                    We count visits with Google Analytics.
                </span>
                <span className="cl-consent__short">
                    We count visits.
                </span>
                {' '}
                <Link href="/privacy" className="cl-consent__link">
                    Details
                </Link>
            </p>

            <div className="cl-consent__actions">
                <button
                    type="button"
                    className="cl-consent__btn cl-consent__btn--no"
                    onClick={decline}
                >
                    No
                </button>
                <button
                    type="button"
                    className="cl-consent__btn cl-consent__btn--yes"
                    onClick={accept}
                >
                    Allow
                </button>
            </div>
        </div>
    );
}
