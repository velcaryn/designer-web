/**
 * Normalise brand logos ALREADY STORED, the way uploads are now normalised.
 *
 * The upload path keys a baked-in backdrop to transparency (lib/logoImage.js),
 * but logos saved before that change are still opaque RGB with a white
 * rectangle in the pixels - which is what makes a circular mark render inside a
 * glowing box on every dark theme. CSS cannot correct it, because the white is
 * image data.
 *
 * DRY RUN BY DEFAULT. Pass --apply to write. Every run reports what it would
 * do per tenant, so the decision to overwrite branding is made on evidence.
 *
 *   node scripts/fix-logo-backdrops.mjs                 # report only
 *   node scripts/fix-logo-backdrops.mjs --apply         # write
 *   node scripts/fix-logo-backdrops.mjs --db velbiz_dev
 *
 * The original data URI is copied to branding.brandLogoOriginal before the
 * first overwrite, so this is reversible - a logo is a tenant's identity and
 * a heuristic should never be the only copy of it.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import sharp from 'sharp';
import { detectBackdrop, clearBackdrop, fitWithin } from '../lib/logoImage.js';

const APPLY = process.argv.includes('--apply');
const dbArg = process.argv.indexOf('--db');
/* Pinned explicitly rather than defaulted from the URI: a script that rewrites
   branding must never guess which database it is pointed at. */
const DB_NAME = dbArg > -1 ? process.argv[dbArg + 1] : 'velbiz_dev';

async function processLogo(dataUrl) {
    const m = /^data:image\/([a-z+]+);base64,(.+)$/i.exec(dataUrl || '');
    if (!m) return { skip: 'not a base64 data URI' };
    if (m[1].toLowerCase().includes('svg')) return { skip: 'vector, already scalable' };

    const input = Buffer.from(m[2], 'base64');
    const meta = await sharp(input).metadata();
    const fit = fitWithin(meta.width, meta.height);
    const { data, info } = await sharp(input).resize(fit.width, fit.height).ensureAlpha()
        .raw().toBuffer({ resolveWithObject: true });

    const backdrop = detectBackdrop(data, info.width, info.height);
    if (!backdrop) return { skip: 'border is not a single colour - keeping as is' };

    const cleared = clearBackdrop(data, info.width, info.height, backdrop);
    if (cleared > info.width * info.height * 0.97) {
        return { skip: 'fill would consume the whole image - keeping as is' };
    }

    const out = await sharp(Buffer.from(data), { raw: { width: info.width, height: info.height, channels: 4 } })
        .png({ compressionLevel: 9 }).toBuffer();

    return {
        dataUrl: `data:image/png;base64,${out.toString('base64')}`,
        source: `${meta.width}x${meta.height}`,
        output: `${info.width}x${info.height}`,
        before: dataUrl.length,
        after: out.toString('base64').length + 22,
        clearedPct: (cleared / (info.width * info.height) * 100).toFixed(1),
    };
}

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI is not set.'); process.exit(1); }

const client = new MongoClient(uri);
await client.connect();
const db = client.db(DB_NAME);
console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} on ${DB_NAME}\n`);

let changed = 0, skipped = 0;
for (const coll of ['tenants']) {
    const docs = await db.collection(coll)
        .find({ 'branding.brandLogo': { $nin: ['', null] } })
        .project({ name: 1, businessName: 1, clientName: 1, 'branding.brandLogo': 1, 'branding.brandLogoOriginal': 1 })
        .toArray();

    for (const doc of docs) {
        const label = `${coll}/${doc.businessName || doc.name || doc.clientName || doc._id}`;
        let result;
        try {
            result = await processLogo(doc.branding.brandLogo);
        } catch (err) {
            console.log(`  SKIP  ${label}: ${err.message}`);
            skipped += 1;
            continue;
        }
        if (result.skip) {
            console.log(`  SKIP  ${label}: ${result.skip}`);
            skipped += 1;
            continue;
        }
        const pct = ((1 - result.after / result.before) * 100).toFixed(1);
        console.log(`  FIX   ${label}`);
        console.log(`        ${result.source} -> ${result.output}, cleared ${result.clearedPct}% backdrop, ${(result.before / 1024).toFixed(0)}KB -> ${(result.after / 1024).toFixed(0)}KB (-${pct}%)`);

        if (APPLY) {
            const update = { 'branding.brandLogo': result.dataUrl };
            // Keep exactly one pristine copy, never overwritten on a re-run.
            if (!doc.branding.brandLogoOriginal) update['branding.brandLogoOriginal'] = doc.branding.brandLogo;
            /* The white-pad workaround exists only to hide a missing alpha
               channel. With real transparency it would draw the very box we
               just removed, so it is turned off in the same write. */
            update['branding.logoBackdrop'] = 'none';
            await db.collection(coll).updateOne({ _id: doc._id }, { $set: update });
        }
        changed += 1;
    }
}

console.log(`\n${changed} logo(s) ${APPLY ? 'updated' : 'would be updated'}, ${skipped} skipped.`);
if (!APPLY && changed) console.log('Re-run with --apply to write.');
await client.close();
