'use client';

/**
 * The header on the demo hub.
 *
 * Chrome comes from ClTopbar. This supplies the qualifier and the links.
 *
 * The lockup reads "VelBiz Examples" rather than "VelBiz Digital",
 * because the hub is the one page where the qualifier is doing real
 * work: it tells a visitor who arrived on a demo and tapped back where
 * they have landed.
 */
import ClTopbar from '@/components/claudelanding/ClTopbar';

const LINKS = [
    { href: '/', label: 'Home' },
    { href: '/services/websites', label: 'Services' },
    { href: '/cloud', label: 'Cloud' },
];

export default function HubNav() {
    return <ClTopbar qualifier="Examples" links={LINKS} />;
}
