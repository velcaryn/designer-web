'use client';

/**
 * The work that goes on after the site is live.
 *
 * The brief: "we also do content creation, poster creation for festivals
 * and social media account handling for your business", cleaned up. The
 * substance already exists in config/site.js as the content-and-social
 * service, so the three items here are read from it rather than retyped,
 * and the link goes to that service page where the full list lives.
 * Nothing on this section can drift from the page it points at.
 *
 * A client component now, because the first card carries a Lottie leaf.
 * One Reveal, on the heading.
 */
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { services } from '@/config/site';
import Reveal from '@/components/Reveal';
import Nl4Lottie from './Nl4Lottie';
import PenIcon from '@/registry/itshover/pen-icon';
import SparklesIcon from '@/registry/itshover/sparkles-icon';
import InstagramIcon from '@/registry/itshover/instagram-icon';
import socialBubble from '@/public/Lottie-JSON/Social Bubble.json';

/* Each item's picture. A Lottie for the posts (speech bubbles, wide
   format), an SVG for the other two. The figure box is the same height
   for all three so the row of cards lines up whatever the artwork's own
   ratio. */
const SHOWN = [
    {
        name: 'Posts on a schedule',
        lottie: socialBubble,
        /* The owner's wording for this page. The service page keeps its
           own text in config/site.js; these two lines are overrides here
           and nowhere else. */
        text: 'Organic posts about what is happening around the business day to day. People really like this, and we will make it more interesting.',
    },
    { name: 'Festival and season copy', img: '/SVGs/cartoon-photo-wall-grid.svg', w: 281, h: 281 },
    {
        name: 'Photographs that are yours',
        img: '/SVGs/photographer.svg',
        w: 178,
        h: 224,
        text: 'Share your product or service with us and we will edit and repurpose the images for your website. An authentic way to build website content.',
    },
];

export default function Nl4Content() {
    const svc = services.find((s) => s.slug === 'content-and-social');
    const items = SHOWN
        .map((pic) => {
            const inc = svc?.includes.find((i) => i.name === pic.name);
            return inc ? { ...inc, text: pic.text ?? inc.text, pic } : null;
        })
        .filter(Boolean);

    return (
        <section className="nv-section nv-ground--lav-soft" id="content">
            <div className="nv-shell">
                <Reveal className="nv4-content__head">
                    <h2 className="nv4-h2 nv4-content__title">
                        We Also
                        {' '}
                        <span className="nv4-verb"><PenIcon size={30} strokeWidth={2.2} />Write</span>,
                        {' '}
                        <span className="nv4-verb"><SparklesIcon size={30} strokeWidth={2.2} />Design</span>
                        {' '}
                        And
                        {' '}
                        <span className="nv4-verb"><InstagramIcon size={30} strokeWidth={2.2} />Post</span>
                        {' '}
                        For You.
                    </h2>
                    <p className="nv-lede">
                        Festival posters for Pongal and Diwali, the posts that
                        go out every week, and the words on the site itself.
                        Written in the same voice, in English and Tamil, and
                        pointing people back to you.
                    </p>
                    <p className="nv4-content__charge">
                        Yes, we will charge you for these services.
                    </p>
                </Reveal>

                <div className="nv4-content__list">
                    {items.map((item) => (
                        <article key={item.name} className="nv4-content__item">
                            <div className="nv4-content__figure" aria-hidden="true">
                                {item.pic.lottie ? (
                                    <Nl4Lottie animationData={item.pic.lottie} size={200} wide />
                                ) : (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={item.pic.img}
                                        alt=""
                                        width={item.pic.w}
                                        height={item.pic.h}
                                        loading="lazy"
                                        className="nv4-content__img"
                                    />
                                )}
                            </div>
                            <h3 className="nv4-content__itemHead">{item.name}</h3>
                            <p className="nv4-content__itemBody">{item.text}</p>
                        </article>
                    ))}
                </div>

                <div className="nv4-content__more">
                    <Link href={`/services/${svc?.slug ?? 'content-and-social'}`} className="nv-btn nv-btn--ghost">
                        <span>See what that includes</span>
                        <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
