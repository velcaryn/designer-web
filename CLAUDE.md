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
   lab, switches through every theme, and measures the real painted contrast
   of every text node against the background actually behind it. It needs the
   production server running (`npm run build && npm start`), which is why it
   is not inside `verify`.

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
- **No swipes at other studios.** Say what we do, not what other people get
  wrong.

## Before calling a task done

Run `npm run verify`. If the task touched `config/site.js`, confirm the phone
number appears exactly once in the built bundle.

## Deployment

**Never deploy, commit, or push without explicit instruction.** Build and
preview locally and report back.
