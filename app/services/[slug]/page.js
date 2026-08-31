/**
 * One service page.
 *
 * WHY THREE PAGES AND NOT ONE SERVICES PAGE
 *
 * A single page listing everything ranks for nothing. Somebody searching
 * "website designer Tirunelveli" and somebody searching "Google Business
 * Profile setup" want different pages, and a page that tries to be both
 * is worse for both.
 *
 * WHAT THIS PAGE NO LONGER CARRIES
 *
 * It had a three-question FAQ lifted from the home page and a full-bleed
 * blue section restating the price band that the lede states two screens
 * above. Both were justified as "a visitor from search should not have to
 * go and find them", which sounds right and was not: the FAQ was the same
 * text a reader had already seen or would see, and the price band said
 * the same number twice on one page. Measured, the page was 3889px tall
 * and two of its five sections held 119 and 197 characters.
 *
 * WHAT IT CARRIES INSTEAD
 *
 * The four things somebody deciding actually needs and could not get
 * anywhere else on the site: what lands in their hands, the order it
 * happens in, what we need from them, and the examples of that service
 * in the demo catalogue. All from config/site.js.
 *
 * Server component. The only client JS is the nav's menu state.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check } from '@phosphor-icons/react/ssr';
import '../../claudelanding.css';

import { brand, services, findService, faqs, pricing, waLink } from '@/config/site';
import StructuredData from '@/components/StructuredData';
import ClServiceNav from '@/components/claudelanding/ClServiceNav';
import ClFooter from '@/components/claudelanding/ClFooter';
import ClMiniDock from '@/components/claudelanding/ClMiniDock';
import Reveal from '@/components/Reveal';

export function generateStaticParams() {
    return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const svc = findService(slug);
    if (!svc) return {};

    return {
        title: svc.title,
        description: svc.seo,
        alternates: { canonical: `/services/${svc.slug}` },
        openGraph: {
            title: `${svc.title} | ${brand.name}`,
            description: svc.seo,
            url: `/services/${svc.slug}`,
        },
    };
}

export default async function ServicePage({ params }) {
    const { slug } = await params;
    const svc = findService(slug);
    if (!svc) notFound();

    const others = services.filter((s) => s.slug !== svc.slug);

    return (
        <>
            <StructuredData />
            <ClServiceNav current={svc.slug} />

            <main>
                {/* HEAD AND DELIVERABLES ON ONE SCREEN.

                    They were two sections, and the gap between them was
                    most of the wasted space on the page: a reader had to
                    scroll past an empty band to find out what they get.
                    Side by side above 900px, stacked below. */}
                <section className="nv-section nv-ground--paper cl-svc__head">
                    <div className="nv-shell cl-svc__top">
                        <div className="cl-svc__intro">
                            <span className="nv-eyebrow">{svc.kicker}</span>
                            <h1 className="cl-svc__title">{svc.headline}</h1>
                            <p className="nv-lede cl-svc__lede">{svc.lede}</p>

                            <div className="cl-svc__actions">
                                <a
                                    href={waLink(`Hello ${brand.shortName}, I would like to talk about ${svc.title.toLowerCase()}.`)}
                                    className="nv-btn nv-btn--primary"
                                    rel="noreferrer noopener"
                                >
                                    Talk to us about this
                                </a>
                                <Link href="/demo-site" className="nv-btn nv-btn--ghost">
                                    See finished examples
                                </Link>
                            </div>
                        </div>

                        {/* The answer to "what do I actually get", on the
                            first screen rather than three scrolls down. */}
                        <aside className="cl-svc__deliver">
                            <h2 className="cl-svc__deliverTitle">What you get</h2>
                            <ul className="cl-svc__deliverList">
                                {svc.deliverables.map((d) => (
                                    <li key={d}>
                                        <Check size={15} weight="bold" aria-hidden="true" />
                                        <span>{d}</span>
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    </div>
                </section>

                {/* HOW IT WORKS AND WHAT WE NEED, ALSO ONE SECTION.

                    Two columns, because they are two halves of the same
                    answer: this is the order it happens in, and this is
                    the part that depends on you. */}
                <section className="nv-section nv-ground--warm">
                    <div className="nv-shell cl-svc__flow">
                        <div>
                            <h2 className="cl-h2 cl-svc__h2">How it runs</h2>
                            <ol className="cl-svc__stages">
                                {svc.stages.map((st, i) => (
                                    <li key={st.name} className="cl-svc__stage">
                                        <span className="cl-svc__stageN" aria-hidden="true">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span className="cl-svc__stageBody">
                                            <span className="cl-svc__stageName">{st.name}</span>
                                            <span className="cl-svc__stageText">{st.text}</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <aside className="cl-svc__need">
                            <h2 className="cl-svc__needTitle">What we need from you</h2>
                            <p className="cl-svc__needLede">
                                Short list, and it is the whole list. A
                                project stalls on these rather than on
                                the build.
                            </p>
                            <ul className="cl-svc__needList">
                                {svc.fromYou.map((f) => (
                                    <li key={f}>{f}</li>
                                ))}
                            </ul>
                        </aside>
                    </div>
                </section>

                {/* The detail, for a reader who wants it. Below the
                    decision-making content rather than above it. */}
                <section className="nv-section nv-ground--paper">
                    <div className="nv-shell">
                        <h2 className="cl-h2 cl-svc__h2">What is included</h2>
                        <div className="cl-svc__grid">
                            {svc.includes.map((item) => (
                                <Reveal key={item.name} className="cl-svc__card">
                                    <h3 className="cl-svc__cardTitle">{item.name}</h3>
                                    <p className="cl-svc__cardText">{item.text}</p>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* The other two services, and the close, in one band
                    rather than two. The blue price section that used to
                    sit between them said the same number as the lede. */}
                <section className="nv-section nv-ground--warm cl-svc__foot">
                    <div className="nv-shell cl-svc__footRow">
                        <div className="cl-svc__close">
                            <h2 className="cl-h2 cl-svc__h2">
                                Tell us what you sell.
                            </h2>
                            <p className="cl-svc__closeText">
                                One conversation, no charge and no pitch
                                deck. If we are not the right fit we will
                                say so.
                            </p>
                            <a
                                href={waLink(`Hello ${brand.shortName}, I would like to talk about ${svc.title.toLowerCase()}.`)}
                                className="nv-btn nv-btn--primary"
                                rel="noreferrer noopener"
                            >
                                Message us on WhatsApp
                            </a>
                        </div>

                        <div className="cl-svc__others">
                            {others.map((o) => (
                                <Link
                                    key={o.slug}
                                    href={`/services/${o.slug}`}
                                    className="cl-svc__other"
                                >
                                    <span className="cl-svc__otherName">{o.title}</span>
                                    <span className="cl-svc__otherSeo">{o.seo}</span>
                                    <span className="cl-svc__otherGo">
                                        Read about it
                                        <ArrowRight size={14} weight="bold" aria-hidden="true" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <ClMiniDock />
            <ClFooter />
        </>
    );
}
