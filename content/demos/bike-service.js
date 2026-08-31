/**
 * Speedline Two Wheelers, Thoothukudi. Entirely invented.
 *
 * DELIBERATELY NOT THE CAR PAGE WITH SMALLER PRICES.
 *
 * A car goes in for the day and the owner books a slot. A bike is walk
 * in, wait, ride away, and the only question is how long the wait is. So
 * this page leads with a live board of what is on the ramps, and there is
 * no booking module at all. Same sector, different sale, different page.
 */

const bikeService = {
    slug: 'bike-service',
    layout: 'catalogue',

    sections: [
        { type: 'hero', variant: 'standard' },
        { type: 'jobboard', title: 'On the ramps right now' },
        { type: 'pricegrid' },
        { type: 'directory', title: 'What else we do' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Four ramps, running since 2015.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'strip',
        landmark: 'On Palayamkottai Road, before the flyover',
    },

    business: {
        name: 'Speedline Two Wheelers',
        tagline: 'Bike and scooter service',
        trade: 'Bike service',
        area: 'Palayamkottai Road',
        city: 'Thoothukudi',
        street: '112, Palayamkottai Road',
        pin: '628002',
        email: 'shop@speedlinetw.example',
        since: '2015',
        trust: ['Walk in, no appointment', 'Watch the work if you want', 'Genuine parts, bill itemised'],
        hours: [
            { days: 'Monday to Saturday', open: 9, close: 20 },
            { days: 'Sunday', open: 9, close: 14 },
        ],
    },

    theme: {
        ink: '#1A1206',
        paper: '#FFFBF5',
        accent: '#EA580C',
        support: '#6B5943',
        soft: '#F7EADB',
        onAccent: '#FFFBF5',
        fill: '#EA580C',
        onFill: '#1A1206',
        radiusSm: '10px',
        radiusLg: '18px',
        borderW: '0px',
        shadow: '0 6px 18px rgba(26, 18, 6, 0.10)',
        display: 'var(--f-outfit)',
        text: 'var(--f-figtree)',
    },

    logo: { mark: 'sprocket', style: 'stamp' },

    voicesTitle: 'From the riders',
    faqTitle: 'Waiting and charges',
    factsTitle: 'What a service costs',
    factsLede: 'Parts included, itemised on the bill. Nothing gets added without you being told first.',

    hero: {
        kicker: 'Palayamkottai Road, Thoothukudi',
        headline: 'Walk in, wait, ride away',
        sub: 'Bike and scooter service with no appointment. See what is on the ramps before you set off, and watch the work if you want to.',
        primaryCta: 'See the board',
        secondaryCta: 'Find the shop',
    },

    module: {
        type: 'jobboard',
        title: 'On the ramps right now',
        subtitle: 'What is being worked on and what is queued. Four ramps, and most jobs are done while you wait.',
    },

    /* Minutes per job; the board works out the queue from these. */
    jobs: [
        { what: 'General service', bike: 'Splendor', mins: 40 },
        { what: 'Brake shoes and cable', bike: 'Activa', mins: 30 },
        { what: 'Chain and sprocket set', bike: 'Pulsar 150', mins: 55 },
        { what: 'Puncture and balancing', bike: 'Jupiter', mins: 20 },
    ],

    prices: [
        {
            label: 'Service',
            items: [
                { name: 'General service, 100 to 125cc', time: 'About 40 minutes', price: 'Rs 650' },
                { name: 'General service, 150cc and above', time: 'About an hour', price: 'Rs 850' },
                { name: 'Scooter service', time: 'About 40 minutes', price: 'Rs 700' },
                { name: 'Engine oil, top brands', time: 'Included above', price: 'From Rs 380' },
            ],
        },
        {
            label: 'Common jobs',
            items: [
                { name: 'Chain and sprocket set', time: 'An hour', price: 'From Rs 1,450' },
                { name: 'Brake shoes, pair', time: 'Half an hour', price: 'From Rs 480' },
                { name: 'Puncture, tubeless', time: 'Twenty minutes', price: 'Rs 120' },
                { name: 'Battery replaced', time: 'Same visit', price: 'From Rs 1,600' },
            ],
        },
    ],

    directory: [
        { name: 'Engine work', lead: 'All two wheelers', text: 'Piston, clutch plates, carburettor cleaning and the tappet noise that appears after twenty thousand kilometres.', when: 'Half a day' },
        { name: 'Electrical', lead: 'Self start, lights, horn', text: 'Battery, starter motor, wiring and the indicator that only works when it rains.', when: 'Same visit' },
        { name: 'Tyres and wheels', lead: 'Fitted and balanced', text: 'Tubeless and tube tyres in stock for common models, fitted and balanced while you wait.', when: 'Twenty minutes' },
        { name: 'Wash and polish', lead: 'While you wait', text: 'Foam wash, chain lubrication and polish. Done after a service unless you say otherwise.', when: 'Twenty minutes' },
    ],

    story: {
        title: 'How the shop runs',
        paragraphs: [
            'Four ramps and six mechanics, open till eight so you can come after work. There is no appointment system because a bike service takes forty minutes and a booking would only make you wait longer somewhere else.',
            'You are welcome to stand and watch the work. Most people do, and the mechanics are used to explaining what they are doing while they do it.',
        ],
    },

    voices: [
        {
            text: 'I came at half past six after work, was on a ramp in fifteen minutes and rode home by half past seven.',
            who: 'Arun P',
            where: 'Thoothukudi',
        },
        {
            text: 'They showed me the worn chain and let me decide. The last shop replaced it and told me afterwards.',
            who: 'Sathish K',
            where: 'Millerpuram',
        },
        {
            text: 'My mother takes her scooter there alone and nobody talks over her head about it. That matters more than the price.',
            who: 'Divya M',
            where: 'Bryant Nagar',
        },
    ],

    faqs: [
        {
            q: 'Do I need to book?',
            a: 'No, and there is no booking system. Walk in any time. The board on this page shows what is on the ramps so you can judge the wait before setting off.',
        },
        {
            q: 'How long will it take?',
            a: 'A general service is about forty minutes on the ramp, plus whatever is queued ahead of you. Most people wait rather than come back.',
        },
        {
            q: 'Are the parts genuine?',
            a: 'Genuine or a named equivalent, and the bill says which. If you want the company part specifically, say so and we will fit it or order it.',
        },
        {
            q: 'Can I watch the work?',
            a: 'Yes, and most people do. Stand at the ramp and ask questions; the mechanics are used to it.',
        },
    ],

    visit: {
        title: 'The shop',
        note: 'Palayamkottai Road, opposite the bus stand side road, the yellow shutter with four ramps. Parking in front, and the tea shop next door is where most people wait.',
    },
};

export default bikeService;
