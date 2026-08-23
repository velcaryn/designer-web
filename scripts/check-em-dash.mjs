/**
 * check-em-dash.mjs
 *
 * Fails if an em dash (U+2014) appears anywhere in the source tree.
 *
 * Em dashes are a house-style ban: nobody types one on a keyboard, so they
 * arrive via autocorrect or generated text and read as such. Use a plain
 * hyphen, a comma, or a full stop instead.
 *
 * Deliberately does NOT touch:
 *   U+2500 (─) box-drawing, used for the `// ── Section ──` comment rules
 *   U+2013 (–) en dash, which is correct in numeric ranges like 10–20
 *
 * Usage:  node scripts/check-em-dash.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOTS = ['app', 'components', 'scripts'];
const EXTS = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx', '.css', '.md', '.json']);
// `skills` holds vendored third-party skill definitions. They are not our prose,
// and rewriting them would only create conflicts the next time they are updated
// upstream, so the house style does not apply there.
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'graphify-out', 'public', 'skills']);
// Generated, and enormous. Nothing a human wrote lives here.
const SKIP_FILES = new Set(['package-lock.json']);
// Built from its code point so this file does not itself contain the character
// it bans, which would make the check permanently self-failing.
const EM_DASH = String.fromCodePoint(0x2014);

// Regions written by a generator, not by us. next dev rewrites its block into
// CLAUDE.md on every run, so editing it would only produce a diff that comes
// straight back. House style applies to prose we author.
const GENERATED_REGIONS = [
    [/<!--\s*BEGIN:nextjs-agent-rules\s*-->/, /<!--\s*END:nextjs-agent-rules\s*-->/],
];

/** Blanks out generated regions so their content is neither scanned nor renumbered. */
function stripGenerated(lines) {
    const out = [...lines];
    for (const [begin, end] of GENERATED_REGIONS) {
        let inside = false;
        for (let i = 0; i < out.length; i++) {
            if (!inside && begin.test(out[i])) inside = true;
            if (inside) {
                const wasEnd = end.test(out[i]);
                out[i] = '';
                if (wasEnd) inside = false;
            }
        }
    }
    return out;
}

const hits = [];

function walk(dir) {
    let entries;
    try {
        entries = readdirSync(dir);
    } catch {
        return;
    }
    for (const entry of entries) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        let st;
        try {
            st = statSync(full);
        } catch {
            continue;
        }
        if (st.isDirectory()) {
            walk(full);
        } else if (EXTS.has(extname(entry)) && !SKIP_FILES.has(entry)) {
            const lines = stripGenerated(readFileSync(full, 'utf8').split('\n'));
            lines.forEach((line, i) => {
                if (line.includes(EM_DASH)) {
                    hits.push({ file: relative(process.cwd(), full), line: i + 1, text: line.trim().slice(0, 100) });
                }
            });
        }
    }
}

for (const root of ROOTS) walk(root);

// Root-level files too (CLAUDE.md, README.md and friends) - they were missed
// on the first pass and are exactly the sort of thing a person reads.
for (const entry of readdirSync('.')) {
    if (SKIP_DIRS.has(entry) || SKIP_FILES.has(entry)) continue;
    if (!EXTS.has(extname(entry))) continue;
    try {
        if (!statSync(entry).isFile()) continue;
    } catch {
        continue;
    }
    stripGenerated(readFileSync(entry, 'utf8').split('\n')).forEach((line, i) => {
        if (line.includes(EM_DASH)) hits.push({ file: entry, line: i + 1, text: line.trim().slice(0, 100) });
    });
}

if (hits.length === 0) {
    console.log('OK: no em dashes found.');
    process.exit(0);
}

console.error(`Found ${hits.length} em dash(es). Use a hyphen, comma, or full stop instead.\n`);
for (const h of hits.slice(0, 40)) {
    console.error(`  ${h.file}:${h.line}  ${h.text}`);
}
if (hits.length > 40) console.error(`  ...and ${hits.length - 40} more`);
process.exit(1);
