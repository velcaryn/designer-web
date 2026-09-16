/**
 * Who builds this. ClWho.js with the blockprint illustration and a Title
 * Case heading; a copy rather than a change to ClWho so the home page is
 * untouched.
 *
 * The same six sentences: we are real, we are here, this is what we are
 * part of. No invented numbers. `brand.parent` and `brand.base` are the
 * two verifiable facts we have. Server component.
 */
import { MapPin, Buildings } from '@phosphor-icons/react/ssr';
import { brand } from '@/config/site';

export default function Nl4Who() {
    return (
        <section id="who" className="nv-section nv-ground--warm">
            <div className="nv-shell">
                <div className="cl-who nv4-who">
                    <div className="cl-who__text">
                        <span className="nv-eyebrow">Who builds this</span>
                        <h2 className="cl-h2">
                            We Are In Tirunelveli, And We Answer Our Own Messages.
                        </h2>
                        <p className="cl-who__body">
                            {brand.name} is a design, development and technical studio, and
                            {' '}
                            {brand.parent.replace(/^A unit of /, 'a unit of ')}
                            . The person who writes back to you on WhatsApp
                            is the person who will build your site, and
                            they will still be there when you need
                            something changed a year later.
                        </p>
                    </div>

                    <div className="nv4-who__side">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/SVGs/blockprint-person-automating-website.svg"
                            alt=""
                            width={300}
                            height={300}
                            loading="lazy"
                            className="nv4-who__img"
                        />
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
                    </div>
                </div>
            </div>
        </section>
    );
}
