/**
 * Google Maps links for the demo sites.
 *
 * WHY THERE IS NO EMBEDDED MAP
 *
 * The CSP in next.config.mjs has no `frame-src`, so `default-src 'self'`
 * blocks every iframe on the site. An embedded map would mean widening
 * the CSP to allow framing from google.com, on twenty-four pages, for a
 * demonstration. That trade is bad on its own terms and it is already
 * written down as a thing not to build.
 *
 * A link costs nothing, needs no API key, no billing account and no
 * third party script, and on a phone it opens the Maps app directly,
 * which is what a person actually wants. The visual interest comes from
 * CSS, not from a tile server.
 *
 * WHY THE LINK POINTS AT AN AREA AND NEVER AT A STREET NUMBER
 *
 * Every demo carries an invented street address, and the streets are
 * real: "412, 12th Main Road, Indiranagar" is a real road in Bengaluru.
 * A maps link on the full address drops a pin on somebody's actual
 * building, on a page built to be forwarded. The area and the city are
 * enough to show the intent, and they are true statements about a
 * neighbourhood rather than false ones about a property.
 *
 * This is also why the query is built here rather than written into
 * twenty-four data files. One function, one rule, and no way for a demo
 * to quietly opt into a house number.
 */

/* The documented, key-free endpoint. `api=1` is the stable contract:
   Google guarantees these parameters, unlike the older /maps?q= form. */
const SEARCH = 'https://www.google.com/maps/search/?api=1&query=';

/**
 * Area and city only. Never the street, never the pin code: a pin code
 * narrows to a delivery beat and starts pointing at buildings again.
 */
export function mapQuery(business) {
    return [business.area, business.city].filter(Boolean).join(', ');
}

export function mapHref(business) {
    return SEARCH + encodeURIComponent(mapQuery(business));
}

/**
 * What the link should say out loud. A screen reader hitting "Indiranagar,
 * Bengaluru" with no context does not know it opens a map in a new tab,
 * and neither does anyone tabbing through.
 */
export function mapLabel(business) {
    return `Open ${mapQuery(business)} in Google Maps. Opens in a new tab.`;
}
