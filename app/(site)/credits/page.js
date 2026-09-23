/**
 * Credits.
 *
 * The Open Peeps and Skiper UI attribution used to sit directly under the
 * crowd illustration on /claudelanding. It moved here so the crowd section
 * itself could run edge to edge with no caption breaking the visual, and so
 * the credit sits alongside the other legal and licensing pages (privacy,
 * terms) rather than being scattered across whichever section happens to
 * use a third-party asset. The license terms that made the credit necessary
 * have not changed: only where it is printed has.
 *
 * Imports the same stylesheet as /claudelanding rather than app/globals.css,
 * for the identical reason that page does: nothing written for this small
 * group of pages should be able to reach the original home page.
 *
 * A server component. Nothing here is interactive.
 */
import { brand } from '@/config/site';
import '../claudelanding.css';
import StructuredData from '@/components/StructuredData';
import ClLegalNav from '@/components/claudelanding/ClLegalNav';
import Nl4Footer from '@/components/newlanding-v4/Nl4Footer';
import Nl4Dock from '@/components/newlanding-v4/Nl4Dock';

export const metadata = {
    title: `Credits | ${brand.name}`,
    description: `Third-party assets and open-source work used to build ${brand.shortName}'s website.`,
    alternates: { canonical: '/credits' },
    openGraph: {
        title: `Credits | ${brand.name}`,
        description: `Third-party assets and open-source work used to build ${brand.shortName}'s website.`,
        url: '/credits',
        siteName: brand.name,
        locale: 'en_IN',
        type: 'website',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `Credits - ${brand.name}` }],
    },
    twitter: {
        card: 'summary_large_image',
        title: `Credits | ${brand.name}`,
        description: `Third-party assets and open-source work used to build ${brand.shortName}'s website.`,
        images: ['/opengraph-image'],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function CreditsPage() {
    return (
        <>
            <StructuredData />
            <ClLegalNav current="/credits" />

            <main>
                <section className="nv-section nv-ground--paper">
                    <div className="nv-shell cl-legal">
                        <h1 className="cl-h2">Credits</h1>
                        <p className="nv-lede">
                            The growth landing page uses two pieces of
                            third-party work under their own open licenses.
                            Both are credited here in full.
                        </p>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">Crowd illustration</h2>
                            <p className="cl-legal__body">
                                The walking figures near the bottom of the
                                growth page are{' '}
                                <a href="https://www.openpeeps.com/" rel="noreferrer noopener">
                                    Open Peeps
                                </a>
                                , a hand-drawn illustration library by
                                Pablo Stanley, released under an open license
                                for free use. The canvas that animates them
                                across the screen is{' '}
                                <a href="https://skiper-ui.com/" rel="noreferrer noopener">
                                    Skiper UI
                                </a>
                                &apos;s crowd component.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">Device frames and icon sphere</h2>
                            <p className="cl-legal__body">
                                The Safari, iPhone and Android frames, and
                                the interactive icon sphere in the tech
                                section, are adapted from the{' '}
                                <a href="https://magicui.design/" rel="noreferrer noopener">
                                    Magic UI
                                </a>{' '}
                                component registry, restyled to match this
                                site&apos;s own visual system.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">Everything else</h2>
                            <p className="cl-legal__body">
                                The rest of the site, its design, its text
                                and its code, is built by {brand.name}.
                            </p>
                        </section>
                    </div>
                </section>
            </main>

            <Nl4Footer home="/" />
            <Nl4Dock home="/" />
        </>
    );
}
