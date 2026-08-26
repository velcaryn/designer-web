'use client';

/**
 * Reads `prefers-reduced-motion` as a subscription rather than as state.
 *
 * WHY NOT useState PLUS useEffect
 *
 * The obvious version sets state synchronously inside an effect, which
 * React's lint rule rejects and which is genuinely wrong here: the component
 * renders once with the motion-heavy branch, mounts it, and only then finds
 * out the visitor asked for no motion and tears it down. For the icon sphere
 * that means a canvas and sixteen network requests started on behalf of
 * someone who explicitly said they did not want them.
 *
 * `useSyncExternalStore` reads the media query during render instead, so the
 * first client render is already correct and the wrong branch never mounts.
 *
 * WHY THE SERVER SNAPSHOT IS ALWAYS FALSE
 *
 * There is no way to know the preference on the server, and guessing `true`
 * would strip motion from everyone on the first paint. Returning false means
 * the server renders the motion branch and the client corrects it on hydrate
 * for the small number of visitors who set the preference. That is the same
 * direction Motion's own `useReducedMotion` resolves in, so the two agree.
 *
 * This is used where the guard must exist in JavaScript, which is anywhere a
 * canvas, a ticker or an interval is involved: a CSS media query cannot stop
 * any of those. CSS-only animation is switched off in the one
 * `prefers-reduced-motion` block at the bottom of app/claudelanding.css
 * instead, and does not need this.
 */
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange) {
    const mq = window.matchMedia(QUERY);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
}

function getSnapshot() {
    return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
    return false;
}

export default function useReducedMotionPref() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
