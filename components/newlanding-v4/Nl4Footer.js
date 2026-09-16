'use client';

/**
 * The footer, in two rows.
 *
 * The owner asked for React Bits Pro's footer-6, "two row footer with
 * categories and large links". The block is paywalled and no licence key
 * is configured here, so this is that design built on the house tokens,
 * at the owner's choice.
 *
 * ROW ONE is the lockup, the availability pill, the tagline, and four
 * large links in the display face: the places a visitor most often goes
 * from the bottom of a page. ROW TWO is the four category columns, the
 * contact card, and the legal bar.
 *
 * EVERYTHING ClFooter.js CARRIES IS HERE, by name: the four groups and
 * every link in them, "Available for projects", the tagline, the
 * WhatsApp button, the email, the base, the Instagram handle, and the
 * copyright with the parent company. Two changes on purpose: the demo
 * badge reads the real count from content/demos rather than a stale
 * "16", and the Studio links point at this page's own sections
 * (examples, why, price) rather than the old home page's anchors, so
 * they keep working when this page becomes the home page.
 *
 * It keeps ClFooter's dark ground, the one documented exception to the
 * theme lock, so every page ends the same way. A client component only
 * for the year.
 */
import Link from 'next/link';
import { InstagramLogo, WhatsappLogo, ArrowUpRight, MapPin, EnvelopeSimple } from '@phosphor-icons/react';
import { brand, contact, emailHref, waDefault } from '@/config/site';
import { DEMOS } from '@/content/demos';

const BIG_LINKS = [
    { href: '/services/websites', label: 'Services' },
    { href: '#examples', label: 'Examples' },
    { href: '/cloud', label: 'VelBiz Cloud' },
    { href: '#talk', label: 'Contact' },
];

const NAV_GROUPS = [
    {
        title: 'Services',
        links: [
            { href: '/services/websites', label: 'Websites' },
            { href: '/services/seo', label: 'SEO & Search' },
            { href: '/services/content-and-social', label: 'Content & Social' },
            { href: '/demo-site', label: 'Demo Showcase', badge: String(DEMOS.length) },
        ],
    },
    {
        title: 'For your trade',
        links: [
            { href: '/for/photo-studio', label: 'Photo studios' },
            { href: '/for/restaurant', label: 'Restaurants' },
            { href: '/for/clinic', label: 'Clinics' },
        ],
    },
    {
        title: 'Studio',
        links: [
            { href: '/cloud', label: 'VelBiz Cloud' },
            { href: '#examples', label: 'Selected Work' },
            { href: '#why', label: 'How We Work' },
            { href: '#price', label: 'Pricing & Scope' },
        ],
    },
    {
        title: 'Company',
        links: [
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Use' },
            { href: '/credits', label: 'Credits' },
        ],
    },
];

function FootLink({ href, home, className, children }) {
    return href.startsWith('#')
        ? <a href={home + href} className={className}>{children}</a>
        : <Link href={href} className={className}>{children}</Link>;
}

/**
 * `home` is the landing page's path when this footer is rendered on
 * another page (/cloud, /services/*), so its section anchors resolve
 * there; '' on the landing page itself.
 */
export default function Nl4Footer({ home = '' }) {
    const year = new Date().getFullYear();

    return (
        <footer className="nv4-foot">
            <div className="nv-shell">
                {/* Row one */}
                <div className="nv4-foot__top">
                    <div className="nv4-foot__brand">
                        <div className="nv4-foot__lockup">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/vb-mark-light.svg" alt="" width={42} height={32} className="nv4-foot__logo" />
                            <span className="nv4-foot__name">{brand.name}</span>
                        </div>
                        <span className="nv4-foot__pill">
                            <span className="nv4-foot__dot" aria-hidden="true" />
                            Available for projects
                        </span>
                        <p className="nv4-foot__tagline">
                            High-performance websites, bespoke digital storefronts, and local growth for ambitious businesses.
                        </p>
                    </div>

                    <nav className="nv4-foot__big" aria-label="Main footer links">
                        {BIG_LINKS.map((l) => (
                            <FootLink key={l.label} href={l.href} home={home} className="nv4-foot__bigLink">
                                <span>{l.label}</span>
                                <ArrowUpRight size={22} weight="bold" aria-hidden="true" />
                            </FootLink>
                        ))}
                    </nav>
                </div>

                {/* Row two */}
                <div className="nv4-foot__bottom">
                    <nav className="nv4-foot__groups" aria-label="Footer navigation">
                        {NAV_GROUPS.map((group) => (
                            <div key={group.title} className="nv4-foot__group">
                                <h3 className="nv4-foot__groupHead">{group.title}</h3>
                                <ul className="nv4-foot__list">
                                    {group.links.map((link) => (
                                        <li key={link.href + link.label}>
                                            <FootLink href={link.href} home={home} className="nv4-foot__link">
                                                <span>{link.label}</span>
                                                {link.badge && <span className="nv4-foot__badge">{link.badge}</span>}
                                            </FootLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>

                    <div className="nv4-foot__contact">
                        <h3 className="nv4-foot__groupHead">Talk to us</h3>
                        <a href={waDefault} rel="noreferrer noopener" className="nv-btn nv-btn--primary nv4-foot__wa">
                            <WhatsappLogo size={18} weight="fill" aria-hidden="true" />
                            <span>Chat on WhatsApp</span>
                        </a>
                        <ul className="nv4-foot__contactList">
                            <li>
                                <EnvelopeSimple size={16} weight="bold" aria-hidden="true" />
                                <a href={emailHref}>{contact.email}</a>
                            </li>
                            <li>
                                <InstagramLogo size={16} weight="bold" aria-hidden="true" />
                                <a href={contact.instagram} rel="noreferrer noopener">{contact.instagramHandle}</a>
                            </li>
                            <li>
                                <MapPin size={16} weight="bold" aria-hidden="true" />
                                <span>{brand.base}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="nv4-foot__legal">
                    <p>&copy; {year} {brand.name}. {brand.parent}.</p>
                </div>
            </div>
        </footer>
    );
}
