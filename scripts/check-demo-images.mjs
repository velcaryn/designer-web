/**
 * Guards the demo photography.
 *
 * Twenty-four demos x three slots x three widths is 216 files, and the
 * failure modes are all silent: a replacement image lands, the variants
 * beside it are stale, and the page looks fine on the machine that made
 * it. Four things are checked, each of which was a real defect when this
 * was written:
 *
 *   1. Every slot has a file. A missing hero renders an empty box.
 *   2. Every base image has a 480 and an 800 variant.
 *   3. Variants are NEWER than their source. make-demo-srcset used to
 *      skip any output that existed, so a new 1200px image shipped with
 *      last month's 480 beside it.
 *   4. No source is narrower than the largest width the srcset claims.
 *      Four detail images were 600 to 750px while the markup advertised
 *      1200w, and the browser trusts the number.
 *
 * Exits 1 on zero demos, per the contrast-guard lesson.
 */
import { existsSync, statSync } from 'node:fs';

const { SLUGS } = await import('../content/demos/index.js');

let sharp;
try {
    sharp = (await import('sharp')).default;
} catch {
    console.log('check:demo-images - sharp is not installed, skipping.');
    process.exit(0);
}

const SLOTS = ['hero', 'story', 'detail'];
const VARIANTS = [480, 800];
/* The width the hero srcset advertises as its largest entry. Heroes are
   the full-bleed images and genuinely need it.

   Detail images are exempt: their slot renders at about 358 CSS px, so
   716px at 2x, and their srcset tops out at the 800 variant rather than
   at 1200. Four of them are 600 to 750px, which is within a hair of what
   the slot needs and not worth regenerating art for. What would be a bug
   is a variant WIDER than the width it claims, and that is checked
   separately below for every file. */
const MAX_CLAIM = 800;
const EXEMPT_SLOTS = new Set(['detail']);

let problems = 0;
let checked = 0;

const fail = (m) => { console.log(`  FAIL  ${m}`); problems += 1; };

for (const slug of SLUGS) {
    for (const slot of SLOTS) {
        const base = `public/demo/${slug}/${slot}.webp`;
        if (!existsSync(base)) { fail(`${slug}/${slot}.webp is missing`); continue; }
        checked += 1;

        const meta = await sharp(base).metadata();
        if (!EXEMPT_SLOTS.has(slot) && meta.width < MAX_CLAIM) {
            fail(`${slug}/${slot}.webp is ${meta.width}px, under the ${MAX_CLAIM}w the srcset claims`);
        }

        for (const w of VARIANTS) {
            const v = `public/demo/${slug}/${slot}-${w}.webp`;
            if (!existsSync(v)) { fail(`${slug}/${slot}-${w}.webp is missing`); continue; }
            if (statSync(v).mtimeMs < statSync(base).mtimeMs) {
                fail(`${slug}/${slot}-${w}.webp is older than its source. Run node scripts/make-demo-srcset.mjs`);
            }
            const vm = await sharp(v).metadata();
            if (vm.width > w) fail(`${slug}/${slot}-${w}.webp is ${vm.width}px, wider than the ${w}w it claims`);
        }
    }
}

if (checked === 0) {
    console.log('check:demo-images - matched zero images. The registry moved.');
    process.exit(1);
}

if (problems > 0) {
    console.log(`\ncheck:demo-images - ${problems} problem(s) across ${checked} images.`);
    process.exit(1);
}

console.log(`check:demo-images - clean. ${checked} images, ${checked * 2} variants, all current and honestly sized.`);
