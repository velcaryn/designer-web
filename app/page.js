/**
 * Velbrant Studios, single-page site.
 *
 * SECTION ORDER IS THE ARGUMENT, in this order for a reason:
 *   hero          the claim, plus proof it is not talk (real work, on screen)
 *   marquee       the breadth, in one glance
 *   capabilities  the five services, as a sequence rather than a menu
 *   work          the proof, properly
 *   triad         CX / UX / UI, because the buyer has heard all three and
 *                 been told they are the same thing
 *   process       what the eight weeks actually contain
 *   cloud         the thing a design shop cannot offer
 *   engagements   how to buy
 *   contact       the ask
 *
 * LAYOUT FAMILIES, so no two neighbouring sections rhyme: asymmetric split,
 * scrolling band, pinned horizontal rail, overlapped image feature, kinetic
 * type with a panel, vertical numbered rail with a drawn line, sticky aside
 * beside grouped definitions, one-plus-two offer grid, split form. Nine
 * sections, nine shapes.
 *
 * EYEBROW BUDGET: three for the page, spent on the hero, capabilities and
 * cloud. Every other section opens on its headline, which is why the page
 * does not have the uniform label-then-heading rhythm that gives away a
 * generated layout.
 */
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import Capabilities from '@/components/Capabilities';
import CaseStudy from '@/components/CaseStudy';
import Triad from '@/components/Triad';
import Process from '@/components/Process';
import Cloud from '@/components/Cloud';
import Engagements from '@/components/Engagements';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function NewVenturePage() {
    return (
        <>
            <Nav />
            <main>
                <Hero />
                <Marquee />
                <Capabilities />
                <CaseStudy />
                <Triad />
                <Process />
                <Cloud />
                <Engagements />
                <Contact />
            </main>
            <Footer />
        </>
    );
}
