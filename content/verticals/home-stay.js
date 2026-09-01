/**
 * VelBiz's own pitch to a home stay, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 */

export default {
    slug: 'home-stay',
    trade: 'Home stay',
    demoSlug: 'home-stay',

    metaTitle: 'Website for a Home Stay',
    metaDescription:
        'A website for a home stay: room tariffs stated clearly, an availability check without a phone call, and a page that sells the actual place rather than a generic booking listing. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your home stay',
    intro:
        "A home stay is chosen on atmosphere as much as price, which a listing on a booking platform cannot show. We build a page that is actually yours: your own photos, your own tariffs by room, and a way for a guest to check dates and enquire directly, without a platform's commission sitting in the middle.",

    needs: [
        {
            name: 'Room tariffs, stated clearly by room type',
            text: 'What each room costs, and what the rate includes. A guest comparing home stays wants this on the page, not behind an enquiry form.',
        },
        {
            name: 'An availability enquiry without a phone call',
            text: 'A request with the dates and number of guests, sent to WhatsApp. Confirming the booking and taking any advance is still a conversation, which is how most home stays already prefer to close a booking.',
        },
        {
            name: 'Photos that sell the actual place',
            text: 'The view, the rooms, the mornings. Real photography, compressed to load fast, does more for a home stay than any stock image ever could.',
        },
        {
            name: 'Found by people searching your area',
            text: '"Home stay near [hill station or town]" is how most guests find a place directly, ahead of or alongside a booking platform. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can guests check room availability through the site?',
            a: 'The site sends a structured enquiry with the dates and number of guests already filled in, straight to WhatsApp. Confirming the booking is still a conversation, which is how most home stays prefer to manage it.',
        },
        {
            q: 'Do we still need to be listed on booking platforms as well?',
            a: 'That is your call and most home stays keep both. Your own site gives you a channel with no commission and full control over how the place is presented.',
        },
        {
            q: 'Can I update tariffs and availability myself?',
            a: 'Yes, we show you how during handover, since rates often change with the season.',
        },
    ],
};
