/*
 * Security response headers.
 *
 * All six are now ENFORCED, including the Content Security Policy.
 *
 * WHY THE CSP WAS FLIPPED OUT OF REPORT-ONLY
 *
 * It shipped report-only because a strict policy would have broken three
 * things that are not obvious from the outside: the colour lab writes
 * inline custom properties onto the root element, fifteen components
 * carry inline style objects, and the vendored WebGL background compiles
 * shaders. Report-only gathered violations without blocking anything and
 * the reports came back clean.
 *
 * Phase 2 is what forced the decision. The site now has two public forms
 * posting to two routes that hold a bearer credential. The playbook is
 * explicit that a report-only policy is not good enough "into anything
 * with a form that hits a server", and it is right: report-only stops
 * nothing, and an injected script on a page with a form is a different
 * class of problem from one on a brochure page.
 *
 * WHAT IS STILL NOT STRICT, STATED PLAINLY
 *
 * `script-src` keeps 'unsafe-inline'. Next injects its own inline
 * bootstrap and the GA4 init block above is inline, so removing it today
 * breaks the site. That is a real weakening and it is worth being honest
 * about rather than implying the policy is tighter than it is: the fix
 * is per-request nonces, which needs middleware and turns every static
 * page dynamic. Worth doing, not worth blocking Phase 2 on.
 *
 * `style-src` keeps 'unsafe-inline' for the lab and the inline style
 * objects. Style injection is a real but much smaller problem than
 * script injection.
 *
 * `'unsafe-eval'` is gone FROM PRODUCTION. It was carried on the
 * assumption that Next's production runtime needs it; it does not, and
 * the built chunks contain no eval() or new Function() at all. React's
 * DEV build is a different story and genuinely requires it, so the grant
 * is now conditional on NODE_ENV rather than removed outright. See the
 * note above the CSP array.
 *
 * `img-src` allows cdn.simpleicons.org because the tech sphere loads its
 * icons from there at runtime. Fonts are self-hosted by next/font, so no
 * external font host is needed.
 *
 * The two Google hosts are the analytics tag and nothing else:
 * googletagmanager.com serves gtag.js, google-analytics.com receives the
 * measurements. Neither is allowed anywhere it is not needed, and no
 * other third-party origin is permitted at all, which is the reason a
 * chat widget or an embedded analytics tool cannot be dropped in without
 * this file being edited deliberately.
 */
/* Development needs one extra grant that production must never have.
 *
 * React's dev build uses eval() for debugging features: reconstructing
 * callstacks across environments, and the Turbopack refresh machinery.
 * None of that ships. So 'unsafe-eval' is granted ONLY when this config
 * is evaluated for `next dev`, and the production policy stays strict.
 *
 * Getting this wrong in the safe direction is what happened here: the
 * grant was removed outright after checking that no eval() or
 * new Function() appears in the built chunks, which is true and remains
 * true. The check was run against `npm start`, so it never exercised the
 * dev bundle, and `npm run dev` then failed on every page load with
 * "eval() is not supported in this environment".
 *
 * The lesson worth keeping: a CSP has to be verified in BOTH modes,
 * because they ship different React builds. `npm run build && npm start`
 * is the only thing that tells you about production, and it is silent
 * about development. */
const isDev = process.env.NODE_ENV !== 'production';

const CSP = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https://cdn.simpleicons.org",
    "font-src 'self' data:",
    /* 'unsafe-inline' for styles is required by the lab and by every
       inline style object; Next also injects its own style tags. */
    "style-src 'self' 'unsafe-inline'",
    /* See the header: 'unsafe-inline' stays until nonces land.
       'unsafe-eval' is a DEVELOPMENT-ONLY grant, required by React's dev
       build and by Turbopack's refresh runtime. It is never present in
       the policy a visitor receives. */
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com`,
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com",

    /* EXPLICIT DENIALS FOR EVERYTHING THIS SITE DOES NOT DO.

       `default-src 'self'` already covers these, so none of them changes
       what is currently allowed. They are here because 'none' is
       stricter than 'self' and because the list documents the intent: if
       somebody later adds a worker, an <iframe> or a media element, the
       page breaks loudly in review rather than quietly widening the
       policy by inheriting default-src.

       Verified against the codebase first: no `new Worker`, no
       serviceWorker registration, no <video> or <audio>, no manifest,
       and no frames. frame-src in particular is the one that keeps the
       demo pages honest, because an embedded map was considered and
       rejected on exactly this ground. */
    "worker-src 'none'",
    "manifest-src 'none'",
    "media-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",

    /* Rewrites any stray http:// subresource to https before it is
       fetched, rather than letting it fail or downgrade. Cheap, and it
       covers a hand-written link that slips through review. */
    'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
    /* Clickjacking. `frame-ancestors 'none'` in the CSP above supersedes
       this for modern browsers; this is what covers the older ones. */
    { key: 'X-Frame-Options', value: 'DENY' },
    /* Stops a browser second-guessing a declared Content-Type, which is
       how a served asset gets reinterpreted as script. */
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    /* Send the full URL same-origin, only the origin cross-origin, so a
       third party never receives a full path. */
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    /* Nothing on this site uses any of these. */
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    /* Two years, subdomains included. Only ever honoured over HTTPS, so
       it is inert in local development. */
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    { key: 'Content-Security-Policy', value: CSP },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    /*
     * The two case-study images are the only raster assets on the site and
     * both are screenshots, so AVIF first is a real saving on a page whose
     * whole pitch is load speed.
     */
    images: {
        formats: ['image/avif', 'image/webp'],
    },
    poweredByHeader: false,
    allowedDevOrigins: ['*.trycloudflare.com', 'statutory-src-packs-senators.trycloudflare.com'],
    async headers() {
        return [
            {
                source: '/:path*',
                headers: SECURITY_HEADERS,
            },
            /* The demo sites are sixteen fictional businesses. They must
               never be indexed: a fake bakery ranking for a real query is
               thin content at best, and at worst someone finds it without
               the context that it is a sample.
               This is belt and braces. Each demo route also carries a
               noindex robots meta through the layout's metadata, and
               app/robots.js disallows the path. A header is the strongest
               of the three because it applies even to a resource fetched
               directly rather than rendered, and Next composes these
               additively, so the security headers above still apply. */
            {
                source: '/demo-site/:path*',
                headers: [
                    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
                ],
            },
        ];
    },
};

export default nextConfig;
