/**
 * Guards the credibility numbers added to the demo corpus.
 *
 * The demos deliberately carried no quantified claims until now. That ban
 * has been narrowed rather than lifted, and a narrowed rule that lives
 * only in a comment is a rule that drifts. This checks the four ways the
 * new numbers can go wrong:
 *
 *   1. Arithmetic that contradicts the business. A demo trading since
 *      2011 cannot claim twenty-five years. This is the failure a reader
 *      can catch in three seconds, on the same page.
 *   2. Round vanity numbers. "500+" and "10,000+" are the generated
 *      marketing register the original ban was written against. Specific
 *      and odd is the whole trick: 430+ reads as counted.
 *   3. Fabricated regulator identifiers. Bar Council enrolment numbers,
 *      ICAI membership numbers, FSSAI licences and GSTINs identify real
 *      people. An invented one is somebody's real number.
 *   4. Real award bodies. Inventing "Nellai Hoteliers Association" is a
 *      demo prop. Claiming NABH or ISO is a false statement about a real
 *      accreditor, and the regulated trades get no awards at all.
 *
 * Exits 1 if it finds nothing to check, per the contrast-guard lesson: a
 * guard that silently matches zero files guards nothing.
 */
import { readFileSync } from 'node:fs';

const { SLUGS } = await import('../content/demos/index.js');
const { loadDemo } = await import('../content/demos/load.js');

const THIS_YEAR = new Date().getFullYear();

/* Trades where an award line is not allowed at all. Advocate advertising
   is restricted in India, and a fabricated medical accreditation is the
   worst version of this whole idea. */
const NO_AWARD = new Set([
    'advocate', 'accountant', 'clinic', 'dental-clinic', 'hospital',
]);

/* Real bodies. Inventing a local association is fine; borrowing one of
   these is a claim about an organisation that exists. */
const REAL_BODIES = [
    'michelin', 'nabh', 'nabl', 'iso ', 'iso9', 'iso 9', 'cii ', 'ficci',
    'assocham', 'crisil', 'icai', 'bar council', 'imc ', 'ima ',
    'jd power', 'trustpilot', 'tripadvisor', 'zomato', 'swiggy',
    'google review', 'justdial', 'sulekha', 'fssai award',
];

const VANITY = /\b(?:100|200|250|300|400|500|750|1000|1,000|2000|5000|5,000|10000|10,000|100000)\s*\+/;

/* GSTIN is 15 chars, PAN 10, Bar Council enrolment reads like MS/1234/2009,
   FSSAI is a 14-digit run. Any long bare digit run in prose is suspect. */
const REGULATOR_ID = [
    /\b\d{2}[A-Z]{5}\d{4}[A-Z]\b/,          // GSTIN-shaped
    /\b[A-Z]{5}\d{4}[A-Z]\b/,               // PAN-shaped
    /\b\d{14}\b/,                            // FSSAI-shaped
    /\b[A-Z]{2}\s*\/\s*\d{3,5}\s*\/\s*\d{4}\b/, // enrolment-shaped
];

let problems = 0;
let checked = 0;
let withStats = 0;
let withAward = 0;

const fail = (slug, msg) => {
    console.log(`  FAIL  ${slug}: ${msg}`);
    problems += 1;
};

for (const slug of SLUGS) {
    const demo = await loadDemo(slug);
    if (!demo) continue;
    checked += 1;

    const proof = demo.proof;
    if (!proof) {
        fail(slug, 'no proof block. Every demo needs one, even if it is only a line.');
        continue;
    }
    if (!proof.line) fail(slug, 'proof.line is required, it is the prose fallback.');

    const since = Number(demo.business?.since);
    const maxYears = Number.isFinite(since) ? THIS_YEAR - since : null;

    /* Every prose surface a number can hide in. */
    const prose = [
        proof.line, proof.award,
        demo.hero?.sub, demo.hero?.headline,
        ...(demo.story?.paragraphs ?? []),
        ...(demo.business?.trust ?? []),
        ...(proof.stats ?? []).map((s) => `${s.value} ${s.unit ?? ''} ${s.label}`),
    ].filter(Boolean);

    for (const text of prose) {
        if (VANITY.test(text)) {
            fail(slug, `round vanity number in "${text.slice(0, 60)}"`);
        }
        for (const re of REGULATOR_ID) {
            if (re.test(text)) fail(slug, `regulator-ID shape in "${text.slice(0, 60)}"`);
        }
        /* Any year-count claim, wherever it appears, against `since`. */
        for (const m of text.matchAll(/(\d{1,3})\s*(?:\+\s*)?year/gi)) {
            const claimed = Number(m[1]);
            if (maxYears !== null && claimed > maxYears) {
                fail(slug, `claims ${claimed} years but since: ${since} allows ${maxYears}`);
            }
        }
    }

    if (proof.stats?.length) {
        withStats += 1;
        if (proof.stats.length < 2 || proof.stats.length > 4) {
            fail(slug, `proof.stats has ${proof.stats.length}, the band is designed for 2 to 4`);
        }
        for (const s of proof.stats) {
            if (!s.value || !s.label) fail(slug, 'a stat is missing value or label');
        }
    }

    if (proof.award) {
        withAward += 1;
        if (NO_AWARD.has(slug)) {
            fail(slug, 'regulated trade, no award line allowed');
        }
        const lower = proof.award.toLowerCase();
        for (const body of REAL_BODIES) {
            if (lower.includes(body)) fail(slug, `names a real body: "${body.trim()}"`);
        }
    }
}

/* A guard that matched nothing must fail rather than pass. */
if (checked === 0) {
    console.log('check:demo-proof - matched zero demos. The loader or the registry moved.');
    process.exit(1);
}

if (problems > 0) {
    console.log(`\ncheck:demo-proof - ${problems} problem(s) across ${checked} demos.`);
    process.exit(1);
}

console.log(
    `check:demo-proof - clean. ${checked} demos, ${withStats} with a stats band, ${withAward} with an award line.`,
);
