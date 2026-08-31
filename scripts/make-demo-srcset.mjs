/**
 * Generates 480w and 800w variants of every demo image.
 *
 * WHY THIS EXISTS
 *
 * The demo heroes are a raw <img>, not next/image, which is the right
 * call for statically-known local assets: next/image would add a
 * component to every demo route's bundle to do work a build step can do
 * once. But a raw img with no srcset means a 390px phone downloads the
 * 1200px file, and 98% of this audience is on a 390px phone over mobile
 * data. That is the single biggest performance item in the system.
 *
 * This writes hero-480.webp and hero-800.webp beside each original. The
 * component then offers all three and the browser picks. Nothing is
 * deleted: the 1200 stays as the srcset's largest entry and as the
 * fallback src for anything that ignores srcset.
 *
 * Run: node scripts/make-demo-srcset.mjs
 * Requires: sharp, or falls back to reporting what it could not do
 * rather than silently producing nothing.
 */
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DEMO = join(ROOT, 'public', 'demo');
const WIDTHS = [480, 800];

let sharp;
try {
    sharp = (await import('sharp')).default;
} catch {
    console.log('make-demo-srcset - sharp is not installed.');
    console.log('  npm i -D sharp, then run this again.');
    console.log('  Skipping rather than failing: the site works without the');
    console.log('  variants, it just ships the 1200px file to every phone.');
    process.exit(0);
}

let made = 0;
let fresh = 0;
const small = [];

for (const slug of readdirSync(DEMO)) {
    /* Underscore-prefixed folders are derived output, not demo source.
       public/demo/_tiles holds the hub grid's own crops, which are
       already sized for their slot: running the srcset generator over
       them produced 48 files nothing references, and they were staged
       for commit before anyone noticed. */
    if (slug.startsWith('_')) continue;

    const dir = join(DEMO, slug);
    if (!statSync(dir).isDirectory()) continue;

    for (const file of readdirSync(dir)) {
        if (!file.endsWith('.webp')) continue;
        /* Do not re-process our own output. */
        if (/-\d+\.webp$/.test(file)) continue;

        const src = join(dir, file);
        const base = file.replace(/\.webp$/, '');
        const meta = await sharp(src).metadata();

        /* A source narrower than the largest slot means the srcset is
           advertising a width the file does not have, and the browser
           may pick it for a slot it cannot fill. Four of Gemini's detail
           images were 600 to 750px while the markup claimed 1200w. */
        if (meta.width < WIDTHS[WIDTHS.length - 1]) {
            small.push(`${slug}/${file} is ${meta.width}px`);
        }

        for (const w of WIDTHS) {
            const out = join(dir, `${base}-${w}.webp`);

            /* REGENERATE WHEN THE SOURCE IS NEWER, DO NOT JUST SKIP.

               This used to `continue` whenever the output existed, which
               is why a batch of replacement images shipped with the old
               variants beside them: the new 1200px file was in place and
               the 480 and 800 next to it were still the previous
               picture, or a straight copy at the wrong size. */
            if (existsSync(out)
                && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
                fresh += 1;
                continue;
            }

            await sharp(src)
                .resize({ width: w, withoutEnlargement: true })
                .webp({ quality: 78, effort: 6 })
                .toFile(out);
            made += 1;
        }
    }
}

console.log(`make-demo-srcset - ${made} written, ${fresh} already current.`);

if (small.length) {
    console.log(`\n  ${small.length} source image(s) narrower than ${WIDTHS[WIDTHS.length - 1]}px.`);
    console.log('  The srcset offers these as 1200w, so a wide screen can pick');
    console.log('  a file that cannot fill the slot. Regenerate them larger:');
    small.forEach((m) => console.log(`    ${m}`));
}
