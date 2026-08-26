'use client';

/**
 * The close on /cloud.
 *
 * The source page ended on "Ready to Experience the Future of Healthcare
 * Ops?" over a founders section. Both are gone: the founders are Velcaryn's
 * people rather than VelBiz's, and the healthcare framing is the whole
 * reason this content needed rewriting.
 *
 * What replaces it is an offer a shop owner can act on without a meeting.
 * Contact details come from config/site.js; a hand-written wa.me URL here
 * would fail npm run check:brand, correctly.
 */
import { WhatsappLogo } from '@phosphor-icons/react';
import { waLink, contact, emailHref } from '@/config/site';
import Reveal from '@/components/Reveal';

export default function CloudCta() {
    const link = waLink(
        'Hello, I would like to see VelBiz Cloud with my own numbers in it.',
    );

    return (
        <section id="talk" className="nv-section nv-ground--lav-full cl-contact">
            <div className="nv-shell">
                <Reveal className="cl-contact__inner">
                    <h2 className="cl-h2">
                        Bring one month of your own numbers.
                    </h2>
                    <p className="cl-contact__body">
                        Send us a month of bills and we will set it up with your
                        real data in it, so you are looking at your own shop
                        rather than a demo. Twenty minutes, no charge.
                    </p>

                    <div className="cl-contact__actions">
                        <a
                            href={link}
                            className="nv-btn nv-btn--primary"
                            rel="noreferrer noopener"
                        >
                            <WhatsappLogo size={20} weight="fill" />
                            Message us on WhatsApp
                        </a>
                        <a href={emailHref} className="nv-btn nv-btn--ghost">
                            {contact.email}
                        </a>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
