/**
 * SpeedTrack Express, Bhiwandi, Mumbai. Entirely invented.
 * Freight: the quote module priced by weight and route.
 */

const logistics = {
    slug: 'logistics',
    layout: 'clinical',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'standard' },
        { type: 'tracker' },
        { type: 'proof' },
        { type: 'spectable', title: 'Routes and transit' },
        { type: 'tariff' },
        { type: 'process', title: 'How a booking runs' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Moving freight out of Thane since 2010.',
        stats: [
            { value: '16', unit: 'years', label: 'on the road' },
            { value: '64', unit: 'routes', label: 'run weekly' },
            { value: '2.4', unit: 'lakh', label: 'consignments delivered' },
            { value: '98.6%', unit: '', label: 'arrived on the promised day' },
        ],
    },

    business: {
        name: 'SpeedTrack Express',
        tagline: 'Part load and full truck, out of Bhiwandi',
        trade: 'Freight company',
        area: 'Bhiwandi',
        city: 'Thane, Maharashtra',
        street: 'Gala 14, Mankoli Naka, Bhiwandi',
        pin: '421302',
        email: 'bookings@speedtrackexpress.example',
        since: '2010',
        trust: ['Transit time in writing', 'GPS on every vehicle', 'Insured in transit'],
        hours: [
            { days: 'Monday to Saturday', open: 8, close: 21 },
            { days: 'Sunday', open: 9, close: 14 },
        ],
    },

    theme: {
        ink: '#0A1128',
        paper: '#F4F6FA',
        accent: '#EA580C',
        support: '#475069',
        soft: '#E1E6EF',
        onAccent: '#F4F6FA',
        fill: '#0A1128',
        onFill: '#F4F6FA',
        radiusSm: '2px',
        radiusLg: '5px',
        borderW: '1px',
        shadow: 'none',
        display: 'var(--f-archivo)',
        text: 'var(--f-inter)',
    },

    logo: { mark: 'wave', style: 'plate' },

    hero: {
        kicker: 'Mankoli Naka, Bhiwandi',
        headline: 'A transit time you can plan around',
        sub: 'Part load and full truck across the west and south, with a transit time in writing.',
        primaryCta: 'Get a freight rate',
        secondaryCta: 'Where we are',
    },

    module: {
        type: 'tariff',
        ratePeriod: 'per consignment',
        title: 'Work out a freight rate',
        subtitle: 'Indicative, per tonne, for a part load out of Bhiwandi. Full truck is quoted separately against the actual vehicle.',
        unitLabel: 'tonnes',
        min: 1,
        max: 24,
        step: 1,
        options: [
            { id: 'pune', label: 'Pune', note: 'Same day, about 5 hours', rate: 1450 },
            { id: 'bengaluru', label: 'Bengaluru', note: 'Two days', rate: 3900 },
            { id: 'chennai', label: 'Chennai', note: 'Two to three days', rate: 4600 },
            { id: 'hyderabad', label: 'Hyderabad', note: 'Two days', rate: 3400 },
        ],
        addons: [
            { id: 'door', label: 'Door delivery', note: 'Per tonne, at destination', rate: 380 },
            { id: 'insure', label: 'Transit insurance', note: 'Per tonne, declared value', rate: 210 },
        ],
    },

    factsTitle: 'Routes and transit',
    factsLede: 'Per tonne, part load, out of Bhiwandi.',
    treatments: [
        { name: 'Bhiwandi to Pune', time: 'Same day', price: 'From Rs 1,450 a tonne' },
        { name: 'Bhiwandi to Hyderabad', time: '2 days', price: 'From Rs 3,400 a tonne' },
        { name: 'Bhiwandi to Bengaluru', time: '2 days', price: 'From Rs 3,900 a tonne' },
        { name: 'Bhiwandi to Chennai', time: '2 to 3 days', price: 'From Rs 4,600 a tonne' },
        { name: 'Full truck, 20 ft', time: 'By route', price: 'Quoted per trip' },
    ],

    process: [
        { title: 'Send the load', text: 'Weight, route and what it is. You get a rate and a transit time in writing.', when: 'Within the hour' },
        { title: 'Pickup', text: 'From your dock, or bring it to the yard at Mankoli Naka.', when: 'Same day before four' },
        { title: 'On the road', text: 'A tracking link when the truck leaves, not when you ask for it.', when: 'GPS on every vehicle' },
        { title: 'Delivered', text: 'Proof of delivery back to you the same day, and a call before the window closes if it is going to slip.', when: 'On arrival' },
    ],
    specGroups: [
        {
            label: 'Out of Bhiwandi',
            rows: [
                { name: 'Pune', value: 'Same day', note: 'About 5 hours' },
                { name: 'Hyderabad', value: '2 days', note: 'Overnight run' },
                { name: 'Bengaluru', value: '2 days', note: 'Two drivers' },
                { name: 'Chennai', value: '2 to 3 days', note: 'Depends on the Krishnagiri stretch' },
                { name: 'Kochi', value: '3 days', note: 'Via Bengaluru' },
            ],
        },
    ],

    /* Reference numbers carry a letter prefix and stay under twelve
       digits, because check-brand-leak hard-fails on a bare twelve-digit
       run and it is right to. */
    consignments: [
        {
            ref: 'ST-48219',
            route: 'Bhiwandi to Bengaluru',
            steps: [
                { at: 'Mon 08:10', where: 'Mankoli Naka', what: 'Picked up, 4.2 t on 6 pallets' },
                { at: 'Mon 14:40', where: 'Pune bypass', what: 'In transit' },
                { at: 'Tue 03:20', where: 'Belgaum', what: 'Driver change, running to time' },
                { at: 'Tue 16:05', where: 'Nelamangala', what: 'Out for delivery' },
            ],
        },
        {
            ref: 'ST-47903',
            route: 'Bhiwandi to Hyderabad',
            steps: [
                { at: 'Sun 19:30', where: 'Mankoli Naka', what: 'Picked up, 11 t full truck' },
                { at: 'Mon 06:15', where: 'Solapur', what: 'In transit' },
                { at: 'Mon 18:50', where: 'Patancheru', what: 'Delivered, POD signed' },
            ],
        },
    ],
    story: {
        title: 'How a booking runs',
        paragraphs: [
            'You get a transit time in writing when the booking is confirmed, not a range and not an estimate. Every vehicle carries GPS and the tracking link goes to you when the truck leaves rather than when you ask.',
            'If a load is going to be late, you are called before the delivery window closes rather than after. That is the whole difference and it is the only thing most customers actually want from a transporter.',
        ],
    },

    voicesTitle: 'From our shippers',
    faqTitle: 'Bookings and transit',
    voices: [
        {
            text: 'Two years and one late delivery, and they called me about it four hours before it was due rather than the next morning.',
            who: 'Deepak J',
            where: 'A garment exporter, Bhiwandi',
        },
        {
            text: 'The tracking link arrives when the truck leaves. I stopped having to chase anybody about a month in.',
            who: 'Farida M',
            where: 'Purchase, an electronics distributor',
        },
    ],

    faqs: [
        {
            q: 'What is the minimum load?',
            a: 'One tonne for a part load. Below that the handling costs more than the freight and a courier will serve you better, which we will say rather than take the booking.',
        },
        {
            q: 'How do I track a shipment?',
            a: 'A tracking link is sent when the vehicle leaves. Every truck carries GPS and the link updates without you having to ask anyone.',
        },
        {
            q: 'Is the load insured?',
            a: 'Transit insurance is optional and priced per tonne against declared value. Without it, our liability is limited to the standard carrier terms, which is much less than the value of most loads.',
        },
        {
            q: 'What if delivery is delayed?',
            a: 'You get a call before the window closes, with a revised time. Breakdowns and closures happen; not telling you about them is a choice, and not one we make.',
        },
    ],

    visit: {
        title: 'The yard',
        note: 'Gala 14 at Mankoli Naka, Bhiwandi. Loading runs from eight in the morning; the office is the building at the front of the yard.',
    },
};

export default logistics;
