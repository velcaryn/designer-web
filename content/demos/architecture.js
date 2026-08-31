/**
 * Kovai Design Collective, Coimbatore. Entirely invented.
 *
 * Same absences as every demo: no phone number, no registration number,
 * no awards, no project count. An architecture practice is bought on
 * clarity about stages and money, and the fastest way to look untrustworthy
 * is a fee that appears only after the drawings do.
 */

const architecture = {
    slug: 'architecture',
    layout: 'editorial',

    sections: [
        { type: 'hero', variant: 'fullbleed' },
        { type: 'process', title: 'How a project runs' },
        { type: 'pricegrid' },
        { type: 'stages', title: 'What happens, stage by stage', lede: 'Seven stages from first walk to handover. What you receive at each, and what you have to decide before the next one can start.', note: 'No dates here on purpose. A project moves at the speed of its slowest approval and its slowest decision, and pretending otherwise is how architects lose trust in month four.' },
        { type: 'gallery', title: 'Recent work' },
        { type: 'proof' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Drawing houses people actually live in, since 2011.',
        stats: [
            { value: '15', unit: 'years', label: 'in practice' },
            { value: '186', unit: 'homes', label: 'handed over' },
            { value: '11', unit: 'towns', label: 'we have built in' },
        ],
        award: 'Residential Design Merit, Kongu Architects Circle 2023',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'inline',
    },

    business: {
        name: 'Kovai Design Collective',
        tagline: 'Architecture and interiors',
        trade: 'Architects',
        area: 'Race Course',
        city: 'Coimbatore',
        street: '18, Second Street, Race Course',
        pin: '641018',
        email: 'studio@kovaidesign.example',
        since: '2011',
        trust: ['Fee agreed before drawings', 'Site visits through the build', 'Working drawings included'],
        hours: [
            { days: 'Monday to Friday', open: 9.5, close: 18.5 },
            { days: 'Saturday', open: 10, close: 14 },
        ],
    },

    theme: {
        ink: '#1C1917',
        paper: '#FAFAF9',
        accent: '#A16207',
        support: '#57534E',
        soft: '#EFEBE5',
        onAccent: '#FAFAF9',
        fill: '#1C1917',
        onFill: '#FAFAF9',
        radiusSm: '2px',
        radiusLg: '4px',
        borderW: '1px',
        shadow: 'none',
        display: 'var(--f-instrument)',
        text: 'var(--f-jost)',
    },

    logo: { mark: 'compass', style: 'bare' },

    voicesTitle: 'From our clients',
    faqTitle: 'Before you commission',
    factsTitle: 'Fees, by stage',
    factsLede: 'A percentage of the build cost, billed against the stage it belongs to. You know the number before we draw anything.',

    hero: {
        kicker: 'Coimbatore, since 2011',
        headline: 'Drawings you can actually build from',
        sub: 'Houses, clinics and small commercial work. The fee is agreed before the first drawing and billed against stages you can see.',
        primaryCta: 'How it works',
        secondaryCta: 'The studio',
    },

    module: {
        type: 'process',
        title: 'How a project runs',
    },

    /* Stages, not a timeline: no dates anywhere. The "you decide" column
       is the honest one. See components/demo/sections/ProjectStages.js. */
    stages: [
        { name: 'Brief and site', text: 'We walk the site with you, measure it, and find out what the setbacks, the soil and the approach road actually allow. Most briefs change at this point, usually for the better.', deliver: 'A written brief and a site appraisal', who: 'A surveyor, if the boundaries are unclear', decide: 'What the house has to do. Not what it looks like.' },
        { name: 'Concept design', text: 'Two or three genuinely different approaches, in plan and in model form. Not three versions of the same house with the kitchen moved.', deliver: 'Plans, sections and a physical massing model', decide: 'Which approach. This is the decision the whole project rests on.' },
        { name: 'Design development', text: 'The chosen approach worked up properly: levels, openings, materials, how light moves through it across a day.', deliver: 'Developed drawings and a materials palette', who: 'Structural engineer joins here', decide: 'Materials and finishes, in principle. Details come later.' },
        { name: 'Approvals', text: 'Drawings prepared and submitted to the local body. This stage is mostly waiting, and how long it takes is not in our hands or yours.', deliver: 'Submission set and the approved plan', who: 'Local planning authority', decide: 'Nothing. Do not make changes during this stage.' },
        { name: 'Tender and contractor', text: 'Drawings issued to three or four contractors, quotes compared line by line, and the differences explained. The cheapest quote is usually the one that has left something out.', deliver: 'Tender set and a comparison statement', who: 'Contractors, quantity surveyor if the project warrants one', decide: 'Which contractor, and the contingency you are comfortable with.' },
        { name: 'On site', text: 'Site visits at the stages that matter: foundation, slab, first fix, finishes. Queries answered as they come up, because a query left waiting becomes a mistake in concrete.', deliver: 'Site reports and revised details as needed', who: 'Contractor, engineer, and you', decide: 'Variations as they arise. Every one has a cost and we will tell you what it is.' },
        { name: 'Handover', text: 'Final inspection, snagging list, and the drawings as actually built rather than as originally drawn.', deliver: 'As-built drawings, warranties and a snagging list', decide: 'When the snags are closed to your satisfaction.' },
    ],

    process: [
        { title: 'First conversation', text: 'What you want, what the site allows, and roughly what it will cost to build. Free, and about an hour.', when: 'No commitment' },
        { title: 'Concept', text: 'Plans and a massing model, two options, revised twice. You see the shape of it before anything is committed.', when: 'Three to four weeks' },
        { title: 'Approvals', text: 'Drawings for the local body, submitted and followed up. We deal with the queries rather than forwarding them to you.', when: 'Six to twelve weeks' },
        { title: 'Working drawings', text: 'Everything the contractor needs, dimensioned. This is the stage most practices skimp on and it is where site disputes come from.', when: 'Four to six weeks' },
        { title: 'On site', text: 'Visits at the stages that matter: footing, slab, finishes. We are the ones arguing with the contractor about the levels, not you.', when: 'Through the build' },
    ],

    prices: [
        {
            label: 'Residential',
            items: [
                { name: 'Concept only', time: 'Plans and model', price: 'Rs 45,000' },
                { name: 'Concept to approval', time: 'Includes submission', price: '2.5% of build cost' },
                { name: 'Full service', time: 'Through to handover', price: '6% of build cost' },
            ],
        },
        {
            label: 'Commercial and interiors',
            items: [
                { name: 'Interior fit out', time: 'Design and drawings', price: 'From Rs 1,80,000' },
                { name: 'Small commercial', time: 'Full service', price: '5% of build cost' },
            ],
        },
    ],

    story: {
        title: 'How we work',
        paragraphs: [
            'Three architects and a draughtsman, working on about eight projects at a time. That number is deliberate: past it, the site visits stop happening and the drawings start being issued without anyone having stood on the plot recently.',
            'We do not take a commission from contractors or suppliers. If we recommend someone it is because they did good work on the last job, and you are free to ignore us and use your own.',
        ],
    },

    voices: [
        {
            text: 'The working drawings were detailed enough that our mason stopped ringing us with questions. That alone was worth the fee.',
            who: 'Ramesh and Uma',
            where: 'Saibaba Colony',
        },
        {
            text: 'They told us the plot could not take the third floor we wanted, at the first meeting, before we had paid anything. Two other practices had said yes.',
            who: 'Dr Anand K',
            where: 'Peelamedu',
        },
        {
            text: 'The approval took eleven weeks and they chased it every week without being asked.',
            who: 'Selvi M',
            where: 'Ganapathy',
        },
    ],

    faqs: [
        {
            q: 'How is the fee calculated?',
            a: 'A percentage of the build cost for full service, or a fixed sum for concept-only work. Both are agreed in writing before we draw anything, and the percentage does not move if the build cost does.',
        },
        {
            q: 'Do you handle the approvals?',
            a: 'Yes, drawings and submission, and we follow up on the queries. Statutory fees are paid by you at cost and we show you the receipts.',
        },
        {
            q: 'Can you recommend a contractor?',
            a: 'We can suggest people whose work we have seen. We take no commission from them, and if you have your own contractor we will work with them.',
        },
        {
            q: 'How often do you visit the site?',
            a: 'At the stages that matter: footing, slab, brickwork, finishes. More often if something is going wrong, which is when it counts.',
        },
    ],

    visit: {
        title: 'The studio',
        note: 'Second Street off Race Course Road, first floor. Come with the plot documents and a rough idea of the budget; we can tell you a lot in one hour.',
    },
};

export default architecture;
