/**
 * Who builds this.
 *
 * WHY IT EXISTS
 *
 * A small business owner about to send money to a website company wants
 * to know a person exists. The whole site is written in the first person
 * plural with no faces, no history and no location above the footer, and
 * the crowd illustration immediately above it is a crowd of strangers.
 *
 * WHY IT IS SIX SENTENCES AND NOT A FOUNDER ESSAY
 *
 * The visitor is here to buy a website, not to read about us. What they
 * need is: we are real, we are here, and this is what we are part of.
 * Everything past that is us talking about ourselves on a page that is
 * meant to be about them.
 *
 * NO INVENTED NUMBERS. No years-in-business count, no projects-delivered
 * figure, no team size. `brand.parent` and `brand.base` are the two
 * verifiable facts we have, and they carry it.
 *
 * Server component.
 */
import { MapPin, Buildings } from '@phosphor-icons/react/ssr';
import { brand } from '@/config/site';
import Reveal from '@/components/Reveal';

export default function ClWho() {
    return (
        <section id="who" className="nv-section nv-ground--paper">
            <div className="nv-shell">
                <Reveal className="cl-who">
                    <div className="cl-who__text">
                        <span className="nv-eyebrow">Who builds this</span>
                        <h2 className="cl-h2">
                            We are in Tirunelveli, and we answer our own
                            messages.
                        </h2>
                        <p className="cl-who__body">
                            {brand.name} is a small studio, and
                            {' '}
                            {brand.parent.replace(/^A unit of /, 'a unit of ')}
                            . The person who writes back to you on WhatsApp
                            is the person who will build your site, and
                            they will still be there when you need
                            something changed a year later.
                        </p>
                        <p className="cl-who__body">
                            We work with businesses across Tamil Nadu and
                            most of them are within a couple of hours of
                            here. That is on purpose: it means we can come
                            and look at your shop.
                        </p>
                    </div>

                    <ul className="cl-who__facts">
                        <li className="cl-who__fact">
                            <MapPin size={20} weight="bold" aria-hidden="true" />
                            <span>
                                <strong>Where we are</strong>
                                {brand.base}
                            </span>
                        </li>
                        <li className="cl-who__fact">
                            <Buildings size={20} weight="bold" aria-hidden="true" />
                            <span>
                                <strong>Who we are part of</strong>
                                {brand.parent.replace(/^A unit of /, '')}
                            </span>
                        </li>
                    </ul>
                </Reveal>
            </div>
        </section>
    );
}
