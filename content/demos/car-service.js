/**
 * Sri Balaji Auto Care, Tirunelveli. Entirely invented.
 *
 * A car service centre sells on two things: a price agreed before the
 * bonnet opens, and not losing your day to it. So the page leads with
 * fixed-price packages and a booking that includes pickup and drop.
 *
 * The bike demo deliberately does NOT share this shape. A bike service is
 * walk in, wait, ride away, so that page leads with a live job board
 * instead of a booking form. Two demos in one sector must not be the same
 * page with different prices.
 */

const carService = {
    slug: 'car-service',
    layout: 'clinical',

    sections: [
        { type: 'hero', variant: 'banner' },
        { type: 'pricegrid' },
        { type: 'due', title: 'What is due on your car', lede: 'Put in roughly what the odometer reads and see which service falls next, and what it covers.', note: 'Bands are indicative and assume nothing is already wrong. Anything found on inspection is quoted and approved by you before a spanner touches it.' },
        { type: 'booking' },
        { type: 'directory', title: 'Other work we take' },
        { type: 'process', title: 'How a service day goes' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Servicing every make on the road since 2007.',
        award: 'Workshop of the Year, Nellai Motor Traders Association 2024',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'strip',
        landmark: 'Madurai Road, opposite the bus stand side',
    },

    business: {
        name: 'Sri Balaji Auto Care',
        tagline: 'Multi-brand car service',
        trade: 'Car service centre',
        area: 'Vannarpettai',
        city: 'Tirunelveli',
        street: '44, Madurai Road, Vannarpettai',
        pin: '627003',
        email: 'service@sribalajiauto.example',
        since: '2007',
        trust: ['Free pickup and drop', 'Estimate before we start', 'Old parts returned to you'],
        hours: [
            { days: 'Monday to Saturday', open: 8.5, close: 19.5 },
            { days: 'Sunday', open: 9, close: 13 },
        ],
    },

    theme: {
        ink: '#111827',
        paper: '#F8FAFC',
        accent: '#DC2626',
        support: '#4B5563',
        soft: '#E7EAEF',
        onAccent: '#F8FAFC',
        fill: '#111827',
        onFill: '#F8FAFC',
        radiusSm: '3px',
        radiusLg: '6px',
        borderW: '1px',
        shadow: 'none',
        display: 'var(--f-archivo)',
        text: 'var(--f-inter)',
    },

    logo: { mark: 'gauge', style: 'plate' },

    voicesTitle: 'From the people who bring their cars here',
    faqTitle: 'Service and charges',
    factsTitle: 'Service packages',
    factsLede: 'Fixed price, parts included. If something else needs doing you get a call with the price before we touch it.',

    hero: {
        kicker: 'Madurai Road, since 2007',
        headline: 'A price before the bonnet opens',
        sub: 'Multi-brand car service with free pickup and drop in Tirunelveli. Fixed-price packages, and a call before any extra work.',
        primaryCta: 'See the packages',
        secondaryCta: 'Book a slot',
    },

    module: {
        type: 'booking',
        title: 'Book a service',
        subtitle: 'Pick a day and we will collect the car. Most services go back the same evening.',
        what: 'a service',
        legends: { day: 'Which day', time: 'Pickup window', size: 'What is due', note: 'Anything to mention' },
        slots: ['8.30 to 10 am', '10 am to 12', '12 to 2 pm', 'I will drop it myself'],
        sizes: ['Periodic service', 'General check', 'AC service', 'Something is wrong'],
        preferences: ['Nothing in particular', 'A noise I want checked', 'Due for insurance', 'Going on a long drive'],
    },

    /* Indicative bands against the odometer, never a firm quote: see the
       header of components/demo/sections/ServiceInterval.js. Four rows,
       so the cycle repeats every 40,000 km. */
    intervals: [
        { name: 'Interim service', price: 'From Rs 2,400', includes: ['Engine oil and oil filter', 'Air filter cleaned or replaced', 'Fluid levels topped up', '20 point visual check', 'Tyre pressure and rotation'] },
        { name: 'Full service', price: 'From Rs 4,600', includes: ['Everything in the interim service', 'Fuel filter and cabin filter', 'Brake pads inspected and cleaned', 'Coolant checked, topped or flushed', 'Battery and charging test'] },
        { name: 'Interim service', price: 'From Rs 2,400', includes: ['Engine oil and oil filter', 'Air filter cleaned or replaced', 'Fluid levels topped up', '20 point visual check', 'Wheel alignment checked'] },
        { name: 'Major service', price: 'From Rs 8,900', includes: ['Everything in the full service', 'Spark plugs, or diesel injector check', 'Brake fluid replaced', 'Transmission oil checked', 'Suspension and steering inspection', 'Timing belt inspected, replaced if due'] },
    ],

    prices: [
        {
            label: 'Periodic service, parts included',
            items: [
                { name: 'Hatchback', time: 'Oil, filters, 20 point check', price: 'Rs 3,800' },
                { name: 'Sedan', time: 'Oil, filters, 20 point check', price: 'Rs 4,600' },
                { name: 'SUV', time: 'Oil, filters, 20 point check', price: 'Rs 5,900' },
                { name: 'Diesel, any size', time: 'Add for diesel', price: 'Plus Rs 900' },
            ],
        },
        {
            label: 'Common jobs',
            items: [
                { name: 'Brake pads, front', time: 'Two hours', price: 'From Rs 2,400' },
                { name: 'AC service', time: 'Half a day', price: 'Rs 2,800' },
                { name: 'Wheel alignment and balancing', time: 'An hour', price: 'Rs 1,100' },
                { name: 'Battery replaced', time: 'Same visit', price: 'From Rs 4,200' },
            ],
        },
    ],

    directory: [
        { name: 'Engine and mechanical', lead: 'All brands', text: 'Clutch, suspension, timing belt and the noises that only happen when you are not at the garage.', when: 'Quoted after inspection' },
        { name: 'Electrical and AC', lead: 'Diagnostics on site', text: 'Battery, alternator, wiring faults and AC gas, with a scanner rather than guesswork.', when: 'Same day usually' },
        { name: 'Denting and painting', lead: 'Booth on site', text: 'Panel work and paint matched to your shade code, not to the nearest tin.', when: 'Two to four days' },
        { name: 'Insurance claims', lead: 'Cashless for most insurers', text: 'We deal with the surveyor and the paperwork. You pay only the excess.', when: 'Three to seven days' },
    ],

    process: [
        { title: 'Book, or just arrive', text: 'A message with your car and what is due is enough. Free pickup within Tirunelveli city.', when: 'Same or next day' },
        { title: 'Inspection first', text: 'Before any work, a check and a written estimate on WhatsApp. Nothing starts until you say yes.', when: 'Within the hour' },
        { title: 'The work', text: 'A photograph of anything we replace. Old parts go back in the boot so you can see what came off.', when: 'Same day, mostly' },
        { title: 'Dropped back', text: 'Washed, with the bill itemised into parts and labour. No line item you have not already agreed.', when: 'Evening' },
    ],

    voices: [
        {
            text: 'They rang about a suspension bush before doing it, sent a photograph, and waited for me to say yes. The last place added things and told me at the counter.',
            who: 'Vignesh S',
            where: 'Palayamkottai',
        },
        {
            text: 'Pickup at nine, back by seven, washed, and the bill was the estimate. Three years of this now.',
            who: 'Meena R',
            where: 'Vannarpettai',
        },
        {
            text: 'The old parts came back in the boot. My father, who does not trust any garage, was satisfied.',
            who: 'Karthik B',
            where: 'Tirunelveli Town',
        },
    ],

    faqs: [
        {
            q: 'Is pickup and drop really free?',
            a: 'Within Tirunelveli city, yes, for any booked service. Further out we will tell you the charge when you book rather than adding it to the bill.',
        },
        {
            q: 'What if something else needs doing?',
            a: 'You get a call and a photograph with the price, before it is touched. If you say no, we do not do it and it does not appear on the bill.',
        },
        {
            q: 'Will servicing here void my warranty?',
            a: 'No. A manufacturer cannot void a warranty because you serviced elsewhere, provided the schedule is followed and genuine parts are used. We keep the records to prove both.',
        },
        {
            q: 'Do you handle insurance claims?',
            a: 'Cashless with most insurers. We deal with the surveyor and you pay the excess. Ask before you leave the car so we can raise it the same day.',
        },
    ],

    visit: {
        title: 'The workshop',
        note: 'Madurai Road at Vannarpettai, the yard behind the fuel station. Six bays and a paint booth. You are welcome to wait; there is a room with a fan and tea.',
    },
};

export default carService;
