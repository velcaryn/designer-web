/**
 * Guards the thing the whole demo corpus exists to prove: that twenty-four
 * businesses in twenty-four trades do not render the same website.
 *
 * Two properties, both of which regressed silently before this existed:
 *
 *   1. Every demo's section order is distinct. Adding a section to one
 *      demo can accidentally make it identical to another, and nothing in
 *      the build would notice.
 *   2. Every demo carries at least one section type used by no more than
 *      three demos. Three retail demos once shared `cart` and nothing
 *      else distinctive, so all three read as the same page with
 *      different photographs. Distinct ORDER is not enough; a demo needs
 *      something that is actually its own.
 *
 * Exits 1 on zero demos, per the contrast-guard lesson: a guard that can
 * find nothing must fail rather than pass.
 */
const { SLUGS } = await import('../content/demos/index.js');
const { loadDemo } = await import('../content/demos/load.js');

/* A type this common is scaffolding, not a signature. */
const RARE_MAX = 3;

const shapes = new Map();
const usage = {};
const demos = [];
let problems = 0;

for (const slug of SLUGS) {
    const demo = await loadDemo(slug);
    if (!demo) continue;
    const types = demo.sections.map((s) => s.type);
    demos.push({ slug, types });
    for (const t of new Set(types)) usage[t] = (usage[t] || 0) + 1;
}

if (demos.length === 0) {
    console.log('check:demo-unique - matched zero demos. The loader or the registry moved.');
    process.exit(1);
}

for (const { slug, types } of demos) {
    const seq = types.join('>');
    if (shapes.has(seq)) {
        console.log(`  FAIL  ${slug} has the same section order as ${shapes.get(seq)}`);
        problems += 1;
    }
    shapes.set(seq, slug);
}

for (const { slug, types } of demos) {
    const rare = [...new Set(types)].filter((t) => usage[t] <= RARE_MAX);
    if (rare.length === 0) {
        console.log(
            `  FAIL  ${slug} has no section used by ${RARE_MAX} or fewer demos. `
            + 'It is assembled entirely from shared parts and will read as a template.',
        );
        problems += 1;
    }
}

if (problems > 0) {
    console.log(`\ncheck:demo-unique - ${problems} problem(s) across ${demos.length} demos.`);
    process.exit(1);
}

const signatures = Object.values(usage).filter((n) => n === 1).length;
console.log(
    `check:demo-unique - clean. ${demos.length} demos, ${shapes.size} distinct shapes, `
    + `${signatures} section types unique to a single demo.`,
);
