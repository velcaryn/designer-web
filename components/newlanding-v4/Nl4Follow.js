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
import { InstagramLogo } from '@phosphor-icons/react/ssr';
import { contact } from '@/config/site';

/* "https://www.instagram.com/p/<code>/..." -> "<code>". Reels use /reel/. */
function shortcode(url) {
    const m = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
}

export default function Nl4Follow() {
    const posts = (contact.instagramPosts || []).map(shortcode).filter(Boolean).slice(0, 6);

    return (
        <section className="nv-section nv4-follow nv-ground--paper" id="follow">
            <div className="nv-shell nv4-follow__inner">
                <h2 className="nv4-h2 nv4-follow__head">Follow Us On Instagram.</h2>
                <p className="nv-lede nv4-follow__body">
                    New work, before it goes on this page.
                </p>

                {posts.length > 0 && (
                    <ul className="nv4-follow__grid" aria-label="Recent Instagram posts">
                        {posts.map((code) => (
                            <li key={code} className="nv4-follow__cell">
                                <iframe
                                    src={`https://www.instagram.com/p/${code}/embed/`}
                                    title="Instagram post"
                                    loading="lazy"
                                    scrolling="no"
                                    allowtransparency="true"
                                    className="nv4-follow__frame"
                                />
                            </li>
                        ))}
                    </ul>
                )}

                <a
                    href={contact.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="nv-btn nv-btn--ghost"
                >
                    <InstagramLogo size={20} weight="bold" aria-hidden="true" />
                    <span>{contact.instagramHandle}</span>
                </a>
            </div>
        </section>
    );
}
