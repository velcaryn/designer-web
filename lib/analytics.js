/**
 * Consent-gated event reporting.
 *
 * THE RULE THIS FILE ENFORCES
 *
 * Nothing is measured until the visitor has said yes. GA4 is loaded in
 * app/layout.js with `analytics_storage: 'denied'` already set, so the
 * tag is present but stores nothing and a visitor who ignores the banner
 * forever is never tracked. This module is the second half of that: it
 * refuses to send an event unless consent is explicitly 'accepted'.
 *
 * Both halves are needed. The consent default protects the visitor who
 * never answers; this check protects the one who answered no. Under the
 * DPDP Act 2023 processing needs a lawful basis, and "they did not
 * decline loudly enough" is not one.
 *
 * WHY THE LIST OF EVENTS IS SHORT AND CLOSED
 *
 * Four events, named here and nowhere else. The temptation with an
 * analytics helper is to let any string through and work out what it
 * meant later, which is how a property ends up with two hundred event
 * names and no answers. These four map to the only questions worth
 * asking right now: does the setup card get used, does using it lead
 * anywhere, and which of the two capture points actually converts.
 *
 * An unrecognised name is dropped rather than sent. If a new event is
 * genuinely needed it should be added here deliberately, and the privacy
 * page checked against it in the same edit.
 */

export const CONSENT_KEY = 'velbiz_analytics_consent';

export const EVENTS = [
    /* The visitor typed a real business name and it committed. */
    'business_named',
    /* The visitor deliberately picked a sector, rather than the
       auto-advance moving it for them. */
    'sector_chosen',
    /* A number reached /api/lead from either capture point. */
    'lead_submitted',
    /* A `wa.me` link was opened. The one conversion we otherwise cannot
       see at all, because it leaves the site immediately. */
    'whatsapp_clicked',
];

export function hasConsent() {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(CONSENT_KEY) === 'accepted';
    } catch {
        /* Private mode and blocked site data both throw on access rather
           than returning null. No consent readable means no consent. */
        return false;
    }
}

/**
 * Sends one event, if and only if it is on the list and consent is in.
 *
 * Never throws and never returns anything a caller has to handle:
 * analytics that can break a form submission is worse than no analytics.
 */
export function track(name, params = {}) {
    if (!EVENTS.includes(name)) return;
    if (!hasConsent()) return;
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    try {
        window.gtag('event', name, params);
    } catch {
        /* Swallowed on purpose. See above. */
    }
}

/**
 * Page views, sent explicitly because the tag is configured with
 * `send_page_view: false`. Automatic page views fire before consent can
 * possibly have been read, which is the exact thing this file exists to
 * prevent.
 */
export function trackPageView(path) {
    if (!hasConsent()) return;
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    try {
        window.gtag('event', 'page_view', {
            page_path: path,
            page_location: window.location.href,
            page_title: document.title,
        });
    } catch {
        /* Swallowed on purpose. */
    }
}
