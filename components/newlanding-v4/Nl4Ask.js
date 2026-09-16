'use client';

/**
 * The one action, directly after the questions.
 *
 * The illustration (a person answering a ringing phone, public/SVGs)
 * sits beside the words at desktop and above them on a phone; it says
 * "somebody picks up" without a sentence. Decorative, so empty alt.
 *
 * The WhatsApp button is magicui's PulsatingButton (vendored, rendering
 * an <a> because it is a link), pulsing in the accent so the one thing
 * on the page we want tapped is the one thing that moves. Every contact
 * detail comes from config/site.js. Client component for the analytics
 * call.
 */
import { WhatsappLogo, Phone, MapPin, EnvelopeSimple } from '@phosphor-icons/react';
import { PulsatingButton } from '@/registry/magicui/pulsating-button';
import { brand, contact, waLink, phoneHref, emailHref } from '@/config/site';
import { track } from '@/lib/analytics';

export default function Nl4Ask() {
    const waHref = waLink('Hello. I would like to talk about a website for my business.');

    return (
        <section className="nv-section nv-ground--paper" id="talk">
            <div className="nv-shell">
                <div className="nv4-ask">
                    <div className="nv4-ask__figure" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/SVGs/answering-ringing-phone.svg"
                            alt=""
                            width={213}
                            height={216}
                            loading="lazy"
                            className="nv4-ask__img"
                        />
                    </div>
                    <div className="nv4-ask__text">
                    <h2 className="nv4-ask__head">Ask Us Anything Else.</h2>
                    <p className="nv4-ask__body">
                        Not sure if your business needs a website? We will
                        guide you honestly and recommend what fits your
                        business.
                    </p>

                    <div className="nv4-ask__actions">
                        <PulsatingButton
                            href={waHref}
                            target="_blank"
                            rel="noreferrer"
                            className="nv-btn nv-btn--primary nv4-ask__wa"
                            duration="1.8s"
                            distance="10px"
                            onClick={() => track('whatsapp_clicked', { source: 'talk' })}
                        >
                            <WhatsappLogo size={20} weight="fill" aria-hidden="true" />
                            <span>Message on WhatsApp</span>
                        </PulsatingButton>
                        <a href={phoneHref} className="nv-btn nv-btn--ghost">
                            <Phone size={18} weight="bold" aria-hidden="true" />
                            <span>Call us {contact.phoneDisplay}</span>
                        </a>
                    </div>

                    <ul className="nv4-ask__meta">
                        <li className="nv4-ask__metaItem">
                            <MapPin size={18} weight="bold" aria-hidden="true" />
                            <span>{brand.base}</span>
                        </li>
                        <li className="nv4-ask__metaItem">
                            <EnvelopeSimple size={18} weight="bold" aria-hidden="true" />
                            <a href={emailHref}>{contact.email}</a>
                        </li>
                    </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
