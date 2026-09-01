/**
 * The manifest of real, indexable per-trade landing pages.
 *
 * WHY THIS EXISTS SEPARATELY FROM content/demos/index.js
 *
 * content/demos/index.js lists the 24 FICTIONAL sample businesses, and
 * those pages are deliberately noindexed. This file lists the 24 REAL
 * pages where VelBiz sells its own service to that trade: "website for
 * a photo studio", not "The Aperture Room, a fictional photo studio".
 *
 * The slugs here are the same 24 as content/demos, one for one, because
 * every real landing page links to its matching demo as portfolio proof.
 * That is a deliberate coupling, not an accident: `demoSlug` on each
 * vertical record must always resolve to a real content/demos/<slug>.js
 * file, and scripts/check-verticals.mjs enforces it (added alongside
 * this file) so the two lists cannot silently drift apart.
 *
 * WHAT LIVES HERE VS IN content/verticals/<slug>.js
 *
 * This file holds only what app/sitemap.js, app/for/[slug]/page.js's
 * generateStaticParams, and StructuredData.js's per-vertical Service
 * loop need to run without importing all 24 full records: slug, trade,
 * category. The prose (h1, intro, needs, faqs) lives in the per-slug
 * file and is loaded only by the route that renders it, same reasoning
 * content/demos/index.js already gives for its own split.
 *
 * ONE RULE THIS FILE MUST NEVER BREAK: no phone numbers, no VelBiz-owned
 * pricing amounts, no fictional business facts. Real prices live only in
 * config/site.js; this file is a routing manifest, not a content file.
 */

export const VERTICALS = [
    { slug: 'bakery', trade: 'Bakery', category: 'food' },
    { slug: 'restaurant', trade: 'Restaurant', category: 'food' },
    { slug: 'retail', trade: 'Grocery shop', category: 'retail' },
    { slug: 'dental-clinic', trade: 'Dental clinic', category: 'health' },
    { slug: 'wellness-and-beauty', trade: 'Salon and spa', category: 'health' },
    { slug: 'home-stay', trade: 'Home stay', category: 'stay' },
    { slug: 'online-shop', trade: 'Online shop', category: 'retail' },
    { slug: 'photo-studio', trade: 'Photo studio', category: 'services' },
    { slug: 'clinic', trade: 'Clinic', category: 'health' },
    { slug: 'hospital', trade: 'Hospital', category: 'health' },
    { slug: 'lodging', trade: 'Lodge', category: 'stay' },
    { slug: 'ecommerce', trade: 'Ecommerce store', category: 'retail' },
    { slug: 'small-business', trade: 'Hardware and general store', category: 'retail' },
    { slug: 'education', trade: 'Tuition and coaching centre', category: 'services' },
    { slug: 'logistics', trade: 'Logistics and courier', category: 'industry' },
    { slug: 'warehouse', trade: 'Warehousing and storage', category: 'industry' },
    { slug: 'architecture', trade: 'Architecture and interiors', category: 'professional' },
    { slug: 'home-services', trade: 'Home services (plumbing, electrical, painting)', category: 'services' },
    { slug: 'real-estate', trade: 'Real estate and plots', category: 'property' },
    { slug: 'accountant', trade: 'Accountant', category: 'professional' },
    { slug: 'advocate', trade: 'Advocate', category: 'professional' },
    { slug: 'car-service', trade: 'Car service and repair', category: 'automobile' },
    { slug: 'bike-service', trade: 'Bike service and repair', category: 'automobile' },
    { slug: 'auto-resale', trade: 'Used vehicle dealer', category: 'automobile' },
];

export const VERTICAL_SLUGS = VERTICALS.map((v) => v.slug);

export function findVertical(slug) {
    return VERTICALS.find((v) => v.slug === slug) ?? null;
}
