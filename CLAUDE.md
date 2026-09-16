# Agent instructions

This is the Velbrant Studios site: our own studio site, not a client build.

**Read `docs/PLAYBOOK.md` before writing any code.** It is the build standard.
Every rule in it is something that was actually built, or a defect that was
actually found.

## How the playbook applies here

The playbook was written for client brochure sites: React + Vite, static,
Netlify, WhatsApp ordering. This site is Next.js and is our own. The rules
that transfer are binding; the stack choices are not, and the difference is
recorded in `docs/PLAYBOOK.md` under "Where this site differs" so nobody has
to guess.

## The rules most often broken

1. **No brand-specific data in `components/`.** Brand name, phone, email,
   social handles all live in `config/site.js`. Never write a `wa.me` or
   `tel:` URL by hand; use `waLink()` / `phoneHref`. Guarded by
   `npm run check:brand`.
2. **No em dashes (U+2014) anywhere.** Code, copy, comments, commit messages,
   markdown. Use a hyphen, comma, or full stop. Guarded by
   `npm run check:emdash`.
3. **Tokens, not raw values.** No hex colours or pixel radii in components.
   The palette and the four locks are at the top of `app/globals.css`.
4. **Hover effects go inside `@media (hover: hover)`.** Touch devices get
   `:active` feedback instead, or the hover state sticks after a tap.
5. **`:hover` must never outrank an active state.** Write
   `.x:hover:not(.is-active)`. Guarded by `npm run check:css`.
6. **Run `npm run verify` after any bulk edit.** It runs all three guards plus
   lint and the build.
7. **Run `npm run check:contrast` after touching any colour.** It renders the
   home page, switches through every theme in the brand preview, and measures
   the real painted contrast of every text node against the background
   actually behind it. It needs the production server running
   (`npm run build && npm start`), which is why it is not inside `verify`.

## The site's own look is decided

Pearl White with Fraunces and Inter, in the token block at the top of
`app/globals.css` and in `app/fonts.js`. The other four palettes and three
pairings in `config/themes.js` are a customer-facing demonstration, not
candidates: they exist so a visitor can repaint the page and see the design
system hold. Any preview always reverts to ours after ten seconds and nothing
is persisted.

## Colour rules

Text colour must always pair with the surface it sits ON, never with the page.
The tokens exist for exactly this:

| Surface | Text token |
|---|---|
| page ground, soft grounds | `--nv-ink`, `--nv-ink-soft`, `--nv-ink-faint` |
| accent-filled surface | `--nv-on-accent`, `--nv-on-accent-soft` |
| filled primary button | `--nv-on-fill` |

Two traps, both of which shipped:

- **Never fade text toward the background.** `color-mix(ink, paper)` means
  "closer to invisible", and on a dark theme it produced 1.0:1 labels. Fade
  toward the ink or the support colour instead.
- **Never use `opacity` to make text quiet.** 45% of anything is roughly
  1.9:1. Dim a border, or pick a quieter colour.

## Content rules specific to this site

- **No timelines outside the estimator.** The process section describes what
  happens, not when. The estimator gives a 1 to 3 week band against a scope
  the visitor selected, and that band is clamped in code so the arithmetic
  cannot contradict the promise.
- **No invented metrics, no fabricated testimonials.** Every number on the
  page is a build fact that can be checked by opening the client's site. The
  testimonial slot stays empty until a real client gives us real words.
- **Exception, decided by the owner on 2026-09-15:** the four figures in the
  "Built for speed, customer trust, and repeat orders" section of the landing
  page (0.8s, 2.4x, 99.4%, 100%) are kept as written at the owner's explicit
  instruction. Do not remove or "correct" them without asking.
- **No swipes at other studios.** Say what we do, not what other people get
  wrong.

## Before calling a task done

Run `npm run verify`. If the task touched `config/site.js`, confirm the phone
number appears exactly once in the built bundle.

## Deployment

**Never deploy, commit, or push without explicit instruction.** Build and
preview locally and report back.


## The landing page design language

Written after the /newlanding-v4 build (September 2026), which is the
look every future page follows. Everything below was either built there
or was a defect found there. Read it before touching any page.

### The look, in one line

Bright paper, fat ink outlines, hard offset shadows, one sapphire accent,
things sitting slightly off-square, and real pictures: illustrations,
screenshots of shipped sites, and small animations. Never a mock drawn in
divs, never an invented number.

### Components we use, and where they live

- `registry/magicui/`: `dock` (bottom dock), `aurora-text` (one word in
  the hero), `shine-border` (metric cards), `pulsating-button` (the one
  WhatsApp CTA), `sparkles-text` (one heading), `glyph-matrix` (the 404),
  plus the older `safari`, `iphone`, `android` frames. All vendored by
  hand as JSX, TypeScript removed, every raw colour replaced by a token.
- `registry/reactbits/TextType.jsx`: the typed line in the hero.
- `components/newlanding-v4/Nl4Lottie.js`: the only way a Lottie is
  rendered. `lottie-react` 3, `LottieLight`, dynamic import with ssr off,
  plays only while in view, still under reduced motion.
- Illustrations are the owner's SVGs in `public/SVGs/`, rendered as plain
  `<img>` with width and height set and `alt=""` when the text beside
  them says the same thing. Single-colour glyphs (the dock icons) are CSS
  masks over `currentColor` so they recolour with their state.
- `Reveal` is used ONCE per section, on the heading block, never on
  content. See "Trap A" below.

### Adding a shadcn / magicui / React Bits component

- `pnpm` is not installed and `shadcn add` must not be run: it writes
  `.tsx` into a `tsx: false` project and adds `lucide-react`, which the
  playbook excludes. Fetch the registry JSON with curl, read
  `.files[0].content`, and write it by hand as `.jsx` under
  `registry/<source>/`. Strip types and `cva`. Replace every colour utility
  or literal with a token. Keep structural Tailwind utilities only.
- Any new folder under `registry/` needs an `@source` line in
  `app/globals.css`, and the dev server MUST be restarted after adding
  it: Turbopack does not re-scan sources, and the dock once rendered as a
  vertical block of labels for exactly that reason. The production build
  was correct throughout, so if a component looks unstyled in dev,
  restart before debugging CSS.
- Keyframes a vendored component needs go in `app/globals.css` as plain
  `@keyframes nv-*`, listed in its reduced-motion block, not as Tailwind
  theme utilities.
- React Bits Pro and the watermelon FAQ and pricing items are unavailable
  (paywalled, or 404). Build the described design on the tokens instead
  and say so in the file header.
- `lottie-react` 3 exports named components only. `dynamic(() =>
  import('lottie-react'))` crashes hydration; unwrap the export:
  `dynamic(() => import('lottie-react').then((m) => m.LottieLight), { ssr: false })`.

### Layout and copy rules, all guarded by `npm run verify` or the capture script

- Mobile first. Every grid is one column at the base and gains columns
  under `min-width` queries. No `max-width` queries for layout.
- Section headings are in Title Case. One `.nv4-h2`-style heading per
  section, capped at about 20ch.
- The hero headline fits two lines at 1440px. Past two is a font-size
  error, never a copy-length one.
- One CTA intent per page: every WhatsApp button says the same thing and
  opens the same thread through `waLink()`.
- Three pricing cards, the middle one filled with the accent and lifted,
  no period toggle, every number from `config/site.js`.
- The FAQ is a conversation: question bubble on the right with a mascot,
  accent reply bubble on the left with the VB mark. Only the reply is
  blue. Its text is the same array `StructuredData` receives.
- The bottom dock has four items, 40px on a phone and 48px from 900px,
  in the header's clothes (paper, ink stroke, blue hard shadow). A tap
  shows the label and bounces the dock; hover magnifies on a mouse only.
- No invented metrics, with the one owner-approved exception recorded
  above.

### Touch and motion

- Every control is at least 48px on its short side (40px inside the
  phone dock, deliberately) and carries `touch-action: manipulation`.
- Hover only inside `@media (hover: hover) and (pointer: fine)`, and any
  hover rule on an element with an active state is written
  `:hover:not(.is-active)`.
- Press feedback: things with a hard shadow slide down-right by the
  shadow's offset and the shadow collapses; things without one scale to
  0.96 or 0.92.
- Every animation this language adds has a one-line reason and a
  reduced-motion off switch. Random values never happen during render
  (see sparkles-text's header for the hydration mismatch that caused).
- React's `set-state-in-effect` rule is on. Never call setState in an
  effect body; derive in initial state, or set it from a callback.

### The three traps

- **Trap A.** `Reveal` hides an element until an IntersectionObserver
  fires. Measured after a full scroll pass, half of them never did, and
  whole sections rendered blank. One Reveal per section, on the heading.
- **Trap B.** `.nv-root ul { margin: 0 }` beats any single-class margin
  on a `<ul>`. Write `.nv-root .your-class { margin: ... }`. Never
  `!important`.
- **Trap C.** `--nv-accent`, `--nv-support` and `--nv-soft` do not exist.
  The tokens are `--nv-lav`, `--nv-ink-soft`, `--nv-lav-soft`.

### Before calling a page done

Run `npm run verify`, then `OUT_DIR=<outside the repo> node scripts/capture-newlanding-v4.mjs`
(adapt the route). It scrolls first, then measures overflow, stranded
Reveals, empty sections, hero line count, dock size, the reserve under
the dock, contrast on every accent surface, and page errors. Then open
the captures and look: numbers do not tell you whether a page reads.
