/**
 * Guards the map links on the demo sites.
 *
 * The rule this protects: a maps link points at an AREA, never at a
 * street number. Every demo carries an invented street address, and the
 * streets are real. "412, 12th Main Road, Indiranagar" is a real road in
 * Bengaluru, so a link on the full address drops a pin on somebody's
 * actual building, on a page built to be forwarded over WhatsApp.
 *
 * lib/mapLink.js is the only thing that builds these URLs and it strips
 * the street by construction. This checks that nothing has routed around
 * it, plus three ways the feature can rot:
 *
 *   1. A hand-written google.com/maps URL anywhere in content or
 *      components, which would bypass the helper entirely.
 *   2. A generated URL that contains the street or the pin code.
 *   3. A demo declaring a variant the component does not implement,
 *      which renders the quiet default and looks like nothing happened.
 *   4. Map text that repeats the visit prose sitting right above it.
 *      Three of the first twenty did, and one contradicted it outright.
 *
 * Exits 1 on zero demos checked.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const { SLUGS } = await import('../content/demos/index.js');
const { loadDemo } = await import('../content/demos/load.js');
const { mapHref } = await import('../lib/mapLink.js');

const VARIANTS = new Set(['pin', 'card', 'inline', 'strip']);

let problems = 0;
let withMap = 0;
let checked = 0;

const fail = (where, msg) => {
    console.log(`  FAIL  ${where}: ${msg}`);
    problems += 1;
};

/* 1. Nobody hand-writes a maps URL. */
const scanDirs = ['content/demos', 'components/demo'];
for (const dir of scanDirs) {
    for (const f of readdirSync(dir)) {
        if (!f.endsWith('.js')) continue;
        const path = join(dir, f);
        const src = readFileSync(path, 'utf8');
        /* lib/mapLink.js is the one legitimate place, and it is not in
           either scanned directory. */
        if (/google\.[a-z.]*\/maps|maps\.google|maps\.app\.goo\.gl/.test(src)) {
            fail(path, 'hand-written Maps URL. Use lib/mapLink.js instead.');
        }
    }
}

/* 2 and 3. Per demo. */
for (const slug of SLUGS) {
    const demo = await loadDemo(slug);
    if (!demo) continue;
    checked += 1;

    const map = demo.map;
    if (!map) continue;
    withMap += 1;

    if (!VARIANTS.has(map.variant)) {
        fail(slug, `unknown map variant "${map.variant}". Expected one of ${[...VARIANTS].join(', ')}.`);
    }

    const href = mapHref(demo.business);
    const decoded = decodeURIComponent(href);

    const street = demo.business.street;
    if (street && decoded.includes(street)) {
        fail(slug, `the street address reached the map URL: "${street}"`);
    }
    /* Any house number at all, even a fragment of the street line. */
    const houseNumber = street?.match(/^\s*([\w/-]*\d[\w/-]*)/)?.[1];
    if (houseNumber && decoded.includes(houseNumber)) {
        fail(slug, `a house number reached the map URL: "${houseNumber}"`);
    }
    if (demo.business.pin && decoded.includes(demo.business.pin)) {
        fail(slug, `the pin code reached the map URL: ${demo.business.pin}`);
    }
    if (!decoded.includes(demo.business.city)) {
        fail(slug, 'the city is missing from the map URL, so the link is useless');
    }

    /* The map card sits directly under the visit prose. Text that repeats
       what the paragraph above already said is filler, and text that
       contradicts it is worse: the first draft of the home stay card said
       twenty minutes from Coonoor while the prose said forty. */
    const note = (demo.visit?.note || '').toLowerCase();
    for (const key of ['landmark', 'direction']) {
        const value = map[key];
        if (!value) continue;
        if (note.includes(value.toLowerCase().slice(0, 40))) {
            fail(slug, `map.${key} repeats the visit note. It should add something, not restate it.`);
        }
    }
}

if (checked === 0) {
    console.log('check:demo-maps - matched zero demos. The loader or the registry moved.');
    process.exit(1);
}

if (problems > 0) {
    console.log(`\ncheck:demo-maps - ${problems} problem(s).`);
    process.exit(1);
}

console.log(
    `check:demo-maps - clean. ${withMap} of ${checked} demos link to a map, `
    + 'area and city only, no street or pin code in any URL.',
);
