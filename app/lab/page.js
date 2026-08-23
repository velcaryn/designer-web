/**
 * /lab: the real site, plus the theme and typography switcher below it.
 *
 * WHY A SEPARATE ROUTE RATHER THAN A FLAG ON THE HOME PAGE
 * The live page must not carry eleven typefaces and a switcher. Keeping the
 * lab on its own route means `/` stays exactly what it will ship as, and the
 * comparison happens somewhere that costs the real page nothing.
 *
 * The sections are imported from the same components, not copied, so what is
 * being judged is the actual site and cannot drift from it.
 *
 * Deleted, with everything else in the lab, once a combination is chosen.
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
import ThemeLab from '@/components/ThemeLab';

export const metadata = {
    title: 'Theme lab',
    robots: { index: false, follow: false },
};

export default function LabPage() {
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
                <Estimator />
                <Contact />
            </main>
            <Footer />
            <ThemeLab />
        </>
    );
}
