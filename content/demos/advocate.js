/**
 * R Krishnamoorthy, Advocate. Tirunelveli. Entirely invented.
 *
 * NO BAR COUNCIL ENROLMENT NUMBER, no court names attached to invented
 * outcomes, no "cases won". Bar Council rules restrict how advocates may
 * advertise in India, and a demo that models bad practice teaches a real
 * client to ask for it. What is here is what the rules do allow: practice
 * areas, the person's own background, and what a consultation costs.
 *
 * The whole page is deliberately quieter than the rest of the set. A
 * legal practice that shouts reads as one that needs the work.
 */

const advocate = {
    slug: 'advocate',
    layout: 'editorial',

    sections: [
        { type: 'hero', variant: 'split' },
        { type: 'directory', title: 'Practice areas' },
        { type: 'consult', title: 'What to bring', lede: 'An hour with the right papers is worth three without them. Bring what you have; nothing on this list is a condition of being seen.' },
        { type: 'process', title: 'A first consultation' },
        { type: 'pricegrid' },
        { type: 'story' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Practising in the Tirunelveli courts since 2004.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'inline',
    },

    business: {
        name: 'R Krishnamoorthy, Advocate',
        tagline: 'Civil, property and family matters',
        trade: 'Advocate',
        area: 'Near the District Court',
        city: 'Tirunelveli',
        street: '9, Court Road, Tirunelveli Junction',
        pin: '627001',
        email: 'chambers@rkadvocate.example',
        since: '2004',
        trust: ['Fee agreed in writing', 'You keep copies of everything', 'Told plainly if you have no case', '22 years in the district court'],
        hours: [
            { days: 'Monday to Saturday', open: 10, close: 18 },
            { days: 'Sunday', open: 10, close: 13 },
        ],
    },

    theme: {
        ink: '#2A1B10',
        paper: '#FCFAF6',
        accent: '#92400E',
        support: '#6B5745',
        soft: '#F0E8DC',
        onAccent: '#FCFAF6',
        fill: '#2A1B10',
        onFill: '#FCFAF6',
        radiusSm: '2px',
        radiusLg: '4px',
        borderW: '1px',
        shadow: 'none',
        display: 'var(--f-bodoni)',
        text: 'var(--f-source)',
    },

    logo: { mark: 'scales', style: 'bare' },

    voicesTitle: 'From clients',
    faqTitle: 'Fees and process',
    factsTitle: 'What things cost',
    factsLede: 'Agreed in writing before any work begins. Court fees and stamp duty are separate and paid at the counter by you.',

    hero: {
        kicker: 'Court Road, Tirunelveli',
        headline: 'Told plainly whether you have a case',
        sub: 'Civil, property and family matters. The fee is agreed in writing first, and you are told honestly if litigation is the wrong answer.',
        primaryCta: 'Practice areas',
        secondaryCta: 'The chambers',
    },

    module: {
        type: 'directory',
        title: 'Practice areas',
        subtitle: 'What this chamber actually does. Anything outside it goes to somebody who does it properly.',
    },

    directory: [
        { name: 'Property and title', lead: 'Civil', text: 'Title verification before you buy, partition, boundary disputes, and the encumbrance problems that surface at registration.', when: 'Most of the work here' },
        { name: 'Family matters', lead: 'Civil', text: 'Maintenance, guardianship, succession and mutual consent matters, handled with as little court time as the situation allows.', when: 'By appointment' },
        { name: 'Civil disputes', lead: 'Suits and appeals', text: 'Recovery, contract disputes and injunctions, in the district court and on appeal.', when: 'District and High Court' },
        { name: 'Documentation', lead: 'Non-contentious', text: 'Sale deeds, wills, partition deeds, rental and partnership agreements, drafted and registered.', when: 'One to two weeks' },
        { name: 'Notices and replies', lead: 'Pre-litigation', text: 'A properly drafted notice settles a surprising number of matters without a suit ever being filed.', when: 'Two to three days' },
    ],

    /* The bespoke section. Reference, not intake: see the header of
       components/demo/sections/ConsultDesk.js for why this page gets a
       table and every other demo gets a widget. */
    matters: [
        {
            matter: 'Buying property',
            bring: [
                'The parent document and the sale deed chain, as far back as you have it',
                'Encumbrance certificate for the last thirty years',
                'Patta and chitta, and the latest kist receipt',
                'Approved layout plan, if it is a plot',
                'Whatever the seller has given you in writing',
            ],
            covers: 'Whether the title is clean, what is missing, and what it would cost to fix before you pay anything.',
            missing: 'Come with what you have. Half the encumbrance certificates in Tirunelveli are ordered after this meeting, not before it.',
        },
        {
            matter: 'A notice has arrived',
            bring: [
                'The notice itself, and the envelope it came in',
                'Anything you have already sent in reply',
                'The agreement or document the notice refers to',
                'Dates: when it arrived, when you signed what',
            ],
            covers: 'What it actually says, what the deadline really is, and whether a reply settles it without a suit.',
            missing: 'Bring the envelope. The postmark decides the deadline more often than the date printed on the notice.',
        },
        {
            matter: 'Family and succession',
            bring: [
                'Death certificate, if there is one',
                'Any will, registered or not',
                'Property documents in the deceased name',
                'A rough family tree, written on paper is fine',
            ],
            covers: 'Who inherits what under the law that applies, and whether the family can settle it without going to court.',
            missing: 'The family tree matters more than the documents at the first meeting. Write it out before you come.',
        },
        {
            matter: 'Money owed to you',
            bring: [
                'The agreement, invoice or acknowledgement',
                'Bank statements showing what was paid',
                'Messages or letters where the debt is admitted',
                'The date of the last payment or last admission',
            ],
            covers: 'Whether it is still in time, what it would cost to recover, and whether that is worth doing.',
            missing: 'The date of the last admission decides whether there is a case at all. Find it before anything else.',
        },
    ],

    prices: [
        {
            label: 'Consultation and drafting',
            items: [
                { name: 'First consultation', time: 'Up to an hour', price: 'Rs 1,000' },
                { name: 'Title verification', time: 'One week', price: 'From Rs 8,000' },
                { name: 'Sale deed drafted', time: 'Three to five days', price: 'From Rs 6,000' },
                { name: 'Will drafted', time: 'One week', price: 'From Rs 5,000' },
                { name: 'Legal notice', time: 'Two to three days', price: 'Rs 3,500' },
            ],
        },
        {
            label: 'Matters in court',
            items: [
                { name: 'Civil suit', time: 'Fee agreed at the outset', price: 'Quoted per matter' },
                { name: 'Appearance', time: 'Per hearing', price: 'Quoted per matter' },
            ],
        },
    ],

    process: [
        { title: 'Bring the papers', text: 'Whatever you have: documents, notices, messages. An hour with the papers is worth three without them.', when: 'Rs 1,000, an hour' },
        { title: 'An honest reading', text: 'Whether you have a case, what it would take, and roughly how long. Sometimes the answer is that you should settle.', when: 'The same meeting' },
        { title: 'Fee in writing', text: 'Before anything is filed. Court fees and stamp duty are separate and paid by you at the counter.', when: 'Before we start' },
        { title: 'Copies of everything', text: 'Every filing and every order, to you, as it happens. A client should never have to ask what stage their own matter is at.', when: 'Throughout' },
    ],

    story: {
        title: 'About the chamber',
        paragraphs: [
            'Practising at the Tirunelveli district court since 2004, mostly in property and civil matters, with two juniors. Most of the work arrives through people who were here before, which is the only kind of reputation worth having in this profession.',
            'Litigation is slow, expensive and uncertain, and a great many disputes are better settled than fought. You will be told that when it is true, even though it is the advice that earns least.',
        ],
    },

    faqs: [
        {
            q: 'What happens at a first consultation?',
            a: 'An hour with your papers, and an honest reading of whether you have a case. Rs 1,000, payable whether or not you go on to instruct this chamber.',
        },
        {
            q: 'How are fees decided?',
            a: 'Drafting and documentation carry fixed fees, listed above. A matter in court is quoted at the outset, in writing, against the stages it will go through. Court fees and stamp duty are separate and paid by you directly.',
        },
        {
            q: 'How long will my matter take?',
            a: 'Longer than you want. A contested civil suit in the district court is measured in years, not months. Anyone promising you a timeline is guessing, and the honest answer is that we will tell you at each stage where it stands.',
        },
        {
            q: 'Will I be told if I should not proceed?',
            a: 'Yes, and it happens often. A weak case pursued for three years costs far more than the advice not to file it.',
        },
    ],

    visit: {
        title: 'The chambers',
        note: 'Court Road, near the district court, ground floor. Come with your documents and ring ahead: court days run long and an appointment saves you waiting.',
    },
};

export default advocate;
