/**
 * Smiles & Shadows, Panampilly Nagar, Kochi. Entirely invented.
 *
 * A wedding photographer sells on portfolio, which is the hardest thing
 * to demonstrate when the CSP forbids external images and we have no
 * photography to license. The before/after module is reused here as a
 * raw-versus-graded comparison, which is honest about being a diagram
 * and demonstrates something a photographer genuinely sells.
 */

const photoStudio = {
    slug: 'photo-studio',
    layout: 'editorial',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'fullbleed' },
        { type: 'beforeafter' },
        { type: 'proof' },
        { type: 'pricegrid' },
        { type: 'process' },
        { type: 'gallery', title: 'Recent work' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Shooting Kerala weddings since 2012.',
        stats: [
            { value: '14', unit: 'years', label: 'behind the camera' },
            { value: '430+', unit: '', label: 'weddings shot' },
            { value: '37', unit: '', label: 'venues we know by name' },
            { value: '2', unit: 'photographers', label: 'at every wedding' },
        ],
        award: 'Portrait of the Year, Kochi Camera Club 2024',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'card',
        landmark: 'Avenue Road, Panampilly Nagar, first floor',
        direction: 'First floor, above the row of shops. The stairs are at the side, not the front.',
    },

    business: {
        name: 'Smiles & Shadows',
        tagline: 'Weddings and portraits in Kerala',
        trade: 'Photo studio',
        area: 'Panampilly Nagar',
        city: 'Kochi',
        street: '22, Avenue Road, Panampilly Nagar',
        pin: '682036',
        email: 'hello@smilesandshadows.example',
        since: '2012',
        trust: ['Two photographers on every wedding', 'Raw files handed over', 'Album within eight weeks'],
        hours: [
            { days: 'Studio, Monday to Saturday', open: 10, close: 19 },
            { days: 'Sunday', open: 11, close: 16 },
        ],
    },

    theme: {
        ink: '#F5F5F4',
        paper: '#0C0A09',
        accent: '#D6A25F',
        support: '#A8A29E',
        soft: '#1C1917',
        onAccent: '#0C0A09',
        fill: '#D6A25F',
        onFill: '#0C0A09',
        radiusSm: '2px',
        radiusLg: '4px',
        borderW: '1px',
        shadow: 'none',
        display: 'var(--f-instrument)',
        text: 'var(--f-jost)',
    },

    logo: { mark: 'lens', style: 'bare' },

    hero: {
        kicker: 'Kochi, and wherever the wedding is',
        headline: 'The photographs you will actually print',
        sub: 'Two photographers on every wedding, the raw files handed over, an album within eight weeks.',
        primaryCta: 'See the difference',
        secondaryCta: 'Check a date',
    },

    module: {
        type: 'beforeafter',
        /* Real photographs rather than the drawn `frame` shape. The
           subtitle used to say "this is a diagram of the process, not a
           client photograph", which stopped being true the moment real
           images went in, so it says what is actually on screen now. */
        shape: 'frame',
        beforeSrc: '/demo/photo-studio/before-correction.webp',
        afterSrc: '/demo/photo-studio/after-correction.webp',
        beforeAlt: 'The same frame straight out of the camera, flat and cool.',
        afterAlt: 'The same frame after colour work, warmer with the skin tones corrected.',
        title: 'What grading does',
        subtitle: 'The same frame, before and after colour work. Drag the handle across to see what changes.',
        beforeLabel: 'Out of camera',
        afterLabel: 'Graded',
    },

    factsTitle: 'Packages',
    factsLede: 'Raw files are included in every one of them.',
    treatments: [
        { name: 'Portrait session', time: '2 hours, 30 edited frames', price: 'Rs 18,000' },
        { name: 'Pre wedding shoot', time: 'Half a day, one location', price: 'Rs 42,000' },
        { name: 'Wedding, single day', time: 'Two photographers, raw files', price: 'Rs 1,25,000' },
        { name: 'Wedding, full function', time: 'Three days, three photographers', price: 'From Rs 2,80,000' },
        { name: 'Printed album, 40 spread', time: 'Eight weeks', price: 'Rs 32,000' },
    ],

    process: [
        { title: 'Tell us the date', text: 'Send the date and the venue. We hold it for a week without a deposit.', when: 'Same day reply' },
        { title: 'Meet, or a call', text: 'Half an hour on what the day looks like and who matters in the photographs.', when: 'Before you commit' },
        { title: 'The shoot', text: 'Two photographers, always. One with the couple, one covering the room.', when: 'The day itself' },
        { title: 'Raw files', text: 'Everything, on a drive, before any editing. They are your photographs.', when: 'At the end of the shoot' },
        { title: 'Graded and printed', text: 'Selects graded in three weeks, the printed album within eight.', when: 'Three to eight weeks' },
    ],
    prices: [
        {
            label: 'Weddings',
            items: [
                { name: 'Single day', time: 'Two photographers, raw files', price: 'Rs 1,25,000' },
                { name: 'Full function', time: 'Three days, three photographers', price: 'From Rs 2,80,000' },
                { name: 'Printed album', time: '40 spreads, eight weeks', price: 'Rs 32,000' },
            ],
        },
        {
            label: 'Sessions',
            items: [
                { name: 'Portrait', time: 'Two hours, 30 edited frames', price: 'Rs 18,000' },
                { name: 'Pre wedding', time: 'Half a day, one location', price: 'Rs 42,000' },
            ],
        },
    ],
    story: {
        title: 'How a wedding is covered',
        paragraphs: [
            'Two photographers, always. One stays with the couple and one covers the room, because the moment you want most is usually happening somewhere the main camera is not pointing.',
            'The raw files are yours at the end of the shoot, on a drive, before any editing. Selected frames are graded and delivered within three weeks and the printed album follows within eight. Nothing is held back to encourage an upgrade.',
        ],
    },

    voicesTitle: 'From the couples',
    faqTitle: 'Booking a date',
    voices: [
        {
            text: 'Getting the raw files felt strange until I understood why. Six months later I found a frame they had not selected that is now the picture on my parents’ wall.',
            who: 'Anjana and Vivek',
            where: 'Kochi',
        },
        {
            text: 'The second photographer caught my grandmother laughing during the ceremony. She died that year. That single photograph was worth the entire fee.',
            who: 'Reshma T',
            where: 'Thrissur',
        },
        {
            text: 'Album arrived in seven weeks, one week early, and the binding is properly done rather than glued.',
            who: 'Joseph M',
            where: 'Alappuzha',
        },
    ],

    faqs: [
        {
            q: 'Do we get the raw files?',
            a: 'Yes, all of them, on a drive at the end of the shoot. They are your photographs. We keep a backup for a year in case the drive fails.',
        },
        {
            q: 'How long until we see the pictures?',
            a: 'Graded selects within three weeks, the printed album within eight. If a date is going to slip you will be told before it does rather than after.',
        },
        {
            q: 'Will you travel?',
            a: 'Anywhere in Kerala and Tamil Nadu at no extra charge beyond travel and stay. Further than that, ask, and the answer is usually yes.',
        },
        {
            q: 'What if it rains?',
            a: 'It is Kerala, so it will. We shoot in it, and some of the best frames come from it. For an outdoor pre-wedding we will move the date if you would rather.',
        },
    ],

    visit: {
        title: 'The studio',
        note: 'Avenue Road in Panampilly Nagar, first floor. Come and look at printed albums rather than at a screen, which is the only way to judge how they are actually made.',
    },
};

export default photoStudio;
