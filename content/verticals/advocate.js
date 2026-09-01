/**
 * VelBiz's own pitch to an advocate, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 *
 * REGULATED TRADE, ADVERTISING RESTRICTED BY LAW. No Bar Council
 * enrolment number, no case outcomes, no "cases won" framing anywhere.
 * Bar Council of India rules restrict how advocates may advertise; this
 * page describes only what those rules allow a website to state: practice
 * areas and what a consultation involves. The whole page stays quieter
 * in register than the rest of the site, deliberately.
 */

export default {
    slug: 'advocate',
    trade: 'Advocate',
    demoSlug: 'advocate',

    metaTitle: 'Website for an Advocate',
    metaDescription:
        'A website for an advocate: practice areas and what a first consultation covers, stated plainly, within what Bar Council rules allow a website to say. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your practice',
    intro:
        "An advocate's website has narrower rules than most: no case outcomes, no advertising of results, nothing that reads as solicitation. Within that, a website can still state practice areas clearly and set out what a first consultation involves, so a prospective client knows what to expect before they call.",

    needs: [
        {
            name: 'Practice areas, stated plainly',
            text: 'What matters you take and what you do not, so a prospective client can tell quickly whether to enquire.',
        },
        {
            name: 'What a first consultation covers',
            text: 'What to bring and what happens in an initial meeting, set out clearly, so a client is not calling to ask basic procedural questions first.',
        },
        {
            name: 'An enquiry that respects confidentiality',
            text: 'A simple way to request a consultation without asking a prospective client to describe their matter in detail over a public form.',
        },
        {
            name: 'A quiet, professional register throughout',
            text: 'No case outcomes, no result claims, nothing that could read as advertising under Bar Council rules. The page states facts about the practice and nothing more.',
        },
    ],

    faqs: [
        {
            q: 'Will the site mention past cases or outcomes?',
            a: 'No. Bar Council of India rules restrict advertising by advocates, and case outcomes are the clearest example of what those rules do not allow a website to state. The site describes practice areas and consultation process only.',
        },
        {
            q: 'Can prospective clients request a consultation through the site?',
            a: 'Yes, a simple enquiry form or WhatsApp link lets someone request a consultation without needing to detail their matter publicly.',
        },
        {
            q: 'Can I update practice areas or consultation details myself?',
            a: 'Yes, we show you how during handover, so the page stays accurate as your practice changes.',
        },
    ],
};
