/**
 * The Crust & Crumble, Indiranagar, Bengaluru. Entirely invented.
 *
 * WHAT IS DELIBERATELY ABSENT, AND WHY
 *
 * No phone number. Not fake, not masked. This page gets forwarded around
 * WhatsApp and a plausible Indian mobile on it means a real person starts
 * taking calls for a bakery that does not exist. Contact is an email at
 * .example, which RFC 2606 reserves as permanently unroutable.
 *
 * No star rating and no review count. Fictional testimonials are claims
 * about a fictional business, which is fine and which every real bakery
 * site has. "4.8 on Google, 342 reviews" is a claim about a THIRD PARTY's
 * data, which is a different thing and is not ours to invent.
 *
 * No FSSAI licence number. "FSSAI registered" as a phrase is fine; a
 * number belongs to a real business and inventing one is a real-world
 * claim on a page people share.
 *
 * No round vanity metrics. "Over 10,000 happy customers" is the
 * generated-marketing tell that makes a demo read as a template. The copy
 * uses concrete specifics instead, because that is what a real shop
 * sounds like.
 *
 * THIS RULE WAS NARROWED, NOT LIFTED. See the `proof` block below and the
 * header of content/demos/index.js. Quantified claims are now allowed,
 * because twenty-four businesses that never said how long they had traded
 * read as brochures rather than shops. What stayed banned is roundness:
 * "430+ weddings" is a count, "500+" is a slogan. scripts/check-demo-proof.mjs
 * enforces the difference, along with the arithmetic against `since`.
 */

const bakery = {
    slug: 'bakery',
    layout: 'editorial',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'standard' },
        { type: 'cart' },
        { type: 'bakeschedule', title: 'What comes out when' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    /* Decimal hours so the "now" marker can compare against the clock
       without parsing anything, same convention as business.hours. */
    bakeSlots: [
        { time: '6.30 am', from: 6.5, to: 8, what: 'First bread', note: 'Milk bread, country sourdough' },
        { time: '8.00 am', from: 8, to: 10, what: 'Butter buns', note: 'Usually gone by nine' },
        { time: '10.00 am', from: 10, to: 13, what: 'Croissants and rolls', note: 'Almond, cinnamon' },
        { time: '1.00 pm', from: 13, to: 16, what: 'Afternoon puffs', note: 'Veg, and the egg one on Fridays' },
        { time: '4.00 pm', from: 16, to: 21, what: 'Focaccia and tea cake', note: 'The last bake of the day' },
    ],

    proof: {
        line: 'Baking to the same recipes since 1998.',
        award: 'Best Filter Coffee Bun, Bengaluru Bakers Meet 2024',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'strip',
        landmark: 'Off the 12th Main junction, Indiranagar',
    },

    business: {
        name: 'The Crust & Crumble',
        tagline: 'A bakehouse on 12th Main',
        trade: 'Bakery',
        area: 'Indiranagar',
        city: 'Bengaluru',
        street: '412, 12th Main Road, Indiranagar',
        pin: '560038',
        email: 'orders@crustandcrumble.example',
        since: '1998',
        trust: ['FSSAI registered', 'Eggless on request', 'Same-day delivery nearby', 'Two ovens in 1998, nine now'],
        /* Decimal hours, so the live open/closed pill can compare against
           the clock without parsing anything. 6.5 is half past six. */
        hours: [
            { days: 'Monday to Saturday', open: 6.5, close: 21 },
            { days: 'Sunday', open: 6.5, close: 13 },
        ],
    },

    theme: {
        ink: '#381E11',
        paper: '#FFFBEB',
        accent: '#D97706',
        support: '#7A5C48',
        soft: '#F6EAD8',
        onAccent: '#FFFBEB',
        fill: '#381E11',
        onFill: '#FFFBEB',
        /* Soft and unbordered. This is the SHAPE and EDGE lock being
           deliberately broken inside demo scope: a bakery should not wear
           a warehouse's hard 3px edge. */
        radiusSm: '12px',
        radiusLg: '28px',
        borderW: '0px',
        shadow: '0 10px 30px rgba(56, 30, 17, 0.10)',
        display: 'var(--f-fraunces)',
        text: 'var(--f-work)',
    },

    logo: { mark: 'wheat', style: 'stamp' },

    hero: {
        kicker: 'Baking since half past five',
        headline: 'Bread that was flour this morning',
        sub: 'Sourdough, buns and cakes made to order. The morning batch is out by half past six.',
        primaryCta: 'See the counter',
        secondaryCta: 'Find us',
    },

    module: {
        type: 'cart',
        title: 'Today at the counter',
        subtitle: 'Add what you want and send the order straight to the shop.',
    },

    /* Prices are plain numbers so the cart can total them. Rendered with
       the Indian grouping helper in whatsapp.js. */
    menu: [
        {
            label: 'Breads',
            items: [
                { name: 'Country sourdough', note: 'Whole loaf, baked at five', price: 220 },
                { name: 'Milk bread', note: 'Soft, for toast', price: 90 },
                { name: 'Multigrain loaf', note: 'Five grains, seeded top', price: 180 },
                { name: 'Garlic focaccia', note: 'Rosemary and sea salt', price: 240 },
            ],
        },
        {
            label: 'Buns and pastries',
            items: [
                { name: 'Butter bun', note: 'Six to a box', price: 150 },
                { name: 'Almond croissant', note: 'Baked to order', price: 130 },
                { name: 'Cinnamon roll', note: 'Cream cheese glaze', price: 120 },
                { name: 'Veg puff', note: 'The afternoon batch', price: 45 },
            ],
        },
        {
            label: 'Cakes',
            items: [
                { name: 'Tea cake, half kilo', note: 'Orange or marble', price: 380 },
                { name: 'Chocolate truffle, half kilo', note: 'Eggless on request', price: 620 },
                { name: 'Birthday cake, one kilo', note: 'Order a day ahead', price: 1150 },
            ],
        },
    ],

    story: {
        title: 'The shop',
        paragraphs: [
            'We started in a two-oven kitchen behind the 12th Main junction in 1998, selling bread to the four shops on the same road. The ovens are bigger now and the road is busier, but the sourdough still takes eighteen hours and still gets shaped by hand.',
            'Everything is baked here, on the day you buy it. What does not sell by closing goes to the shelter on 80 Feet Road rather than back on the counter tomorrow.',
        ],
    },

    voicesTitle: 'Regulars',
    faqTitle: 'Before you come',
    voices: [
        {
            text: 'I have been buying the milk bread here since my children were small. They are grown and I still walk down on Sunday mornings.',
            who: 'Lakshmi R',
            where: 'Indiranagar',
        },
        {
            text: 'Ordered a birthday cake at two days notice and they got the lettering right in Kannada. It mattered to my mother more than the cake did.',
            who: 'Arun P',
            where: 'Domlur',
        },
        {
            text: 'The focaccia is the only thing my flatmate and I agree on.',
            who: 'Nisha K',
            where: 'HAL 2nd Stage',
        },
    ],

    faqs: [
        {
            q: 'Do you deliver?',
            a: 'Within about three kilometres, on the same day, if the order is in before four. Further than that we can arrange a pickup but it is usually easier to collect.',
        },
        {
            q: 'Can I get an eggless cake?',
            a: 'Yes, on every cake we make. Say so when you order. There is no extra charge and it does not change how long it takes.',
        },
        {
            q: 'How much notice do you need for a birthday cake?',
            a: 'A day for anything standard, two if you want writing, a photo print or a particular colour. Same-day is sometimes possible on a weekday morning if you ring first.',
        },
        {
            q: 'What time does the bread come out?',
            a: 'The first batch is on the counter by half past six. Sourdough and the multigrain come out around eight. The butter buns usually go before nine.',
        },
    ],

    visit: {
        title: 'Come and see',
        note: 'We are on 12th Main, two doors down from the pharmacy, with the blue awning. There is parking on the side road after nine.',
    },
};

export default bakery;
