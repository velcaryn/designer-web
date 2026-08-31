/**
 * The "where are you" affordance, in four different shapes.
 *
 * WHY FOUR TREATMENTS AND NOT ONE
 *
 * The same reasoning as the rest of this corpus. A single map component
 * dropped identically into fourteen demos is another thing that makes
 * twenty-four sites read as one template, which is the exact problem
 * every other section here was built to solve. So the variant is chosen
 * per demo, matched to what that trade's customer is actually doing:
 *
 *   pin      A quiet line under the address. For businesses whose
 *            customers already know roughly where they are: the family
 *            clinic, the local grocery, the hardware shop.
 *   card     A bordered block with the area, the landmark and a
 *            direction line. For places a customer travels to on
 *            purpose and has to find: the hill stay, the hotel.
 *   inline   A link inside a sentence. For businesses where location is
 *            context rather than a destination: the architect, the
 *            accountant.
 *   strip    A full-width band with the area set large. For places with
 *            walk-in trade where the neighbourhood IS the pitch: the
 *            bakery, the restaurant, the workshop.
 *
 * WHY NO EMBEDDED MAP
 *
 * See lib/mapLink.js. Short version: the CSP has no frame-src, an embed
 * would mean widening it across the whole site, and the link is what a
 * phone user wants anyway because it opens the Maps app.
 *
 * Server component. No key, no script, no tile requests, nothing added
 * to the JS budget.
 */
import { mapHref, mapQuery, mapLabel } from '@/lib/mapLink';

/* rel="noopener" is not optional on a target=_blank link, and noreferrer
   keeps the demo's URL out of Google's referrer log. */
const REL = 'noreferrer noopener';

function Arrow() {
    return (
        <svg
            className="vd-map__icon"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
            focusable="false"
        >
            {/* A location pin, drawn rather than loaded: img-src would
                allow it but a request is a request. */}
            <path
                d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.4 4.5 8.5 4.5 8.5s4.5-5.1 4.5-8.5A4.5 4.5 0 0 0 8 1.5Zm0 6.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z"
                fill="currentColor"
            />
        </svg>
    );
}

export default function MapLink({ business, variant = 'pin', landmark, direction }) {
    if (!business?.city) return null;

    const href = mapHref(business);
    const where = mapQuery(business);
    const label = mapLabel(business);

    if (variant === 'inline') {
        return (
            <a
                href={href}
                target="_blank"
                rel={REL}
                className="vd-map vd-map--inline"
                aria-label={label}
            >
                {where}
            </a>
        );
    }

    if (variant === 'card') {
        return (
            <a
                href={href}
                target="_blank"
                rel={REL}
                className="vd-map vd-map--card"
                aria-label={label}
            >
                <span className="vd-map__head">
                    <Arrow />
                    <span className="vd-map__where">{where}</span>
                </span>
                {landmark && <span className="vd-map__landmark">{landmark}</span>}
                {direction && <span className="vd-map__direction">{direction}</span>}
                <span className="vd-map__cta">Open in Maps</span>
            </a>
        );
    }

    if (variant === 'strip') {
        return (
            <a
                href={href}
                target="_blank"
                rel={REL}
                className="vd-map vd-map--strip"
                aria-label={label}
            >
                <span className="vd-map__stripWhere">{where}</span>
                {landmark && <span className="vd-map__stripSub">{landmark}</span>}
                <span className="vd-map__cta">
                    <Arrow />
                    Directions
                </span>
            </a>
        );
    }

    /* pin, the default and the quietest. */
    return (
        <a
            href={href}
            target="_blank"
            rel={REL}
            className="vd-map vd-map--pin"
            aria-label={label}
        >
            <Arrow />
            {landmark || `Find ${where} on the map`}
        </a>
    );
}
