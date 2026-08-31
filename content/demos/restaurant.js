/**
 * Dakshin Aromas, T. Nagar, Chennai. Entirely invented.
 *
 * Same absences as every demo and for the same reasons: no phone number,
 * no star rating, no review count, no FSSAI licence number, no round
 * vanity metrics. See content/demos/bakery.js for the full reasoning.
 *
 * WHAT THIS ONE PROVES
 *
 * The editorial layout with a booking module rather than a cart, and a
 * palette dark enough to check that the token contract holds when ink and
 * paper are close together. The menu carries a `veg` flag because an
 * Indian restaurant site that does not mark vegetarian dishes is not a
 * realistic Indian restaurant site.
 */

const restaurant = {
    slug: 'restaurant',
    layout: 'editorial',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'fullbleed' },
        { type: 'booking' },
        { type: 'menu', title: 'What the kitchen sends out' },
        { type: 'gallery', title: 'The room' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'The same kitchen, the same recipes, since 2006.',
        award: "Chef's Choice, Chennai Regional Food Festival 2023",
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'strip',
        landmark: 'Thanikachalam Road, two streets off Usman Road',
    },

    business: {
        name: 'Dakshin Aromas',
        tagline: 'Chettinad and coastal, since 2006',
        trade: 'Restaurant',
        area: 'T. Nagar',
        city: 'Chennai',
        street: '27, Thanikachalam Road, T. Nagar',
        pin: '600017',
        email: 'tables@dakshinaromas.example',
        since: '2006',
        trust: ['FSSAI registered', 'Pure veg kitchen separate', 'Parking behind the building', 'The same kuzhambu for 20 years'],
        hours: [
            { days: 'Monday to Saturday', open: 12, close: 15.5 },
            { days: 'Sunday', open: 12, close: 16 },
        ],
    },

    theme: {
        ink: '#180D07',
        paper: '#FFF7ED',
        accent: '#EA580C',
        support: '#7C5A45',
        soft: '#FDE7D3',
        onAccent: '#FFF7ED',
        fill: '#EA580C',
        onFill: '#FFF7ED',
        radiusSm: '6px',
        radiusLg: '10px',
        borderW: '1px',
        shadow: '0 6px 18px rgba(24, 13, 7, 0.12)',
        display: 'var(--f-bodoni)',
        text: 'var(--f-jost)',
    },

    logo: { mark: 'mortar', style: 'plate' },

    hero: {
        kicker: 'Lunch from twelve, dinner from seven',
        headline: 'The Chettinad your grandmother argued about',
        sub: 'Pepper, stone-ground masala, and a kuzhambu the kitchen has not changed since 2006.',
        primaryCta: 'Book a table',
        secondaryCta: 'See the menu',
    },

    module: {
        type: 'booking',
        legends: { day: 'Which day', time: 'Which sitting', size: 'How many of you', note: 'Seating' },
        title: 'Book a table',
        subtitle: 'Tell us when and how many. The kitchen holds it for fifteen minutes past the time.',
        what: 'a table',
        slots: ['12.30 pm', '1.15 pm', '2.00 pm', '7.30 pm', '8.15 pm', '9.00 pm'],
        sizes: ['2 people', '4 people', '6 people', 'More than 6'],
        preferences: ['No preference', 'Air conditioned', 'Near the window', 'Quiet corner'],
    },

    menu: [
        {
            label: 'From the Chettinad kitchen',
            items: [
                { name: 'Chicken Chettinad', note: 'Roasted spice, thick gravy', price: 380, veg: false, heat: 3 },
                { name: 'Nattu kozhi kuzhambu', note: 'Country chicken, slow cooked', price: 420, veg: false, heat: 2 },
                { name: 'Kadai mushroom', note: 'From the separate kitchen', price: 290, veg: true, heat: 2 },
                { name: 'Vellai paniyaram', note: 'Six to a plate', price: 160, veg: true, heat: 0 },
            ],
        },
        {
            label: 'From the coast',
            items: [
                { name: 'Meen kuzhambu', note: 'Seer fish, tamarind, curry leaf', price: 460, veg: false, heat: 3 },
                { name: 'Prawn thokku', note: 'Dry, heavy on pepper', price: 490, veg: false, heat: 3 },
                { name: 'Crab masala', note: 'Ask what came in today', price: 620, veg: false, heat: 2, sold: 'Limited' },
            ],
        },
        {
            label: 'Rice and breads',
            items: [
                { name: 'Ghee rice', note: 'Short grain, fried onion', price: 180, veg: true, heat: 0 },
                { name: 'Parotta, two', note: 'Layered, made to order', price: 90, veg: true, heat: 0 },
                { name: 'Curd rice', note: 'With the pickle from Karaikudi', price: 140, veg: true, heat: 0 },
            ],
        },
    ],

    story: {
        title: 'The kitchen',
        paragraphs: [
            'Kamala Ammal cooked in Karaikudi for thirty years before her son opened this room on Thanikachalam Road in 2006. The masala is still stone-ground in the back, in the same quantities, on the same two days a week.',
            'The pure vegetarian kitchen is a separate room with separate pans and separate staff. That was not a marketing decision; it was the condition on which her sister agreed to cook here.',
        ],
    },

    voicesTitle: 'What people say after',
    faqTitle: 'Before you book',
    voices: [
        {
            text: 'I brought my father, who is from Karaikudi and has opinions. He ate without saying anything, which from him is the highest possible review.',
            who: 'Deepa S',
            where: 'Mylapore',
        },
        {
            text: 'The meen kuzhambu is the only one in this city that tastes like the one at home. I have tested this claim extensively.',
            who: 'Rajesh V',
            where: 'Adyar',
        },
        {
            text: 'Booked for eight people at short notice for my mother-in-law. They moved two tables together and nobody made it awkward.',
            who: 'Priya M',
            where: 'Nungambakkam',
        },
    ],

    faqs: [
        {
            q: 'Do I need to book?',
            a: 'On a weekday lunch, usually not. Friday and Saturday evenings, yes, or you will be standing outside. Sunday afternoon is the busiest hour of the week.',
        },
        {
            q: 'Is the vegetarian food cooked separately?',
            a: 'Completely. Separate room, separate pans, separate staff. Nothing crosses between the two kitchens.',
        },
        {
            q: 'How spicy is the Chettinad?',
            a: 'Genuinely spicy, because that is what it is. Tell the server when you order and the kitchen will bring it down, though the pepper is the point of the dish.',
        },
        {
            q: 'Can you do a large group?',
            a: 'Up to about sixteen if you tell us a day ahead. Beyond that the room does not really work and we will say so rather than seat you badly.',
        },
    ],

    visit: {
        title: 'Finding us',
        note: 'On Thanikachalam Road, past the saree shop with the green board. The entrance is the narrow one; parking is behind the building, in through the side gate.',
    },
};

export default restaurant;
