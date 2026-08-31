# Demo site images: what is still needed

**29 images across 10 demos.** Everything else is already in place.

Generate each one, save it at the exact path with the exact filename, then
run `npm run gen:demo-images` to produce the 480w and 800w variants the
site serves to phones. Nothing else needs editing: the code resolves each
image by convention.

---

## Rules that apply to every prompt

**Format.** Save as `.webp`, **under 150KB**. The build generates smaller
variants automatically, so this file is what a desktop visitor gets.

**Aspect ratio is not decorative.** It matches the hero treatment the demo
actually uses, so the image fills its slot without an awkward crop. The
ratio is stated on every prompt below.

**No text in the image.** No signage, no readable labels, no packaging.
Generators get lettering wrong and one misspelt sign destroys the
illusion. The site supplies all text.

**No faces in focus.** Hands, backs, mid-distance figures and silhouettes
are fine and usually better. A recognisable invented face on a page people
forward around is a different problem from an invented business name.

**No logos or brand marks**, including invented ones. The site draws its
own.

**Real Indian context, named.** These are businesses in Coimbatore,
Madurai, Trichy, Bhiwandi and Sriperumbudur. Generic Western interiors are
the tell that kills a demo. The prompts name the city, the light and the
materials for that reason.

---

## What each slot is for

| Slot | Where it appears | Notes |
|---|---|---|
| `hero.webp` | Top of the page, above the fold | The LCP element. Loads eagerly. Ratio depends on the demo's hero treatment. |
| `story.webp` | Inside the story section, mid-page | Lazy loaded. Process or interior, not another wide establishing shot. |
| `detail.webp` | Story section, or the gallery | A single object, close. Square. |

**Eight demos also run a gallery** that shows all three images in one
scroll-snap filmstrip at roughly 4:3. `architecture` is one of them, so
its three should read as a set: wide, mid, close. The other four demos in
this list have no gallery, so their three are independent.

---

## Hero ratios by treatment

| Treatment | Ratio | Demos in this list |
|---|---|---|
| `fullbleed` | 16:9, with a calm area for overlaid text | architecture |
| `split` | 4:5 portrait, sits in a side column | home-services, accountant, advocate |
| `banner` | 21:9 shallow strip across the top | real-estate, car-service, auto-resale |
| `standard` | 3:2, sits in a card below the text | logistics, warehouse, bike-service |

---

# The 14

## education, 1 image

### `public/demo/education/detail.webp` - 1:1 square
> A whiteboard corner with a partly erased geometric diagram, a marker
> resting in the tray. Shot straight on and close. Warm afternoon light,
> amber and white. The diagram is abstract: no legible words, numbers or
> equations. Nothing else in frame.

---

## logistics, 2 images
Palette: orange `#EA580C` on cool grey `#F4F6FA`.

### `public/demo/logistics/story.webp` - 4:3 landscape
> The inside of a truck trailer being loaded, cartons stacked and strapped,
> shot from the open rear doors looking in. Hard daylight at the opening
> falling off into shadow towards the front. Orange strapping against
> brown cardboard and steel. Bhiwandi, working, unstaged. No people in
> focus, no readable labels on the boxes.

### `public/demo/logistics/detail.webp` - 1:1 square
> A cargo strap ratchet tensioned over stacked cartons, shot close and
> from above. Orange webbing, steel ratchet, cardboard. Hard directional
> light, very sharp. Industrial macro. Nothing else in frame. No text.

---

## warehouse, 2 images
Palette: yellow `#EAB308` on grey `#F4F4F5`.

### `public/demo/warehouse/story.webp` - 4:3 landscape
> A cold storage room with its heavy insulated door partly open, wrapped
> pallets visible inside, cold vapour spilling out at floor level. Shot
> from outside looking in. Cool blue-white interior light against warmer
> ambient light outside. Grey, steel and yellow. Sriperumbudur,
> industrial. No people, no text.

### `public/demo/warehouse/detail.webp` - 1:1 square
> A shrink-wrapped pallet on a warehouse floor with yellow safety lines
> painted around it, shot from above at a slight angle. The wrap catches
> the overhead high-bay light. Grey concrete, yellow paint, clear plastic.
> Minimal and almost graphic. Nothing else. No text or labels.

---

## architecture, 3 images
**Kovai Design Collective, Race Course, Coimbatore.**
Palette: ochre `#A16207` on warm white `#FAFAF9`. Hero is `fullbleed`, and
all three appear together in a gallery, so treat them as a set: wide, mid,
close.

### `public/demo/architecture/hero.webp` - 16:9 cinematic
> A contemporary South Indian house at dusk, shot wide from the garden.
> Board-marked concrete and teak, deep overhangs, warm interior light
> through large openings. Coimbatore, modern rather than colonial. **Keep
> the left third dark and uncluttered so headline text can sit over it.**
> Ochre and warm grey against a deep blue evening sky. Architectural
> photography, tripod-steady. No people, no text, no signage.

### `public/demo/architecture/story.webp` - 4:3 landscape
> An architect's desk: a rolled drawing partly unrolled and weighted at
> the corners, a scale rule, and a physical massing model in grey card.
> Shot from above at a slight angle. Daylight from a window on the left,
> warm neutral tones. Hands at the very edge of frame only, or none.
> No faces, no legible text on the drawing.

### `public/demo/architecture/detail.webp` - 1:1 square
> Close-up of a junction where board-marked concrete meets a teak screen
> on a building exterior. Raking afternoon light showing the timber grain
> in the concrete. Fills the frame. Ochre and grey. Nothing else. No text.

---

## home-services, 3 images
**Anna Home Care, Anna Nagar, Madurai.**
Palette: cyan `#0891B2` on pale blue `#F0FDFF`. Hero is `split`, so the
hero must be **portrait**: it sits in a column beside the text, not behind
it.

### `public/demo/home-services/hero.webp` - 4:5 portrait
> A tradesman's hands fitting a tap under a kitchen sink, shot vertically
> from just outside the cabinet. Only hands and forearms visible, tools
> laid out neatly on a cloth beside. A clean, ordinary Indian domestic
> kitchen, bright daylight. Cyan and white tones. Competent and unstaged,
> not a stock-photo smile. No faces, no text, no brand marks on the tools.

### `public/demo/home-services/story.webp` - 4:3 landscape
> A work van with its rear doors open, showing organised tool boxes,
> coiled cable and paint tins racked inside. Shot from behind the van in
> daylight on a Madurai street. Cyan and grey. Orderly rather than
> cluttered. No people, no text, no number plate visible.

### `public/demo/home-services/detail.webp` - 1:1 square
> A freshly painted interior corner where wall meets ceiling, a crisp cut
> line, masking tape being peeled away at the edge of frame. Shot close.
> Soft daylight, pale blue and white. Nothing else in frame. No hands in
> focus, no text.

---

## real-estate, 3 images
**Vaigai Land & Plots, Thillai Nagar, Trichy.**
Palette: gold `#CA8A04` on pale green `#F7FEE7`. Hero is `banner`, so it
is a **shallow strip**: the composition has to survive being cropped top
and bottom.

### `public/demo/real-estate/hero.webp` - 21:9 wide strip
> An approved plot layout on the outskirts of Trichy, shot from slightly
> elevated. Black-topped roads laid out in a grid, survey stones marking
> corners, street lights installed, a few plots with boundary walls up.
> Coconut palms along the edges. Late afternoon, long shadows. Green and
> gold. Orderly and real, a photograph rather than an architectural
> rendering. No people, no signage, no hoardings.

### `public/demo/real-estate/story.webp` - 4:3 landscape
> Property documents spread on a wooden desk: a layout plan, a survey
> sketch and a stamped page, a pen resting on top. Shot from directly
> above. Daylight, warm neutrals with green accents. Stamps and
> handwriting present but deliberately not legible. No faces, no readable
> text.

### `public/demo/real-estate/detail.webp` - 1:1 square
> A concrete survey stone set into red earth at a plot corner, grass at
> the edges, shot low and close. Hard afternoon light casting a sharp
> shadow. Gold and green. Nothing else in frame. No markings or numbers
> on the stone.

---

## accountant, 3 images
**Sundaram & Associates, Palayamkottai, Tirunelveli.**
Palette: teal `#0F766E` on pale blue `#F5FAFB`. Hero is `split`, so the
hero must be **portrait**.

### `public/demo/accountant/hero.webp` - 4:5 portrait
> A chartered accountant's office in a small Tamil Nadu town, shot
> vertically. A desk with neat stacks of files, a calculator, a monitor
> turned away from camera, shelves of ledgers behind. Daylight from a
> window on the left. Teal and pale blue tones, orderly and unglamorous.
> Competent rather than corporate. No people, no text, no readable labels
> on the files.

### `public/demo/accountant/story.webp` - 4:3 landscape
> Two people at a desk, seen from behind and to one side, one pointing at
> a printed statement between them. Only shoulders and hands in frame.
> Daylight, teal and neutral tones. The document is not legible. Reads as
> a working conversation, not a stock handshake. No faces, no text.

### `public/demo/accountant/detail.webp` - 1:1 square
> A wall calendar with a few dates circled in pen, shot straight on and
> close. Soft daylight, teal and white. The month name and the numbers are
> deliberately not legible: just the marks. Nothing else in frame.

---

## advocate, 3 images
**R Krishnamoorthy, Court Road, Tirunelveli.**
Palette: sienna `#92400E` on warm white `#FCFAF6`. Hero is `split`, so the
hero must be **portrait**. This page is deliberately quieter than the
rest of the set: restrained, not dramatic.

### `public/demo/advocate/hero.webp` - 4:5 portrait
> An advocate's chambers in a South Indian district town, shot vertically.
> A wooden desk, bound law reports on shelves behind, a table lamp, two
> chairs facing. Warm afternoon light through a shuttered window. Sienna
> and cream, worn wood, quiet and serious. No people, no text, no legible
> spines on the books.

### `public/demo/advocate/story.webp` - 4:3 landscape
> A stack of tied legal files on a desk, the traditional cloth-bound
> bundles with string, one partly open. Shot from above at an angle. Warm
> low light, deep shadows. Sienna and cream. Documentary and still. No
> people, no legible text.

### `public/demo/advocate/detail.webp` - 1:1 square
> A single brass scales-of-justice ornament on a wooden desk, shot close
> with shallow depth of field, warm side light. Or, if that reads as
> cliche, a close-up of the grain and worn edge of an old wooden desk with
> a fountain pen resting on it. Sienna and cream. Nothing else in frame.

---

## car-service, 3 images
**Sri Balaji Auto Care, Vannarpettai, Tirunelveli.**
Palette: red `#DC2626` on near-white `#F8FAFC`. Hero is `banner`, so a
**shallow strip**: the composition must survive being cropped top and
bottom.

### `public/demo/car-service/hero.webp` - 21:9 wide strip
> A multi-brand car workshop bay in Tamil Nadu, shot wide and straight
> down the line of ramps. Two cars raised on lifts, tool trolleys, clean
> painted floor with bay markings. Bright workshop lighting, red accents
> against grey. Busy but orderly. No people in focus, no readable brand
> names on signage or cars, no number plates.

### `public/demo/car-service/story.webp` - 4:3 landscape
> A mechanic's hands at an open engine bay with a diagnostic scanner
> plugged in, screen turned away. Only hands and forearms visible. Hard
> workshop light, red and grey. Precise and unstaged. No faces, no
> readable text on the scanner.

### `public/demo/car-service/detail.webp` - 1:1 square
> A set of worn brake pads laid beside a new pair on a clean workshop
> bench, shot directly overhead. Hard even light showing the difference in
> the friction material. Grey steel and red. Minimal, almost technical.
> Nothing else in frame. No text or part numbers.

---

## bike-service, 3 images
**Speedline Two Wheelers, Palayamkottai Road, Thoothukudi.**
Palette: orange `#EA580C` on warm cream `#FFFBF5`. Hero is `standard`, so
**3:2**, sitting in a card below the text.

### `public/demo/bike-service/hero.webp` - 3:2 landscape
> A two-wheeler service shop in a Tamil Nadu town, shot from the street
> into the open front. Four bikes on ramps at different stages, tool
> boards on the wall, mechanics working in the mid distance. Late
> afternoon light coming in from the road. Orange and warm cream against
> grey. Busy and real. No faces in focus, no readable signage, no number
> plates.

### `public/demo/bike-service/story.webp` - 4:3 landscape
> A mechanic's hands fitting a chain onto a rear sprocket, bike up on a
> ramp. Only hands and forearms. Warm workshop light, orange and grey,
> visible chain oil. Close and tactile. No faces, no text.

### `public/demo/bike-service/detail.webp` - 1:1 square
> A clean new sprocket and chain set laid on a workshop cloth, shot
> directly overhead. Warm directional light picking out the teeth. Orange
> and steel against cream cloth. Minimal. Nothing else. No text or
> markings.

---

## auto-resale, 3 images
**Nellai Pre-Owned Motors, Tenkasi Road, Tirunelveli.**
Palette: blue `#2563EB` on pale blue `#F6F9FF`. Hero is `banner`, so a
**shallow strip**.

### `public/demo/auto-resale/hero.webp` - 21:9 wide strip
> A used vehicle yard in a Tamil Nadu town, shot wide from one end. A row
> of clean second-hand hatchbacks and sedans parked at an angle, a few
> two-wheelers to one side, a low boundary wall behind. Late afternoon
> light, long shadows on the concrete. Blue and grey. Tidy and legitimate,
> not a scrapyard. No people, no number plates, no readable signage or
> price boards.

### `public/demo/auto-resale/story.webp` - 4:3 landscape
> Vehicle documents on a desk: a registration book, an insurance page and
> a service record laid out side by side, a pen resting on top. Shot from
> above. Daylight, blue and neutral tones. Stamps and entries present but
> deliberately not legible. No faces, no readable text or numbers.

### `public/demo/auto-resale/detail.webp` - 1:1 square
> A car key with a plain fob resting on a folded document on a desk, shot
> close with shallow depth of field. Soft daylight, blue and cream.
> Nothing else in frame. No branding on the key, no legible text on the
> document.

---

## After you generate

```bash
npm run gen:demo-images   # writes the 480w and 800w variants
npm run build && npm start
```

Then open the five demos and check them at a phone width:

```
/demo-site/education        /demo-site/accountant
/demo-site/logistics        /demo-site/advocate
/demo-site/warehouse        /demo-site/car-service
/demo-site/architecture     /demo-site/bike-service
/demo-site/home-services    /demo-site/auto-resale
/demo-site/real-estate
```

**A missing file degrades gracefully by design.** No hero collapses the
page to the plain text layout; a missing story or detail simply renders
nothing, and a gallery shows however many frames exist. So these can land
in any order without the site breaking in between.

**If a hero looks wrong, check the ratio first.** A `split` hero given a
landscape image gets centre-cropped to portrait and usually loses its
subject; a `banner` hero given a square one loses the top and bottom.
