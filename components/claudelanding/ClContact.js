'use client';

/**
 * The close.
 *
 * One action, WhatsApp, because that is how the businesses this page is
 * written for already talk to everyone. There is no form: a form asks a shop
 * owner on a phone to fill four fields to start a conversation they could
 * have started in one tap.
 *
 * Every contact detail comes from config/site.js through waLink(). Nothing
 * here is hand-typed, and a `wa.me` URL written by hand in this file would
 * fail npm run check:brand outright. The reason is in that file's header: on
 * an earlier build the phone number lived in eight files, and cloning the
 * repo while missing one occurrence ships the previous client's number.
 *
 * The message is prefilled with the business name the visitor typed, so the
 * conversation opens with context instead of "hello". If they typed nothing
 * the fallback is used and the message still reads correctly.
 */
import { WhatsappLogo } from '@phosphor-icons/react';
import { waLink, contact, emailHref } from '@/config/site';
import Reveal from '@/components/Reveal';
import { useBusiness } from './BusinessContext';

export default function ClContact() {
    const { displayName, named, type } = useBusiness();

    const message = named
        ? `Hello, I run ${displayName}, a ${type.noun}. I would like to talk about a website.`
        : 'Hello, I would like to talk about a website for my business.';

    return (
        <section
            id="talk"
            className="nv-section nv-ground--lav-full cl-contact"
        >
            <div className="nv-shell">
                <Reveal className="cl-contact__inner">
                    <h2 className="cl-h2">
                        Tell us what you sell. We will tell you what it needs.
                    </h2>
                    <p className="cl-contact__body">
                        One conversation, no charge and no pitch deck. If we are
                        not the right fit we will say so.
                    </p>

                    <div className="cl-contact__actions">
                        <a
                            href={waLink(message)}
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
