/*
 * Security response headers.
 *
 * None of these were set before. Five are enforced; the Content Security
 * Policy is REPORT-ONLY on purpose.
 *
 * WHY CSP IS REPORT-ONLY FOR NOW
 *
 * A strict policy would break three things on this site that are not
 * obvious from the outside: the colour lab writes inline custom
 * properties onto the root element, fifteen components carry inline
 * style objects, and the vendored WebGL background compiles shaders.
 * Shipping an enforced policy without watching real traffic first is how
 * a site silently loses a feature in a browser nobody tested. Report-only
 * gathers violations without blocking anything; switch the header name to
 * `Content-Security-Policy` once the reports are clean.
 *
 * `img-src` allows cdn.simpleicons.org because the tech sphere loads its
 * icons from there at runtime. Fonts are self-hosted by next/font, so no
 * external font host is needed.
 */
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
    /* Next's runtime needs both in production builds. */
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self'",
].join('; ');

const SECURITY_HEADERS = [
    /* Clickjacking. `frame-ancestors 'none'` in the CSP above supersedes
       this for modern browsers, but the CSP is report-only, so this is
       what actually enforces it today. */
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
    { key: 'Content-Security-Policy-Report-Only', value: CSP },
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
        ];
    },
};

export default nextConfig;
