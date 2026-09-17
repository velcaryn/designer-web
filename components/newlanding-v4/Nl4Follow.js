/**
 * Instagram, just above the footer, with the latest posts.
 *
 * THE POSTS ARE EMBEDS OF PERMALINKS FROM CONFIG, NOT A LIVE FEED.
 *
 * There is no way to fetch an account's latest posts without a Facebook
 * app token and a Business account: the Basic Display API that used to
 * allow it was retired in December 2024, and scraping the profile is not
 * something this site does. What Instagram does allow is its own embed
 * frame for any public post, so `contact.instagramPosts` holds the
 * permalinks and this renders each as that frame. Adding a post is one
 * line in config/site.js.
 *
 * With no posts listed the section is the follow button alone, which is
 * what it was before. The frames are lazy, load below the fold, and the
 * CSP's frame-src was opened to www.instagram.com for exactly this and
 * nothing else (see next.config.mjs). Server component.
 */
import { InstagramLogo, Heart, ChatCircle, Play } from '@phosphor-icons/react/ssr';
import { contact } from '@/config/site';

export default function Nl4Follow() {
    const posts = contact.instagramPosts || [];

    return (
        <section className="nv-section nv4-follow nv-ground--paper" id="follow">
            <div className="nv-shell nv4-follow__inner">
                <h2 className="nv4-h2 nv4-follow__head">Follow Us On Instagram.</h2>
                <p className="nv-lede nv4-follow__body">
                    Official posts, client releases, and work in progress from {contact.instagramHandle}.
                </p>

                <ul className="nv4-follow__grid" aria-label="Recent Instagram posts">
                    {posts.map((post) => (
                        <li key={post.id} className="nv4-follow__cell">
                            <a
                                href={post.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="nv4-follow__card"
                                aria-label={`${post.title} on Instagram`}
                            >
                                <div className="nv4-follow__media">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        width={400}
                                        height={400}
                                        loading="lazy"
                                        className="nv4-follow__img"
                                    />
                                    {post.type === 'reel' && (
                                        <div className="nv4-follow__reel-badge" aria-label="Instagram Reel">
                                            <Play size={12} weight="fill" />
                                            <span>Reel</span>
                                        </div>
                                    )}
                                    <div className="nv4-follow__overlay" aria-hidden="true">
                                        <span className="nv4-follow__stat">
                                            <Heart size={18} weight="fill" />
                                            <span>{post.likes}</span>
                                        </span>
                                        <span className="nv4-follow__stat">
                                            <ChatCircle size={18} weight="fill" />
                                            <span>{post.comments}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="nv4-follow__meta">
                                    <div className="nv4-follow__meta-top">
                                        <span className="nv4-follow__tag">
                                            <InstagramLogo size={14} weight="bold" />
                                            <span>{post.tag}</span>
                                        </span>
                                        {post.date && (
                                            <span className="nv4-follow__date">{post.date}</span>
                                        )}
                                    </div>
                                    <p className="nv4-follow__caption">{post.caption}</p>
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>

                <a
                    href={contact.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="nv-btn nv-btn--ghost nv4-follow__btn"
                >
                    <InstagramLogo size={20} weight="bold" aria-hidden="true" />
                    <span>Follow {contact.instagramHandle}</span>
                </a>
            </div>
        </section>
    );
}
