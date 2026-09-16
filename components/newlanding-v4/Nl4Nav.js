/**
 * The header on this page.
 *
 * Chrome comes from ClTopbar, which every header on the site shares, for
 * the reasons recorded at the top of that file. This supplies the links.
 *
 * FIVE TABS, NONE OF THEM "CONTACT".
 *
 * The bar already carries the fixed "Contact us" button beside these, so
 * a Contact tab would be the same intent twice on one row. "About" points
 * at the "Who builds this" section, which is otherwise unreachable from
 * the nav and is the one a cautious buyer goes looking for.
 *
 * `ctaHref="#talk"` keeps the button on this page. The default is "/#talk",
 * which on a draft route would navigate to the live homepage.
 */
'use client';

import ClTopbar from '@/components/claudelanding/ClTopbar';

const LINKS = [
    { href: '#why', label: 'Websites' },
    { href: '#examples', label: 'Examples' },
    { href: '#price', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
    { href: '#who', label: 'About' },
];

export default function Nl4Nav() {
    return <ClTopbar qualifier="Digital" links={LINKS} ctaHref="#talk" home="#top" />;
}
