/**
 * UrbanPulse, Cyber City, Gurugram. Entirely invented.
 *
 * A dark palette, which is the second demo testing that the token
 * contract survives ink and paper being inverted. The specs on each
 * product are the point: a D2C electronics buyer reads specifications,
 * not adjectives.
 */

const ecommerce = {
    slug: 'ecommerce',
    layout: 'catalogue',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'banner' },
        { type: 'cart' },
        { type: 'gallery', title: 'The gear' },
        { type: 'specs', title: 'What we measured', lede: 'Battery figures in this category are quoted at a volume nobody actually listens at. Ours are measured at 70 percent, and we publish both.', note: 'Measured on units pulled from the same stock we ship. If yours reads materially lower, that is a warranty case and not an argument.' },
        { type: 'process', title: 'Ordering and support' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Shipping our own label since 2019.',
    },

    business: {
        name: 'UrbanPulse',
        tagline: 'Audio and desk gear, shipped from Gurugram',
        trade: 'Online brand',
        area: 'Cyber City',
        city: 'Gurugram',
        street: 'Unit 402, Tower B, Cyber City',
        pin: '122002',
        email: 'support@urbanpulse.example',
        since: '2019',
        trust: ['Two year warranty', 'Seven day return, no questions', 'Ships same day before 2 pm'],
        hours: [
            { days: 'Support, Monday to Saturday', open: 9, close: 18 },
            { days: 'Sunday', open: 10, close: 14 },
        ],
    },

    theme: {
        ink: '#FAFAFA',
        paper: '#0B0B0E',
        accent: '#A78BFA',
        support: '#A1A1AA',
        soft: '#18181D',
        onAccent: '#0B0B0E',
        fill: '#A78BFA',
        onFill: '#0B0B0E',
        radiusSm: '6px',
        radiusLg: '14px',
        borderW: '1px',
        shadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        display: 'var(--f-geist)',
        text: 'var(--f-inter)',
    },

    logo: { mark: 'wave', style: 'bare' },

    hero: {
        kicker: 'Designed here, shipped from Gurugram',
        headline: 'Specifications, not adjectives',
        sub: 'Driver size, impedance, battery in hours under real use. Two year warranty, seven day return.',
        primaryCta: 'See the range',
        secondaryCta: 'Support',
    },

    specRows: [
        { key: 'battery', label: 'Battery life' },
        { key: 'driver', label: 'Driver' },
        { key: 'impedance', label: 'Impedance' },
        { key: 'weight', label: 'Weight' },
        { key: 'charge', label: 'Full charge' },
        { key: 'warranty', label: 'Warranty' },
    ],

    specProducts: [
        { name: 'Over-ear, wireless', battery: { claimed: '40 hours', measured: '27 hours' }, driver: '40 mm', impedance: '32 ohm', weight: '268 g', charge: { claimed: '90 minutes', measured: '105 minutes' }, warranty: '2 years' },
        { name: 'In-ear, wireless', battery: { claimed: '8 hours', measured: '6 hours' }, driver: '10 mm', impedance: '16 ohm', weight: '4.6 g each', charge: '55 minutes', warranty: '2 years' },
        { name: 'Desk speaker, pair', battery: 'Mains powered', driver: '3 inch, 2 way', impedance: '6 ohm', weight: '2.1 kg each', charge: 'Not applicable', warranty: '2 years' },
    ],

    module: {
        type: 'cart',
        title: 'The range',
        subtitle: 'Everything ships the same day if ordered before two.',
    },

    menu: [
        {
            label: 'Audio',
            items: [
                { name: 'Pulse One, over ear', note: '40 mm driver, 32 ohm, 38 hours', price: 6490 },
                { name: 'Pulse Air, in ear', note: '10 mm driver, 7 hours plus 21 in the case', price: 3290 },
                { name: 'Pulse Studio, wired', note: '50 mm driver, 250 ohm, 3 m cable', price: 11900 },
            ],
        },
        {
            label: 'Desk',
            items: [
                { name: 'Arc mechanical keyboard', note: '75 percent, hot swap, PBT caps', price: 8900 },
                { name: 'Orbit mouse', note: '26k sensor, 63 g, 70 hours', price: 4200 },
                { name: 'Riser stand, aluminium', note: 'Holds 12 kg, 110 mm lift', price: 2800 },
            ],
        },
        {
            label: 'Cables and spares',
            items: [
                { name: 'Braided USB C, 2 m', note: '100 W, USB 3.2', price: 890 },
                { name: 'Replacement ear pads', note: 'For Pulse One and Studio', price: 1200 },
            ],
        },
    ],

    process: [
        { title: 'Order before two', text: 'Ships the same day from the Gurugram warehouse.', when: 'Weekdays' },
        { title: 'Two to four days', text: 'Most Indian metros in two, the rest in four.', when: 'Tracked' },
        { title: 'Seven day return', text: 'Any condition, no reason required. We arrange the pickup.', when: 'From delivery' },
        { title: 'Two year warranty', text: 'Manufacturing faults replaced. Spares stocked four years past discontinuation.', when: 'From purchase' },
    ],
    story: {
        title: 'How we build',
        paragraphs: [
            'Everything is specified before it is designed: driver size, impedance, weight, battery under continuous use rather than under laboratory conditions. If a number on this site is worse than a competitor’s, it is because ours is measured the way you will actually use it.',
            'Spares are stocked for four years after a product is discontinued. Ear pads, cables and switches are all replaceable, and the teardown guide is on the support page rather than behind a request form.',
        ],
    },

    voicesTitle: 'Owner reviews',
    faqTitle: 'Warranty, returns and support',
    voices: [
        {
            text: 'The battery figure was accurate, which I did not expect. Thirty-eight hours meant thirty-eight hours, not thirty-eight at half volume with everything off.',
            who: 'Nikhil A',
            where: 'Bengaluru',
        },
        {
            text: 'A switch failed in month fourteen. They sent five replacements and the tool, no charge, no argument.',
            who: 'Tanvi S',
            where: 'Pune',
        },
        {
            text: 'Returned a keyboard because I did not get on with the layout. Seven day return meant seven day return.',
            who: 'Farhan K',
            where: 'Delhi',
        },
    ],

    faqs: [
        {
            q: 'What does the warranty cover?',
            a: 'Two years on everything except consumables like ear pads and cables, which carry six months. Manufacturing faults are replaced; accidental damage is repaired at cost, and we will quote before doing it.',
        },
        {
            q: 'How does the return work?',
            a: 'Seven days from delivery, in any condition, no reason required. We arrange the pickup and refund within three working days of it reaching us.',
        },
        {
            q: 'Do you ship outside India?',
            a: 'Not yet. Duties and warranty support are the reason, and we would rather not sell you something we cannot support than take the order.',
        },
        {
            q: 'Are spares available?',
            a: 'For four years after a product is discontinued. Ear pads, cables, switches and keycaps are all stocked, and the teardown guide is on the support page.',
        },
    ],

    visit: {
        title: 'Support',
        note: 'We are an online brand, so there is no shop to walk into. Support is by email and answered within a working day, usually much sooner. The Gurugram address is the warehouse, and returns go there.',
    },
};

export default ecommerce;
