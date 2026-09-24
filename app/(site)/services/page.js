/**
 * The services index.
 *
 * There was no /services route: the three service pages existed and the
 * header linked to them, but /services itself was a 404. This is the
 * door: one card per service, read from config/site.js so the names,
 * headlines and ledes cannot drift from the pages they point at.
 *
 * Content, illustrations and animation to follow from the owner; this
 * carries the shared chrome (the header, the v4 dock, the v4 footer) and
 * the responsive rules so the page is consistent with the landing page
 * from the first day.
 */
import '../claudelanding.css';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { brand, services } from '@/config/site';
import StructuredData from '@/components/StructuredData';
import ClServiceNav from '@/components/claudelanding/ClServiceNav';
import Nl4Dock from '@/components/newlanding-v4/Nl4Dock';
import Nl4Footer from '@/components/newlanding-v4/Nl4Footer';
import { SparklesText } from '@/registry/magicui/sparkles-text';
import { ShineBorder } from '@/registry/magicui/shine-border';

export const metadata = {
    title: 'Websites, Online Shops and SEO',
    description: `What ${brand.shortName} does: websites, getting found on search and maps, and the words and posts that bring people back.`,
    alternates: { canonical: '/services' },
    openGraph: {
        title: `Services | ${brand.name}`,
        description: `What ${brand.shortName} does: websites, getting found on search and maps, and the words and posts that bring people back.`,
        url: '/services',
        siteName: brand.name,
        locale: 'en_IN',
        type: 'website',
        images: [
            {
                url: '/opengraph-image',
                width: 1200,
                height: 630,
                alt: `Services - ${brand.name}`,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `Services | ${brand.name}`,
        description: `What ${brand.shortName} does: websites, getting found on search and maps, and the words and posts that bring people back.`,
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

export default function ServicesIndexPage() {
    return (
        <>
            <StructuredData />
            <ClServiceNav />

            <main>
                <section className="nv-section nv-ground--paper nv-svcIndex__head">
                    <div className="nv-shell">
                        <SparklesText
                            as="h1"
                            text="What We Do."
                            className="nv-svcIndex__title"
                            colors={{ first: '#0066cc', second: '#a855f7' }}
                            sparklesCount={7}
                        />
                        <p className="nv-lede">
                            Three things, each with its own page: the website,
                            being found, and the words and posts that keep
                            people coming back.
                        </p>
                    </div>
                </section>

                <section className="nv-section nv-ground--warm">
                    <div className="nv-shell">
                        <ul className="nv-svcIndex__grid">
                            {services.map((svc) => (
                                <li key={svc.slug}>
                                    <Link href={`/services/${svc.slug}`} className="nv-svcIndex__card">
                                        <ShineBorder borderWidth={1.5} duration={12} shineColor={['var(--nv-lav)', 'rgba(0,102,204,0.3)', 'var(--nv-lav)']} />
                                        <span className="nv-eyebrow">{svc.kicker}</span>
                                        <span className="nv-svcIndex__cardTitle">{svc.headline}</span>
                                        <span className="nv-svcIndex__cardLede">{svc.lede}</span>
                                        <span className="nv-svcIndex__cardGo">
                                            <span>Read about {svc.nav.toLowerCase()}</span>
                                            <ArrowRight size={16} weight="bold" aria-hidden="true" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </main>

            <Nl4Footer home="/" />
            <Nl4Dock home="/" />
        </>
    );
}
