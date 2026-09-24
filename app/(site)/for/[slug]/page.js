/**
 * One real, indexable landing page per business vertical.
 *
 * WHY THIS ROUTE EXISTS, SEPARATE FROM /demo-site
 *
 * /demo-site/<slug> is a fictional sample business and is deliberately
 * noindexed: a fake bakery ranking for a real search is thin content,
 * and it correctly stays out of search. But that leaves nothing for
 * someone actually searching "website for a photo studio" to land on,
 * even though VelBiz has a real answer for exactly that trade. This
 * route is that real answer: VelBiz's own pitch to a photo studio (or
 * bakery, or advocate), grounded in the same trade knowledge the demo
 * shows off, with none of the demo's invented business facts.
 *
 * WHY /for AND NOT ANOTHER /services/<slug>
 *
 * The three existing services (websites, seo, content-and-social) are
 * OFFER pages: what we sell. These are AUDIENCE pages: who it is for.
 * Sharing one [slug] segment between two different manifests would
 * collide the first time a slug appeared in both, and would make
 * generateStaticParams ambiguous about which list it is serving.
 *
 * Server component, same as app/services/[slug]/page.js. The only
 * client JS anywhere on this page is ClFaq's open/close state and the
 * nav's menu state, both already shipped elsewhere on the site.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import '../../claudelanding.css';

import { brand, waLink } from '@/config/site';
import { VERTICALS, findVertical } from '@/content/verticals';
import { findDemo } from '@/content/demos';
import StructuredData from '@/components/StructuredData';
import ClServiceNav from '@/components/claudelanding/ClServiceNav';
import ClFaq from '@/components/claudelanding/ClFaq';
import Nl4Footer from '@/components/newlanding-v4/Nl4Footer';
import Nl4Dock from '@/components/newlanding-v4/Nl4Dock';
import Reveal from '@/components/Reveal';

export function generateStaticParams() {
    return VERTICALS.map((v) => ({ slug: v.slug }));
}

async function loadContent(slug) {
    if (!findVertical(slug)) return null;
    try {
        const mod = await import(`@/content/verticals/${slug}.js`);
        return mod.default;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const content = await loadContent(slug);
    if (!content) return {};

    return {
        title: content.metaTitle,
        description: content.metaDescription,
        alternates: { canonical: `/for/${slug}` },
        openGraph: {
            title: `${content.metaTitle} | ${brand.name}`,
            description: content.metaDescription,
            url: `/for/${slug}`,
            siteName: brand.name,
            locale: 'en_IN',
            type: 'website',
            images: [
                {
                    url: '/opengraph-image',
                    width: 1200,
                    height: 630,
                    alt: `${content.metaTitle} - ${brand.name}`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${content.metaTitle} | ${brand.name}`,
            description: content.metaDescription,
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
}

export default async function VerticalPage({ params }) {
    const { slug } = await params;
    const content = await loadContent(slug);
    if (!content) notFound();

    /* The matching fictional sample, used only for its card-sized
       summary (name, blurb, swatch) to build the portfolio link. Never
       its full record: this page must not render any invented business
       fact, only point at where one lives. */
    const demo = findDemo(content.demoSlug);

    return (
        <>
            <StructuredData pageFaqs={content.faqs} verticalService={content} />
            <ClServiceNav current={null} />

            <main>
                <section className="nv-section nv-ground--paper cl-svc__head">
                    <div className="nv-shell cl-svc__top">
                        <div className="cl-svc__intro">
                            <span className="nv-eyebrow">Website for a {content.trade.toLowerCase()}</span>
                            <h1 className="cl-svc__title">{content.h1}</h1>
                            <p className="nv-lede cl-svc__lede">{content.intro}</p>

                            <div className="cl-svc__actions">
                                <a
                                    href={waLink(`Hello ${brand.shortName}, I would like to talk about a website for my ${content.trade.toLowerCase()}.`)}
                                    className="nv-btn nv-btn--primary"
                                    rel="noreferrer noopener"
                                >
                                    Talk to us about this
                                </a>
                                {demo && (
                                    <Link href={`/demo-site/${demo.slug}`} className="nv-btn nv-btn--ghost">
                                        See a sample {content.trade.toLowerCase()} site
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="nv-section nv-ground--warm">
                    <div className="nv-shell">
                        <h2 className="cl-h2 cl-svc__h2">What a {content.trade.toLowerCase()} needs from its website</h2>
                        <div className="cl-svc__grid">
                            {content.needs.map((item) => (
                                <Reveal key={item.name} className="cl-svc__card">
                                    <h3 className="cl-svc__cardTitle">{item.name}</h3>
                                    <p className="cl-svc__cardText">{item.text}</p>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="nv-section nv-ground--paper cl-svc__foot">
                    <div className="nv-shell cl-svc__footRow">
                        <div className="cl-svc__close">
                            <h2 className="cl-h2 cl-svc__h2">Tell us about your {content.trade.toLowerCase()}.</h2>
                            <p className="cl-svc__closeText">
                                One conversation, no charge and no pitch
                                deck. If we are not the right fit we will
                                say so.
                            </p>
                            <a
                                href={waLink(`Hello ${brand.shortName}, I would like to talk about a website for my ${content.trade.toLowerCase()}.`)}
                                className="nv-btn nv-btn--primary"
                                rel="noreferrer noopener"
                            >
                                Message us on WhatsApp
                            </a>
                        </div>

                        <div className="cl-svc__others">
                            <Link href="/services/websites" className="cl-svc__other">
                                <span className="cl-svc__otherName">Website design and development</span>
                                <span className="cl-svc__otherSeo">What lands in your hands, the order it happens in, and the price band.</span>
                                <span className="cl-svc__otherGo">
                                    Read about it
                                    <ArrowRight size={14} weight="bold" aria-hidden="true" />
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>

                <ClFaq faqs={content.faqs} />
            </main>

            <Nl4Footer home="/" />
            <Nl4Dock home="/" />
        </>
    );
}
