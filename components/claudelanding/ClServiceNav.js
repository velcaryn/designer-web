'use client';

/**
 * The header on a service page.
 *
 * Chrome comes from ClTopbar, which every header on the site now shares.
 * This file supplies only what is different: the three services as the
 * links, and which one you are reading.
 *
 * WHAT WAS REMOVED, AND WHY
 *
 * "Pricing" pointed at /#invest and "Examples" at /demo-site. Both took
 * a reader who was part-way through evaluating one service and threw
 * them onto a different page, which is a strange thing for a nav to do
 * mid-consideration. The price is stated on this page already, and the
 * examples are linked from its body where they are relevant.
 *
 * What is left is Home plus the three services, which is the whole set
 * of places a reader here plausibly wants: back out, or sideways to the
 * service they actually meant.
 */
import ClTopbar from '@/components/claudelanding/ClTopbar';
import { services } from '@/config/site';

export default function ClServiceNav({ current }) {
    const links = [
        { href: '/', label: 'Home' },
        ...services.map((s) => ({
            href: `/services/${s.slug}`,
            label: s.nav,
            active: s.slug === current,
        })),
    ];

    return <ClTopbar qualifier="Digital" links={links} />;
}
