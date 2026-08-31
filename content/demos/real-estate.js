/**
 * Vaigai Land & Plots, Trichy. Entirely invented.
 *
 * A plot seller lives or dies on whether the buyer believes the paperwork.
 * So the spec table is the module: approval number, survey number, what
 * is laid and what is not. Nothing here is a rendering of a clubhouse
 * that does not exist.
 *
 * NO REAL DTCP NUMBERS. The approval references carry a letter prefix and
 * stay under twelve digits, because check-brand-leak hard-fails on a bare
 * twelve-digit run, and because a real-looking approval number on a page
 * about land is a claim somebody might act on.
 */

const realEstate = {
    slug: 'real-estate',
    layout: 'catalogue',

    sections: [
        { type: 'hero', variant: 'banner' },
        { type: 'proof' },
        { type: 'plots', title: 'What is on the ground', lede: 'Live stock across both layouts. Budget bands rather than rates, because land prices move and a stale number helps nobody.', note: 'Every plot listed here has its approval, patta and encumbrance certificate ready to be sent before you visit.' },
        { type: 'spectable', title: 'The layouts' },
        { type: 'pricegrid' },
        { type: 'process', title: 'How a purchase goes' },
        { type: 'story' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Selling clean-title plots around Trichy since 2009.',
        stats: [
            { value: '17', unit: 'years', label: 'in the Trichy market' },
            { value: '412', unit: 'families', label: 'on their own land' },
            { value: '9', unit: 'layouts', label: 'approved and sold out' },
        ],
        award: 'Member, Trichy Plot Promoters Forum',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'inline',
    },

    business: {
        name: 'Vaigai Land & Plots',
        tagline: 'Approved plots around Trichy',
        trade: 'Plots and land',
        area: 'Thillai Nagar',
        city: 'Tiruchirappalli',
        street: '22, Eleventh Cross, Thillai Nagar',
        pin: '620018',
        email: 'plots@vaigailand.example',
        since: '2009',
        trust: ['DTCP approved layouts', 'Papers shown before advance', 'Registration handled'],
        hours: [
            { days: 'Monday to Saturday', open: 9.5, close: 19 },
            { days: 'Sunday', open: 10, close: 17 },
        ],
    },

    theme: {
        ink: '#14532D',
        paper: '#F7FEE7',
        accent: '#CA8A04',
        support: '#4A6B4F',
        soft: '#E6F5D8',
        onAccent: '#14532D',
        fill: '#14532D',
        onFill: '#F7FEE7',
        radiusSm: '4px',
        radiusLg: '8px',
        borderW: '1px',
        shadow: '0 3px 12px rgba(20, 83, 45, 0.08)',
        display: 'var(--f-archivo)',
        text: 'var(--f-source)',
    },

    logo: { mark: 'plot', style: 'plate' },

    voicesTitle: 'From buyers',
    faqTitle: 'Papers and payment',
    factsTitle: 'What a plot costs',
    factsLede: 'Per square foot, before registration. Corner and east-facing plots carry the usual premium and we will tell you which are left.',

    hero: {
        kicker: 'Trichy and around, since 2009',
        headline: 'Plots with the approval papers on the page',
        sub: 'DTCP approved layouts around Trichy. Survey numbers, approval references and what is actually laid, before you pay an advance.',
        primaryCta: 'See the layouts',
        secondaryCta: 'The office',
    },

    module: {
        type: 'spectable',
        title: 'The layouts',
    },

    /* Budget bands, never a rate. Land pricing moves and a static page
       quoting a stale per-cent figure is worse than one that says ask.
       See the header of components/demo/sections/PlotFinder.js. */
    budgets: ['Under Rs 15 lakh', 'Rs 15 to 25 lakh', 'Rs 25 to 40 lakh', 'Above Rs 40 lakh'],

    plots: [
        { id: 'Plot 14', layout: 'Ponvizha Nagar', extent: '1,200 sq ft', facing: 'East', budget: 'Rs 15 to 25 lakh', note: 'Corner plot, two road frontages.' },
        { id: 'Plot 22', layout: 'Ponvizha Nagar', extent: '1,800 sq ft', facing: 'North', budget: 'Rs 25 to 40 lakh' },
        { id: 'Plot 27', layout: 'Ponvizha Nagar', extent: '2,400 sq ft', facing: 'East', budget: 'Above Rs 40 lakh', note: 'Backs onto the park reserve, so nothing will be built behind it.' },
        { id: 'Plot 31', layout: 'Ponvizha Nagar', extent: '1,200 sq ft', facing: 'West', budget: 'Under Rs 15 lakh' },
        { id: 'Plot 5', layout: 'Sivan Gardens', extent: '1,500 sq ft', facing: 'North', budget: 'Rs 15 to 25 lakh' },
        { id: 'Plot 9', layout: 'Sivan Gardens', extent: '1,200 sq ft', facing: 'South', budget: 'Under Rs 15 lakh', note: 'Priced lower for the facing. The plot itself is level and clean.' },
        { id: 'Plot 16', layout: 'Sivan Gardens', extent: '2,000 sq ft', facing: 'East', budget: 'Rs 25 to 40 lakh' },
        { id: 'Plot 18', layout: 'Sivan Gardens', extent: '1,600 sq ft', facing: 'West', budget: 'Rs 15 to 25 lakh' },
    ],

    specGroups: [
        {
            label: 'Ponvizha Nagar, Manapparai Road',
            rows: [
                { name: 'Approval', value: 'DTCP TRY-4821', note: 'Copy on request' },
                { name: 'Survey number', value: '148/2B, 148/3', note: 'Patta available' },
                { name: 'Total plots', value: '84', note: '31 remaining' },
                { name: 'Plot sizes', value: '1,200 to 2,400 sq ft', note: 'Some corner' },
                { name: 'Roads', value: '30 ft and 23 ft', note: 'Black topped' },
                { name: 'Laid', value: 'Water, drains, lights', note: 'Complete' },
            ],
        },
        {
            label: 'Anaikarai Gardens, Thuvakudi',
            rows: [
                { name: 'Approval', value: 'DTCP TRY-5107', note: 'Copy on request' },
                { name: 'Survey number', value: '76/1A', note: 'Patta available' },
                { name: 'Total plots', value: '46', note: '19 remaining' },
                { name: 'Plot sizes', value: '1,500 to 3,000 sq ft', note: 'Larger plots' },
                { name: 'Roads', value: '30 ft', note: 'Black topped' },
                { name: 'Laid', value: 'Water, drains', note: 'Lights by March' },
            ],
        },
    ],

    prices: [
        {
            label: 'Ponvizha Nagar',
            items: [
                { name: 'Standard plot', time: 'Per square foot', price: 'Rs 1,450' },
                { name: 'Corner plot', time: 'Per square foot', price: 'Rs 1,650' },
                { name: 'East facing', time: 'Per square foot', price: 'Rs 1,580' },
            ],
        },
        {
            label: 'Anaikarai Gardens',
            items: [
                { name: 'Standard plot', time: 'Per square foot', price: 'Rs 1,180' },
                { name: 'Corner plot', time: 'Per square foot', price: 'Rs 1,380' },
            ],
        },
    ],

    process: [
        { title: 'See the papers first', text: 'Approval, patta, parent document and the encumbrance certificate. Before you visit, if you want them by message.', when: 'Same day' },
        { title: 'Walk the plot', text: 'On site, with the survey stones and the layout plan in hand, so you can see exactly which piece is yours.', when: 'Any day' },
        { title: 'Advance and agreement', text: 'A written sale agreement at the time of the advance, not a receipt. The advance is refundable if the title does not clear.', when: 'On booking' },
        { title: 'Registration', text: 'At the sub-registrar, with our documentation person present. Stamp duty and fees are yours and paid at the counter.', when: 'Within thirty days' },
    ],

    story: {
        title: 'How we sell',
        paragraphs: [
            'Every layout here is approved and every plot has a survey number you can check yourself at the taluk office. We hand over the papers before the advance rather than after, because a buyer who has read the documents is a buyer who does not pull out at registration.',
            'We do not sell agricultural land as house plots, and we do not sell in layouts we have not developed. Both are how people lose money on land in this district, and both are easy to avoid.',
        ],
    },

    voices: [
        {
            text: 'They gave us the encumbrance certificate and the parent document before we had paid anything. My brother in law is a lawyer and he could not find a problem.',
            who: 'Senthil V',
            where: 'Srirangam',
        },
        {
            text: 'We asked about a plot on the corner and were told it was already sold, rather than being shown it and pressured later.',
            who: 'Fathima and Rafi',
            where: 'Trichy',
        },
    ],

    faqs: [
        {
            q: 'Is the layout approved?',
            a: 'Both layouts are DTCP approved and the reference is on the page. Ask and we will send you the approval copy before you visit.',
        },
        {
            q: 'What do I get before paying an advance?',
            a: 'Approval copy, patta, parent document and the encumbrance certificate. Take them to your own lawyer. Anyone who will not give you these before an advance is telling you something.',
        },
        {
            q: 'Is the advance refundable?',
            a: 'If the title does not clear, yes, in full. If you change your mind, the agreement sets out what is retained, and it is written down before you pay.',
        },
        {
            q: 'Can I get a bank loan on these?',
            a: 'Both layouts are approved for plot loans with the main banks. We provide whatever documentation the bank asks for, though the loan is between you and them.',
        },
    ],

    visit: {
        title: 'The office',
        note: 'Eleventh Cross in Thillai Nagar. Come with an idea of the budget and we will take you to whichever layout fits it, the same day if you have an hour.',
    },
};

export default realEstate;
