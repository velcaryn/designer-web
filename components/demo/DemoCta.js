'use client';

/**
 * The one commercial ask on a demo page.
 *
 * Sits in the thumb zone on a phone, because the visitor arrived from a
 * WhatsApp chat on a phone and that is where their hand already is.
 *
 * WHY THE MESSAGE NAMES THE VERTICAL
 *
 * A prospect who taps this has just spent a minute looking at a bakery
 * site. Opening a chat that says only "hello" throws that context away
 * and makes them explain themselves. Naming the demo they were looking at
 * means the conversation starts where their head already is.
 *
 * WHY waLink() AND NOT A HAND-WRITTEN URL
 *
 * scripts/check-brand-leak.mjs hard-fails on `wa.me/<digits>` anywhere
 * outside config/site.js, and it is right to: on an earlier build the
 * number lived in eight files and cloning the repo while missing one
 * shipped the previous client's number. This is the only live WhatsApp
 * link on any demo page. The fictional business's own order buttons never
 * open a real chat, because there is no business behind them.
 *
 * THE SECOND LINK, TO /for/<slug>
 *
 * A visitor who taps this CTA is exactly the audience app/for/[slug]
 * exists for: someone who has just looked at a real sample and is
 * deciding whether to talk to VelBiz. Sending them straight to WhatsApp
 * works for someone ready to talk now; the /for page is there for
 * someone who wants to read VelBiz's own pitch for their trade first,
 * with its own indexable page for anyone who lands on the demo cold from
 * search rather than a WhatsApp share.
 *
 * Rendered only when a vertical page actually exists for this slug
 * (checked at build time via `hasContent`, passed down from the route,
 * not guessed here), so a demo whose vertical page has not been written
 * yet never links to a 404.
 */
import Link from 'next/link';
import { WhatsappLogo, ArrowRight } from '@phosphor-icons/react';
import { waLink } from '@/config/site';

export default function DemoCta({ label, trade, slug, hasVerticalPage }) {
    const message = trade
        ? `Hello, I looked at the ${label} demo on your site. I run a ${trade} and I would like a website like that.`
        : `Hello, I looked at the ${label} demo on your site. I would like a website like that for my business.`;

    return (
        <div className="vd-cta">
            <div className="vd-cta__inner">
                <p className="vd-cta__text">
                    Want a site like this for your own business?
                </p>
                <div className="vd-cta__actions">
                    <a
                        href={waLink(message)}
                        className="vd-btn vd-cta__btn"
                        rel="noreferrer noopener"
                    >
                        <WhatsappLogo size={20} weight="fill" aria-hidden="true" />
                        Ask us about it
                    </a>
                    {hasVerticalPage && (
                        <Link href={`/for/${slug}`} className="vd-cta__read">
                            What we build for a {trade}
                            <ArrowRight size={14} weight="bold" aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
