/**
 * Why a website is worth having, with an illustration per point.
 *
 * Three observations about how buying has changed, in the owner's words,
 * each with one of the SVG illustrations from public/SVGs: a person
 * searching a menu on a phone, a person demonstrating a website, and a
 * small crowd cheering. The pictures carry the idea a second time for a
 * reader who skims, which is most of them; they are decorative to a
 * screen reader (empty alt) because the heading says the same thing.
 *
 * On a phone each block is a small grid: picture and heading side by
 * side, the paragraph under both, with the picture swapping sides on the
 * middle block so the three read as a zigzag rather than a list. From
 * 900px the three stand as columns. Both are in the stylesheet.
 *
 * Plain <img>, not next/image: these are small SVGs (5 to 10KB) and the
 * image pipeline would only rasterise them. Width and height are set so
 * nothing shifts when they load.
 *
 * The three blocks are plain <article>s, not wrapped in Reveal (Trap A).
 * Server component.
 */
import Reveal from '@/components/Reveal';
import { LineShadowText } from '@/registry/magicui/line-shadow-text';

const POINTS = [
    {
        img: '/SVGs/cartoon-person-searching-menu.svg',
        head: 'People Check Before They Come',
        body: 'Before somebody drives over, they look you up on their phone. They want your timings, where exactly you are, and what you charge. If they cannot find that in a few seconds, they stop looking.',
    },
    {
        img: '/SVGs/person-demoing-website.svg',
        head: 'Your Website Helps First-Time Customers Discover And Trust Your Business',
        body: 'A customer who already has your number can reach you. A customer who does not have your number has no way to find you, and that is the one you are trying to reach.',
    },
    {
        img: '/SVGs/small-crowd-cheering.svg',
        head: 'Being Online Keeps You In The Current Trend',
        body: 'This is the unfair part. No website, or an old, tired one, reads as a business stuck in the past. People expect a fresh look, and they want a business they can see and trust online.',
    },
];

export default function Nl4Why() {
    return (
        <section className="nv-section nv-ground--warm" id="why">
            <div className="nv-shell">
                <Reveal className="nv4-why__head">
                    <h2 className="nv4-h2 nv4-why__title">
                        Why Do You Need A <LineShadowText className="nv4-why__word">Website?</LineShadowText>
                    </h2>
                    <p className="nv-lede">
                        Three things that have changed in how people buy. Many
                        businesses now are getting a website for these reasons!
                    </p>
                </Reveal>

                <div className="nv4-why__list">
                    {POINTS.map((point) => (
                        <article key={point.head} className="nv4-why__item">
                            <div className="nv4-why__figure">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={point.img}
                                    alt=""
                                    width={260}
                                    height={200}
                                    loading="lazy"
                                    className="nv4-why__img"
                                />
                            </div>
                            <h3 className="nv4-why__itemHead">{point.head}</h3>
                            <p className="nv4-why__itemBody">{point.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
