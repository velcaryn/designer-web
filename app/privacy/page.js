/**
 * Privacy policy.
 *
 * Minimal and honest rather than a boilerplate document copied from
 * elsewhere: this page collects a business name and a WhatsApp message the
 * visitor sends themselves, nothing else, so the policy says exactly that
 * rather than listing data practices the site does not actually have.
 */
import { brand, contact } from '@/config/site';
import '../claudelanding.css';
import ClLegalNav from '@/components/claudelanding/ClLegalNav';
import ClFooter from '@/components/claudelanding/ClFooter';

export const metadata = {
    title: 'Privacy',
    description: `What ${brand.shortName} collects on this site, and what it does not.`,
    alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
    return (
        <>
            <ClLegalNav current="/privacy" />

            <main>
                <section className="nv-section nv-ground--paper">
                    <div className="nv-shell cl-legal">
                        <h1 className="cl-h2">Privacy</h1>
                        <p className="nv-lede">
                            This page describes what actually happens on
                            this site, not a generic policy borrowed from
                            elsewhere.
                        </p>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">What this site collects</h2>
                            <p className="cl-legal__body">
                                The business name you type into the setup
                                card stays in your browser only, to drive
                                the mock storefront, search result and
                                message thread on the page. It is never
                                sent anywhere, saved, or visible to us.
                            </p>
                            <p className="cl-legal__body">
                                When you message us on WhatsApp or email
                                from a button on this site, that message and
                                whatever you choose to write in it reaches
                                us the way any WhatsApp message or email
                                does, and nothing more.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">What this site does not do</h2>
                            <p className="cl-legal__body">
                                No analytics, no third-party trackers, no
                                cookies beyond what your browser needs to
                                load the page, and nothing stored on our
                                side unless you send it to us yourself.
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
