/**
 * Vigneshwara Electricals, Peenya, Bengaluru. Entirely invented.
 * A trade counter: the quote module, priced by quantity across a
 * catalogue, which is the second use of that component.
 */

const smallBusiness = {
    slug: 'small-business',
    layout: 'clinical',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'standard' },
        { type: 'process', title: 'How the counter works' },
        { type: 'stock', title: 'Is it on the shelf', lede: 'The page keeps saying we tell you the truth about stock. Here it is, searchable, including the lines we do not carry.', note: 'Prices move with copper and with the brand. What is shown is this week, and you get a written quote before anything is packed.' },
        { type: 'tariff' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Selling wire and fittings since 2002.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'pin',
        landmark: '4th Phase, Peenya Industrial Area',
    },

    business: {
        name: 'Vigneshwara Electricals',
        tagline: 'Industrial spares and hardware, Peenya',
        trade: 'Hardware shop',
        area: 'Peenya Industrial Area',
        city: 'Bengaluru',
        street: '7, 4th Phase, Peenya Industrial Area',
        pin: '560058',
        email: 'sales@vigneshwaraelectricals.example',
        since: '2002',
        trust: ['GST invoice on everything', 'Credit for regular accounts', 'Delivery within Peenya same day', '4,200 line items on the shelf'],
        hours: [
            { days: 'Monday to Saturday', open: 9.5, close: 19 },
            { days: 'Sunday', open: 10, close: 13 },
        ],
    },

    theme: {
        ink: '#111827',
        paper: '#F9FAFB',
        accent: '#C2410C',
        support: '#4B5563',
        soft: '#E5E7EB',
        onAccent: '#F9FAFB',
        fill: '#111827',
        onFill: '#F9FAFB',
        radiusSm: '3px',
        radiusLg: '6px',
        borderW: '1px',
        shadow: 'none',
        display: 'var(--f-archivo)',
        text: 'var(--f-source)',
    },

    logo: { mark: 'spark', style: 'bare' },

    hero: {
        kicker: '4th Phase, Peenya',
        headline: 'The part you need, in stock, today',
        sub: 'Contactors, cables and switchgear for the workshops around Peenya. Send a list, get a real quote.',
        primaryCta: 'Build a quote',
        secondaryCta: 'Where we are',
    },

    module: {
        type: 'tariff',
        ratePeriod: 'per order',
        title: 'Build a quote',
        subtitle: 'Rough it out here and send it across. Prices are per unit, before GST, and firm for seven days.',
        unitLabel: 'units',
        min: 5,
        max: 500,
        step: 5,
        options: [
            { id: 'contactor', label: 'Contactor, 25 A', note: 'Three pole, coil 240 V', rate: 1450 },
            { id: 'mcb', label: 'MCB, 32 A', note: 'C curve, single pole', rate: 320 },
            { id: 'cable', label: 'Cable, 4 sq mm', note: 'Per metre, copper, FR', rate: 78 },
        ],
        addons: [
            { id: 'fitting', label: 'Fitting and lugs', note: 'Per unit', rate: 60 },
            { id: 'delivery', label: 'Delivery in Peenya', note: 'Per unit, same day', rate: 15 },
        ],
    },

    factsTitle: 'What we stock',
    factsLede: 'Trade prices, before GST.',
    /* Three states, not two: on the shelf, two days, and genuinely not
       stocked. The story promises exactly this, so the section has to
       deliver it including the unflattering third case. */
    catalogue: [
        { name: 'Contactor, 9A, 3 pole', also: 'contactor relay', pack: 'Each', price: 'Rs 640', state: 'in' },
        { name: 'Contactor, 25A, 3 pole', also: 'contactor', pack: 'Each', price: 'Rs 1,180', state: 'in' },
        { name: 'Contactor, 95A, 3 pole', also: 'contactor', pack: 'Each', price: 'Rs 4,900', state: 'soon' },
        { name: 'MCB, 6A to 32A, C curve', also: 'breaker mcb', pack: 'Each', price: 'Rs 220', state: 'in' },
        { name: 'MCB, 63A, C curve', also: 'breaker mcb', pack: 'Each', price: 'Rs 580', state: 'in' },
        { name: 'RCCB, 40A, 30mA', also: 'rccb elcb', pack: 'Each', price: 'Rs 2,150', state: 'in' },
        { name: 'Copper cable, 1.5 sq mm', also: 'wire copper', pack: '90 m coil', price: 'Rs 2,380', state: 'in' },
        { name: 'Copper cable, 2.5 sq mm', also: 'wire copper', pack: '90 m coil', price: 'Rs 3,850', state: 'in' },
        { name: 'Copper cable, 4 sq mm', also: 'wire copper', pack: '90 m coil', price: 'Rs 6,100', state: 'soon' },
        { name: 'Armoured cable, 4 core, 16 sq mm', also: 'armoured', pack: 'Per metre', price: 'Rs 410', state: 'soon' },
        { name: 'Modular switch, 6A', also: 'switch plate', pack: 'Each', price: 'Rs 78', state: 'in' },
        { name: 'Modular socket, 16A', also: 'socket plate', pack: 'Each', price: 'Rs 165', state: 'in' },
        { name: 'Distribution board, 8 way', also: 'db board', pack: 'Each', price: 'Rs 1,640', state: 'in' },
        { name: 'Distribution board, 16 way', also: 'db board', pack: 'Each', price: 'Rs 2,980', state: 'soon' },
        { name: 'Cable gland, brass, 20mm', also: 'gland', pack: 'Pack of 10', price: 'Rs 340', state: 'in' },
        { name: 'Lugs, copper, assorted', also: 'lug terminal', pack: 'Pack of 50', price: 'Rs 290', state: 'in' },
        { name: 'VFD, 3 phase, 5 hp', also: 'drive inverter vfd', pack: 'Each', price: 'Order only', state: 'no' },
        { name: 'Servo stabiliser', also: 'stabiliser', pack: 'Each', price: 'Order only', state: 'no' },
    ],

    treatments: [
        { name: 'Contactors and relays', time: 'Most sizes in stock', price: 'From Rs 640' },
        { name: 'MCBs and RCCBs', time: 'All curves', price: 'From Rs 220' },
        { name: 'Copper cable', time: 'Cut to length', price: 'From Rs 32 per metre' },
        { name: 'Switchgear enclosures', time: 'Two day lead', price: 'From Rs 3,400' },
        { name: 'Fasteners and lugs', time: 'Loose or boxed', price: 'By weight' },
    ],

    process: [
        { title: 'Send a list', text: 'On WhatsApp, in whatever form. Part numbers, a photograph, or a description.', when: 'Before eight works best' },
        { title: 'What is on the shelf', text: 'Back to you with what is in stock, what is two days out, and a price against each.', when: 'Usually within the hour' },
        { title: 'Collect or delivered', text: 'Same day within Peenya. Next day elsewhere in Bengaluru.', when: 'Order before four' },
        { title: 'On account', text: 'Thirty days against a GST invoice once you are a regular.', when: 'After a few orders' },
    ],
    story: {
        title: 'How the counter works',
        paragraphs: [
            'Send a list on WhatsApp and you get back what is on the shelf, what is two days out, and the price against each. Nobody is going to tell you something is available and then order it after you have paid.',
            'Regular accounts run on thirty day credit against a GST invoice. New customers pay on collection for the first few orders, which is not personal.',
        ],
    },

    voicesTitle: 'From the trade counter',
    faqTitle: 'Orders, credit and delivery',
    voices: [
        {
            text: 'I send a list of twelve items at eight in the morning and have the quote before I reach the workshop. Half the time the delivery arrives before I have finished the tea.',
            who: 'Manjunath H',
            where: 'Peenya Phase 2',
        },
        {
            text: 'They told me a cheaper contactor would do the job and sold me that instead of the one I asked for. It has been running two years.',
            who: 'Imran S',
            where: 'Rajajinagar',
        },
        {
            text: 'Thirty day credit, GST invoice, no chasing. That is the whole relationship and it works.',
            who: 'Prakash B',
            where: 'Jalahalli',
        },
    ],

    faqs: [
        {
            q: 'Do you deliver?',
            a: 'Within Peenya the same day for anything ordered before four. Elsewhere in Bengaluru it is next day and there is a charge depending on the load.',
        },
        {
            q: 'Can I open a credit account?',
            a: 'After a few orders paid on collection, yes. Thirty days against a GST invoice. Come in and talk rather than filling anything in.',
        },
        {
            q: 'What if the part is not in stock?',
            a: 'You are told when you send the list, not after you have paid. Most things are two working days; anything longer we say so and you can decide.',
        },
        {
            q: 'Do you supply to individuals?',
            a: 'Yes, over the counter. The credit account is for trade, but anyone can walk in and buy a single MCB.',
        },
    ],

    visit: {
        title: 'The counter',
        note: '4th Phase, Peenya, on the road behind the bus depot. The shutter says Vigneshwara. Vehicles can pull up outside for loading.',
    },
};

export default smallBusiness;
