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
import { useSyncExternalStore } from 'react';
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

export default function CookieBanner() {
    const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    function accept() {
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
    }

    function decline() {
        write('declined');
    }

    /* Absent consent is the only state that shows the banner. */
    if (consent !== null) return null;

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
        <div className="cl-consent" role="region" aria-label="Analytics consent">
            <p className="cl-consent__body">
                We count visits with Google Analytics.
                {' '}
                <Link href="/privacy" className="cl-consent__link">
                    How we use it
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
