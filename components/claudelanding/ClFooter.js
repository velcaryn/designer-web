'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { InstagramLogo, WhatsappLogo, ArrowUpRight, MapPin } from '@phosphor-icons/react';
import { brand, contact, emailHref, waDefault } from '@/config/site';

const NAV_GROUPS = [
    {
        title: 'Services',
        links: [
            { href: '/services/websites', label: 'Websites' },
            { href: '/services/seo', label: 'SEO & Search' },
            { href: '/services/content-and-social', label: 'Content & Social' },
            { href: '/demo-site', label: 'Demo Showcase', badge: '16' },
        ],
    },
    {
        /* Three verticals, not all 24: a link-farm footer is worse for
           search than no vertical links at all. These three are picked
           for the highest-intent search terms ("wedding photographer
           website", "restaurant website design"), and the group's
           existence proves the pattern out; the remaining 21 are reached
           from their own /demo-site card and its DemoCta link, not from
           here. */
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
            { href: '/#work', label: 'Selected Work' },
            { href: '/#grow', label: 'How We Work' },
            { href: '/#invest', label: 'Pricing & Scope' },
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

export default function ClFooter() {
    /* THE PRODUCT, NOT JUST THE COMPANY.

       One footer serves both / and /cloud, and it said "VelBiz Digital"
       on both. On the Cloud page that is the wrong name: the product a
       visitor has just read about is VelBiz Cloud. The mark and the rest
       of the footer are identical, only the wordmark changes. */
    const pathname = usePathname();
    const productName = pathname?.startsWith('/cloud')
        ? `${brand.shortName} Cloud`
        : brand.name;

    const year = new Date().getFullYear();

    return (
        <footer className="cl-foot">
            <div className="cl-foot__glow" aria-hidden="true" />
            <div className="cl-foot__glowSecondary" aria-hidden="true" />

            <div className="nv-shell cl-foot__inner">
                {/* Main Content Grid */}
                <div className="cl-foot__grid">
                    {/* Left Column: Brand, Availability, and Direct Action Card */}
                    <div className="cl-foot__brandCard">
                        <div className="cl-foot__brandHeader">
                            <div className="cl-foot__brandIdentity">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/vb-mark-light.svg"
                                    alt=""
                                    className="cl-foot__logo"
                                    /* 1.31 after the viewBox crop, closer
                                       to square than the mark this
                                       replaced. Sized to match the CSS
                                       height in .cl-foot__logo. */
                                    width={42}
                                    height={32}
                                />
                                {/* The second word fades out of the first,
                                    so the lockup reads as one object with
                                    a qualifier rather than two words of
                                    equal weight. See .cl-foot__brandName. */}
                                <span className="cl-foot__brandName">
                                    {productName}
                                </span>
                            </div>
                            <div className="cl-foot__statusPill">
                                <span className="cl-foot__pulseDot" aria-hidden="true" />
                                <span>Available for projects</span>
                            </div>
                        </div>

                        <p className="cl-foot__tagline">
                            High-performance websites, bespoke digital storefronts, and local growth for ambitious businesses.
                        </p>

                        <div className="cl-foot__actions">
                            <a
                                href={waDefault}
                                rel="noreferrer noopener"
                                className="cl-foot__btnPrimary"
                            >
                                <WhatsappLogo size={18} weight="fill" />
                                <span>Chat on WhatsApp</span>
                                <ArrowUpRight size={15} weight="bold" />
                            </a>
                            <a href={emailHref} className="cl-foot__btnSecondary">
                                <span>{contact.email}</span>
                            </a>
                        </div>

                        <div className="cl-foot__location">
                            <MapPin size={14} weight="bold" />
                            <span>{brand.base}</span>
                        </div>
                    </div>

                    {/* Right Column: Curated Navigation Columns */}
                    <nav className="cl-foot__nav" aria-label="Footer navigation">
                        {NAV_GROUPS.map((group) => (
                            <div
                                key={group.title}
                                className={`cl-foot__navCol cl-foot__navCol--${group.title.toLowerCase()}`}
                            >
                                <h3 className="cl-foot__colHeading">{group.title}</h3>
                                <ul className="cl-foot__linkList">
                                    {group.links.map((link) => (
                                        <li key={link.href}>
                                            <Link href={link.href} className="cl-foot__link">
                                                <span>{link.label}</span>
                                                {link.badge && (
                                                    <span className="cl-foot__linkBadge">{link.badge}</span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Architectural Brand Watermark */}
                <div className="cl-foot__watermarkWrap" aria-hidden="true">
                    {/* The full name, in the wordmark face, not "VELBIZ"
                        in all caps. The footer's own lockup a few lines
                        up already reads "VelBiz Digital"; a watermark
                        shouting a different, shorter form of the same
                        name underneath it made the page carry two
                        versions of the brand. */}
                    <span className="cl-foot__watermark">{productName}</span>
                </div>

                {/* Bottom Metadata & Legal Bar */}
                <div className="cl-foot__metaBar">
                    <p className="cl-foot__legal">
                        &copy; {year} {brand.name}. {brand.parent}.
                    </p>

                    <div className="cl-foot__metaRight">
                        <a
                            href={contact.instagram}
                            rel="noreferrer noopener"
                            className="cl-foot__socialLink"
                        >
                            <InstagramLogo size={16} weight="bold" />
                            <span>{contact.instagramHandle}</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
