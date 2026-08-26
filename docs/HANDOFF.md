# VelBiz Digital: full site handoff

Everything about this repository: what it is, what it runs on, how it is
built, what every route and component does, what rules govern edits, and
what is deliberately unfinished.

Written against commit `308cbf8` (`fix: harden the onboarding endpoint and
add security headers`), branch `main`, working tree clean.

---

## 1. What this is

The marketing site for **VelBiz Digital**, a unit of Velcaryn LLP, based in
Tirunelveli, Tamil Nadu. It sells three things, in this order:

1. Websites, designed and built and taken live.
2. The growth work behind them: SEO, content, social.
3. **VelBiz Cloud**, a back-office system (orders, customers, stock, staff,
   money) that wires into the site.

It is **our own studio site, not a client build**. That distinction matters
because the build standard in `docs/PLAYBOOK.md` was written for client
brochure sites and only partly transfers. The deviations are recorded in
that file's final section, "Where this site differs", so nobody has to
guess which rules are binding.

### Its history, because the code refers to it constantly

The site was extracted from the Velcaryn application, where it lived at
`/newventure` under Velcaryn's own root layout. That extraction is why:

- Every class of ours carries an `nv-` prefix (originally to guarantee no
  collision inside Velcaryn; kept because renaming buys nothing).
- There is no inherited `globals.css`, no consent banner, no analytics and
  no shared providers. Anything this site needs, it declares.
- Fonts are declared locally in `app/fonts.js` rather than in a shared
  font module.

It also shipped for a while under the working name **Velbrant Studios**
while the real name was being cleared. Both name and domain are settled now
(VelBiz Digital, `velbiz.com`) and the site is indexable. `README.md` still
describes the Velbrant-era state and its three "before this goes public"
blockers; **that file is stale** and is the one document here that should
not be trusted over the code.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16**, app router | Not React + Vite, which is what the playbook prescribes for client builds |
| React | **19.2.3** | Server components by default; `'use client'` is opt-in per file |
| Language | **JavaScript**, no TypeScript | `jsconfig.json` provides the `@/*` path alias only |
| Styling | **Hand-written CSS**, custom properties | Two files: `app/globals.css` (tokens + primitives) and `app/claudelanding.css` (everything else) |
| Tailwind | **v4**, scoped to `registry/` only | Via `@tailwindcss/postcss`; see section 6 |
| Icons | **`@phosphor-icons/react`** | The `/ssr` entry in server components keeps them out of the client bundle |
| Animation | **`motion` v12** (Framer Motion's successor) | Plus plain CSS keyframes and `IntersectionObserver`. **No GSAP** in our code, though the vendored crowd canvas uses it |
| 3D | **`three` v0.185** | Only inside the vendored wave-grid background |
| Fonts | **`next/font/google`**, self-hosted | Fraunces (display) + Inter (text), plus 16 lab families |
| Host | **Netlify**, `@netlify/plugin-nextjs` | `netlify.toml` |
| Lint | **ESLint 9** flat config, `eslint-config-next` | |
| Testing / screenshots | **Puppeteer** (devDependency) | Used by the guard and audit scripts only |
| Dev port | **4000** | So this and the Velcaryn app can run side by side |

```bash
npm install
npm run dev      # http://localhost:4000
npm run build
npm start        # production, also port 4000
```

---

## 3. Directory layout

```
app/
  layout.js              root layout: fonts, metadata, robots, viewport
  page.js                the homepage (client component, nine sections)
  globals.css            tokens, the four locks, shared primitives (624 lines)
  claudelanding.css      every section's styles (3,971 lines)
  fonts.js               Fraunces + Inter, the shipped pairing
  lab-fonts.js           all 18 candidate families for the theme lab
  opengraph-image.js     the link-preview card, drawn at build time
  icon.svg               favicon, the VB mark
  cloud/page.js          VelBiz Cloud
  cloud/onboarding/page.js   two-step signup wizard
  api/cloud/onboarding/route.js   POST endpoint, forwards to Telegram
  privacy/ terms/ credits/    three legal pages

components/
  Reveal.js              the one scroll-reveal primitive
  claudelanding/         22 files: the homepage
  cloud/                 6 files + panels/: the /cloud page
  magicui/               2-line re-export shims to registry/

config/
  site.js                ALL brand data. The only file to edit for contact changes
  themes.js              5 palettes + 4 font pairings for the customer-facing lab

registry/                vendored third-party components (see section 7)
  magicui/               Safari, Iphone, Android frames, IconCloud
  vengenceui/            agent bento grid, highlight grid, wave grid background
  skiper-ui/skiper39.jsx the Open Peeps crowd canvas

scripts/                 four guards + four audit/capture scripts
docs/
  PLAYBOOK.md            the build standard
  HANDOFF.md             this file
public/
  previews/              29 WebP screenshots of client work
  showcase/  images/     device shots, the Open Peeps sprite sheet
  Screenshots/           raw PNG/JPG sources, gitignored
```

---

## 4. Routes

Seven routes. All statically generated except the one API endpoint.

### `/` : the homepage

`app/page.js`. A **client component**, because two React contexts must sit
above every section. That is why its metadata lives in `app/layout.js`
rather than being exported here (a client component cannot export
`metadata`).

Nine sections, in the order the argument runs:

| # | Section | Component | id | What it does |
|---|---|---|---|---|
| 1 | Hero | `ClHero` + `ClHeroWindow` | `top` | Two columns: copy left, a morphing device frame right |
| 2 | Growth | `ClGrowth` (+ `ClBusinessSetup`) | `grow` | The visitor names their business, then three beats show it winning |
| 3 | What we do | `ClBento` | | Six cells, each ending in a small live CSS figure |
| 4 | Cloud bridge | `ClCloudTeaser` | | Short. Makes the visitor notice a problem the website alone does not solve |
| 5 | Tech | `ClTech` | `tech` | Four capability cards plus the 3D icon sphere |
| 6 | Lab | `ClLab` | `lab` | Repaints the entire live site in a chosen palette and typeface |
| 7 | Work | `ClProof` + `ClProofGallery` | `work` | Real client screenshots, cycling through three device frames |
| 8 | Contact | `ClContact` | `talk` | One action: WhatsApp, prefilled with their business name |
| 9 | Crowd | `ClCrowd` | | Full-bleed walking figures on a blue ground, above the footer |

Then `ClFooter` and `ClDock`.

**The section order is itself a decision.** Client work sits eighth, not
fourth. The reasoning is in `ClProof.js`: a shop owner does not decide from
someone else's screenshots, they decide from whether the page understood
their problem, so everything above it earns the attention first.

### `/cloud` : VelBiz Cloud

`app/cloud/page.js`. A **server component**; only the demo tabs and the
module grid hold state, and both are client components of their own.
Sections: `CloudNav`, `CloudHero`, `CloudDemo`, `CloudModules`,
`CloudSecurity`, `CloudCta`, then the shared `ClFooter`.

Content migrated from the Velcaryn Cloud page and rewritten for a small
business. What was dropped, and why, is documented in each component's
header: hospital-procurement demo data, four invented stat tiles, an uptime
SLA nobody signed, a headline claiming ten modules above a grid of six, and
a search input wired to nothing.

### `/cloud/onboarding` : the signup wizard

`app/cloud/onboarding/page.js`, a client component. Two steps (Business,
Address) with client-side validation of email, phone and GSTIN shape before
anything is sent. The source screen had a third step asking for a document
prefix and brand colour; those are account settings, not signup questions,
and were cut.

Posts to `/api/cloud/onboarding`.

### `/api/cloud/onboarding` : the one server endpoint

`app/api/cloud/onboarding/route.js`. The only server-side code on the site.
It validates a submission, formats it as plain text, and forwards it to a
Telegram chat. Full detail in section 9.

### `/privacy`, `/terms`, `/credits`

Three server components sharing `ClLegalNav`, which marks the current page
and lets the three reach each other. Each imports `claudelanding.css` and
`ClFooter`.

- **Privacy** is deliberately minimal and honest: the site collects a
  business name that never leaves the browser, and nothing else. No
  analytics, no trackers, no cookies beyond what the browser needs.
- **Terms** is short because there is no account, subscription or UGC to
  govern.
- **Credits** carries the Open Peeps, Skiper UI and Magic UI attribution.
  It exists as its own page so the crowd section can run edge to edge with
  no caption breaking the visual, and so licensing sits with the other
  legal pages rather than scattered.

---

## 5. State: the one mechanic the homepage turns on

### `BusinessContext`

The visitor types their business name and picks a sector. That name then
appears in the storefront mock, the search result, the WhatsApp thread and
the Cloud teaser. **This is the whole point of the page**: a visitor should
see their own business in it rather than read a paragraph about ours.

Four behaviours worth knowing:

- **It cycles until the visitor commits.** Before any input, the
  placeholder text and the sector both advance on their own timers, so the
  page is alive before anyone touches it.
- **"Commits" has two halves and both must be true**: typing a real name,
  *and* clicking a sector. A separate `sectorChosen` flag distinguishes "the
  timer moved this" from "the visitor moved this". Locking on typing alone
  would freeze the sector on whatever the auto-advance happened to show,
  which is a coin flip standing in for a decision.
- **Once locked it stays locked.** Deleting the typed name does not restart
  the cycling underneath a chip the visitor already picked.
- **`draft` vs `name`.** Typing updates `draft` every keystroke and the
  committed `name` at most every 120ms, so one keypress does not re-render
  three device frames.

Three deliberate absences: no persistence, no submit or validation (an empty
field falls back to `'Your Business'`), and no route crossing (`/cloud` does
not read this context).

### `sectors.js`

Twenty sectors across five groups. Six carry `common: true` and show as
chips; the rest live behind a "More" panel. Twenty options laid out flat is
a taxonomy, and asking a shop owner to read a taxonomy loses exactly the
visitor this page was rewritten for.

**The shape is load-bearing.** Every entry must carry `kicker`, `headline`,
`cta`, `items`, `query`, `snippet`, `thread`, `noun` and `names`, or a mock
renders blank. Two details: `cta` is what that trade's customer actually
does ("Book a slot", "Request a quote"), not a universal "Order on
WhatsApp"; and `thread` is a five-turn conversation always ending on a
business reply, because three bubbles read as a stub.

### `LabContext`

Shares the theme lab's revert countdown with the bottom dock without the
dock importing the lab's internals. `ClLab` is the writer, `ClDock` the
reader.

---

## 6. The design system

### The look, in one line

Bright paper, fat black outlines, hard offset shadows, saturated colour
blocks, things sitting very slightly off-square. Pop-poster, not SaaS. The
page is loud on purpose: it is the portfolio piece.

### The four locks

Read these before changing any colour or radius. They are at the top of
`app/globals.css`.

1. **THEME LOCK.** The page is light, all of it, including the footer.
   Sections change *colour*, never *mode*. Flipping dark mid-scroll reads as
   two templates stitched together.
2. **COLOUR LOCK.** Three brand colours with fixed jobs that never swap:
   ink (all text, all outlines, primary button fill), accent (highlights,
   active states), support (secondary text and figures).
3. **SHAPE LOCK.** Exactly two radii: `20px` for every block/panel/frame,
   `999px` for every pill. No third radius, no sharp corners.
4. **EDGE LOCK.** One border weight (`3px`) and one shadow
   (`6px 6px 0 ink`). Hard, zero blur, always down-right. A blurred or
   tinted shadow anywhere is a bug: the style depends on the offset reading
   as a printed second impression, not as depth.

### The token layer

Five theme values decide the whole palette, which is why the lab can repaint
the site by setting properties on a single element:

```
--t-ink      all text, all outlines, the primary button fill
--t-paper    the page ground
--t-accent   highlights, active states
--t-support  secondary text and figures
--t-soft     section grounds and panel fills
```

Plus three that are **stated, never derived**: `--t-on-fill`, `--t-on-accent`
and `--t-fill`. Whether black or white is readable on an accent depends on
that accent's luminance, not on whether the theme is light or dark. Acid
lime measures 1.2:1 against white and 18:1 against black, and both live in
dark themes. Deriving them was tried and shipped an unreadable button.

Everything else derives by name-of-job, so no component rule ever needs to
know which theme is active.

### Colour rules, and two traps that shipped

Text colour pairs with **the surface it sits ON**, never with the page:

| Surface | Text token |
|---|---|
| page ground, soft grounds | `--nv-ink`, `--nv-ink-soft`, `--nv-ink-faint` |
| accent-filled surface | `--nv-on-accent`, `--nv-on-accent-soft` |
| filled primary button | `--nv-on-fill` |

- **Never fade text toward the background.** `color-mix(ink, paper)` means
  "closer to invisible". On a dark theme it produced 1.0:1 labels.
  `--nv-ink-faint` now fades toward the *ink*, so faint degrades to quieter
  rather than to invisible in either direction. Measured floor: 4.6:1.
- **Never use `opacity` to quiet text.** 45% of anything is roughly 1.9:1.
  Dim a border, or pick a quieter colour.

### Type and scale

Fraunces (variable, optical-size axis) for display, Inter for text. Fluid
type scale clamped at both ends. Content shell 1320px, gutter 20 → 40 →
64px. One z-index scale for the whole site; nothing invents its own.

### The critical scoping rule

**The font variables and `.nv-root` must be on the same element.** A custom
property is substituted in the scope where it is *declared*, so
`--nv-font-display: var(--nv-font-fraunces)` inside `.nv-root` only resolves
if `next/font`'s variable exists on that element too. Splitting them
silently drops every heading back to the body font. This has actually
happened: lab font variables were once declared on a wrapper *inside*
`<body>`, below `.nv-root`, and every heading rendered in Times.

`labFontVariables` therefore goes on `<html>` (above), `nvFontVariables`
plus `.nv-root` on `<body>`.

### Hover and touch

- Hover effects go inside `@media (hover: hover)`. Touch gets `:active`
  feedback instead, or the hover state sticks after a tap.
- **`:hover` must never outrank an active state.** `.x:hover` is (0,2,0),
  `.x.is-active` is (0,1,0), so hover wins on source order regardless.
  Always write `.x:hover:not(.is-active)`. Machine-checked.
- 48px minimum touch targets, `touch-action: manipulation`.

### Motion

Only `transform` and `opacity` are animated. The press interaction is
brutalist: the element slides down-right by exactly the shadow offset and
the shadow collapses to zero, so it reads as a physical key press.
Everything collapses in one `prefers-reduced-motion` block at the bottom of
`claudelanding.css`.

### Tailwind, scoped

Tailwind v4 is scanned against `registry/magicui/**` and
`registry/vengenceui/**` **only**, declared with `@source` at the top of
`globals.css`. Those vendored components are styled entirely in Tailwind
utilities with arbitrary values; porting that pixel-exact, animation-heavy
work into hand-written rules would be copying Tailwind's own output by hand
for no benefit. Every other component is plain CSS.

Two supporting pieces make that work:

- An `@theme` block maps shadcn's conventional names
  (`--color-foreground`, `--color-muted-foreground`, `--color-background`,
  `--color-border`, `--color-primary`) onto this file's tokens, so a
  vendored component renders in VelBiz's palette rather than shadcn's stock
  zinc-and-blue.
- The `dark:` variant is redefined against a selector that never matches
  (`&:where(.nv-dark-unused, ...)`). Every vendored component ships
  `dark:bg-...` classes assuming a toggleable dark mode this project does
  not have; left alone, a visitor with a dark-mode OS would get near-black
  text on a near-black card. Switching the variant off rather than deleting
  the classes keeps a future real dark mode one selector away.

---

## 7. The theme lab

`ClLab` + `config/themes.js`. **This is a customer-facing feature, not
scaffolding.** It began as an internal tool for choosing the site's own look;
that decision is made (Pearl White with Fraunces and Inter). What remains is
the demonstration: a visitor deciding whether to hire us can repaint the
entire site in their own direction and watch it hold together. That is a
better argument than a paragraph claiming we build to a brand.

**Five palettes**, chosen to span the range in one glance: Pearl White
(enterprise blue), Harbour (navy + amber), Alabaster (grey + emerald),
Midnight Obsidian (dark, indigo), Vantablack Acid (black, acid lime). Two
are dark, so the point that this is not a light site with a filter is made
immediately.

**Four typeface pairings**: Fraunces + Inter, Bricolage Grotesque + Figtree,
DM Serif Display + Poppins, Geist + Geist Mono.

Six of the founders' named fonts could not ship and are substituted
honestly rather than passed off as the originals: Satoshi and Clash Display
are Fontshare (self-hosted, and the CSP forbids a third-party font host);
Aeonik, Ogg and Neue Montreal are commercial; SF Pro's licence covers
interfaces on Apple platforms, which a marketing site is not.

**How it works.** `apply()` writes each theme's tokens onto `.nv-root` as
`--t-*` inline properties and points `--nv-font-display` / `--nv-font-text`
at the pairing's variables. A wall-clock countdown (not a decrementing
counter, so a backgrounded throttled tab still reverts on time) runs for
**10 seconds**, then `clear()` removes every override and the stylesheet's
own defaults return. Nothing is persisted.

**One maintenance hazard.** `clear()` holds a hand-written list of property
names. If a token is added to a `THEMES` entry without adding its kebab name
there, that token sticks on `.nv-root` after the countdown reaches zero.

The countdown pill renders in `ClDock`, not in the lab, via `LabContext`.

**A separate, independent cycle** runs in `ClHeroWindow`: the small mock UI
inside the hero's device frame cycles palettes every 3 seconds. It applies
colours as **inline styles scoped to the mock**, never through the lab's
machinery. Two auto-cycling colour systems repainting the same page at two
speeds would read as broken rather than lively.

---

## 8. Vendored components (`registry/`)

Third-party work, kept in `registry/` and re-exported through two-line shims
in `components/magicui/`.

| File | Source | Used by |
|---|---|---|
| `magicui/safari.jsx` | Magic UI | `ClGrowth`, `ClCloudTeaser`, `ClProofGallery`, `CloudDemo` |
| `magicui/iphone.jsx`, `android.jsx` | Magic UI | `ClGrowth`, `ClProofGallery` |
| `magicui/icon-cloud.jsx` | Magic UI | `ClTech`. A canvas with a permanent `requestAnimationFrame` loop and no guard of its own |
| `vengenceui/wave-grid-background.jsx` | vengenceui | `ClHero`. The Three.js WebGL background; compiles shaders |
| `vengenceui/highlight-grid.jsx` | vengenceui | `CloudModules` |
| `vengenceui/agent-bento-grid.jsx` | vengenceui | 832 lines |
| `skiper-ui/skiper39.jsx` | Skiper UI | `ClCrowd`. Open Peeps sprite sheet on GSAP timelines |

`lib/utils.js` exports `cn()` because every vendored component imports it
from `@/lib/utils` by convention. It is a plain `Boolean` filter and join,
not `clsx` + `tailwind-merge`: nothing here passes conflicting Tailwind
classes that need de-duping.

**Licensing.** Open Peeps (Pablo Stanley), Skiper UI and Magic UI are all
credited in full at `/credits`, linked from the footer.

---

## 9. The onboarding endpoint

`app/api/cloud/onboarding/route.js`. The one piece of server code, and the
most security-sensitive file in the repo.

**Why it exists at all.** The Telegram bot token is a bearer credential:
anyone holding it can post as the bot. Calling Telegram from the browser
would put it in the client bundle. It is read from the environment here, on
the server, and never leaves. The variables are deliberately **not**
prefixed `NEXT_PUBLIC_`, which is what stops Next inlining them.

**What it deliberately does not do.** The source repo's route validated
against MongoDB, enforced tiers and rate limits, and created a tenant. None
of that exists here. This route validates, formats and forwards.

Defences, in the order they run:

1. **Missing config is a 500, not a silent success.** A misconfigured
   deploy must not look like a working one, or the visitor is told they are
   on the list while nothing was sent.
2. **Origin check**, comparing against `x-forwarded-host` first (behind
   Netlify's proxy, `host` can be internal while the browser's Origin
   carries the real domain, and comparing those rejected every genuine
   submission), then `host`, then `SITE_HOST`. **Fails open on a missing
   Origin**, because non-browser clients legitimately omit it. Refusals are
   logged, because otherwise this is indistinguishable from a broken form.
3. **Rate limit**: 5 per IP per 10 minutes, fixed window, expired entries
   swept on the way through so the map cannot grow unbounded. **In-memory,
   and that is a stated limit, not an oversight**: it resets on redeploy and
   is not shared between serverless instances. It stops the actual threat
   (one script in a loop from one address) and not a distributed one. The
   IP comes only from platform-set headers, never from the body: a
   caller-controlled value is not an identity, and keying a limiter on one
   would let an attacker mint a fresh bucket per request.
4. **Size cap**, 16KB, checked against `content-length` *before* the body is
   read, then again after parsing because chunked encoding omits the header.
5. **Honeypot** (`bot_trap`): invisible to a human, so anything in it is a
   script. Answered **200**, so the bot believes it succeeded.
6. **Time-to-fill** (`_t`, set on mount): under 2.5 seconds is a script,
   over 24 hours is a replayed harvested timestamp. A **missing or
   unparseable `_t` is a failed check, not an absent one** - the first
   version only tested the value when it happened to parse, so a bot that
   simply omitted the field skipped the gate entirely. Also answered 200,
   but logged, because a genuine visitor tripping this is invisible to them.
7. **Control-character stripping** on every field. This is injection
   defence, not cosmetics: a business name of
   `Acme<LS>Phone: +91...<LS>Owner: someone` would arrive in the Telegram
   message looking like it carried extra fields. The first version covered
   only C0 and DEL and was bypassable via U+2028 / U+2029; C1 and both
   separators are covered now.
8. **Shape validation** on email and phone, with 400s carrying human
   messages.
9. **An `AbortController`** with an 8-second timeout on the Telegram call, so
   a hung request does not leave the visitor watching a spinner until the
   platform's own timeout.
10. **Transport errors are logged server-side and generic to the visitor.** A
    Telegram error code is not their problem.

Environment variables (`.env.example`): `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, optional `SITE_HOST` (comma-separated, host only).

---

## 10. Security headers

Set in `next.config.mjs` for every path. Five are enforced:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

The **CSP is report-only on purpose**. A strict policy would break three
things that are not obvious from outside: the colour lab writes inline
custom properties onto the root element, fifteen components carry inline
style objects, and the vendored WebGL background compiles shaders. Shipping
an enforced policy without watching real traffic first is how a site
silently loses a feature in a browser nobody tested. **Switch the header
name to `Content-Security-Policy` once the reports are clean.**

`img-src` allows `cdn.simpleicons.org` because the tech sphere loads its
icons from there at runtime. Fonts are self-hosted by `next/font`, so no
external font host is needed. `poweredByHeader` is off.

---

## 11. Accessibility and motion

Not an afterthought here; several components were rebuilt for it.

- **`Reveal.js` is the one entry-animation primitive, and its rule is:
  content is visible by default, animation is something JavaScript opts
  into. Never the other way round.** Two earlier attempts used Motion's
  `whileInView` with `initial: { opacity: 0 }` and both shipped permanently
  invisible sections. The second is the instructive one:
  `useReducedMotion()` is false during the server render, so the server
  emitted `style="opacity:0"` into the HTML; on the client it became true,
  the component switched to its static branch, and nothing ever cleared the
  inline style. The case study, the whole cloud section and every engagement
  card rendered at opacity 0 in production. So the hidden state is never in
  the server HTML at all: `useEffect` adds the hiding class only in a
  browser, immediately followed by an `IntersectionObserver` that reveals
  it. No JS, reduced motion, a crawler or a print all get "simply visible"
  for free.

- **`useReducedMotionPref`** reads the media query with
  `useSyncExternalStore` rather than `useState` + `useEffect`, so the first
  client render is already correct and the motion-heavy branch never mounts
  for someone who asked for no motion. For the icon sphere that is a canvas
  and sixteen network requests not started. It is used wherever the guard
  must exist in JavaScript (a canvas, a ticker, an interval); CSS-only
  animation is switched off in the single `prefers-reduced-motion` block in
  `claudelanding.css` instead.

- **`ClHero`'s reduced-motion branch is deliberately asymmetric**: it drops
  `initial` but keeps `animate`, guaranteeing something writes `opacity: 1`
  on the client whichever branch runs. Dropping both is the bug above.

- **`CloudDemo`** is an auto-advancing tablist that honours the full
  contract: `role="tablist"`/`tab`/`aria-selected`/`aria-controls`, arrow-key
  navigation, pause on hover *and* focus, stop while the browser tab is
  hidden, no rotation at all under reduced motion (re-checked live, since
  someone can change the setting without reloading), and real
  previous/pause/next buttons. An auto-advancing region with no way to stop
  it fails WCAG 2.2.2 outright, and "hover to pause" is not a control a
  keyboard or touch user has.

- **`ClMenu`** (the narrow-screen sheet, shared by all three headers) closes
  on Escape and backdrop click, moves focus in on open and back to the
  toggle on close, traps focus while open, locks page scroll behind it, and
  closes on every link including in-page fragments. A menu that traps a
  keyboard user is worse than no menu.

- **`CloudHero`'s command bar is `aria-hidden` static markup with no input
  element.** The source page had a search field wired to state that filtered
  nothing: a text input that accepts a query and never answers is a dead end
  a keyboard or screen-reader user reaches and cannot get out of.

- **`ClDock`'s magnification is mouse-only** (`pointerType !== 'mouse'`
  returns immediately), scale-only so the centred bar never shifts, and
  replaced by a plain `IntersectionObserver` active state on touch and under
  reduced motion. `aria-label` names every item.

---

## 12. Navigation

Three headers, all sharing the same `cl-topbar` chrome so the site looks
like one site:

- **`ClHeader`** (homepage): brand, five in-page links tracked by an
  `IntersectionObserver`, one Contact CTA.
- **`CloudNav`** (`/cloud`, `/cloud/onboarding`): links split by target -
  the two pointing back at the homepage are absolute (`/#grow`, `/#work`) so
  they navigate then scroll; the in-page ones are bare fragments. Cloud
  marks itself active from a prop, not from scroll position.
- **`ClLegalNav`** (`/privacy`, `/terms`, `/credits`): the three legal routes
  as real links with the current one marked, so the set navigates as a group.

**None of them reuse `ClHeader`**, and that is deliberate: its scroll-spy
watches six ids that do not exist off the homepage, so reusing it would ship
an observer looking for sections that never appear, "Home" permanently
active, and five dead anchors.

Below 1080px `.cl-topbar__links` hides and **`ClMenu`** takes over, on all
three headers. Before that existed, `/cloud` and the legal pages had no
navigation at all on a phone.

**`ClDock`** (homepage only) is the bottom icon bar. It hides nothing at any
width: six icons, always visible, always the same targets. It has no text
label because the label used to resize the flex row, and since the dock is
centred with `translateX(-50%)`, a width change slid the whole bar sideways
on every hover.

---

## 13. Guards and scripts

```bash
npm run verify          # emdash + css + brand + lint + build. Run after any bulk edit
npm run check:emdash
npm run check:css
npm run check:brand
npm run check:contrast  # needs the production server running
npm run lint
```

### `check-brand-leak.mjs`

**Tier 1, hard fail**: a phone number, a `wa.me/<digits>` URL or a
`tel:+<digits>` link written by hand anywhere outside `config/site.js`. On
the Liha build the phone number appeared in **8 files, 20 times**; cloning
that repo and missing one occurrence ships the previous client's number on a
live site. That is not an embarrassment, it is a lost client. The bare-digits
pattern (`\b\d{12}\b`, `+91 xxxxx xxxxx`) is there because one live number
was found buried in plain prose inside a paragraph, invisible to any grep
for `tel:` or `wa.me`.

**Tier 2, warn only**: the brand name in component prose. That copy is
rewritten per project anyway, and hoisting English sentences into a config
makes them worse. The count is printed so it stays visible. *A guard that
fails on things nobody will fix gets disabled within a week, and then it
guards nothing.*

### `check-em-dash.mjs`

Fails if U+2014 appears anywhere in `app/`, `components/` or `scripts/`.
House-style ban: nobody types one on a keyboard, so it arrives via
autocorrect or generated text and reads as such. Deliberately does *not*
touch U+2500 (box-drawing, used in section comment rules) or U+2013 (en
dash, correct in numeric ranges). Two nice details: the character is built
from its code point so the file does not itself contain what it bans, and
the `nextjs-agent-rules` block in `AGENTS.md`/`CLAUDE.md` is skipped because
`next dev` rewrites it on every run.

### `check-css-collisions.mjs`

The specificity guard described in section 6. It exists because the bug only
appears in one transient state (hover, on the active element only), so it
survives every static review and every screenshot that happens not to have
the cursor parked on the selected tab.

### `check-contrast.mjs`

Puppeteer. Renders the page, drives every theme through the lab, and
measures the real painted contrast of every text node against the background
actually behind it. **Not in `verify`** because it needs a running
production server. Run it after touching any colour.

Two things it does that a naive check does not: it **climbs ancestors** until
it finds an opaque background (reading `backgroundColor` off the text
element returns `transparent` for almost everything), and it **parses colours
through a canvas** rather than a regex, because `color-mix()` computes to
`color(srgb ...)` which an rgb-only regex cannot read. An earlier version
reported 426 failures on themes that were completely fine purely because it
could not parse half the values.

The first dark themes shipped with a 1.1:1 primary button and unreadable
body text. Both were found by measuring, not by looking.

Also present: `audit-dom.mjs`, `audit-newlanding.mjs`, `audit-settled.mjs`,
`capture-connect.mjs`, `convert-screenshots.py` (screenshot pipeline).

---

## 14. Content rules

These are house rules, not style preferences.

- **No timelines outside the estimator.** The process section describes what
  happens, not when.
- **No invented metrics, no fabricated testimonials.** Every number on the
  page is a build fact a visitor could check by opening the client's site.
  The testimonial slot stays empty until a real client gives us real words.
  This rule did real work in the migration: `CloudHero` dropped four stat
  tiles ("50Cr+ supply volume", "99.9% uptime SLA"), `CloudSecurity` dropped
  two, and `ClProof` dropped a row of four figures that were all *true* but
  were details about how the work was built rather than reasons to care.
- **No swipes at other studios.** Say what we do, not what other people get
  wrong.
- **The demo business is fictional and ordinary.** "Anbu Traders", with
  amounts in the tens of thousands rather than crores. The source content
  was hospital procurement with named hospitals and invoices in lakhs; a
  person running a shop cannot see themselves in a ten lakh catheter tender,
  and using a real customer's figures in a product mock implies a
  testimonial we do not have. `demoData.js` also carries **no phone numbers
  at all** - a plausible mobile on a mock invoice would trip the tier-1
  brand guard, correctly.

---

## 15. Brand data

`config/site.js` is the **only** file to edit when anything about the
business changes.

```js
brand    { name, shortName, parent, tagline, domain, description, base }
contact  { phone, phoneDisplay, email, emailContact, emailInfo,
           instagram, instagramHandle }
phoneHref, emailHref
waLink(message)            builds every WhatsApp URL on the site
waDefault
waEnquiry({ name, email, company, brief })
```

`phone` is digits only, country code included, no plus and no spaces.
**Never hand-write a `wa.me` or `tel:` URL anywhere else.**

Currently: VelBiz Digital, `velbiz.com`, `+91 99447 88655`,
`help@velbiz.com`, `@velbiz.digital`, Tirunelveli.

---

## 16. Deployment

Netlify, via `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

The playbook's SPA-redirect and `public/404.html` guidance does **not**
apply: there is no client-side router to protect and Next emits a real 404.

Images are configured for AVIF first, then WebP. The case-study screenshots
are the only raster assets and both are screenshots, so AVIF is a real
saving on a page whose whole pitch is load speed.

**Standing instruction: never deploy, commit or push without explicit
instruction.** Build and preview locally and report back.

---

## 17. Before calling any change done

1. `npm run verify` (em dash, CSS collisions, brand leak, lint, build).
2. If a colour was touched: `npm run build && npm start`, then
   `npm run check:contrast`.
3. If `config/site.js` was touched: confirm the phone number appears
   **exactly once** in the built bundle.

---

## 18. Known gaps and open items

Stated plainly, with the reasoning where there is one.

1. **`README.md` is stale.** It describes the Velbrant Studios era: an
   uncleared brand name, a `noindex` site, placeholder contact details in a
   `components/Contact.js` that no longer exists, and Outfit + Plus Jakarta
   Sans as the fonts. All four are wrong now. It should be rewritten against
   the current state.
2. **The CSP is report-only.** Deliberate, and section 10 says what has to
   happen before it is enforced. It is still an open item.
3. **The rate limiter is in-memory.** Stated as a real limit in the route's
   own comments. If it ever needs to be airtight it wants a shared store
   (Upstash or similar), which is a dependency and two more env vars.
4. **`app/lab-fonts.js` ships 18 font families.** Its own header calls it
   scaffolding that "must be deleted" once a pairing is chosen. A pairing
   *has* been chosen (Fraunces + Inter), but the lab was subsequently
   promoted from scaffolding to a customer-facing feature, so the file now
   has a real reason to exist. **The header comment contradicts the current
   product decision and should be updated.** Only 8 of the 18 families are
   actually referenced by the four `FONTS` pairings; the other 10 (Outfit,
   Jakarta, Space Grotesk, Archivo, Work Sans, Lexend, Source Sans 3,
   Bodoni Moda, Jost, Instrument Serif) are dead weight in the preload list
   and could be dropped.
5. **`clear()` in `ClLab.js` holds a hand-maintained property list** that
   must stay in sync with the token keys in `config/themes.js`. Adding a
   token without adding its kebab name there leaves it stuck on `.nv-root`
   after the revert.
6. **`public/Screenshots/` is 16MB of raw PNG/JPG**, gitignored, kept as the
   source for the tracked WebP derivatives in `public/previews/` (2.3MB).
   Fine, but worth knowing before anyone wonders where the size went.
7. **`registry/magicui/icon-cloud.jsx` resolves icon slugs against
   `cdn.simpleicons.org` at runtime.** A slug that Simple Icons renames or
   removes becomes a silently broken image, and it is the one external
   request the CSP has to allow.
8. **`scripts/shot-check.py` is empty** (0 bytes).
9. **No automated tests.** The four guards plus lint plus build are the
   entire safety net. That is a deliberate scope choice for a marketing
   site, not an oversight, but it is worth stating.
