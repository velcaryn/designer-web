/**
 * The primary homepage for VelBiz Digital.
 *
 * Promoted from /newlanding-v4 (September 2026).
 *
 * WHAT IT IS MADE OF
 *
 * The first draft's block structure and its pricing presentation, the
 * second draft's copy register and machinery (real screenshots, the real
 * demo sites, prices from config, one CTA intent), and the live home
 * page's hero, FAQ, "who builds this" and crowd sections. The reader is
 * a business owner around fifty who reads English fully but is not
 * technical and has never bought a website.
 *
 * Section order runs: what we do, why it matters, what it does, what it
 * costs, what else we do, the questions, the ask, who we are, our work,
 * the crowd, Instagram. Every section id is a target for the header, the
 * dock or both; change one and change Nl4Nav.js and Nl4Dock.js with it.
 *
 * A server component. Only five leaves need the browser (the nav's menu,
 * the hero, the FAQ disclosure, the ask card's analytics call, the dock)
 * and each carries its own 'use client'. `metadata` therefore lives here
 * rather than in the root layout.
 *
 * ONE ARRAY, TWO CONSUMERS. StructuredData is handed the exact array
 * ClFaq renders, so the answers a crawler is given and the answers a
 * person reads cannot drift.
 */
import './claudelanding.css';
import './nv4-faq.css';
import './newlanding-v4.css';

import { brand, plans, pricing, v4Faqs } from '@/config/site';
import StructuredData from '@/components/StructuredData';
import ClCrowd from '@/components/claudelanding/ClCrowd';
import Nl4Nav from '@/components/newlanding-v4/Nl4Nav';
import Nl4Hero from '@/components/newlanding-v4/Nl4Hero';
import Nl4Why from '@/components/newlanding-v4/Nl4Why';
import Nl4Examples from '@/components/newlanding-v4/Nl4Examples';
import Nl4Metrics from '@/components/newlanding-v4/Nl4Metrics';
import Nl4Price from '@/components/newlanding-v4/Nl4Price';
import Nl4Content from '@/components/newlanding-v4/Nl4Content';
import Nl4Faq from '@/components/newlanding-v4/Nl4Faq';
import Nl4Ask from '@/components/newlanding-v4/Nl4Ask';
import Nl4Who from '@/components/newlanding-v4/Nl4Who';
import Nl4Follow from '@/components/newlanding-v4/Nl4Follow';
import Nl4Footer from '@/components/newlanding-v4/Nl4Footer';
import Nl4Dock from '@/components/newlanding-v4/Nl4Dock';

export const metadata = {
    /* The home page shares the layout's segment, so the "%s | VelBiz Digital"
       template does not apply here: the brand has to be in the title itself.
       Tamil Nadu is named because the business is local and so is the search. */
    title: { absolute: 'Websites for Small Businesses in Tamil Nadu | VelBiz Digital' },
    description: `We build websites for small businesses. From ${pricing.currency} ${plans[0].price}, one fixed price agreed before anything starts. ${brand.shortName}, ${brand.base}.`,
    alternates: { canonical: '/' },
    openGraph: {
        title: `${brand.name} | Websites for small businesses`,
        description: `We build websites for small businesses. From ${pricing.currency} ${plans[0].price}, one fixed price agreed before anything starts. ${brand.shortName}, ${brand.base}.`,
        url: '/',
        siteName: brand.name,
        locale: 'en_IN',
        type: 'website',
        images: [
            {
                url: '/opengraph-image',
                width: 1200,
                height: 630,
                alt: `${brand.name} - Websites for small businesses`,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${brand.name} | Websites for small businesses`,
        description: `We build websites for small businesses. From ${pricing.currency} ${plans[0].price}, one fixed price agreed before anything starts. ${brand.shortName}, ${brand.base}.`,
        images: ['/opengraph-image'],
    },
};

export default function HomePage() {
    return (
        <>
            <StructuredData pageFaqs={v4Faqs} />
            <Nl4Nav />

            <main>
                <Nl4Hero />
                <Nl4Why />
                <Nl4Metrics />
                <Nl4Price />
                <Nl4Content />
                <Nl4Faq />
                <Nl4Ask />
                <Nl4Who />
                {/* The examples sit here, above the crowd, at the owner's
                    request: the last thing before the closing image is
                    the proof. The hero's "Explore live demo" still points
                    at them. */}
                <Nl4Examples />
                <ClCrowd />
                <Nl4Follow />
            </main>

            <Nl4Footer />
            <Nl4Dock />
        </>
    );
}

