'use client';

/**
 * The VelBiz Cloud hero.
 *
 * WHAT WAS DROPPED FROM THE SOURCE PAGE, AND WHY
 *
 * The Velcaryn cloud hero carried a four-tile stat bar: "50Cr+ supply
 * volume", "99.9% uptime SLA", "100% GST-ready", "100% tenant isolation".
 * Three of those are Velcaryn's numbers about Velcaryn's business, and the
 * uptime figure is a service commitment nobody here has signed. Repeating
 * them under a different brand would be inventing metrics, which the house
 * rule forbids for exactly this reason: every number on the site has to be
 * something a visitor could check.
 *
 * So the tiles are capability statements instead. They say what the software
 * does, which is true and verifiable in a demo, and claim no figure at all.
 * If real VelBiz numbers exist later they belong here.
 *
 * The headline is in the same register as the landing page: plain words
 * about the visitor's business, not a category name. "Enterprise ERP
 * infrastructure" means nothing to someone running a shop.
 *
 * THE COMMAND BAR IS A PICTURE, NOT A CONTROL
 *
 * The source page's hero carried a search field wired to component state
 * that filtered nothing: typing in it did nothing at all. A text input
 * that accepts a query and never answers is a dead end a keyboard or
 * screen-reader user reaches and cannot get out of, so it is rebuilt here
 * as static markup behind `aria-hidden`, with no input element and
 * nothing focusable inside it. It illustrates what the product looks
 * like, which is all it ever did.
 */
import Link from 'next/link';
import {
    ArrowRight,
    WhatsappLogo,
    Receipt,
    Users,
    Package,
    Lock,
    MagnifyingGlass,
} from '@phosphor-icons/react';
import { waLink } from '@/config/site';

const CAPABILITIES = [
    {
        Icon: Receipt,
        name: 'Bills that are correct',
        note: 'GST worked out for you, with your letterhead on the invoice.',
    },
    {
        Icon: Users,
        name: 'One customer record',
        note: 'The person who enquired and the person who paid are the same row.',
    },
    {
        Icon: Package,
        name: 'Stock that matches',
        note: 'What the shelf has and what the system says stay the same number.',
    },
    {
        Icon: Lock,
        name: 'Your own copy',
        note: 'Runs on your instance. Export everything, any time you ask.',
    },
];

export default function CloudHero() {
    const demoLink = waLink(
        'Hello, I would like to see VelBiz Cloud for my business.',
    );

    return (
        <section className="cld-hero" id="top">
            <div className="nv-shell">
                <h1 className="cld-hero__title">
                    Everything behind the counter,{' '}
                    <span className="nv-mark">in one place</span>.
                </h1>

                <p className="nv-lede cl-hero__lede">
                    Most shops run on a notebook, a billing app and a
                    spreadsheet that never agree. This is the one system that
                    replaces all three, and it is wired to the website we build
                    you.
                </p>

                {/* The mock. Not a form, not focusable, hidden from the
                    accessibility tree entirely. */}
                <div className="cld-cmd" aria-hidden="true">
                    <span className="cld-cmd__field">
                        <MagnifyingGlass size={18} weight="bold" />
                        <span className="cld-cmd__placeholder">
                            Search invoices, customers, stock, staff
                        </span>
                    </span>
                    <span className="cld-cmd__hint">Quick launch</span>
                </div>

                <div className="cl-actions">
                    <a
                        href={demoLink}
                        className="nv-btn nv-btn--primary"
                        rel="noreferrer noopener"
                    >
                        <WhatsappLogo size={20} weight="fill" />
                        Ask for a walkthrough
                    </a>
                    <Link
                        href="/cloud/onboarding"
                        className="nv-btn nv-btn--ghost"
                    >
                        Start free trial
                        <ArrowRight size={18} weight="bold" />
                    </Link>
                </div>

                <ul className="cld-hero__chips">
                    {CAPABILITIES.map(({ Icon, name, note }) => (
                        <li key={name} className="cld-capability">
                            <Icon size={22} weight="bold" />
                            <span className="cld-capability__name">{name}</span>
                            <span className="cld-capability__note">{note}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
