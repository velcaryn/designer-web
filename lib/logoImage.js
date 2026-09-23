/**
 * Prepare an uploaded brand logo for display on an arbitrary background.
 *
 * TWO PROBLEMS, BOTH FROM STORING THE FILE EXACTLY AS UPLOADED
 *
 * A logo is uploaded once and then rendered on every screen, in the shell
 * header, on documents and on printed stationery - against whatever surface the
 * active theme provides. Two things about a typical upload break that:
 *
 * 1. NO ALPHA CHANNEL. Logos are commonly exported as opaque RGB with a white
 *    rectangle baked into the pixels. It looks correct on a white page and
 *    wrong everywhere else: on a dark theme the mark sits in a glowing white
 *    box. This cannot be corrected in CSS, because the white is image data, not
 *    styling - which is why reaching for a filter or a background colour only
 *    moves the seam around instead of removing it.
 *
 * 2. SOURCE RESOLUTION. A 6250x6250 export is ~1.7MB. Inlined as a base64 data
 *    URI it is carried in the tenant config on every page load, to be drawn
 *    34px high.
 *
 * So the upload is normalised once, here, rather than compensated for at each
 * of the render sites.
 *
 * WHY FLOOD FILL AND NOT "REMOVE WHITE PIXELS"
 *
 * Keying out every pixel near the background colour also punches holes in the
 * artwork - white lettering inside the mark, a highlight on a curve. Filling
 * inward from the border only clears the CONTIGUOUS region touching the edge,
 * so enclosed whites are untouched. A white circle on a white field is the one
 * case this cannot separate, and there the conservative outcome is that we
 * leave the image alone.
 */

/** Background removal only runs when the border is this consistent. */
const BORDER_UNIFORMITY = 0.9;
/** Channel distance treated as "the same colour" while filling. */
const COLOUR_TOLERANCE = 32;
/** Logos render at most ~190px wide; 512 keeps them crisp on a 2x display. */
export const MAX_LOGO_EDGE = 512;

/** Squared distance in RGB, avoiding a sqrt per pixel. */
function distSq(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return dr * dr + dg * dg + db * db;
}

/**
 * Does the border consist of one colour? Returns it, or null.
 *
 * Sampling only the border is deliberate: it is the region that must become
 * transparent, and a logo whose border is already mixed is one we should not
 * touch at all.
 */
export function detectBackdrop(data, width, height, tolerance = COLOUR_TOLERANCE) {
    const idx = (x, y) => (y * width + x) * 4;
    const border = [];
    const step = Math.max(1, Math.floor(Math.min(width, height) / 64));
    for (let x = 0; x < width; x += step) {
        border.push(idx(x, 0), idx(x, height - 1));
    }
    for (let y = 0; y < height; y += step) {
        border.push(idx(0, y), idx(width - 1, y));
    }
    if (!border.length) return null;

    /*
     * An image that ALREADY carries real transparency is finished - leave it
     * alone entirely.
     *
     * Testing only the corner pixel is not enough, and getting this wrong is
     * destructive rather than cosmetic. A wordmark exported with a correct
     * alpha channel can still have an opaque corner, and treating its
     * background as a backdrop to remove lets the fill leak between the
     * letterforms and eat the glyphs from the inside. Measured on a real logo:
     * 45% of the image cleared, most of the lettering gone, and the 97%
     * runaway-fill guard never fired because 45% looks like a plausible
     * backdrop.
     *
     * So the question is whether the image has meaningful transparency
     * anywhere, not whether one pixel is clear.
     */
    let clear = 0;
    for (const i of border) {
        if (data[i + 3] === 0) clear += 1;
    }
    if (clear / border.length > 0.05) return null;

    // The corner is the reference: a framed logo has its backdrop there.
    const r0 = data[0], g0 = data[1], b0 = data[2];
    if (data[3] === 0) return null;

    const tol = tolerance * tolerance * 3;
    let matching = 0;
    for (const i of border) {
        if (distSq(data[i], data[i + 1], data[i + 2], r0, g0, b0) <= tol) matching += 1;
    }
    if (matching / border.length < BORDER_UNIFORMITY) return null;
    return { r: r0, g: g0, b: b0 };
}

/**
 * Clear the backdrop-coloured region connected to the border, in place.
 *
 * Iterative scanline-free BFS over a typed queue rather than recursion: a
 * 512x512 fill is up to 262144 cells deep and would overflow the call stack.
 *
 * Returns the number of pixels cleared, so the caller can decline a fill that
 * consumed essentially the whole image (which would mean the detection was
 * wrong and we are about to erase the logo).
 */
export function clearBackdrop(data, width, height, backdrop, tolerance = COLOUR_TOLERANCE) {
    const total = width * height;
    const seen = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0, tail = 0;

    const push = (p) => {
        if (p < 0 || p >= total || seen[p]) return;
        const i = p * 4;
        if (data[i + 3] === 0) { seen[p] = 1; return; }
        if (distSq(data[i], data[i + 1], data[i + 2], backdrop.r, backdrop.g, backdrop.b) > tolerance * tolerance * 3) return;
        seen[p] = 1;
        queue[tail++] = p;
    };

    for (let x = 0; x < width; x += 1) { push(x); push((height - 1) * width + x); }
    for (let y = 0; y < height; y += 1) { push(y * width); push(y * width + width - 1); }

    let cleared = 0;
    while (head < tail) {
        const p = queue[head++];
        data[p * 4 + 3] = 0;
        cleared += 1;
        const x = p % width, y = (p / width) | 0;
        if (x > 0) push(p - 1);
        if (x < width - 1) push(p + 1);
        if (y > 0) push(p - width);
        if (y < height - 1) push(p + width);
    }
    return cleared;
}

/** Fit within a square edge without enlarging a logo that is already small. */
export function fitWithin(width, height, maxEdge = MAX_LOGO_EDGE) {
    const longest = Math.max(width, height);
    if (longest <= maxEdge) return { width, height };
    const scale = maxEdge / longest;
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Normalise an uploaded logo in the browser: trim the baked-in backdrop to
 * transparency and cap the resolution.
 *
 * Runs on the client because the file is already there - sending 1.7MB up to
 * be processed and pulled back down would be slower and would put the raw
 * upload in a request log for no gain.
 *
 * ALWAYS RESOLVES. A logo that cannot be decoded, or whose border is too mixed
 * to key safely, comes back as the original data URI. Failing to remove a
 * backdrop leaves the admin with the white-box logo they had before, which is a
 * cosmetic problem. Erasing artwork because a heuristic misfired is not
 * recoverable, so every uncertain path keeps the original.
 */
export async function prepareLogo(dataUrl, { maxEdge = MAX_LOGO_EDGE } = {}) {
    if (typeof document === 'undefined' || !dataUrl?.startsWith('data:image/')) {
        return { dataUrl, changed: false, reason: 'unsupported' };
    }
    // An SVG is resolution-independent and usually already has real
    // transparency; rasterising it here would only throw quality away.
    if (dataUrl.startsWith('data:image/svg')) return { dataUrl, changed: false, reason: 'vector' };

    try {
        const img = await new Promise((resolve, reject) => {
            const el = new Image();
            el.addEventListener('load', () => resolve(el), false);
            el.addEventListener('error', () => reject(new Error('decode failed')), false);
            el.src = dataUrl;
        });

        const fit = fitWithin(img.naturalWidth, img.naturalHeight, maxEdge);
        const canvas = document.createElement('canvas');
        canvas.width = fit.width;
        canvas.height = fit.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return { dataUrl, changed: false, reason: 'no-context' };
        ctx.drawImage(img, 0, 0, fit.width, fit.height);

        const image = ctx.getImageData(0, 0, fit.width, fit.height);
        const backdrop = detectBackdrop(image.data, fit.width, fit.height);

        let cleared = 0;
        if (backdrop) {
            cleared = clearBackdrop(image.data, fit.width, fit.height, backdrop);
            // A fill that swallowed almost everything means the detection was
            // wrong - keep the upload rather than store an empty logo.
            if (cleared > fit.width * fit.height * 0.97) {
                return { dataUrl, changed: false, reason: 'fill-too-large' };
            }
            ctx.putImageData(image, 0, 0);
        }

        const out = canvas.toDataURL('image/png');
        // Resizing alone is worth keeping; a bigger result never is.
        if (!backdrop && out.length >= dataUrl.length) {
            return { dataUrl, changed: false, reason: 'no-gain' };
        }
        return {
            dataUrl: out,
            changed: true,
            removedBackdrop: Boolean(backdrop),
            resized: fit.width !== img.naturalWidth || fit.height !== img.naturalHeight,
            before: dataUrl.length,
            after: out.length,
        };
    } catch {
        return { dataUrl, changed: false, reason: 'error' };
    }
}
