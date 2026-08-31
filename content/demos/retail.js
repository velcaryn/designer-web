/**
 * Sri Murugan Supermarket, Tambaram, Chennai. Entirely invented.
 * A daily grocery shop: the cart module with everyday prices.
 */

const retail = {
    slug: 'retail',
    layout: 'catalogue',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'banner' },
        { type: 'cart' },
        { type: 'fresh', title: 'On the board this morning', lede: 'What came off the lorry before seven, and what it is going for. Vegetable prices move daily and these will too.', note: 'Written on the slate at the door every morning and copied here. If something has run out by evening, it has run out.' },
        { type: 'gallery', title: 'In the shop' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Weighing out rice and dal since 1994.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'pin',
        landmark: 'Two doors from Tambaram station',
    },

    business: {
        name: 'Sri Murugan Supermarket',
        tagline: 'Provisions and fresh, on Station Road',
        trade: 'Grocery shop',
        area: 'West Tambaram',
        city: 'Chennai',
        street: '31, Station Road, West Tambaram',
        pin: '600045',
        email: 'orders@srimurugansuper.example',
        since: '1994',
        trust: ['Same day delivery nearby', 'Fresh stock every morning', 'Monthly account for regulars', '32 years, two doors from the station'],
        hours: [
            { days: 'Monday to Saturday', open: 7, close: 21.5 },
            { days: 'Sunday', open: 7, close: 13 },
        ],
    },

    theme: {
        ink: '#06382B',
        paper: '#F7FDF9',
        accent: '#B45309',
        support: '#4A6B5D',
        soft: '#E2F3E9',
        onAccent: '#F7FDF9',
        fill: '#06382B',
        onFill: '#F7FDF9',
        radiusSm: '8px',
        radiusLg: '16px',
        borderW: '1px',
        shadow: '0 4px 14px rgba(6, 56, 43, 0.08)',
        display: 'var(--f-outfit)',
        text: 'var(--f-work)',
    },

    logo: { mark: 'leaf', style: 'plate' },

    hero: {
        kicker: 'Station Road, since 1994',
        headline: 'The list you send at nine, at your door by twelve',
        sub: 'Provisions, fresh vegetables and the brands you actually buy. Send the list, or walk in.',
        primaryCta: 'Start a list',
        secondaryCta: 'Find the shop',
    },

    produce: [
        { name: 'Tomato', price: 'Rs 32', unit: ' a kg' },
        { name: 'Onion, small', price: 'Rs 48', unit: ' a kg' },
        { name: 'Potato', price: 'Rs 34', unit: ' a kg' },
        { name: 'Drumstick', price: 'Rs 12', unit: ' each', tag: 'Good today' },
        { name: 'Brinjal', price: 'Rs 40', unit: ' a kg' },
        { name: 'Ladies finger', price: 'Rs 52', unit: ' a kg' },
        { name: 'Curry leaves', price: 'Rs 5', unit: ' a bunch' },
        { name: 'Coriander', price: 'Rs 10', unit: ' a bunch' },
        { name: 'Beans', price: 'Rs 68', unit: ' a kg', tag: 'Dearer this week' },
        { name: 'Carrot, Ooty', price: 'Rs 56', unit: ' a kg', tag: 'Good today' },
        { name: 'Banana, nendran', price: 'Rs 62', unit: ' a kg' },
        { name: 'Lemon', price: 'Rs 4', unit: ' each' },
    ],

    module: {
        type: 'cart',
        title: 'Today in the shop',
        subtitle: 'Add what you need and send the list. Someone will confirm what is in stock before it comes.',
    },

    factsTitle: 'What things cost',
    menu: [
        {
            label: 'Rice and provisions',
            items: [
                { name: 'Ponni boiled rice, 5 kg', note: 'The one most people take', price: 340 },
                { name: 'Toor dal, 1 kg', note: 'Loose, from the sack', price: 165 },
                { name: 'Groundnut oil, 1 litre', note: 'Cold pressed', price: 245 },
                { name: 'Pure cow ghee, 500 ml', note: 'From the Erode dairy', price: 340 },
            ],
        },
        {
            label: 'Fresh',
            items: [
                { name: 'Ooty carrots, 1 kg', note: 'In on Tuesday and Friday', price: 65 },
                { name: 'Tomatoes, 1 kg', note: 'Country variety', price: 40 },
                { name: 'Curry leaves, bunch', note: 'Cut this morning', price: 10 },
                { name: 'Bananas, dozen', note: 'Poovan', price: 60 },
            ],
        },
        {
            label: 'Household',
            items: [
                { name: 'Detergent powder, 1 kg', note: 'Whichever brand you use', price: 180 },
                { name: 'Dishwash bar, three', note: '', price: 60 },
                { name: 'Phenyl, 500 ml', note: '', price: 85 },
            ],
        },
    ],

    story: {
        title: 'The shop',
        paragraphs: [
            'Two doors from Tambaram station, open since 1994 and run by the same family. The fresh section is restocked before seven every morning, which is why the vegetables on Tuesday and Friday are worth coming for.',
            'Regulars keep a monthly account and settle at the end. It is written in a book, and the book has never once been wrong in a way that favoured the shop.',
        ],
    },

    voicesTitle: 'From the shop',
    faqTitle: 'Ordering and delivery',
    voices: [
        {
            text: 'I send the list at nine on my way to work and it is at my mother-in-law’s door by twelve. She has never once had to explain what she wanted twice.',
            who: 'Kavitha S',
            where: 'Chromepet',
        },
        {
            text: 'They called me to say the ghee I always buy was not in and asked whether I wanted the other one or would rather wait. Nobody does that.',
            who: 'Ramesh P',
            where: 'West Tambaram',
        },
        {
            text: 'The account book is in Tamil and my father can read it, which matters to him more than any app would.',
            who: 'Anitha V',
            where: 'Selaiyur',
        },
    ],

    faqs: [
        {
            q: 'How does delivery work?',
            a: 'Send the list before eleven and it goes out the same afternoon within about four kilometres. After eleven it goes the next morning. There is no charge above five hundred rupees.',
        },
        {
            q: 'What if something is out of stock?',
            a: 'You get a message before it is packed, asking whether you want an alternative or would rather leave it. Nothing is substituted without asking.',
        },
        {
            q: 'Can I open a monthly account?',
            a: 'Regulars, yes. Come in and ask. It is settled at the end of each month and it is written in a book rather than an app.',
        },
        {
            q: 'Are the vegetables really fresh?',
            a: 'Restocked before seven every morning. The Ooty stock comes Tuesday and Friday and is best on those days, which we will tell you if you ask on a Thursday.',
        },
    ],

    visit: {
        title: 'Finding the shop',
        note: 'Station Road, two doors from the West Tambaram station entrance, with the green shutter. Easiest on foot; the road is narrow and parking is on the side street.',
    },
};

export default retail;
