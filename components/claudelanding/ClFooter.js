'use client';

/**
 * Footer, round three: the footer-19 layout from the watermelon registry,
 * rebuilt against this site's own tokens and real content.
 *
 * `npx shadcn add https://registry.watermelon.sh/r/footer-19.json`. This
 * repo has no shadcn `components.json` and vendors registry components by
 * hand, and footer-19 in particular could not be dropped in as-is: it
 * carries `@hugeicons/react` (this site uses Phosphor everywhere else),
 * hard-coded violet and neutral Tailwind colours (this site's palette is
 * five swappable themes driven by custom properties, and Tailwind here is
 * scoped to registry/** only), and a live clock. What is kept is the
 * LAYOUT, which is the part that was asked for: a dark full-bleed panel,
 * a large statement at the top with a call to action beside it, the brand
 * row, three nav columns, and a bottom meta bar with copyright, base and
 * socials.
 *
 * WHAT IS REAL AND WHAT WAS DROPPED
 *
 * The newsletter form is gone. There is no list to subscribe anyone to,
 * and a form that silently discards an email address is worse than no
 * form; the slot it occupied carries the WhatsApp action that every other
 * CTA on this page already points at. The "Trusted by Thousands" badge is
 * gone for the same reason the rest of this site has no invented metrics.
 * The live clock is gone because a ticking clock is motion with no
 * meaning, and it forces a client render for a static fact.
 *
 * Every link below goes somewhere real: the five page sections, /cloud,
 * and the three legal pages (/privacy, /terms, /credits) that used to be
 * reachable only from a single cramped row.
 */
import Link from 'next/link';
import { InstagramLogo, WhatsappLogo, ArrowUpRight } from '@phosphor-icons/react';
import { brand, contact, emailHref, waDefault } from '@/config/site';

const COLUMNS = [
    {
        title: 'Studio',
        links: [
            { href: '/#top', label: 'Home' },
            { href: '/#grow', label: 'How it works' },
            { href: '/#tech', label: 'Tech' },
            { href: '/#lab', label: 'Lab' },
            { href: '/#work', label: 'Work' },
        ],
    },
    {
        title: 'Product',
        links: [
            { href: '/cloud', label: 'VelBiz Cloud' },
            { href: '/#talk', label: 'Start a project' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { href: '/privacy', label: 'Privacy policy' },
            { href: '/terms', label: 'Terms of use' },
            { href: '/credits', label: 'Credits' },
        ],
    },
];

export default function ClFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="cl-foot">
            <div className="cl-foot__glow" aria-hidden="true" />

            <div className="nv-shell cl-foot__inner">
                <div className="cl-foot__lead">
                    <h2 className="cl-foot__heading">
                        Let us build the thing
                        <br />
                        your business is losing
                        <br />
                        customers without.
                    </h2>

                    <div className="cl-foot__leadAction">
                        <a
                            href={waDefault}
                            rel="noreferrer noopener"
                            className="cl-foot__cta"
                        >
                            <WhatsappLogo size={18} weight="bold" />
                            Message us on WhatsApp
                            <ArrowUpRight size={16} weight="bold" />
                        </a>
                        <a href={emailHref} className="cl-foot__email">
                            {contact.email}
                        </a>
                    </div>
                </div>

                <div className="cl-foot__mid">
                    <div className="cl-foot__brand">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/vb-mark.svg"
                            alt=""
                            className="cl-foot__nameIcon"
                        />
                        <span className="cl-foot__name">{brand.name}</span>
                    </div>

                    <nav className="cl-foot__cols" aria-label="Footer">
                        {COLUMNS.map((col) => (
                            <div key={col.title} className="cl-foot__col">
                                <h3 className="cl-foot__colTitle">{col.title}</h3>
                                <ul className="cl-foot__colLinks">
                                    {col.links.map((link) => (
                                        <li key={link.href}>
                                            <Link href={link.href}>{link.label}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="cl-foot__bottom">
                    <p className="cl-foot__copyright">
                        &copy; {year} {brand.name}. {brand.parent}.
                    </p>

                    <span className="cl-foot__base">{brand.base}</span>

                    <div className="cl-foot__socials">
                        <a
                            href={contact.instagram}
                            rel="noreferrer noopener"
                        >
                            <InstagramLogo size={16} weight="bold" />
                            {contact.instagramHandle}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
