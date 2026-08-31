/**
 * Privacy policy.
 *
 * Minimal and honest rather than a boilerplate document copied from
 * elsewhere: it says exactly what the code does rather than listing data
 * practices the site does not actually have.
 *
 * THIS PAGE IS PART OF THE FEATURE, NOT DOCUMENTATION OF IT.
 *
 * Until Phase 2 this page said "No analytics, no third-party trackers,
 * no cookies beyond what your browser needs to load the page." That was
 * true when it was written. The moment GA4 and the two enquiry forms
 * shipped it became false, and a privacy policy that contradicts the
 * running code is worse than no policy: it is a claim a visitor relies
 * on and a regulator reads.
 *
 * So the rule for this file is that it changes in the SAME commit as
 * anything that changes what is collected. If you add an event to
 * lib/analytics.js or a field to either form, this page is part of that
 * edit, not a follow-up ticket.
 */
import { brand, contact } from '@/config/site';
import '../claudelanding.css';
import StructuredData from '@/components/StructuredData';
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
            <StructuredData />
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
                            <h2 className="cl-h3">What stays in your browser</h2>
                            <p className="cl-legal__body">
                                The business name you type into the setup
                                card stays in your browser only, to drive
                                the mock storefront, search result and
                                message thread on the page. It is never
                                sent anywhere, saved, or visible to us
                                unless you go on to submit one of the
                                forms below.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">What you send us</h2>
                            <p className="cl-legal__body">
                                If you leave a number on this site, we
                                receive what you typed: your phone number,
                                and whichever of business name, sector,
                                your name, email and description you filled
                                in. It reaches us as a message in a private
                                chat so we can reply to you. We keep it
                                until we have finished talking to you about
                                your project.
                            </p>
                            <p className="cl-legal__body">
                                If you start a Cloud account, the same
                                applies to the business and address details
                                on that form.
                            </p>
                            <p className="cl-legal__body">
                                When you message us on WhatsApp or email
                                from a button on this site, that message
                                reaches us the way any WhatsApp message or
                                email does, and nothing more.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">Analytics, and your choice</h2>
                            <p className="cl-legal__body">
                                We use Google Analytics to see which parts
                                of this site people use. It is switched off
                                until you agree: the banner asks once, and
                                until you answer yes, nothing is measured
                                and no analytics cookie is set. If you
                                answer no, the same is true permanently.
                            </p>
                            <p className="cl-legal__body">
                                If you do agree, we count four things: that
                                a business name was entered, that a sector
                                was picked, that an enquiry was sent, and
                                that a WhatsApp button was clicked. Along
                                with those, Google records the usual page
                                view information, including your rough
                                location and the kind of device and browser
                                you are using. We do not send Google your
                                name, number, email or business name.
                            </p>
                            <p className="cl-legal__body">
                                Your answer is stored in your own browser.
                                To change it, clear this site&apos;s data in
                                your browser settings and the banner will
                                ask again.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">What this site does not do</h2>
                            <p className="cl-legal__body">
                                No advertising trackers, no selling or
                                sharing of anything you send us, no
                                third-party embeds, and no profile built
                                about you. Nothing is collected at all
                                unless you either agree to analytics or
                                send us something yourself.
                            </p>
                        </section>

                        <section className="cl-legal__block">
                            <h2 className="cl-h3">Questions</h2>
                            <p className="cl-legal__body">
                                To ask what we hold about you, or to have
                                it deleted, write to{' '}
                                <a href={`mailto:${contact.email}`}>
                                    {contact.email}
                                </a>
                                {' '}
                                and we will action it.
                            </p>
                        </section>
                    </div>
                </section>
            </main>

            <ClFooter />
        </>
    );
}
