/**
 * VelBiz's own pitch to a hardware or general trade shop, not a
 * fictional business. See content/verticals/photo-studio.js for the
 * rule this file follows.
 */

export default {
    slug: 'small-business',
    trade: 'Hardware and general store',
    demoSlug: 'small-business',

    metaTitle: 'Website for a Hardware or General Store',
    metaDescription:
        'A website for a hardware, electrical or general trade shop: a catalogue that prices by quantity, and a quote request that does not need a counter visit. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your shop',
    intro:
        "A trade shop's customers are often ordering in quantity, not one item, so the page needs to price that way: pick items, set quantities, and get a running total before anyone drives to the counter. We build the catalogue and the quote request around that, not a consumer shopping cart borrowed from elsewhere.",

    needs: [
        {
            name: 'A catalogue priced by quantity',
            text: 'A contractor ordering fittings in bulk wants the total for the quantity they need, not a single-unit price they have to multiply themselves.',
        },
        {
            name: 'A quote request without a counter visit',
            text: 'A structured request listing every item and quantity, sent to WhatsApp, so you can confirm stock and the price before anyone drives over.',
        },
        {
            name: 'Stock and pack sizes, stated clearly',
            text: 'What is in stock and what size it comes in are the two questions a trade customer actually has. We put them on the page instead of leaving them to a phone call.',
        },
        {
            name: 'Found by people searching your trade and area',
            text: '"Hardware shop near me" or "electricals dealer" plus a locality is how most trade customers find a new supplier. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can customers request a quote for a bulk order through the site?',
            a: 'Yes, the site sends a structured quote request with every item and quantity already listed, straight to WhatsApp. Confirming stock and the final price is still a conversation.',
        },
        {
            q: 'Can I update stock and prices myself?',
            a: 'Yes, we show you how during handover, since trade prices and stock change often.',
        },
        {
            q: 'Does this work for a shop with a very large catalogue?',
            a: 'Yes, the catalogue is built to stay fast to search and browse even with hundreds of items, since that is closer to how a real hardware or electrical shop is stocked.',
        },
    ],
};
