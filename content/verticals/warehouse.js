/**
 * VelBiz's own pitch to a warehousing and storage business, not a
 * fictional business. See content/verticals/photo-studio.js for the
 * rule this file follows.
 */

export default {
    slug: 'warehouse',
    trade: 'Warehousing and storage',
    demoSlug: 'warehouse',

    metaTitle: 'Website for a Warehousing or Storage Business',
    metaDescription:
        'A website for a warehousing and storage business: space and tariffs calculated by pallets and duration, and an enquiry that reaches you directly. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your warehousing business',
    intro:
        'A B2B storage customer wants a concrete answer to one question: how much space, for how long, and roughly what it will cost. We build a calculator around exactly that, so a serious enquiry arrives with the numbers already worked out instead of a vague message asking for a quote.',

    needs: [
        {
            name: 'A space calculator by pallets and duration',
            text: 'A customer enters what they need to store and for how long, and gets an indicative space requirement and monthly cost, before they ever call.',
        },
        {
            name: 'Capacity and specifications, stated plainly',
            text: 'Floor area, ceiling height, dock access, whatever is actually relevant to a business deciding where to store goods. Specific numbers, not vague reassurance.',
        },
        {
            name: 'An enquiry that reaches you with the details already filled in',
            text: 'A structured request with the space and duration already specified, sent to WhatsApp, so the first conversation starts from a real number.',
        },
        {
            name: 'Found by people searching for warehousing near their operation',
            text: '"Warehouse space" or "storage facility" plus a locality is how most B2B customers find a new provider. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can the space calculator reflect our actual pricing structure?',
            a: 'Yes, it is built around your real rate card, whatever units and duration bands you actually quote by.',
        },
        {
            q: 'Can we list multiple facilities with different specifications?',
            a: 'Yes, if you operate more than one site, each can be listed with its own capacity and specifications.',
        },
        {
            q: 'Can I update rates and available capacity myself?',
            a: 'Yes, we show you how during handover, since available space and rates change as bookings come and go.',
        },
    ],
};
