'use client';

/**
 * Suggests the closest demo to whatever the visitor actually typed.
 *
 * WHY IT IS CLIENT-SIDE
 *
 * A not-found boundary is not given the params that failed to match, and
 * Next 16 does not expose the requested path to a server component
 * rendering inside one. The browser knows it: it is in location.pathname.
 *
 * WHY useSyncExternalStore AND NOT setState IN AN EFFECT
 *
 * `location` is an external store, and this is the API React provides for
 * reading one. The obvious version, a useEffect that calls setState,
 * renders once with the wrong value and immediately again with the right
 * one, which React cannot distinguish from an accidental cascade. The
 * lint rule that catches it is the same one that shaped CookieBanner.
 *
 * The server snapshot is an empty string, so the server renders nothing
 * here and the hydration pass matches exactly. The full list of sixteen
 * is server-rendered beside this, so a visitor with no JavaScript still
 * lands on a page that does its job; the suggestion is an enhancement.
 */
import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { nearestSlug } from '@/content/demos';

/* The path does not change while this component is mounted: reaching it
   means the route already failed to match, and any navigation unmounts
   it. So there is nothing to subscribe to and the unsubscribe is a
   no-op. */
function subscribe() {
    return () => {};
}

function getSnapshot() {
    return window.location.pathname;
}

function getServerSnapshot() {
    return '';
}

export default function NearestMatch() {
    const path = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const guess = path.split('/demo-site/')[1]?.split(/[?#/]/)[0] ?? '';
    const near = guess ? nearestSlug(guess) : null;

    if (!near) return null;

    return (
        <Link href={`/demo-site/${near.slug}`} className="vd-404__near">
            <span className="vd-404__nearLabel">Closest match</span>
            <span className="vd-404__nearName">{near.name}</span>
            <span className="vd-404__nearTrade">{near.trade}</span>
        </Link>
    );
}
