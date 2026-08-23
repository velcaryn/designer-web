#!/usr/bin/env node
/**
 * Guards against the CSS specificity collision that repeatedly shipped
 * invisible "ghosted" tab labels across Connect and the public site.
 *
 * The bug, concretely:
 *
 *     .vt-tab:hover   { background: var(--surface-hover); }        (0,2,0)
 *     .vt-tab--active { background: var(--accent);
 *                       color: var(--text-on-accent); }            (0,1,0)
 *
 * `.vt-tab:hover` carries a class AND a pseudo-class, so it outranks
 * `.vt-tab--active` regardless of source order. Hovering the SELECTED tab
 * therefore replaces its accent background with the plain hover background,
 * while `color: var(--text-on-accent)` (white) has no competitor and stays -
 * producing white text on a light background, i.e. an unreadable tab.
 *
 * It is a nasty class of bug because it only appears in one transient state
 * (hover, on the active element only), so it survives every static review
 * and every screenshot that happens not to have the cursor parked on the
 * selected tab. That is exactly why it needs a mechanical check.
 *
 * The fix is always the same: exclude the active variant from the hover
 * rule, so the two can never contend for the same property:
 *
 *     .vt-tab:hover:not(.vt-tab--active) { background: var(--surface-hover); }
 *
 * Run via `npm run check:css` (also wired into `npm run verify`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['app', 'components'];
const EXTS = ['.js', '.jsx', '.ts', '.tsx', '.css'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'graphify-out']);

/** Properties where an active/selected state losing to hover is a visual bug. */
const CONTESTED = ['background', 'background-color', 'color', 'border-color'];

function walk(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (EXTS.some(e => entry.endsWith(e))) out.push(full);
    }
    return out;
}

/** Extracts `selector { body }` pairs. Good enough for the flat rule sets used here. */
function rules(text) {
    const found = [];
    const re = /([^{}();]+?)\s*\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const selector = m[1].trim().split('\n').pop().trim();
        if (selector.startsWith('@') || !selector.startsWith('.')) continue;
        found.push({ selector, body: m[2], at: m.index });
    }
    return found;
}

/**
 * (id, class, type) specificity. Only class and pseudo-class counts matter for
 * the comparison this script makes, and both land in the same column.
 */
function specificity(selector) {
    const classes = (selector.match(/\.[A-Za-z0-9_-]+/g) || []).length;
    // :not() is transparent - it contributes its argument's specificity, not its own.
    const pseudoClasses = (selector.match(/:(?!not\b)[a-z-]+/g) || []).length;
    return classes + pseudoClasses;
}

function declaredProps(body) {
    return CONTESTED.filter(p =>
        new RegExp(`(^|[;{\\s])${p}\\s*:`).test(body)
    );
}

const findings = [];

for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
        const text = readFileSync(file, 'utf8');
        if (!text.includes(':hover')) continue;

        const all = rules(text);

        // Every `.base:hover` rule that does NOT already exclude a variant.
        const hovers = all.filter(r =>
            /^\.[A-Za-z0-9_-]+:hover\s*$/.test(r.selector)
        );

        for (const hover of hovers) {
            const base = hover.selector.slice(1).replace(':hover', '');
            const hoverProps = declaredProps(hover.body);
            if (hoverProps.length === 0) continue;

            // Any single-class state variant of the same base element.
            const variants = all.filter(r =>
                new RegExp(`^\\.${base}(--|\\.)(active|selected|current|open)[A-Za-z0-9_-]*\\s*$`).test(r.selector)
            );

            for (const variant of variants) {
                const clash = declaredProps(variant.body).filter(p => hoverProps.includes(p));
                if (clash.length === 0) continue;

                // Does hover actually WIN? Higher specificity always wins; on a tie
                // (e.g. `.x:hover` vs `.x.active`, both one class + one other unit)
                // the later declaration wins, so a variant declared after its hover
                // rule is already safe and must not be reported.
                const hoverSpec = specificity(hover.selector);
                const variantSpec = specificity(variant.selector);
                const hoverWins = hoverSpec > variantSpec
                    || (hoverSpec === variantSpec && hover.at > variant.at);
                if (!hoverWins) continue;

                findings.push({
                    file: relative(ROOT, file),
                    hover: hover.selector,
                    variant: variant.selector,
                    props: clash,
                });
            }
        }
    }
}

if (findings.length === 0) {
    console.log('OK: no hover/active CSS specificity collisions found.');
    process.exit(0);
}

console.error('\nCSS specificity collision(s) found.\n');
console.error('A `.x:hover` rule (0,2,0) outranks `.x--active` (0,1,0), so hovering the');
console.error('ACTIVE element silently wins these properties - typically leaving the');
console.error('active label unreadable (white text on a light hover background).\n');

for (const f of findings) {
    console.error(`  ${f.file}`);
    console.error(`    ${f.hover}  overrides  ${f.variant}`);
    console.error(`    contested: ${f.props.join(', ')}`);
    console.error(`    fix: ${f.hover}:not(.${f.variant.slice(1)}) { ... }\n`);
}

console.error(`${findings.length} collision(s). See the header of this script for the why.\n`);
process.exit(1);
