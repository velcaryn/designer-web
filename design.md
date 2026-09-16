# VelBiz Digital  -  Brand Design Reference

Generated from the live codebase (`app/globals.css`, `app/fonts.js`,
`config/themes.js`, `public/Logo/`). This is the site's actual, shipped
design system, not a proposal.

---

## Brand identity

**Name:** VelBiz Digital (short name: VelBiz)
**Parent:** A unit of Velcaryn LLP
**Base:** Tirunelveli, Tamil Nadu, India
**Domain:** velbiz.com

**Logo mark:** A monogram "VB", solid geometric fill with a negative-space
diagonal cut connecting the two letterforms. Files: `public/Logo/VB-logo-rework-SVG.svg`
(master, two-tone: white background square, dark glyph `#221d1f`) and the
site-ready crops `public/vb-mark.svg` (renders in `currentColor`, for light
grounds) / `public/vb-mark-light.svg` (hardcoded white, for dark grounds  - 
footer, near-black demo bars, dark theme previews).

**Wordmark:** "VelBiz" set bold, tight, in the brand's wordmark face,
followed by a smaller-weight qualifier ("Digital", "Cloud", "Examples")
in uppercase micro-tracked type  -  see Typography below.

---

## Colour palette  -  Pearl White (the real, live brand palette)

This is the one and only brand palette. It is not a "light mode" among
several  -  the site is light everywhere, permanently, by design (see
Theme lock, below).

| Role | Name | Hex | Used for |
|---|---|---|---|
| Ink | Space Gray | `#1d1d1f` | All text, all outlines, primary button fill |
| Paper | Pearl | `#fbfbfd` | The page ground (off-white, not pure white  -  easier on long reading) |
| Accent | Sapphire | `#0066cc` | Highlights, active states, links, the primary button's actual fill colour |
| Support | Slate | `#5c5c61` | Secondary text, captions, supporting figures |
| Soft |  -  | `#eef0f4` | Section grounds and panel fills (a tint, not a new hue) |

**Derived tones** (computed with CSS `color-mix`, not hand-picked, so they
never drift from the five above):
- Warm paper tint: `color-mix(soft 45%, paper 55%)`
- Storm soft (quiet section ground): `color-mix(support 14%, paper 86%)`
- Deep accent: `color-mix(accent 78%, ink 22%)`
- Faint ink (labels/captions only, never body text): `color-mix(support 70%, ink 30%)`

**On-fill / on-accent text:** the primary button's label is Pearl
(`#fbfbfd`) on a Sapphire fill. Text placed directly on an accent-filled
surface also uses Pearl, never the page's ink colour  -  pairing text with
the surface it actually sits on, never with the page background, is a
hard rule throughout the system.

**Contrast floor:** every colour pairing in production is measured, not
assumed. Ink-on-paper never drops below 13:1; the accent against paper
holds 4.3:1 minimum (AA for large/bold type).

---

## Typography

| Role | Typeface | Source | Weight(s) used |
|---|---|---|---|
| Display (headlines) | **Fraunces** | Google Fonts, variable | Full optical-size range  -  sharpens as size increases |
| Text (body/UI) | **Inter** | Google Fonts, variable | 400, 500, 600, 700 |
| Wordmark ("VelBiz") | **Poppins** (substitute for Sifonn) | Google Fonts | 800 only |

**Pairing logic:** Fraunces is a serif display face with real character  - 
the strongest visual signal that design is the product, not an
afterthought. Inter is the most road-tested interface face available,
deliberately plain underneath the display serif. The contrast between an
expressive display face and a neutral text face is the pairing's whole
point.

**On the wordmark specifically:** the actual brand typeface is **Sifonn**
(a commercial face from Zeune Ink)  -  a heavy geometric sans with
near-circular bowls and tight apertures. It is not available on Google
Fonts and is not currently licensed for the live site, so **Poppins at
weight 800** is used as the closest practical substitute (chosen after
comparing six candidates against the VB mark; Outfit 900 was the
runner-up but reads too condensed). If you are building a brand profile
in a tool that has access to commercial type libraries, **specify Sifonn
as the true wordmark face** and Poppins 800 as the fallback.

**Type scale** (fluid, clamped so nothing gets absurd at either a 320px
phone or a 4K monitor):

| Token | Size |
|---|---|
| Hero display | `clamp(3.6rem, 15vw, 8.5rem)` |
| Display 1 | `clamp(2.3rem, 5.4vw, 4.6rem)` |
| Display 2 | `clamp(1.85rem, 4.4vw, 3.7rem)` |
| Display 3 | `clamp(1.3rem, 2.5vw, 2rem)` |
| Body, large | `clamp(1.05rem, 1.5vw, 1.28rem)` |
| Body | `1rem` |
| Small | `0.875rem` |
| Micro (labels, qualifiers) | `0.75rem` |

---

## Shape and edge system

Two locked rules, applied everywhere with no exceptions:

**Radius  - ** exactly two values, by role:
- `20px`  -  every block, panel, image frame, input group
- `999px` (full pill)  -  every button, tag, form field

**Border and shadow  - ** one weight, one shadow style, everywhere:
- Border: `3px solid` ink colour
- Shadow: `6px 6px 0` ink colour  -  hard-edged, **zero blur**, always
  offset down-and-right

The shadow reading as a printed "second impression" rather than a soft
drop-shadow is the single most load-bearing visual rule in the system.
A blurred or tinted shadow anywhere is treated as a defect, not a style
choice.

**Overall character, in one line:** bright paper, fat black outlines,
hard offset shadows, saturated colour blocks, things sitting very
slightly off-square. Pop-poster, not SaaS.

---

## Layout tokens

| Token | Value |
|---|---|
| Gutter | `20px` |
| Max content width (shell) | `1320px` |
| Section vertical padding | `clamp(72px, 10vw, 150px)` |
| Motion easing | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Motion duration | `0.4s` |

**Motion rule:** only `transform` and `opacity` are ever animated. The
signature press interaction slides an element down-right by exactly the
shadow's offset while the shadow collapses to zero  -  a physical
"button being pressed" effect, not a generic hover fade.

---

## Theme rule (why there is only one real palette)

The site is light, everywhere, permanently  -  this is a locked rule, not
a current preference. Sections change *colour*, never *mode*: a
saturated colour block is the design; flipping any section to dark
mid-scroll would read as two different templates stitched together.

---

## Not brand colours: the four demonstration palettes

`config/themes.js` also defines four additional palettes and four font
pairings, used ONLY in an interactive "brand preview" widget on the site
that lets a visitor repaint the page live for ten seconds before it
reverts. **These are a sales demonstration of the design system's
flexibility, not alternate brand identities.** Do not use them when
building VelBiz's own brand profile  -  they exist to be shown to
prospective clients, not worn by VelBiz itself.

Listed here only so they are not mistaken for hidden brand options if
you encounter them elsewhere in the codebase:

| Palette | Ink | Paper | Accent | Support | Soft |
|---|---|---|---|---|---|
| Harbour | `#0f2436` | `#f7f8fa` | `#b45309` | `#1e5f8c` | `#e3eaf1` |
| Alabaster | `#09090b` | `#f4f4f5` | `#10b981` | `#52525b` | `#e4e4e7` |
| Midnight Obsidian (dark) | `#fafafa` | `#0a0a0a` | `#5e5ce6` | `#a1a1aa` | `#18181b` |
| Vantablack Acid (dark) | `#fafafa` | `#000000` | `#d4ff00` | `#a1a1aa` | `#0f0f0f` |

Demonstration font pairings: Fraunces + Inter (the real pairing, listed
again as one of the four options), Bricolage Grotesque + Figtree, DM
Serif Display + Poppins, Geist + Geist Mono.

---

## Quick-reference summary (for pasting into a brand tool)

```
Brand name:      VelBiz Digital
Logo:            VB monogram, geometric, negative-space diagonal cut
Ink:             #1d1d1f  (Space Gray  -  text, outlines, button fill)
Paper:           #fbfbfd  (Pearl  -  page background)
Accent:          #0066cc  (Sapphire  -  highlights, CTAs, links)
Support:         #5c5c61  (Slate  -  secondary text)
Soft/tint:       #eef0f4  (section grounds)
Display font:    Fraunces (serif, variable weight)
Body font:       Inter (sans, 400/500/600/700)
Wordmark font:   Sifonn (substitute: Poppins 800)
Corner radius:   20px (panels) / 999px (pills, buttons)
Border:          3px solid ink
Shadow:          6px 6px 0 ink, zero blur, always down-right
Character:       Bright, high-contrast, pop-poster brutalist. Light mode
                 only, permanently.
```
