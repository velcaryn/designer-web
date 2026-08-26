#!/usr/bin/env node
/**
 * Brand-leak guard. From docs/PLAYBOOK.md section 2.
 *
 * TIER 1, HARD FAIL: a phone number, a `wa.me/<digits>` URL or a
 * `tel:+<digits>` link written by hand anywhere outside config/site.js.
 *
 * This is the guard that matters. On the Liha build the phone number appeared
 * in 8 files, 20 times; cloning that repo and missing one occurrence ships the
 * previous client's number on a live site. The bare-digits pattern is here
 * because one live number was found buried in plain prose inside a paragraph,
 * invisible to any grep for `tel:` or `wa.me`.
 *
 * TIER 2, WARN ONLY: the brand name in component prose. This copy is rewritten
 * per project anyway, and hoisting English sentences into a config makes them
 * worse. The count is printed so it stays visible rather than silently
 * drifting. A guard that fails on things nobody will fix gets disabled within
 * a week, and then it guards nothing.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN = ['components', 'app'];
const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.css']);
/* The single source of truth is allowed to contain the real values. */
const ALLOWED = new Set(['config/site.js']);

const TIER1 = [
    { name: 'wa.me link', re: /wa\.me\/\d+/g },
    { name: 'tel: link', re: /tel:\+?\d{6,}/g },
    { name: 'bare phone number', re: /\b\d{12}\b|\+91[\s-]?\d{5}[\s-]?\d{5}/g },
];
const TIER2 = [{ name: 'brand name in prose', re: /Velbrant|VelBiz/g }];

function walk(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry.startsWith('.')) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (EXTS.has(entry.slice(entry.lastIndexOf('.')))) out.push(full);
    }
    return out;
}

let hard = 0;
let soft = 0;

for (const dir of SCAN) {
    let files = [];
    try { files = walk(join(ROOT, dir)); } catch { continue; }
    for (const file of files) {
        const rel = relative(ROOT, file);
        if (ALLOWED.has(rel)) continue;
        const src = readFileSync(file, 'utf8');
        src.split('\n').forEach((line, i) => {
            for (const { name, re } of TIER1) {
                re.lastIndex = 0;
                if (re.test(line)) {
                    console.log(`  FAIL  ${rel}:${i + 1}  ${name}`);
                    console.log(`        ${line.trim().slice(0, 90)}`);
                    hard += 1;
                }
            }
            for (const { re } of TIER2) {
                re.lastIndex = 0;
                if (re.test(line)) soft += 1;
            }
        });
    }
}

if (hard > 0) {
    console.log(`\ncheck:brand - ${hard} hard failure(s). Contact data belongs in config/site.js.`);
    console.log('Build the URL with waLink() or phoneHref instead of writing it by hand.');
    process.exit(1);
}

console.log(`check:brand - clean (tier 1). ${soft} brand-name mention(s) in prose, warn only.`);
