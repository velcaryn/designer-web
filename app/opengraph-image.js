/**
 * The link preview card, generated at build time.
 *
 * Next's file convention: an `opengraph-image` in the app root emits the
 * `og:image` tags for every route that does not override them. There was
 * no image at all before this, so a link shared to WhatsApp, LinkedIn or
 * Slack rendered as a bare title and URL, which for a studio that sells
 * websites is the worst possible first impression.
 *
 * Drawn rather than shipped as a file so it cannot drift from the brand:
 * it uses the same three locked colours and the same hard 6px offset
 * shadow as the site itself. `next/og` runs a very small subset of CSS
 * (flexbox only, no grid, every element needs an explicit `display`), so
 * this is deliberately plainer markup than the real page.
 *
 * It uses the renderer's own bundled face rather than loading Fraunces
 * or Inter. Fetching a font at build time makes the build depend on the
 * network, and shipping a woff2 purely for this one image is weight for
 * a card most people see at thumbnail size. The type here is doing a
 * different job from the type on the page.
 */
import { ImageResponse } from 'next/og';
import { brand } from '@/config/site';

export const alt = `${brand.name}: ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/* The three locked brand colours, written literally because the OG
   renderer has no access to the stylesheet's custom properties. Keep in
   step with the token block at the top of app/globals.css. */
const INK = '#0a0a0c';
const PAPER = '#faf8f7';
const FILL = '#0066cc';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: PAPER,
                    padding: 72,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 64,
                            height: 64,
                            background: FILL,
                            border: `4px solid ${INK}`,
                            borderRadius: 20,
                            boxShadow: `6px 6px 0 ${INK}`,
                            color: PAPER,
                            fontSize: 34,
                            fontWeight: 700,
                        }}
                    >
                        VB
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 30,
                            fontWeight: 700,
                            color: INK,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {brand.name}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 82,
                            fontWeight: 700,
                            color: INK,
                            lineHeight: 1.05,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        Grow your brand.
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 82,
                            fontWeight: 700,
                            color: FILL,
                            lineHeight: 1.05,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        Grow your business.
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', fontSize: 26, color: '#4a4a52' }}>
                        Websites, SEO, and one place to run the orders.
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            padding: '14px 28px',
                            background: INK,
                            borderRadius: 999,
                            color: PAPER,
                            fontSize: 24,
                            fontWeight: 700,
                        }}
                    >
                        {brand.domain}
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
