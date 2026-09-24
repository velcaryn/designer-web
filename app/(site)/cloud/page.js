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
import '../nv4-faq.css';

import { brand, cloudFaqs } from '@/config/site';
import StructuredData from '@/components/StructuredData';
import CloudNav from '@/components/cloud/CloudNav';
import CloudHero from '@/components/cloud/CloudHero';
import CloudDemo from '@/components/cloud/CloudDemo';
import CloudModules from '@/components/cloud/CloudModules';
import CloudSecurity from '@/components/cloud/CloudSecurity';
import CloudCta from '@/components/cloud/CloudCta';
import Nl4Faq from '@/components/newlanding-v4/Nl4Faq';
import Nl4Footer from '@/components/newlanding-v4/Nl4Footer';
import Nl4Dock from '@/components/newlanding-v4/Nl4Dock';

/* Under 60 characters, and says what the product does rather than only its
   name, which is what someone searching for billing software types. */
const TITLE = 'VelBiz Cloud: GST Billing, Accounting and Inventory Software';
const DESCRIPTION = 'GST invoices, stock across shop and godown, purchases, double-entry accounts and payroll in one system for small businesses in India. Works on your phone.';

export const metadata = {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: '/cloud' },
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: '/cloud',
        siteName: brand.name,
        locale: 'en_IN',
        type: 'website',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `VelBiz Cloud - ${brand.name}` }],
    },
    twitter: {
        card: 'summary_large_image',
        title: TITLE,
        description: DESCRIPTION,
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

/* The page's own entities, alongside the organisation and website that
   StructuredData always declares. SoftwareApplication carries no offers and
   no rating: no price is published and there are no reviews to cite. */
const SITE = `https://${brand.domain}`;
const CLOUD_NODES = [
    {
        '@type': 'WebPage',
        '@id': `${SITE}/cloud#webpage`,
        url: `${SITE}/cloud`,
        name: TITLE,
        description: DESCRIPTION,
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': `${SITE}/cloud#software` },
        mainEntity: { '@id': `${SITE}/cloud#software` },
        inLanguage: 'en-IN',
    },
    {
        '@type': 'SoftwareApplication',
        '@id': `${SITE}/cloud#software`,
        name: 'VelBiz Cloud',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'GST invoicing, accounting and inventory',
        operatingSystem: 'Web browser',
        url: `${SITE}/cloud`,
        publisher: { '@id': `${SITE}/#organization` },
        description: DESCRIPTION,
        featureList: [
            'GST invoices and quotes, numbered in sequence, on your letterhead',
            'Repeat invoices on a schedule, credit and debit notes',
            'A bill link your customer opens without an app',
            'Enquiry pipeline, customers, tasks and a timeline',
            'Stock per location, movement history and reorder alerts',
            'Purchase orders, vendors and goods receipt',
            'Double-entry accounts: vouchers, daybook, ledgers',
            'Expenses with approval, GST filing summary',
            'Employee records and monthly payroll',
            'Invoice and quote template designer',
            'Export everything in open formats',
        ],
        audience: { '@type': 'BusinessAudience', audienceType: 'Small businesses in India' },
    },
];


export default function CloudPage() {
    return (
        <>
            <StructuredData pageFaqs={cloudFaqs} pagePath="/cloud" extra={CLOUD_NODES} />
            <CloudNav />
            <main>
                <CloudHero />
                <CloudDemo />
                <CloudModules />
                <CloudSecurity />
                <Nl4Faq
                    items={cloudFaqs}
                    groups={[]}
                    sectionId="cloud-faq"
                    idPrefix="cloudfaq"
                    title="Questions About VelBiz Cloud."
                    lede="What it does, whether it handles GST, and what happens to your data. Tap a question and the answer arrives like a reply."
                />
                <CloudCta />
            </main>
            <Nl4Footer home="/" />
            <Nl4Dock home="/" />
        </>
    );
}
