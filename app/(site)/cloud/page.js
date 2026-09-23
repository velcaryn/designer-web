/**
 * VelBiz Cloud.
 *
 * This route previously held a version written against the /newlanding
 * design, using `nl-` classes and linking back to it. It is replaced here by
 * the migration of the Velcaryn Cloud offering, rewritten for a small
 * business, and now sits under the same visual system as /claudelanding.
 * The previous version's copy is not carried forward; see the header of
 * components/cloud/CloudHero.js and CloudModules.js for what was dropped and
 * why.
 *
 * A server component. Only the demo tabs and the price calculator need
 * state, and both are client components of their own, so the hero, the
 * module list and the footer are all rendered on the server.
 */
import '../claudelanding.css';

import { brand } from '@/config/site';
import StructuredData from '@/components/StructuredData';
import CloudNav from '@/components/cloud/CloudNav';
import CloudHero from '@/components/cloud/CloudHero';
import CloudDemo from '@/components/cloud/CloudDemo';
import CloudModules from '@/components/cloud/CloudModules';
import CloudSecurity from '@/components/cloud/CloudSecurity';
import CloudCta from '@/components/cloud/CloudCta';
import Nl4Footer from '@/components/newlanding-v4/Nl4Footer';
import Nl4Dock from '@/components/newlanding-v4/Nl4Dock';

export const metadata = {
    title: `VelBiz Cloud | ${brand.name}`,
    description: `Orders, customers, stock, staff and the money in one system, wired to the website ${brand.shortName} builds you.`,
    alternates: { canonical: '/cloud' },
    openGraph: {
        title: `VelBiz Cloud | ${brand.name}`,
        description: `Orders, customers, stock, staff and the money in one system, wired to the website ${brand.shortName} builds you.`,
        url: '/cloud',
        siteName: brand.name,
        locale: 'en_IN',
        type: 'website',
        images: [
            {
                url: '/opengraph-image',
                width: 1200,
                height: 630,
                alt: `VelBiz Cloud - ${brand.name}`,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `VelBiz Cloud | ${brand.name}`,
        description: `Orders, customers, stock, staff and the money in one system, wired to the website ${brand.shortName} builds you.`,
        images: ['/opengraph-image'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function CloudPage() {
    return (
        <>
            <StructuredData />
            <CloudNav />
            <main>
                <CloudHero />
                <CloudDemo />
                <CloudModules />
                <CloudSecurity />
                <CloudCta />
            </main>
            <Nl4Footer home="/" />
            <Nl4Dock home="/" />
        </>
    );
}
