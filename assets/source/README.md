# Source images

Full-resolution originals. **Nothing here is served**: it sits outside
`public/` on purpose, because anything under `public/` is deployed whether
a page references it or not, and these are multi-megabyte PNGs.

The webp variants that actually ship are generated beside the demo that
uses them, at 480w, 800w and 1200w. To regenerate after replacing an
original:

```
node -e "
const sharp=require('sharp');
(async()=>{ for (const n of ['before-correction','after-correction'])
  for (const [w,s] of [[1200,''],[800,'-800'],[480,'-480']])
    await sharp('assets/source/photo-studio/'+n+'.png')
      .resize(w,null,{withoutEnlargement:true})
      .webp({quality:82,effort:6})
      .toFile('public/demo/photo-studio/'+n+s+'.webp');
})();"
```

Quality 82 rather than the usual 72 to 78, deliberately: the photo-studio
pair exists to demonstrate colour grading, and compressing the difference
away would defeat the section.

## brand/

`VB-Final.svg` and `VB-Final.png` are the master logo files as supplied.
They are **not served**: the working assets are derived from them and live
in `public/`.

- `public/vb-mark.svg` is the glyph path alone, in `currentColor`, with the
  viewBox cropped to the mark's own bounds.
- `public/vb-mark-light.svg` is the same path filled white, for ink grounds
  where an `<img>` cannot inherit a colour.
- `app/icon.svg` places the mark in white on the Abyss Blue rounded tile.

The supplied SVG is a white square with the mark knocked out of it, so the
square is dropped rather than shipped: a white tile reads as blank against
light browser chrome.
