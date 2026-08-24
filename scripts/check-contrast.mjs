#!/usr/bin/env node
/**
 * Contrast guard. Renders /lab, switches through every theme, and measures the
 * real painted contrast of every text node against the background actually
 * behind it.
 *
 * WHY THIS EXISTS AS A GUARD RATHER THAN A ONE-OFF SCRIPT
 * Eighteen themes multiplied by every text style is far more combinations than
 * anyone will check by eye, and the failures are invisible until someone picks
 * the wrong theme. The first dark themes shipped with a 1.1:1 primary button
 * and body text that could not be read at all. Both were found by measuring,
 * not by looking.
 *
 * TWO THINGS IT DOES THAT A NAIVE CHECK DOES NOT:
 *
 *   1. It resolves the background by CLIMBING ancestors until it finds one
 *      that is actually opaque. Reading `backgroundColor` off the text element
 *      returns `transparent` for almost everything, which then gets compared
 *      against nothing.
 *
 *   2. It parses colours through a canvas rather than a regex. `color-mix()`
 *      computes to `color(srgb 0.93 0.94 0.96)`, which an rgb()-only regex
 *      cannot read. An earlier version of this check reported 426 failures on
 *      themes that were completely fine, purely because it could not parse
 *      half the values it was given.
 *
 * Requires the production server on :4000. Not part of `npm run verify`,
 * because it needs a running server; run it with `npm run check:contrast`
 * after any change to the palette, the tokens, or a section's colours.
 */
import puppeteer from 'puppeteer';

const URL = process.env.CONTRAST_URL || 'http://localhost:4000/';

const AUDIT = () => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const ctx = cv.getContext('2d', { willReadFrequently: true });

    function parse(c) {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000';
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255];
    }
    function lum(c) {
        const [r, g, b] = parse(c).slice(0, 3).map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function ratio(x, y) {
        const a = lum(x); const b = lum(y);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    function bgOf(el) {
        let n = el;
        while (n && n !== document.documentElement) {
            const c = getComputedStyle(n).backgroundColor;
            if (c && parse(c)[3] > 0.95) return c;
            n = n.parentElement;
        }
        return getComputedStyle(document.body).backgroundColor;
    }

    const worst = new Map();
    document.querySelectorAll('p,h1,h2,h3,h4,span,dt,dd,li,a,button,label,legend').forEach((el) => {
        const txt = el.textContent.trim();
        if (!txt || el.children.length > 0) return;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.opacity === '0') return;
        const cr = ratio(cs.color, bgOf(el));
        const size = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        /* WCAG large text: 24px, or 18.66px when bold. */
        const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
        if (cr < need) {
            const key = (el.className || el.tagName).toString().slice(0, 44);
            if (!worst.has(key) || worst.get(key).cr > cr) {
                worst.set(key, { cr: +cr.toFixed(2), need });
            }
        }
    });
    return [...worst.entries()].map(([k, v]) => `${v.cr}:1 (needs ${v.need}) ${k}`);
};

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 240000 });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
} catch {
    console.log(`check:contrast - could not reach ${URL}`);
    console.log('Start the production server first: npm run build && npm start');
    await browser.close();
    process.exit(1);
}
await new Promise((r) => setTimeout(r, 3000));

const COLOUR_GRID = '.nv-preview__grid > div:first-child .nv-swatch';

const names = await page.evaluate(
    (sel) => [...document.querySelectorAll(sel)]
        .map((b) => b.querySelector('.nv-swatch__name')?.textContent.trim())
        .filter(Boolean),
    COLOUR_GRID,
);

let total = 0;
for (const name of names) {
    await page.evaluate(([n, sel]) => {
        const el = [...document.querySelectorAll(sel)]
            .find((b) => b.querySelector('.nv-swatch__name')?.textContent.trim() === n);
        if (el) el.click();
    }, [name, COLOUR_GRID]);
    await new Promise((r) => setTimeout(r, 350));
    const fails = await page.evaluate(AUDIT);
    total += fails.length;
    if (fails.length) {
        console.log(`  FAIL  ${name}`);
        fails.forEach((f) => console.log(`          ${f}`));
    } else {
        console.log(`  PASS  ${name}`);
    }
}

await browser.close();

if (total > 0) {
    console.log(`\ncheck:contrast - ${total} text/background pair(s) below WCAG AA.`);
    process.exit(1);
}
console.log(`\ncheck:contrast - clean. ${names.length} themes, every text pair at or above AA.`);
