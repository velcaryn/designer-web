/**
 * The hub grid's own tile crops.
 *
 * WHY NOT hero-480.webp
 *
 * The grid used the hero's 480w variant, which is the right file for a
 * demo page's hero and the wrong one here. A tile is at most 330px wide
 * at four columns, and the heroes are a mix of 16:9, 4:5 and 21:9, so
 * `object-fit: cover` was throwing away most of some of them after
 * downloading all of it. Twenty-four of those came to 610KB.
 *
 * A crop made for the slot is 340x191, which covers a 330px tile at
 * better than 1x and is honest about what the browser will show. At
 * quality 72 the set is about 286KB, under half.
 *
 * Quality 72 rather than the 78 used elsewhere: this is a 191px-tall
 * thumbnail behind a glyph and a caption, not a hero somebody looks at.
 *
 * Run: node scripts/make-hub-tiles.mjs
 */
import { existsSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'public', 'demo', '_tiles');

let sharp;
try {
    sharp = (await import('sharp')).default;
} catch {
    console.log('make-hub-tiles - sharp is not installed, skipping.');
    process.exit(0);
}

const { SLUGS } = await import('../content/demos/index.js');

/* 2x a 170px tile, which is the narrowest the grid goes (two columns on a
   320px phone). Wider tiles on desktop show it at just over 1x, which is
   the correct trade for a thumbnail. */
const W = 340;
const H = 191;

mkdirSync(OUT, { recursive: true });

let made = 0;
let fresh = 0;

for (const slug of SLUGS) {
    const src = join(ROOT, 'public', 'demo', slug, 'hero.webp');
    if (!existsSync(src)) {
        console.log(`  no hero for ${slug}, skipping`);
        continue;
    }
    const out = join(OUT, `${slug}.webp`);

    /* Same mtime rule as make-demo-srcset: regenerate when the source is
       newer, rather than skipping anything that exists. */
    if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
        fresh += 1;
        continue;
    }

    await sharp(src)
        .resize({ width: W, height: H, fit: 'cover', position: 'attention' })
        .webp({ quality: 72, effort: 6 })
        .toFile(out);
    made += 1;
}

console.log(`make-hub-tiles - ${made} written, ${fresh} already current.`);
