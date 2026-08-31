/**
 * Terms of service.
 *
 * Short, because there is little to govern: this page is a marketing site,
 * not a product with an account, a subscription or user-generated content.
 */
import Link from 'next/link';
import { brand, contact } from '@/config/site';
import '../claudelanding.css';
import StructuredData from '@/components/StructuredData';
import ClLegalNav from '@/components/claudelanding/ClLegalNav';
import ClFooter from '@/components/claudelanding/ClFooter';

export const metadata = {
    title: 'Terms',
    description: `The terms of using ${brand.shortName}'s website.`,
    alternates: { canonical: '/terms' },
};

export default function TermsPage() {
    return (
        <>
            <StructuredData />
            <ClLegalNav current="/terms" />

            <main>
                <section className="nv-section nv-ground--paper">
                    <div className="nv-shell cl-legal">
                        <h1 className="cl-h2">Terms</h1>
                        <p className="nv-lede">
                            This site is a marketing page for {brand.name}.
                            Using it does not create a contract between us;
                            an engagement only begins once we have agreed
                            on scope and price directly with you.
                        </p>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">The demo content</h2>
                            <p className="cl-legal__body">
                                The storefront, search result, message
                                thread and back-office demo on this site are
                                illustrations built around whatever business
                                name and type you enter. None of the prices,
                                messages or figures shown are real
                                transactions or real customers.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">Third-party work</h2>
                            <p className="cl-legal__body">
                                Some illustrations and components on this
                                site are used under their own open-source
                                licenses. See{' '}
                                <Link href="/credits">Credits</Link>.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">Questions</h2>
                            <p className="cl-legal__body">
                                Write to{' '}
                                <a href={`mailto:${contact.email}`}>
                                    {contact.email}
                                </a>
                                .
                            </p>
                        </section>
                    </div>
                </section>
            </main>

            <ClFooter />
        </>
    );
}
