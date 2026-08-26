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

import { brand } from '@/config/site';
import CloudNav from '@/components/cloud/CloudNav';
import CloudHero from '@/components/cloud/CloudHero';
import CloudDemo from '@/components/cloud/CloudDemo';
import CloudModules from '@/components/cloud/CloudModules';
import CloudSecurity from '@/components/cloud/CloudSecurity';
import CloudCta from '@/components/cloud/CloudCta';
import ClFooter from '@/components/claudelanding/ClFooter';

export const metadata = {
    title: 'VelBiz Cloud',
    description: `Orders, customers, stock, staff and the money in one system, wired to the website ${brand.shortName} builds you.`,
};

export default function CloudPage() {
    return (
        <>
            <CloudNav />
            <main>
                <CloudHero />
                <CloudDemo />
                <CloudModules />
                <CloudSecurity />
                <CloudCta />
            </main>
            <ClFooter />
        </>
    );
}
