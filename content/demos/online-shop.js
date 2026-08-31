/**
 * Kavira Silks, Kanchipuram. Entirely invented.
 *
 * WHAT THIS ONE PROVES
 *
 * The catalogue layout with a cart, and a palette at the saturated end.
 * A saree shop sells on looks, so this demo leans hardest on the CSS art:
 * each product is a drawn drape in its own colours rather than a
 * photograph, which is the only honest option when the CSP forbids
 * external images and we have no product photography to license.
 */

const onlineShop = {
    slug: 'online-shop',
    layout: 'catalogue',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'banner' },
        { type: 'cart' },
        { type: 'process', title: 'Ordering' },
        { type: 'weavers', title: 'Who wove it', lede: 'Six pieces on the shelf this week, and the loom each came off. This is what you are paying for.', note: 'Zari is tested by burning a thread from the fall. We will do it in front of you before you buy, and we would rather you asked.' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Weaving and selling Kanchipuram silk since 1987.',
        award: 'Heritage Weave Citation, Kanchi Handloom Society 2022',
    },

    business: {
        name: 'Kavira Silks',
        tagline: 'Handloom from the Kanchipuram looms',
        trade: 'Online shop',
        area: 'Pillaiyarpalayam',
        city: 'Kanchipuram',
        street: '9, Weavers Colony, Pillaiyarpalayam',
        pin: '631502',
        email: 'orders@kavirasilks.example',
        since: '1987',
        trust: ['Silk mark on every piece', 'Woven on our own looms', 'Exchange within seven days'],
        hours: [
            { days: 'Monday to Saturday', open: 10, close: 20 },
            { days: 'Sunday', open: 10, close: 14 },
        ],
    },

    theme: {
        ink: '#4A0404',
        paper: '#FFFDF7',
        accent: '#B8860B',
        support: '#7C4A4A',
        soft: '#F7EFDC',
        onAccent: '#FFFDF7',
        fill: '#4A0404',
        onFill: '#FFFDF7',
        radiusSm: '4px',
        radiusLg: '8px',
        borderW: '1px',
        shadow: '0 6px 20px rgba(74, 4, 4, 0.10)',
        display: 'var(--f-dmserif)',
        text: 'var(--f-jost)',
    },

    logo: { mark: 'thread', style: 'lockup' },

    hero: {
        kicker: 'Woven in Kanchipuram since 1987',
        headline: 'Silk with the weaver’s name on the label',
        sub: 'Pure mulberry silk, tested zari, woven on our own looms. Every piece names its weaver.',
        primaryCta: 'See the collection',
        secondaryCta: 'Visit the shop',
    },

    pieces: [
        { piece: 'Korvai silk, deep maroon with a mustard border', price: 'Rs 28,500', weaver: 'Chandran and his son Arun', loom: 'Pit loom 3, Pillaiyarpalayam', days: '18 days', zari: 'Half fine, tested', note: 'Korvai means the border is woven separately and interlocked by hand. It is the join you can feel with a thumbnail.' },
        { piece: 'Plain mulberry with a temple border', price: 'Rs 16,200', weaver: 'Saroja', loom: 'Pit loom 7, Pillaiyarpalayam', days: '11 days', zari: 'Half fine, tested' },
        { piece: 'Bridal, full contrast pallu', price: 'Rs 64,000', weaver: 'Chandran, Arun and Vetri', loom: 'Pit looms 3 and 4', days: '41 days', zari: 'Pure, tested', note: 'Three weavers, two looms, and the pallu joined last. This is the only piece on the list with pure zari.' },
        { piece: 'Light silk, everyday weight', price: 'Rs 9,800', weaver: 'Malathi', loom: 'Pit loom 11, Sevilimedu', days: '7 days', zari: 'Half fine, tested' },
        { piece: 'Checked, self border', price: 'Rs 12,400', weaver: 'Ravi', loom: 'Pit loom 9, Sevilimedu', days: '9 days', zari: 'Half fine, tested' },
        { piece: 'Butta work, small motifs throughout', price: 'Rs 34,000', weaver: 'Saroja and Malathi', loom: 'Pit loom 7', days: '26 days', zari: 'Half fine, tested', note: 'Every motif is a separate operation. The day count is why butta costs what it does.' },
    ],

    module: {
        type: 'cart',
        title: 'The collection',
        subtitle: 'Add what you like and send the list to the shop. Someone will confirm what is on the shelf today.',
    },

    menu: [
        {
            label: 'Bridal',
            items: [
                { name: 'Korvai bridal, deep maroon', note: 'Contrast border, heavy zari', price: 42000, art: 'maroon' },
                { name: 'Temple border, arakku red', note: 'Traditional rudraksham motif', price: 38500, art: 'red' },
                { name: 'Mubbagam, mustard and green', note: 'Three shades, joined by hand', price: 46000, art: 'mustard' },
            ],
        },
        {
            label: 'Everyday silk',
            items: [
                { name: 'Plain body, thin border', note: 'Light enough for a full day', price: 9800, art: 'teal' },
                { name: 'Checked kattam, indigo', note: 'Small check, silver zari', price: 12500, art: 'indigo' },
                { name: 'Butta work, sandal', note: 'Scattered motif across the body', price: 14200, art: 'sandal' },
            ],
        },
        {
            label: 'Blouse and accessories',
            items: [
                { name: 'Matching blouse piece', note: 'Unstitched, 0.8 metre', price: 1400, art: 'plain' },
                { name: 'Silk cotton dupatta', note: 'For everyday wear', price: 2200, art: 'plain' },
            ],
        },
    ],

    process: [
        { title: 'Look, or ask', text: 'Browse the collection, or send us what you are looking for and a budget.', when: 'Reply the same day' },
        { title: 'See it properly', text: 'Ask for a video call and someone will walk the piece to the window. A photograph never gets silk right.', when: 'Any working hour' },
        { title: 'Order and pay', text: 'On WhatsApp, with the weaver named on the card that comes with it.', when: 'Ships next day' },
        { title: 'Seven days', text: 'Exchange if the colour is not what you saw, unworn and with the tag on.', when: 'From delivery' },
    ],
    story: {
        title: 'The looms',
        paragraphs: [
            'Fourteen looms in Pillaiyarpalayam, and eleven of the weavers have been with the family for more than a decade. A bridal korvai takes about three weeks on the loom, longer if the border is a joined one, because the body and the border are woven separately and interlocked by hand.',
            'The zari is tested and the silk carries the Silk Mark. If a piece does not, it is not sold as pure silk, which sounds obvious and is not universal.',
        ],
    },

    voicesTitle: 'What buyers tell us',
    faqTitle: 'Ordering, sizing and returns',
    voices: [
        {
            text: 'My daughter’s wedding saree came with a card naming the weaver. She wrote to him. He wrote back.',
            who: 'Vasantha K',
            where: 'Chennai',
        },
        {
            text: 'Ordered from Dubai, arrived in nine days, exactly the colour on the screen. The second one I ordered on trust and it was right too.',
            who: 'Shalini P',
            where: 'Dubai',
        },
        {
            text: 'I went to exchange a blouse piece and they remembered which saree it was for.',
            who: 'Revathi S',
            where: 'Kanchipuram',
        },
    ],

    faqs: [
        {
            q: 'Is the silk genuine?',
            a: 'Every piece carries the Silk Mark, which is the Central Silk Board’s test for pure mulberry silk. The zari is tested separately. Anything not pure silk is sold as what it is.',
        },
        {
            q: 'Can I see it before buying?',
            a: 'Come to the shop in Pillaiyarpalayam if you can. If you cannot, ask for a video call and someone will walk the piece to the window and show you the colour in daylight, which a photograph will never get right.',
        },
        {
            q: 'Do you deliver outside India?',
            a: 'Yes, and it usually takes seven to twelve days. Customs is yours to settle at your end and we will send whatever documentation your courier asks for.',
        },
        {
            q: 'What if it is the wrong colour?',
            a: 'Exchange within seven days of it reaching you, unworn and with the tag on. Colours do read differently on a screen and we would rather exchange it than argue about it.',
        },
    ],

    visit: {
        title: 'The shop',
        note: 'Weavers Colony in Pillaiyarpalayam, the building with the blue gate. If you are coming from Chennai it is easier to call ahead so someone can bring pieces down before you arrive.',
    },
};

export default onlineShop;
