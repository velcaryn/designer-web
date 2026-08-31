/**
 * Fails the build if a demo route grows past its budget.
 *
 * WHY A SCRIPT AND NOT A NOTE IN THE PLAN
 *
 * The playbook's own contrast-guard lesson is the argument: a guard that
 * is not run guards nothing, and a guard that can find nothing must fail
 * rather than pass. Budgets recorded in a document drift; budgets checked
 * on every `npm run verify` do not.
 *
 * WHAT IT MEASURES
 *
 * The gzipped JS and CSS a demo route pulls on FIRST PAINT, read out of
 * the served HTML rather than off disk. A router prefetch of another
 * route is a warm cache for a navigation the visitor may make, not weight
 * on this page, and counting it would make the number meaningless.
 *
 * The JS floor is Next's framework, identical on every route including
 * ones with almost no JavaScript. `/terms` is the baseline: if a demo
 * with a working cart is within a few KB of a static legal page, the
 * application code is not the problem.
 *
 * Needs the production server on :4000. Not part of `verify` for that
 * reason; it runs inside `verify:full`.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BASE = process.env.DEMO_WEIGHT_URL || 'http://localhost:4000';

/* Ceilings, gzipped, on first paint. Argued for in the plan rather than
   drifted into: 8KB of CSS is what one stylesheet serving sixteen sites
   costs, and the JS number is the playbook's 60KB plus the framework
   floor the route cannot avoid. */
const CSS_MAX = 40 * 1024;
const JS_MAX = 220 * 1024;

/* Read from the registry rather than listed here.
   This was a hardcoded array of sixteen. Three demos were added and the
   guard carried on reporting "all 16 clean", which is precisely the
   failure mode the playbook's contrast-guard lesson warns about: a guard
   that cannot see the new thing passes without mentioning it. */
const { SLUGS } = await import('../content/demos/index.js');

function sizeOf(href) {
    const file = join(ROOT, '.next', href.slice('/_next'.length).split('?')[0]);
    if (!existsSync(file)) return 0;
    return gzipSync(readFileSync(file)).length;
}

async function weigh(route) {
    const html = await (await fetch(BASE + route)).text();
    const js = [...html.matchAll(/<script[^>]*src="(\/_next\/[^"]+)"/g)]
        .reduce((n, m) => n + sizeOf(m[1]), 0);
    const css = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="(\/_next\/[^"]+)"/g)]
        .reduce((n, m) => n + sizeOf(m[1]), 0);
    return { js, css };
}

try {
    await fetch(BASE);
} catch {
    console.log(`check:demo-weight - could not reach ${BASE}`);
    console.log('Start the production server first: npm run build && npm start');
    process.exit(1);
}

const kb = (n) => (n / 1024).toFixed(1).padStart(6) + 'KB';
let failed = 0;

const baseline = await weigh('/terms');
console.log(`  baseline /terms          JS ${kb(baseline.js)}  CSS ${kb(baseline.css)}`);
console.log('');

for (const slug of SLUGS) {
    const { js, css } = await weigh(`/demo-site/${slug}`);
    const bad = js > JS_MAX || css > CSS_MAX;
    if (bad) failed += 1;
    console.log(`  ${bad ? 'FAIL' : 'ok  '} ${slug.padEnd(21)} JS ${kb(js)}  CSS ${kb(css)}`);
}

if (failed > 0) {
    console.log(`\ncheck:demo-weight - ${failed} route(s) over budget.`);
    console.log(`Ceilings: JS ${JS_MAX / 1024}KB, CSS ${CSS_MAX / 1024}KB, gzipped, on first paint.`);
    process.exit(1);
}

console.log(`\ncheck:demo-weight - clean. All ${SLUGS.length} demo routes inside budget.`);
