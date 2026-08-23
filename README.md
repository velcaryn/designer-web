# Velbrant Studios

Marketing site for Velbrant Studios, a unit of Velcaryn LLP.

Extracted from the Velcaryn application, where it was built at `/newventure`.
It is standalone now: its own Next.js app, its own design system, no inherited
theme, no shared providers.

```bash
npm install
npm run dev        # http://localhost:4000
```

Port 4000 rather than 3000, so this and the Velcaryn app can run side by side.

## Before this goes public

Three things are deliberately unfinished, each for a stated reason.

**1. The brand name is not cleared.** Every "Vel-" candidate checked so far had
a real conflict, several in this exact market. "Velbrant" came back clean on a
web search, which is not the same as clear. Run both before committing to it:

- MCA company-name check: <https://www.mca.gov.in>
- IP India trademark search: <https://ipindiaonline.gov.in/tmrpublicsearch>
  Class 42 (software and SaaS) and class 35 (business consulting).

**2. The site is `noindex`.** Set in `app/layout.js`. It stays that way until
the name above is cleared and the real domain is live, because indexing a name
that may have to change means the eventual real name launches competing with a
dead one. One-line change when ready.

**3. Contact details are placeholders.** In `components/Contact.js`:

```js
const CONTACT = {
    whatsapp: '910000000000',       // intentionally unroutable
    email: 'hello@velbrant.studio',
};
```

The number is deliberately broken rather than plausible. A plausible
placeholder is a real person's line that then receives your enquiries.

## The form has no backend

Submitting validates, then composes a WhatsApp message and hands off to the
visitor's own client. Nothing is stored, so the site creates no personal data
at rest and no retention obligation, which is the right posture for a page
that argues for taking the DPDP Act seriously.

To make it a real endpoint later, replace `handoff` in `components/Contact.js`
with a POST. The validation, the error states and the focus management do not
change.

## Layout of the code

```
app/
  layout.js      root layout, fonts, metadata, robots
  page.js        section order, and why it is that order
  globals.css    the entire design system, tokens first
  fonts.js       Outfit (display) and Plus Jakarta Sans (text)
components/      one file per section, plus Reveal
scripts/         the two house guards
```

`app/globals.css` opens with the four locks (theme, colour, shape, edge). Read
them before changing any colour or radius. The palette is three brand colours
with fixed jobs:

| Token        | Colour        | Job |
|--------------|---------------|-----|
| `--nv-ink`   | Abyss Blue `#17313E`    | All text, all outlines, every primary button |
| `--nv-lav`   | Lavender Haze `#C5B0CD` | Highlights, active states, the swipe behind a word |
| `--nv-storm` | Storm Blue `#415E72`    | Secondary text and figures |

Storm Blue is 4.5:1 against ink, so it is never the ground under a paragraph.
The contrast note at the token records the measured value for each.

## Checks

```bash
npm run verify     # em dash, CSS hover/active collisions, lint, build
```

Both guards came from the Velcaryn repo and encode rules that have each been
a shipped bug:

- **No em dash** anywhere, including UI copy. Use a hyphen, comma or full stop.
- **`:hover` must never outrank an active state.** `.tab:hover` is (0,2,0) and
  `.tab--active` is (0,1,0), so hover wins regardless of source order and
  repaints the selected element. Always write `.tab:hover:not(.tab--active)`.

## Notes for whoever edits this next

Three bugs were fixed here that are easy to reintroduce, and each is explained
at length in the file where it lives:

- `components/Reveal.js`: scroll reveal is CSS plus IntersectionObserver,
  armed only in the browser. Content is visible by default and animation opts
  in. The Motion `whileInView` version shipped three permanently invisible
  sections, because `useReducedMotion()` is false during the server render and
  the inline `opacity: 0` it emitted was never cleared.
- `components/HeroDevices.js`: why the hero scene is CSS 3D and not Three.js,
  even though the dependency was available.
- `app/fonts.js`: why the font variables and `.nv-root` must be on the same
  element.
