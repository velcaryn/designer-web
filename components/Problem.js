/**
 * Naming the problem, before any pitching.
 *
 * WHY THIS SECTION EXISTS
 * The page previously opened by describing what we do and never once said
 * what is wrong with the thing the buyer already has. That is a weak order:
 * a reader who has not yet recognised their own problem has no reason to care
 * about the solution. The single strongest sentence on the site was buried in
 * step six of the process list, "the part most agencies leave out", which is
 * an argument that deserves a section rather than a footnote.
 *
 * LAYOUT. Two columns of plain text under one heading, with a rule between
 * them, and no cards. Deliberate: three of the sections around it are already
 * card grids, and putting these in boxes would make them read as features
 * rather than as an accusation. The heaviest thing on the page here is the
 * sentence, which is correct for a section whose entire job is copy.
 *
 * TONE. Each item names a real, specific, recognisable failure and then says
 * plainly what we do instead. No invented statistics about how many websites
 * fail, because we do not have that data and a made-up number here would
 * undercut the honesty the section is trading on.
 */
import Reveal from './Reveal';
import SectionLink from './SectionLink';

const FAILURES = [
    {
        wrong: 'The agency hands over files and disappears',
        right: 'The build is the start of the engagement, not the end of it. Launch day is week eight of a relationship, and the growth work that follows is the part that decides whether the site was worth paying for.',
    },
    {
        wrong: 'It looks good and nobody can find it',
        right: 'Search visibility is engineering before it is writing. Schema, sitemaps, crawlable structure and page speed go in during the build, because retrofitting them into a finished site costs more and works less well.',
    },
    {
        wrong: 'A template with your logo dropped into it',
        right: 'Every project gets a design system of its own: type, colour, spacing, components, states. Nothing you ship shares a skeleton with a competitor who bought the same theme.',
    },
    {
        wrong: 'Beautiful on the designer screen, broken on a phone',
        right: 'Designed at 375px first and tested on real devices, because that is where your customers actually are. Not a desktop layout squeezed down until it fits.',
    },
    {
        wrong: 'Your customer data spread across five tools that disagree',
        right: 'The site, the orders and the customer record can run as one system on your own Cloud instance, so the person who filled the form and the person who ordered are the same row.',
    },
    {
        wrong: 'Privacy handled by pasting in a cookie banner',
        right: 'Consent, retention and data-subject rights are decided during the build and written down. The DPDP Act is a design constraint here, not a plugin installed the week before launch.',
    },
];

export default function Problem() {
    return (
        <section className="nv-section nv-ground--warm" id="problem">
            <div className="nv-shell">
                <Reveal>
                    <h2 className="nv-problem__title">
                        You have probably been burned by a website before.
                    </h2>
                    <SectionLink target="problem" label="What goes wrong" />
                    <p className="nv-lede nv-problem__lede">
                        Most of the businesses that come to us are not starting from
                        nothing. They are starting from something that disappointed them.
                        These are the six versions of that we hear most.
                    </p>
                </Reveal>

                <dl className="nv-problem__list">
                    {FAILURES.map(({ wrong, right }, i) => (
                        <Reveal className="nv-problem__item" key={wrong} delay={i * 0.04}>
                            <dt className="nv-problem__wrong">{wrong}</dt>
                            <dd className="nv-problem__right">{right}</dd>
                        </Reveal>
                    ))}
                </dl>
            </div>
        </section>
    );
}
