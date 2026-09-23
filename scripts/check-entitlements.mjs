#!/usr/bin/env node
/**
 * Guards the VelBiz Cloud plan ceiling: what a tenant's tier allows.
 *
 * Every rule here is a defect that actually shipped in this code's earlier
 * home, where Cloud once ran with no plan enforcement at all:
 *
 *  1. MODULE LIST DRIFT. The permission list (lib/permissions.js) and the
 *     entitlement list (lib/cloud/entitlements.js) cannot import each other
 *     (circular). A key added to one and not the other silently vanishes
 *     from either the admin preview or the real gate.
 *
 *  2. CEILING AFTER THE BYPASS. hasPermission() must check the tenant's plan
 *     BEFORE the owner/admin early return, or an owner login reaches every
 *     module whatever the plan says.
 *
 *  3. DEAD ENFORCEMENT. A gate with no call sites enforces nothing however
 *     correct it looks, and reads as protection in review.
 *
 * Run via `npm run verify`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const problems = [];
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// 1. Module list parity.
const perms = read('lib/permissions.js');
const ents = read('lib/cloud/entitlements.js');
const listA = [...(perms.match(/PERMISSION_MODULES\s*=\s*\[([\s\S]*?)\n\];/)?.[1] || '').matchAll(/key:\s*['"]([a-z_]+)['"]/g)].map(m => m[1]);
const listB = [...(ents.match(/ALL_MODULE_KEYS\s*=\s*\[([\s\S]*?)\]/)?.[1] || '').matchAll(/['"]([a-z_]+)['"]/g)].map(m => m[1]);
if (!listA.length || !listB.length) {
    problems.push('could not parse PERMISSION_MODULES / ALL_MODULE_KEYS. Update this script if the shape changed.');
} else {
    const onlyA = listA.filter(k => !listB.includes(k));
    const onlyB = listB.filter(k => !listA.includes(k));
    if (onlyA.length || onlyB.length) {
        problems.push(
            'module lists have drifted apart.\n' +
            `    Only in PERMISSION_MODULES (lib/permissions.js): ${onlyA.join(', ') || 'none'}\n` +
            `    Only in ALL_MODULE_KEYS (lib/cloud/entitlements.js): ${onlyB.join(', ') || 'none'}`
        );
    }
}

// 2. The ceiling runs before the owner/admin bypass.
const fnStart = perms.indexOf('export function hasPermission(');
const decl = perms.slice(fnStart, perms.indexOf('\n}', fnStart));
if (fnStart === -1 || !decl.includes('moduleAllowedForTenant')) {
    problems.push('lib/permissions.js: hasPermission() never calls moduleAllowedForTenant(). The plan ceiling is not enforced.');
} else {
    const bypassAt = decl.search(/role === 'owner'/);
    if (bypassAt !== -1 && decl.indexOf('moduleAllowedForTenant') > bypassAt) {
        problems.push('lib/permissions.js: hasPermission() checks moduleAllowedForTenant() AFTER the owner/admin bypass. Move it above the role check.');
    }
}

// 3. moduleAllowedForTenant has real callers.
const walk = (dir, out = []) => {
    for (const e of readdirSync(dir)) {
        if (e === 'node_modules' || e.startsWith('.')) continue;
        const f = join(dir, e);
        if (statSync(f).isDirectory()) walk(f, out); else if (/\.m?jsx?$/.test(e)) out.push(f);
    }
    return out;
};
const callers = ['app', 'lib', 'components'].flatMap(d => walk(d))
    .filter(f => !f.endsWith('entitlements.js') && readFileSync(f, 'utf8').includes('moduleAllowedForTenant'));
if (callers.length === 0) {
    problems.push('moduleAllowedForTenant() has no call sites outside lib/cloud/entitlements.js. It enforces nothing.');
}

if (problems.length) {
    console.error('check:entitlements - FAILED\n');
    for (const p of problems) console.error(`  - ${p}\n`);
    process.exit(1);
}
console.log(`check:entitlements - clean (${listA.length} modules in parity, ceiling before bypass, ${callers.length} caller(s))`);
