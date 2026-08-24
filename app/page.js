/**
 * Velbrant Studios, single-page site.
 *
 * SECTION ORDER IS THE ARGUMENT, in this order for a reason:
 *   hero          the claim, plus proof it is not talk (real work, on screen)
 *   marquee       the breadth, in one glance
 *   problem       what is wrong with the site they already have. Before any
 *                 pitching, because a reader who has not recognised their own
 *                 problem has no reason to care about the solution
 *   capabilities  the five services, as a sequence rather than a menu
 *   work          the proof, properly
 *   triad         CX / UX / UI, because the buyer has heard all three and
 *                 been told they are the same thing
 *   process       what the eight weeks actually contain
 *   cloud         the thing a design shop cannot offer
 *   engagements   how to buy
 *   preview       proof that the build is theirs and not a template: they
 *                 repaint the page and watch it hold
 *   estimator     they scope it themselves, and arrive at the form having
 *                 already specified the project
 *   contact       the ask
 *
 * LAYOUT FAMILIES, so no two neighbouring sections rhyme: asymmetric split,
 * scrolling band, pinned horizontal rail, overlapped image feature, kinetic
 * type with a panel, vertical numbered rail with a drawn line, sticky aside
 * beside grouped definitions, one-plus-two offer grid, split form. Nine
 * sections, nine shapes.
 *
 * EYEBROW BUDGET: four, for eleven sections. Spent on the hero,
 * capabilities, cloud and the estimator. Every other section opens on its headline, which is why the page
 * does not have the uniform label-then-heading rhythm that gives away a
 * generated layout.
 */
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import Problem from '@/components/Problem';
import Capabilities from '@/components/Capabilities';
import CaseStudy from '@/components/CaseStudy';
import Rescue from '@/components/Rescue';
import Triad from '@/components/Triad';
import Process from '@/components/Process';
import Cloud from '@/components/Cloud';
import Engagements from '@/components/Engagements';
import Estimator from '@/components/Estimator';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import BrandPreview from '@/components/BrandPreview';

export default function NewVenturePage() {
    return (
        <>
            <Nav />
            <main>
                <Hero />
                <Marquee />
                <Problem />
                <Capabilities />
                <CaseStudy />
                <Rescue />
                <Triad />
                <Process />
                <Cloud />
                <Engagements />
                <BrandPreview />
                <Estimator />
                <Contact />
            </main>
            <Footer />
        </>
    );
}
