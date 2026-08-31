'use client';

/**
 * The header on the legal pages.
 *
 * Chrome comes from ClTopbar. Home first, because somebody who has
 * finished reading the terms wants out more often than they want the
 * next policy.
 */
import ClTopbar from '@/components/claudelanding/ClTopbar';

const LEGAL_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/credits', label: 'Credits' },
];

export default function ClLegalNav({ current }) {
    const links = LEGAL_LINKS.map((l) => ({ ...l, active: l.href === current }));
    return <ClTopbar qualifier="Digital" links={links} />;
}
