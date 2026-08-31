/**
 * Apex Dental, Koramangala, Bengaluru. Entirely invented.
 *
 * WHAT THIS ONE PROVES
 *
 * The clinical layout with a before/after module, and that a healthcare
 * demo can be convincing without a single fabricated credential. There is
 * no NABH number, no registration number, no "twenty years of combined
 * experience" and no star rating. What replaces them is specificity: what
 * a treatment costs, how long it takes, and what happens at the first
 * visit. That is what someone choosing a dentist actually wants.
 *
 * The before/after images are CSS and SVG, not photographs. Real clinical
 * photography of real patients is not something we can invent, and a
 * stock smile would be obvious. The slider shows a drawn tooth diagram
 * moving from crowded to aligned, which demonstrates the interaction
 * honestly without pretending to be a clinical result.
 */

const dental = {
    slug: 'dental-clinic',
    layout: 'clinical',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'split' },
        { type: 'beforeafter' },
        { type: 'pricegrid' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Treating Coimbatore families since 2014.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'pin',
        landmark: '80 Feet Road, Koramangala 5th Block',
    },

    business: {
        name: 'Apex Dental',
        tagline: 'Orthodontics and general dentistry',
        trade: 'Dental clinic',
        area: 'Koramangala',
        city: 'Bengaluru',
        street: '18, 5th Block, 80 Feet Road, Koramangala',
        pin: '560095',
        email: 'appointments@apexdental.example',
        since: '2014',
        trust: ['Sterilised per patient', 'Digital X-ray on site', 'Written estimate before we start', '12 years, one chair, one dentist'],
        hours: [
            { days: 'Monday to Saturday', open: 9.5, close: 19.5 },
            { days: 'Sunday', open: 10, close: 13 },
        ],
    },

    theme: {
        ink: '#042F2E',
        paper: '#F0FDFA',
        accent: '#0D9488',
        support: '#4B6C6A',
        soft: '#D7F2EE',
        onAccent: '#F0FDFA',
        fill: '#0D9488',
        onFill: '#F0FDFA',
        radiusSm: '8px',
        radiusLg: '14px',
        borderW: '1px',
        shadow: '0 4px 14px rgba(4, 47, 46, 0.08)',
        display: 'var(--f-lexend)',
        text: 'var(--f-inter)',
    },

    logo: { mark: 'tooth', style: 'plate' },

    hero: {
        kicker: 'Koramangala 5th Block',
        headline: 'A written estimate before anything starts',
        sub: 'You are told what it costs and how long it takes before a drill is picked up.',
        primaryCta: 'See the treatments',
        secondaryCta: 'Find the clinic',
    },

    module: {
        type: 'beforeafter',
        shape: 'arch',
        title: 'What alignment changes',
        subtitle: 'Drag to see the difference eighteen months of aligners makes. This is a diagram, not a patient photograph.',
        beforeLabel: 'Before',
        afterLabel: 'After 18 months',
    },

    factsTitle: 'Treatments and what they cost',
    factsLede: 'Every figure is what you are quoted before anything starts.',
    treatments: [
        { name: 'Consultation and X-ray', time: '30 minutes', price: 'Rs 500' },
        { name: 'Scaling and polishing', time: '45 minutes', price: 'Rs 1,800' },
        { name: 'Composite filling', time: '40 minutes', price: 'Rs 2,200 per tooth' },
        { name: 'Root canal, single root', time: 'Two visits', price: 'Rs 6,500' },
        { name: 'Ceramic crown', time: 'Two visits', price: 'Rs 9,000' },
        { name: 'Clear aligners, full course', time: '12 to 24 months', price: 'From Rs 1,80,000' },
    ],

    story: {
        title: 'How a first visit goes',
        paragraphs: [
            'Thirty minutes, a digital X-ray and a look at what is actually there. You leave with a written estimate listing every treatment, what it costs, and what happens if you do nothing. Nothing is started on the first visit unless you are in pain.',
            'If a treatment can wait, we say it can wait. If a cheaper option is genuinely adequate, we say that too. The estimate is the estimate: if something changes mid-treatment we stop and tell you before carrying on.',
        ],
    },

    voicesTitle: 'From our patients',
    faqTitle: 'Before your first visit',
    voices: [
        {
            text: 'I was quoted for four fillings at another clinic. Here they said two of them did not need doing yet and to come back in a year. I went back in a year and they still did not need doing.',
            who: 'Meera J',
            where: 'Koramangala',
        },
        {
            text: 'The aligner course ran long by about two months and they did not charge for the extra sets. It was in the estimate that way from the start.',
            who: 'Karthik B',
            where: 'HSR Layout',
        },
        {
            text: 'My son is nine and terrified of dentists. They spent the first appointment letting him hold the mirror and did not do anything at all.',
            who: 'Fatima A',
            where: 'Ejipura',
        },
    ],

    faqs: [
        {
            q: 'Do I need an appointment?',
            a: 'For anything planned, yes, and you will wait less. If you are in pain, come in and we will fit you between appointments the same day.',
        },
        {
            q: 'How much do aligners cost?',
            a: 'From Rs 1,80,000 for a full course, depending on how much movement is needed and how long it takes. You get the full figure in writing after the first scan, not a range.',
        },
        {
            q: 'Do you take insurance?',
            a: 'We give you an itemised invoice and the treatment codes your insurer will ask for. We do not bill insurers directly, so you claim it back yourself.',
        },
        {
            q: 'What if I need something you do not do?',
            a: 'Complex surgical work goes to a maxillofacial surgeon we have worked with for years, and we send the X-rays across rather than making you repeat them.',
        },
    ],

    visit: {
        title: 'Where we are',
        note: 'On 80 Feet Road in 5th Block, above the pharmacy, first floor. There is a lift. Parking is easiest on the side road after the junction.',
    },
};

export default dental;
