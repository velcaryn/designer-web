'use client';

/**
 * The header on the VelBiz Cloud pages.
 *
 * Chrome comes from ClTopbar, which is also where the CTA now lives.
 * This page used to say "Get started" where every other page said
 * "Contact us": one label, one destination, so the control reads as the
 * same control wherever you meet it.
 *
 * The anchors are real. An earlier version linked #how and #onboard,
 * neither of which exists on the page; the section is #modules and
 * onboarding is its own route.
 */
import ClTopbar from '@/components/claudelanding/ClTopbar';

export default function CloudNav({ current = '/cloud' }) {
    const links = [
        { href: '/', label: 'Home' },
        { href: '#modules', label: 'How it works' },
        {
            href: '/cloud/onboarding',
            label: 'Onboard',
            active: current === '/cloud/onboarding',
        },
    ];

    return <ClTopbar qualifier="Cloud" links={links} />;
}
