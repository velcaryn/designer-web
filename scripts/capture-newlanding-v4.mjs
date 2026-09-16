#!/usr/bin/env node
/**
 * Captures /newlanding-v4 at three widths and measures the things a
 * screenshot alone cannot show.
 *
 * WHY IT SCROLLS BEFORE IT CAPTURES
 *
 * Every section heading on this site is wrapped in Reveal, which hides
 * the element until an IntersectionObserver fires. A plain fullPage shot
 * composites the page without any real scroll having happened, so the
 * headings render blank. That is a property of the capture, not of the
 * page, and it produced a false alarm on an earlier draft. The page is
 * scrolled to the bottom in 60vh steps and back to the top first.
 *
 * WHAT IT MEASURES, AND WHY EACH ONE
 *
 *   - horizontal overflow at every width (must be none);
 *   - Reveal elements still hidden after the scroll pass (at most one per
 *     section, never a card: trap A in the stylesheet header);
 *   - visible text nodes per section, counting ancestor opacity so a
 *     section whose wrapper is stuck at opacity 0 reads as empty (none
 *     may be zero);
 *   - the hero h1 line count at desktop (two at most);
 *   - the gap between the hero buttons and the proof chips (trap B: a
 *     dead margin on a <ul> read as 0px on an earlier draft);
 *   - the why-section column count at desktop;
 *   - the dock items' size (48px minimum) and the reserve under the last
 *     section (86px);
 *   - WCAG contrast of the new accent surfaces, which the site's own
 *     contrast guard (aimed at the lab) does not cover;
 *   - page errors and console errors.
 *
 * Usage:  OUT_DIR=/some/dir node scripts/capture-newlanding-v4.mjs
 * Needs the dev server on port 4000. Writes PNGs to OUT_DIR, never into
 * the repo.
 */
import puppeteer from 'puppeteer';
import path from 'node:path';

const ROUTE = process.env.ROUTE || '/';
const BASE = process.env.BASE || 'http://localhost:4000';
const OUT = process.env.OUT_DIR;
if (!OUT) { console.error('Set OUT_DIR to a directory outside the repo.'); process.exit(1); }

const VIEWPORTS = [
    ['desktop', { width: 1440, height: 900, deviceScaleFactor: 1 }],
    ['mobile', { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }],
    ['narrow', { width: 320, height: 720, deviceScaleFactor: 1, isMobile: true, hasTouch: true }],
];

const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)]; return (hi + 0.05) / (lo + 0.05); };
const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);

let failures = 0;
const fail = (msg) => { failures += 1; console.log('   FAIL ' + msg); };
const ok = (msg) => console.log('   ok   ' + msg);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

for (const [name, vp] of VIEWPORTS) {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
    await page.setViewport(vp);
    await page.goto(BASE + ROUTE, { waitUntil: 'networkidle2', timeout: 45000 });

    await page.evaluate(() => document.querySelector('.nv4-faq__q')?.click());
    await page.evaluate(async () => {
        const step = window.innerHeight * 0.6;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 90));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 500));
    });

    const m = await page.evaluate(() => {
        const bgOf = (el) => {
            let n = el;
            while (n) {
                const c = getComputedStyle(n).backgroundColor;
                if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c;
                n = n.parentElement;
            }
            return 'rgb(255, 255, 255)';
        };
        const effOpacity = (el) => {
            let o = 1;
            for (let n = el; n && n !== document.body; n = n.parentElement) {
                o *= parseFloat(getComputedStyle(n).opacity);
                if (o < 0.5) return o;
            }
            return o;
        };
        const rect = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) }; };
        const secs = [...document.querySelectorAll('main > section')].map((s) => ({
            id: s.id || '(none)',
            h: Math.round(s.getBoundingClientRect().height),
            vis: [...s.querySelectorAll('h1,h2,h3,p,li,a,span')].filter((e) => effOpacity(e) > 0.5 && e.textContent.trim()).length,
            hiddenReveals: [...s.querySelectorAll('.nv-reveal')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).map((e) => e.className.split(' ').find((c) => c.startsWith('nv4-') || c.startsWith('cl-')) || '?'),
            padBottom: parseFloat(getComputedStyle(s).paddingBottom),
        }));
        const h1 = document.querySelector('h1');
        const h1cs = h1 && getComputedStyle(h1);
        const h1lh = h1cs ? (parseFloat(h1cs.lineHeight) || parseFloat(h1cs.fontSize) * 1.05) : 1;
        const actions = rect('.cl-actions');
        const proof = rect('.nv4-hero__type');
        const why = document.querySelector('.nv4-why__list');
        const dockItems = [...document.querySelectorAll('.nv4-dock__item')].map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
        const dockW = Math.round(document.querySelector('.nv4-dock__bar')?.getBoundingClientRect().width || 0);
        const contrast = [];
        const add = (sel, label) => document.querySelectorAll(sel).forEach((e) => {
            if (!e.textContent.trim()) return;
            const cs = getComputedStyle(e);
            contrast.push({ label, color: cs.color, bg: bgOf(e), size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10), text: e.textContent.trim().slice(0, 30) });
        });
        add('.nv4-plan--lead .nv4-plan__name', 'lead plan name');
        add('.nv4-plan--lead .nv4-plan__who', 'lead plan who');
        add('.nv4-plan--lead .nv4-plan__item span', 'lead plan item');
        add('.nv4-plan--lead .nv4-plan__days', 'lead plan days');
        add('.nv4-metric__pill', 'metric pill');
        add('.nv4-metric__num', 'metric number');
        add('.nv4-dock__item.is-active', 'dock active');
        add('.nv4-faq__item.is-open .nv4-faq__qText', 'faq open question (paper)');
        add('.nv4-faq__item.is-open .nv4-faq__a p', 'faq open answer');
        add('.nv4-chip.is-active', 'faq chip active');
        add('.nv4-content__itemBody', 'content item body');
        add('.nv4-hero__lede', 'hero lede');
        return {
            height: document.documentElement.scrollHeight,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            secs,
            h1Lines: h1 ? Math.round(h1.getBoundingClientRect().height / h1lh) : null,
            h1Size: h1cs ? Math.round(parseFloat(h1cs.fontSize)) : null,
            heroGap: actions && proof ? proof.top - actions.bottom : null,
            heroBottom: rect('.nv4-hero__type')?.bottom,
            lotties: document.querySelectorAll('.nv4-lottie svg').length,
            whyImgs: [...document.querySelectorAll('.nv4-why__img')].filter((i) => i.complete && i.naturalWidth > 0).length,
            aurora: !!document.querySelector('.cl-hero__title .nv-aurora'),
            typed: document.querySelector('.text-type') ? 1 : 0,
            whyCols: why ? getComputedStyle(why).gridTemplateColumns.split(' ').length : null,
            dockItems,
            dockW,
            contrast,
        };
    });

    await page.screenshot({ path: path.join(OUT, `v4_${name}.png`), fullPage: true });

    console.log(`\n### ${name} @ ${vp.width}px  height=${m.height}px`);
    if (m.overflow) fail('horizontal overflow'); else ok('no horizontal overflow');
    if (errs.length) errs.forEach((e) => fail(e)); else ok('no JS errors');
    for (const s of m.secs) {
        const bad = s.vis === 0 || s.hiddenReveals.length > 1;
        (bad ? fail : ok)(`#${s.id.padEnd(9)} ${String(s.h).padStart(5)}px  visibleText=${s.vis}  hiddenReveals=${s.hiddenReveals.length ? s.hiddenReveals.join(',') : 'none'}`);
    }
    if (vp.width >= 1440) {
        (m.h1Lines <= 2 ? ok : fail)(`h1 is ${m.h1Lines} line(s) at ${m.h1Size}px`);
        (m.whyCols === 3 ? ok : fail)(`why section has ${m.whyCols} column(s)`);
    }
    if (vp.width < 600) {
        (m.heroBottom <= vp.height ? ok : fail)(`hero proof chips end at ${m.heroBottom}px of a ${vp.height}px viewport`);
    }
    (m.heroGap >= 24 ? ok : fail)(`gap buttons -> typed line is ${m.heroGap}px`);
    (m.aurora ? ok : fail)('aurora word rendered in the h1');
    (m.typed ? ok : fail)('typed proof line is mounted (its text is mid-cycle by design)');
    (m.whyImgs === 3 ? ok : fail)(`why illustrations loaded: ${m.whyImgs} of 3`);
    (m.lotties === 5 ? ok : fail)(`lottie players rendered: ${m.lotties} of 5`);
    const smallDock = m.dockItems.filter(([w, h]) => w < 48 || h < 48);
        const dockMin = vp.width >= 900 ? 48 : 40;
    const smallDock2 = m.dockItems.filter(([w, h]) => w < dockMin || h < dockMin);
    (smallDock2.length === 0 && m.dockItems.length === 4 ? ok : fail)(`dock has ${m.dockItems.length} items, ${smallDock2.length} under ${dockMin}px`);
    (m.dockW <= (vp.width < 900 ? 200 : 320) ? ok : fail)(`dock bar is ${m.dockW}px wide`);
    const last = m.secs[m.secs.length - 1];
    if (!last) fail('no sections rendered at all (the page probably threw during hydration; see the pageerror above)');
    else (last.padBottom >= 86 ? ok : fail)(`last section reserves ${Math.round(last.padBottom)}px under the dock`);
    for (const c of m.contrast) {
        const r = ratio(rgb(c.color), rgb(c.bg));
        const large = c.size >= 24 || (c.size >= 18.66 && c.weight >= 700);
        const floor = large ? 3 : 4.5;
        (r >= floor ? ok : fail)(`contrast ${r.toFixed(2)}:1 (needs ${floor}) ${c.label} "${c.text}"`);
    }
    await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
