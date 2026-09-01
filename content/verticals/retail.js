/**
 * VelBiz's own pitch to a grocery shop, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 */

export default {
    slug: 'retail',
    trade: 'Grocery shop',
    demoSlug: 'retail',

    metaTitle: 'Website for a Grocery Shop',
    metaDescription:
        'A website for a daily grocery or general shop: a running basket that totals as customers add items, and an order sent straight to WhatsApp without a phone call. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your grocery shop',
    intro:
        "A grocery shop's website has one job: let a regular customer order the same list they order every week without picking up the phone. We build a running basket that totals as items are added and sends the whole order to you in one message, not a form that asks them to type each item by hand.",

    needs: [
        {
            name: 'A basket that totals as you add',
            text: 'A customer picks items off a list, sees the total update live, and sends the order. No typing a list from memory into a text message.',
        },
        {
            name: 'An order that arrives on WhatsApp, ready to fulfil',
            text: 'The full basket, itemised, sent straight to your phone. You confirm availability and the total, the same way a phone order already works, just faster to place.',
        },
        {
            name: "Prices you can update when they change",
            text: 'Vegetable and grocery prices move week to week. We hand over a way to update them without needing us for every change.',
        },
        {
            name: 'Found by people searching your locality',
            text: '"Grocery shop near me" plus a locality is how most of this trade is actually found online. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can customers see running prices as they build an order?',
            a: 'Yes, the basket totals live as items are added, so a customer knows the bill before sending the order, the same way a supermarket till works.',
        },
        {
            q: 'How does an order actually reach us?',
            a: 'As a structured WhatsApp message listing every item and quantity, so you can check stock and confirm the total without any back-and-forth typing.',
        },
        {
            q: 'Can I update prices and stock myself?',
            a: 'Yes, we show you how during handover, since grocery prices change too often to depend on us for every update.',
        },
    ],
};
