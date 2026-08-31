'use client';

/**
 * The home page: the growth landing page, now living at `/` directly.
 *
 * This used to be a separate route, `/claudelanding`, built alongside the
 * original homepage while that homepage's design was still current. Once
 * this page replaced it as the real homepage, keeping both around stopped
 * making sense: two competing homepages is exactly the "duplicate code"
 * this project's rule against it exists to prevent. The original homepage
 * and its components, and the satellite pages that only made sense next to
 * it (/newlanding, /faq, /rebuild, /tech-stack, and the old /cloud-replica
 * and its login/onboarding stubs), were removed in the same change that
 * moved this page here. This file is the whole surviving homepage.
 *
 * Nine sections, in the order the argument runs:
 *
 *   hero+setup  the outcome, then the visitor names their business
 *   grow        the three beats, now about their business
 *   what        the six things we do
 *   cloud       the bridge to the back office
 *   tech        who built this and will it last
 *   lab         the design system holding together under a different skin
 *   work        the proof, last rather than fourth
 *   talk        one action
 *   crowd       the closing full-bleed strip, just above the footer
 *
 * ClDock carries every navigation link at every width; ClHeader is brand
 * and one CTA only. LabProvider wraps everything because both ClLab (the
 * writer) and ClDock (a reader, for the countdown pill) need it.
 *
 * WHY THIS IS A CLIENT COMPONENT
 *
 * The business name and the lab's live theme are context every section can
 * read, and both providers have to sit above all of them. A client
 * component cannot export `metadata`, which is why this route's metadata
 * lives in app/layout.js instead, merged into the root layout now that this
 * page IS the root.
 *
 * The stylesheet is imported here rather than added to app/globals.css,
 * which stays the small shared token file every route (this one and
 * /cloud) builds on.
 */
import './claudelanding.css';

import { BusinessProvider } from '@/components/claudelanding/BusinessContext';
import { LabProvider } from '@/components/claudelanding/LabContext';
import StructuredData from '@/components/StructuredData';
import ClHeader from '@/components/claudelanding/ClHeader';
import ClDock from '@/components/claudelanding/ClDock';
import ClHero from '@/components/claudelanding/ClHero';
import ClGrowth from '@/components/claudelanding/ClGrowth';
import ClBento from '@/components/claudelanding/ClBento';
import ClCloudTeaser from '@/components/claudelanding/ClCloudTeaser';
import ClTech from '@/components/claudelanding/ClTech';
import ClLab from '@/components/claudelanding/ClLab';
import ClProof from '@/components/claudelanding/ClProof';
import ClWho from '@/components/claudelanding/ClWho';
import ClInvest from '@/components/claudelanding/ClInvest';
import ClFaq from '@/components/claudelanding/ClFaq';
import ClContact from '@/components/claudelanding/ClContact';
import ClCrowd from '@/components/claudelanding/ClCrowd';
import ClFooter from '@/components/claudelanding/ClFooter';

export default function HomePage() {
    return (
        <BusinessProvider>
            <LabProvider>
                <StructuredData />
                <ClHeader />
                <main>
                    <ClHero />
                    <ClGrowth />
                    <ClBento />
                    <ClCloudTeaser />
                    <ClTech />
                    <ClLab />
                    <ClProof />
                    {/* Price then questions then the ask, in that order.
                        Both are objection handling, so they belong
                        immediately before the CTA rather than earlier:
                        a visitor who has not yet seen the work has no
                        reason to care what it costs. */}
                    {/* Between the work and the price. Someone who has
                        just seen what we build and is about to see what
                        it costs is exactly the person wondering who they
                        would be paying. */}
                    <ClWho />
                    <ClInvest />
                    <ClFaq />
                    <ClContact />
                    {/* Last thing in <main>, immediately above the footer:
                        a full-bleed blue crowd strip is the final
                        impression before the page's administrative
                        content. */}
                    <ClCrowd />
                </main>
                <ClFooter />
                <ClDock />
            </LabProvider>
        </BusinessProvider>
    );
}
