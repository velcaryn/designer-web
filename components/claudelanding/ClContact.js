'use client';

/**
 * The close.
 *
 * WhatsApp first, because that is how the businesses this page is written
 * for already talk to everyone, and because a shop owner on a phone can
 * open it in one tap.
 *
 * PHASE 2: TWO MORE DOORS, BOTH QUIETER THAN THE FIRST
 *
 * The original version of this file offered WhatsApp and a `mailto:` and
 * argued against a form: four fields to start a conversation you could
 * start in one tap is friction bought with nothing. That is still true
 * for the visitor it describes.
 *
 * It is not true for the one it does not. A B2B buyer at a desk, on a
 * machine with no WhatsApp session and no configured mail client, had
 * two dead ends and no third option. So:
 *
 *  - a `tel:` link, using the phoneHref that has existed in config since
 *    the beginning and was rendered nowhere on this page;
 *  - a callback form, collapsed behind a disclosure so it costs no
 *    attention until someone wants it.
 *
 * The ordering is the whole point. WhatsApp is the primary button, the
 * phone and email sit beside it as ghosts, and the form is closed by
 * default. Nobody who would have tapped WhatsApp is slowed down.
 *
 * Every contact detail comes from config/site.js. A `wa.me` or `tel:`
 * URL written by hand in this file would fail npm run check:brand
 * outright: on an earlier build the phone number lived in eight files,
 * and cloning the repo while missing one occurrence ships the previous
 * client's number.
 */
import { useState } from 'react';
import { WhatsappLogo, Phone } from '@phosphor-icons/react';
import { waLink, contact, emailHref, phoneHref } from '@/config/site';
import Reveal from '@/components/Reveal';
import { useBusiness } from './BusinessContext';
import ClLeadForm from './ClLeadForm';
import { track } from '@/lib/analytics';

export default function ClContact() {
    const { displayName, named, type } = useBusiness();
    const [showForm, setShowForm] = useState(false);

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
                            onClick={() => track('whatsapp_clicked', { source: 'talk' })}
                        >
                            <WhatsappLogo size={20} weight="fill" />
                            Message us on WhatsApp
                        </a>
                        <a href={phoneHref} className="nv-btn nv-btn--ghost">
                            <Phone size={20} weight="fill" />
                            {contact.phoneDisplay}
                        </a>
                        <a href={emailHref} className="nv-btn nv-btn--ghost">
                            {contact.email}
                        </a>
                    </div>

                    {/* Closed by default. A real button rather than a
                        <details>, because the panel needs to be announced
                        and because <details> styling is still uneven
                        across browsers at this border weight. */}
                    <div className="cl-contact__callback">
                        {showForm ? (
                            <div className="cl-contact__form">
                                <ClLeadForm
                                    variant="talk"
                                    source="talk"
                                    businessName={named ? displayName : ''}
                                    sector={named ? (type.label || type.id) : ''}
                                    submitLabel="Ask us to call back"
                                    doneMessage="Got it. We will call you back."
                                />
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="cl-contact__toggle"
                                onClick={() => setShowForm(true)}
                            >
                                Prefer we call you back?
                            </button>
                        )}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
