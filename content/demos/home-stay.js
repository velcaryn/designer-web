/**
 * Misty Pines, Coonoor. Entirely invented.
 *
 * Same absences as every demo: no phone number, no star rating, no review
 * count, no licence numbers, no round vanity metrics. See
 * content/demos/bakery.js for the full reasoning.
 *
 * The tariff module here prices room nights rather than pallet positions,
 * which is the second use of that component and the reason it takes its
 * labels and rates from data rather than knowing what it is pricing.
 */

const homeStay = {
    slug: 'home-stay',
    layout: 'editorial',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'fullbleed' },
        { type: 'rooms' },
        { type: 'gallery', title: 'The place' },
        { type: 'tariff' },
        { type: 'process', title: 'How a stay works' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Four rooms above the tea slopes since 2009.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'card',
        landmark: 'Hubbathalai, above the tea slopes',
        direction: 'Signal drops on the last stretch, so open the map before you leave Coonoor.',
    },

    business: {
        name: 'Misty Pines',
        tagline: 'A plantation bungalow above Coonoor',
        trade: 'Home stay',
        area: 'Hubbathalai',
        city: 'Coonoor, Nilgiris',
        street: 'Misty Pines Estate, Hubbathalai Road',
        pin: '643101',
        email: 'stay@mistypines.example',
        since: '2009',
        trust: ['Four rooms only', 'All meals included', 'Estate walk every morning'],
        hours: [
            { days: 'Check in', open: 13, close: 19 },
            { days: 'Sunday', open: 13, close: 19 },
        ],
    },

    theme: {
        ink: '#062C22',
        paper: '#F4FBF6',
        accent: '#8C5A21',
        support: '#4E6B5C',
        soft: '#DFF0E4',
        onAccent: '#F4FBF6',
        fill: '#062C22',
        onFill: '#F4FBF6',
        radiusSm: '10px',
        radiusLg: '22px',
        borderW: '0px',
        shadow: '0 12px 32px rgba(6, 44, 34, 0.12)',
        display: 'var(--f-fraunces)',
        text: 'var(--f-work)',
    },

    logo: { mark: 'leaf', style: 'stamp' },

    hero: {
        kicker: 'Fourteen acres above the Hubbathalai valley',
        headline: 'Four rooms, and the rest is tea bushes',
        sub: 'A working plantation bungalow at six thousand feet. No television, no pool, and mist by four.',
        primaryCta: 'Work out a tariff',
        secondaryCta: 'Getting here',
    },

    module: {
        type: 'tariff',
        ratePeriod: 'per stay',
        title: 'What a stay costs',
        subtitle: 'Per room per night, all meals included. Two night minimum, and the whole bungalow can be taken for a family.',
        unitLabel: 'nights',
        min: 2,
        max: 14,
        step: 1,
        options: [
            { id: 'garden', label: 'Garden room', note: 'Two people, opens onto the lawn', rate: 6500 },
            { id: 'valley', label: 'Valley room', note: 'Two people, the view everyone wants', rate: 8200 },
            { id: 'whole', label: 'Whole bungalow', note: 'Four rooms, up to eight people', rate: 26000 },
        ],
        addons: [
            { id: 'pickup', label: 'Pickup from Coonoor station', note: 'Each way', rate: 900 },
            { id: 'guide', label: 'Guided estate walk', note: 'Per day, with the manager', rate: 1200 },
        ],
    },

    process: [
        { title: 'Ask about a date', text: 'Two nights minimum, three over a long weekend. We will say if it is worth the drive.', when: 'Reply the same day' },
        { title: 'Getting up here', text: 'Forty minutes from Coonoor town, the last two kilometres on estate road.', when: 'Come in daylight' },
        { title: 'Settling in', text: 'Check in from one. Tea whenever you want it, and dinner at eight on one table.', when: 'From 1 pm' },
        { title: 'The estate walk', text: 'Every morning with the manager, through the drying shed if you want.', when: 'After breakfast' },
    ],
    rooms: [
        { name: 'Garden room', sleeps: 'Two', text: 'Opens onto the lawn. The mist reaches this side first.', has: ['Fireplace', 'Hot water', 'Tea tray'], rate: 'Rs 6,500', per: 'a night, all meals' },
        { name: 'Valley room', sleeps: 'Two', text: 'The view everyone asks for. Two windows, both facing the drop.', has: ['Fireplace', 'Bay window', 'Writing desk'], rate: 'Rs 8,200', per: 'a night, all meals' },
        { name: 'The whole house', sleeps: 'Up to eight', text: 'Four rooms and the dining table to yourselves.', has: ['Four rooms', 'Private cook', 'Bonfire'], rate: 'Rs 26,000', per: 'a night, all meals' },
    ],

    seasons: [
        { when: 'April to June', what: 'Warmest, and the busiest. Book a month ahead.' },
        { when: 'July to September', what: 'Rain most afternoons. The estate is greenest and the house is quietest.' },
        { when: 'October to March', what: 'Cold at night, clear in the morning. Fireplaces lit from November.' },
    ],
    story: {
        title: 'The house',
        paragraphs: [
            'The bungalow was built in 1928 for the estate manager and has been in the family since 1974. The tea is still picked and sold; the four rooms came later, mostly because people kept asking to stay.',
            'Meals are whatever the kitchen is cooking, eaten together at one table at half past eight, one and eight. If you want something else, say so in the morning and it can usually be arranged. The kitchen does not do room service and the dining room does not have a menu.',
        ],
    },

    voicesTitle: 'Guest notes',
    faqTitle: 'Staying with us',
    voices: [
        {
            text: 'We came for two nights and stayed five. The mist arrives at four and everyone stops whatever they were doing to watch it, including the staff, who have presumably seen it before.',
            who: 'Anand and Ritu',
            where: 'Bengaluru',
        },
        {
            text: 'No television is the point, not an oversight. My children complained for one evening and then found the dog.',
            who: 'Sneha T',
            where: 'Chennai',
        },
        {
            text: 'The manager walked us through the drying shed and explained the whole process without once making it a sales pitch.',
            who: 'Michael D',
            where: 'Pune',
        },
    ],

    faqs: [
        {
            q: 'Is there a minimum stay?',
            a: 'Two nights, and three over a long weekend. It is a long drive up for one night and most people regret it.',
        },
        {
            q: 'What is included?',
            a: 'The room, all three meals, tea whenever you want it, and the morning estate walk. Pickup from the station and a guided walk with the manager are extra.',
        },
        {
            q: 'Is there phone signal?',
            a: 'Patchy, and better on the lawn than indoors. There is wifi in the main house that is adequate for messages and not for anything else. This is not something we are planning to fix.',
        },
        {
            q: 'Can we bring children?',
            a: 'Yes, and there is a dog who will find them. There is no fence at the valley end of the lawn, so small children need watching.',
        },
    ],

    visit: {
        title: 'Getting here',
        note: 'About forty minutes up from Coonoor town, the last two kilometres on estate road. Come in daylight the first time. Pickup from the station is easier than describing the turning.',
    },
};

export default homeStay;
