# Client Site Playbook

**Read this file before writing any code.** It is the build standard for
small-business brochure sites: React + Vite, static, Netlify, WhatsApp
ordering. Every rule here is something that was actually built, or a defect
that was actually found, in the Liha's Karuppati build. Nothing here is
aspirational.

Target: **site number two in a weekend, not a month.**

---

## 0. Before writing code

Non-negotiable, in order:

1. **Written permission** to use the finished site as a portfolio piece, and
   a written line on who owns the code. Get it before the build, not after.
   Friend-projects turn awkward exactly when they become commercial
   references.
2. **Photo rights in writing.** Client supplies images they own, or you
   shoot/license them and bill for it. You inherit this liability and pass it
   to every future client.
3. **One-page scope**: what is included, how many revision rounds, what costs
   extra, payment 50/50. The failure mode of this business is not finding
   clients, it is the client who asks for "one small change" thirty-one times
   on a fixed fee.
4. **Confirm the domain before the first commit.** It goes in ~6 places
   (canonical, og:url, twitter:url, robots.txt, sitemap.xml, JSON-LD @id). A
   late change means editing all of them. See the domain bug in section 9.

---

## 1. Stack

Do not deviate without a reason you can state.

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 | Client knows the name, hiring pool exists |
| Build | Vite 6 | Sub-second builds, zero config |
| Icons | lucide-react | Tree-shakes, consistent stroke weight |
| Animation | GSAP *(see 8)* | Only if the design needs it |
| Host | Netlify | Free tier, edge headers, auto SSL |
| Ordering | WhatsApp deep links | See below |

**No cart, no checkout, no payment gateway** unless the client explicitly asks
and will pay for the compliance work. A small Indian food seller takes orders
on WhatsApp. Building Stripe checkout for them is building the thing that
demos well instead of the thing they will use. This is the single most
important product decision in the stack and it is the one most often got
wrong.

---

## 2. Architecture

```
src/
  config/site.js      <- ALL client-specific data. The only file you edit
                         for a new client (plus /public/images).
  components/         <- Generic. No brand names, no phone numbers.
  index.css           <- Design tokens + shared primitives.
scripts/
  check-brand-leak.mjs <- Guard. Wired into `npm run verify`.
public/
  images/             <- WebP only (see 5)
  robots.txt  sitemap.xml  favicon.ico  apple-touch-icon.png
index.html            <- SEO head + JSON-LD
netlify.toml          <- Headers, caching, SPA redirect
```

### The one rule that makes reuse work

**No client-specific value lives in `src/components/`.** Brand name, phone
number, products, social handles: all in `src/config/site.js`.

Why this matters more than it sounds: on the Liha build the phone number
appeared in **8 files, 20 times**. Cloning that repo for a new client and
missing one occurrence ships the previous client's phone number on a live
site. That is not an embarrassment, it is a lost client and possibly a lost
referral chain.

`src/config/site.js` exports, at minimum:

```js
export const brand   = { name, shortName, tagline, domain, logo, ogImage, description };
export const contact = { phone, phoneDisplay, email, address, instagram, instagramHandle };

export const phoneHref = `tel:+${contact.phone}`;
export function waLink(message) {           // builds every WhatsApp URL
  return `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
}
export const waDefault = waLink(`Hi ${brand.shortName}, I would like to enquire about ordering.`);
export function waOrder(name) { return waLink(`Hi, I would like to order ${name}`); }

export const products = [...];      // name, tamil, subtitle, img, badge, desc, tags, grid
export const trustBadges = [...];   // icon, title
export const copy = {...};          // section eyebrows/titles/subtitles
```

`phone` is digits only, country code included. **Never** write a `wa.me` URL
or a `tel:` link by hand anywhere else. Build it with the helper.

### Two tiers of enforcement

`scripts/check-brand-leak.mjs`, run by `npm run verify`:

- **Tier 1, hard fail**: phone numbers, `wa.me/<digits>`, `tel:+<digits>` in
  components. These cause a wrong-client incident.
- **Tier 2, warn only**: brand and product names in prose (FAQ answers,
  policy text, alt attributes). This copy is rewritten per client anyway;
  hoisting English paragraphs into a JS config makes it worse. The guard
  counts them so the number stays visible instead of silently drifting.

This distinction matters. A guard that fails on things you will never fix
gets disabled within a week, and then it guards nothing.

---

## 3. Design language

### Tokens, never raw values

Every color, radius, shadow, and transition is a CSS custom property on
`:root`. A component with `#2d5a27` hardcoded is a bug. Re-theming for a new
client should mean editing the token block, nothing else.

The Liha palette is a warm earth system - swap the values, keep the
structure:

```css
--font-serif / --font-sans           /* headings serif, body sans */
--bg-surface                         /* page ground */
--bg-container-lowest .. -highest    /* 5-step elevation ramp */
--primary / --primary-container / --on-primary / --on-primary-container
--secondary / --secondary-hover / --secondary-container / --on-secondary
--accent-*                           /* 1-2 accents, no more */
--text-main / --text-variant / --text-muted
--outline / --outline-variant
--soil-shadow-sm / --soil-shadow / --soil-shadow-hover
--radius-sm 8 / -md 12 / -lg 16 / -xl 24 / -full 9999px
--transition-smooth: 0.3s cubic-bezier(0.16, 1, 0.3, 1)
--safe-bottom: env(safe-area-inset-bottom, 0px)
```

The `--on-*` pairs are the discipline worth keeping: every background token
has a matching foreground token, so contrast is decided once in the palette
rather than guessed per component.

Headings serif, body sans. It is the cheapest way to look designed rather
than templated.

### Breakpoints

Mobile-first. `768px` (tablet), `1024px` (desktop), `900/899px` for the
nav swap. Container maxes at `1200px`, padding `1rem -> 1.5rem -> 2rem`.

### Touch rules

These are not polish, they are the difference between a site that feels
native on a phone and one that feels like a desktop site shrunk down. Your
audience is on mid-range Android phones.

```css
/* Hover effects ONLY where hover exists. On touch, :hover sticks
   after tap and leaves elements visually stuck. */
@media (hover: hover) and (pointer: fine) {
  .soil-card:hover { transform: translateY(-4px); }
}

/* Touch gets press feedback instead */
@media (hover: none) {
  .soil-card:active { transform: scale(0.985); }
}
```

- **Minimum 48px touch target** on every button (Apple HIG). `min-height: 48px`
  on `.btn`.
- `touch-action: manipulation` on interactive elements - kills the 300ms
  tap delay.
- `-webkit-tap-highlight-color: transparent` globally.
- `user-select: none` on buttons.
- Respect the notch: `--safe-bottom` on any fixed bottom bar.

### Never let :hover outrank an active/selected state

`.tab:hover` is specificity (0,2,0); `.tab--active` is (0,1,0). **Hover wins
regardless of source order.** The selected tab's background gets repainted
while its white text survives, rendering white-on-light-grey: invisible.
Only appears when hovering the already-selected element, so no screenshot
review catches it.

```css
.tab:hover:not(.tab--active) { background: var(--surface-hover); }
```

### Carousels: CSS scroll-snap, not JS transforms

The Liha build shipped a JS transform carousel and replaced it with native
CSS scroll-snap. Native gets hardware acceleration, real momentum, and
correct touch feel for free. Reach for JS only when scroll-snap genuinely
cannot express the layout.

---

## 4. House style

**No em dashes (U+2014) anywhere.** Not in UI copy, buttons, toasts, code
comments, commit messages, or markdown. Nobody types one on a keyboard, so it
reads as generated text. Use a hyphen, a comma, or a full stop. En dashes in
numeric ranges (10-20) and box-drawing characters are fine.

---

## 5. Images

- **WebP only.** The Liha PNG-to-WebP conversion was a **92% size reduction**
  at visually identical quality.
- Keep each product image **under ~150KB**. Total `/public/images` under
  ~2MB.
- **Every `<img>` needs real alt text.** Not the filename. For products:
  `alt={`${p.name} (${p.tamil})`}`.
- `loading="lazy"` below the fold, `loading="eager"` on the hero image only.
- Explicit `width`/`height` on fixed-size images (logos, icons) to prevent
  layout shift.
- Global `img { max-width: 100%; height: auto; display: block; }`.

---

## 6. SEO

`index.html` carries all of it. Checklist, all present on Liha:

**Core**: `<title>`, `meta description`, `meta keywords`, `link canonical`,
`lang` on `<html>`, viewport.

**Open Graph** (this is what renders when the client shares the link on
WhatsApp, which is how the site will actually spread):
`og:type`, `og:url`, `og:title`, `og:description`, `og:image`,
`og:image:secure_url`, `og:image:type`, `og:image:width` (1200),
`og:image:height` (630), `og:image:alt`, `og:site_name`.

The OG image must be a real 1200x630 JPG at an absolute URL. WhatsApp will
not render a relative path or a WebP.

**Twitter**: `summary_large_image`, url, title, description, image.

**Geo** (worth it for a regional business):
`geo.region` (`IN-TN`), `geo.placename`, `geo.position`, `ICBM`.

**JSON-LD `@graph`** with three node types:
- `Store` - name, url, logo, image, description, telephone, priceRange,
  `PostalAddress`, `sameAs` (social links), with an `@id` anchor.
- `ItemList` of `Product` nodes - each with name, description, image, and an
  `Offer` (priceCurrency INR, availability InStock, seller referencing the
  store `@id`).
- `FAQPage` with `Question` / `acceptedAnswer` nodes.

**Keep the JSON-LD FAQ text in sync with the rendered FAQ component.** They
drifted on Liha - the structured data claims 9-12 months shelf life while the
component says 6-12. Google reads one, the customer reads the other.

**`robots.txt`** - allow all, absolute sitemap URL.
**`sitemap.xml`** - the root plus each `#anchor` section with `lastmod`,
`changefreq`, `priority`.

### Fonts without blocking render

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="...&display=swap" />
<link href="...&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
<noscript><link href="...&display=swap" rel="stylesheet" /></noscript>
```

The `media="print"` + `onload` trick makes the stylesheet non-blocking. The
`<noscript>` fallback keeps it working with JS disabled.

---

## 7. Netlify and security

`netlify.toml`, copy wholesale:

```toml
[build]
  command = "npm run build"
  publish = "dist"

# SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Hashed assets - immutable, one year
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Images - 30 days
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=2592000"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-src https://www.instagram.com; object-src 'none'; base-uri 'self'"
```

Notes:
- `frame-src` lists **only** the embeds you actually use. Drop
  `https://www.instagram.com` if there is no Instagram feed.
- `'unsafe-inline'` in `script-src` is there for the JSON-LD block. Acceptable
  on a static site with no user input; do not carry it into anything with a
  form that hits a server.
- `X-Frame-Options: DENY` plus `frame-ancestors` would be better still.
- Cache rule ordering matters: `/assets/*` before `/*`.

### Custom domain

Apex `A` record -> `75.2.60.5`. `www` `CNAME` -> `<site>.netlify.app`.
Netlify issues Let's Encrypt automatically once DNS verifies.

**No secrets in a static site, ever.** Everything in `dist/` is public. If a
build needs an API key, it needs a Netlify Function, and that is a different
quote.

---

## 7b. 404 handling

There are two ways to serve a 404 and they conflict. Know which one you are
using.

**The Liha build has both**, which is why this needs saying:

- `public/404.html` - a standalone, fully self-contained page (inline CSS,
  its own font links). Netlify serves this automatically for unmatched paths
  *when there is no catch-all redirect*.
- `src/components/NotFound.jsx` - a React component. `App.jsx` checks
  `window.location.pathname` against a whitelist of valid paths on mount and
  renders it for anything else.

**Because `netlify.toml` has the SPA catch-all redirect (`/* -> /index.html`,
status 200), `public/404.html` never renders.** Every unmatched path returns
index.html with a 200, React boots, and the component takes over. The static
file is dead weight.

Pick one:

- **SPA route (what Liha does).** Keep the catch-all redirect and the React
  component. Delete `public/404.html` to avoid confusing the next person.
  Downside: unmatched URLs return **HTTP 200, not 404**, which is wrong for
  crawlers. Acceptable on a single-page site with no real routes.
- **True 404.** Drop the catch-all redirect, keep `public/404.html`. Netlify
  serves it with a real 404 status. Correct for SEO. Do this if the site has
  no client-side routing to protect, which on a one-page brochure site is
  usually true.

**Recommendation for the next build: true 404.** A one-page site does not
need SPA routing, and a real 404 status is the honest answer. Keep the
`#anchor` links working, since they never hit the server.

Either way the 404 page must: carry the brand logo, name the site, and give
one obvious route home.

---

## 8. Performance

Liha ships **116KB of gzipped JS**, most of it GSAP across 3 components, for
a page that is fundamentally text and images. On a mid-range Android phone on
3G in a Tamil Nadu town - the actual audience - that is a slow first paint.

For the next build:

- **Start without GSAP.** CSS transitions and scroll-snap cover most of it.
  Add GSAP only if a specific interaction genuinely needs it, and accept
  ~70KB gzipped when you do.
- Budget: **under 60KB gzipped JS** for a brochure site. Check with
  `gzip -c dist/assets/*.js | wc -c` after every build.
- CSS should land near 3-4KB gzipped. Liha does 3.5KB. This is achievable.
- `sourcemap: false` in the Vite build config.

---

## 9. Bugs found on Liha, do not repeat

Each of these shipped or nearly shipped.

1. **Phone number in 8 files.** Fixed by `config/site.js` + the guard.
2. **A live phone number buried in refund policy prose.** Invisible to a
   grep for `tel:` or `wa.me` because it was plain text inside a `<p>`. The
   Tier-1 guard regex catches bare `\b\d{12}\b` and `+91 xxxxx xxxxx`
   specifically for this.
3. **Domain mismatch.** `lihashop.in` in the HTML canonical, robots, and
   sitemap; a different domain in the config. A wrong canonical tag actively
   harms indexing. **Verify the domain in all 6 places before launch.**
4. **Instagram handle typo.** `lihas_karupatti` vs `lihas_karuppati`, one
   letter apart, silently a dead link. Single-source it in config.
5. **JSON-LD drifted from the rendered FAQ.** Shelf life 9-12 months in
   structured data, 6-12 in the component.
6. **JSX braces inside plain object literals.** `href: {waLink(...)}` inside
   a JS array is a syntax error, not JSX. Caught only by building. Always run
   `npm run verify` after a bulk edit.
7. **A local function shadowing an imported one.** A component-local
   `waLink()` shadowed the imported `waLink()` and would have recursed
   infinitely. Renamed to `buildOrderLink()`.

---

## 10. Launch checklist

Run top to bottom. Nothing gets skipped because it "looks fine".

**Build**
- [ ] `npm run verify` passes (guard + build)
- [ ] Gzipped JS under budget
- [ ] `npm run preview`, click every link and CTA

**Config**
- [ ] Zero client data in `src/components/` (Tier 1 clean)
- [ ] Phone appears exactly **once** in the built bundle
  (`grep -o '<digits>' dist/assets/*.js | wc -l`)
- [ ] Every WhatsApp link opens with the right prefilled message
- [ ] Social handles verified by actually opening them

**SEO**
- [ ] Domain identical in: canonical, og:url, twitter:url, robots.txt,
      sitemap.xml, JSON-LD `@id`
- [ ] OG image is a real 1200x630 JPG at an absolute URL
- [ ] Link previews correctly in a WhatsApp message to yourself
- [ ] JSON-LD passes Google Rich Results Test
- [ ] JSON-LD FAQ text matches the rendered FAQ word for word
- [ ] `sitemap.xml` `lastmod` dates are current

**Assets**
- [ ] All images WebP, each under ~150KB
- [ ] Every `<img>` has meaningful alt text
- [ ] `loading="eager"` on hero only, `lazy` elsewhere
- [ ] favicon.ico + apple-touch-icon.png present

**Mobile**
- [ ] Tested on a real mid-range Android phone, not just devtools
- [ ] No stuck `:hover` states after tapping
- [ ] All touch targets >= 48px
- [ ] Bottom bar clears the notch/home indicator
- [ ] No horizontal scroll at 320px width

**Netlify**
- [ ] Security headers live (check devtools Network tab, not the toml)
- [ ] CSP `frame-src` lists only embeds actually used
- [ ] SPA redirect works: visit `/nonsense`, get the 404 component
- [ ] HTTPS + auto-redirect from http
- [ ] Custom domain resolves on apex and www

**Legal and handover**
- [ ] Privacy policy, shipping, returns, terms all reachable
- [ ] Policy contact details pulled from config, not typed in prose
- [ ] Portfolio permission in writing
- [ ] Client owns their domain and Netlify account, or knows you hold it
- [ ] Retainer agreed: hosting, updates, seasonal changes

---

## 11. New client, step by step

1. `git clone` this repo, delete `.git`, `git init`.
2. Rewrite `src/config/site.js` top to bottom.
3. Replace `/public/images` with client assets, converted to WebP.
4. Retheme the token block in `src/index.css`.
5. Rewrite prose: FAQ, policies, heritage story, hero copy.
6. Update `index.html`: title, description, keywords, all OG/Twitter tags,
   geo tags, JSON-LD.
7. Update `robots.txt` and `sitemap.xml` with the new domain.
8. Delete unused components (`InstagramFeed` if no Instagram, etc.) and
   trim CSP `frame-src` to match.
9. `npm run verify`.
10. Walk section 10 in full.

If step 2 takes more than an hour, something leaked into the components that
should not have. Fix the leak rather than working around it - that is the
whole asset.

---

## 12. Where this site differs

This repo is the Velbrant Studios site, not a client brochure build. The
playbook above was written against the Liha build and is binding wherever it
transfers. These deviations are deliberate and stated, per section 1.

**Stack.** Next.js 16 with the app router, not React + Vite. This site is
statically generated and has a route-level layout, metadata and image
pipeline that Vite would have to reimplement. Sections 1 and 7 (Netlify SPA
redirect, `public/404.html`) do not apply: there is no client-side router to
protect and Next emits a real 404.

**Icons.** `@phosphor-icons/react` via the `/ssr` entry rather than
`lucide-react`, so icons render as plain SVG in server components and stay
out of the client bundle. The section 1 rationale (tree-shakes, consistent
stroke weight) is satisfied either way.

**GSAP.** Not used. A pinned ScrollTrigger horizontal pan was built for the
capabilities section and removed: it hijacked scroll, and released with a
visible jump when the user clicked a panel or scrolled away. It is a native
CSS scroll-snap rail now, exactly as section 3 prescribes, and the dependency
is gone. Section 8's advice to start without GSAP was correct.

**No WhatsApp product ordering.** There is no catalogue. WhatsApp is the
enquiry channel only, and the message is assembled in `config/site.js` by
`waEnquiry()`.

**What still binds, and does most of the work here:** `config/site.js` as the
single source of contact data with the tier-1 guard, no em dashes, tokens
never raw values, the hover guard, the hover-versus-active specificity rule,
48px touch targets, `touch-action: manipulation`, and the launch checklist in
section 10.
