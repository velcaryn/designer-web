/**
 * The WhatsApp link card. One per demo, in that demo's own palette.
 *
 * THIS IS THE MOST IMPORTANT ASSET IN THE PROJECT.
 *
 * The entire distribution channel is a link pasted into a chat. What a
 * prospect sees BEFORE deciding whether to tap is this card, not the
 * page. A demo that loads in 400ms is worth nothing if the preview above
 * it is a grey box with a URL in it.
 *
 * Generated at build time, one per slug, served from our own origin,
 * which matters because the CSP allows images from 'self' only and
 * because WhatsApp will not render a WebP or resolve a relative path.
 * next/og emits PNG and metadataBase is set in the root layout, so both
 * of those are handled.
 *
 * WHY IT CARRIES THE DEMO'S PALETTE AND NOT OURS
 *
 * A prospect sent the bakery link should see the bakery's colours in the
 * preview, because the whole argument is that we do not ship one template
 * with the colours swapped. Sixteen identical blue cards would make the
 * opposite case before anyone opened anything.
 *
 * The one piece of VelBiz chrome is the strip along the bottom. It has to
 * be there: the card is a preview of a fictional business and it should
 * say whose demonstration it is before the tap, not after.
 *
 * next/og runs a very small subset of CSS: flexbox only, no grid, and
 * every element needs an explicit `display`. It also has no access to the
 * stylesheet, so the palette is read from the demo record and written as
 * literal values here.
 */
import { ImageResponse } from 'next/og';
import { SLUGS, findDemo } from '@/content/demos';
import { brand } from '@/config/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
    return SLUGS.map((slug) => ({ slug }));
}

/* `alt` is a plain export rather than generateImageMetadata. That API is
   for a route emitting SEVERAL images and requires an `id` on each; here
   there is exactly one card per slug, and combining it with
   generateStaticParams made the build reject every route. The alt text is
   generic because a static export cannot see the slug, and the card is
   decorative in a chat preview anyway: WhatsApp shows the image, not its
   alt. */
export const alt = 'An example business website built by VelBiz Digital';

export default async function Image({ params }) {
    const { slug } = await params;
    const demo = findDemo(slug);

    /* The registry's swatch is [ink, accent, paper], the same three
       values the hub card paints, so the preview and the card a visitor
       tapped from are visibly the same business. */
    const [ink, accent, paper] = demo?.swatch ?? ['#0a0a0c', '#0066cc', '#faf8f7'];

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: paper,
                }}
            >
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '0 80px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 26,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: accent,
                        }}
                    >
                        {demo?.trade ?? 'Example site'}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            marginTop: 18,
                            fontSize: 78,
                            fontWeight: 700,
                            lineHeight: 1.05,
                            letterSpacing: '-0.03em',
                            color: ink,
                        }}
                    >
                        {demo?.name ?? brand.name}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            marginTop: 22,
                            maxWidth: 780,
                            fontSize: 30,
                            lineHeight: 1.4,
                            color: ink,
                            opacity: 0.72,
                        }}
                    >
                        {demo?.blurb ?? ''}
                    </div>

                    {/* The palette itself, as three bars. It is the same
                        device the hub card uses and it makes the range
                        argument inside a chat thread, where several of
                        these often sit one above another. */}
                    <div style={{ display: 'flex', marginTop: 40, height: 14, width: 320 }}>
                        <div style={{ display: 'flex', flex: 1, background: ink }} />
                        <div style={{ display: 'flex', flex: 1, background: accent }} />
                        <div
                            style={{
                                display: 'flex',
                                flex: 1,
                                background: paper,
                                border: `2px solid ${ink}`,
                            }}
                        />
                    </div>
                </div>

                {/* VelBiz chrome, deliberately in our colours rather than
                    the demo's, so it reads as a frame around someone
                    else's brand rather than part of it. */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '26px 80px',
                        background: '#0a0a0c',
                        color: '#fbfbfd',
                        fontSize: 24,
                    }}
                >
                    <div style={{ display: 'flex' }}>
                        Demonstration site by {brand.name}
                    </div>
                    <div style={{ display: 'flex', fontWeight: 700 }}>
                        {brand.domain}
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
