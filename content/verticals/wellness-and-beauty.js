/**
 * VelBiz's own pitch to a salon and spa, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 */

export default {
    slug: 'wellness-and-beauty',
    trade: 'Salon and spa',
    demoSlug: 'wellness-and-beauty',

    metaTitle: 'Website for a Salon or Spa',
    metaDescription:
        'A website for a salon or spa: a service menu with durations stated plainly, and a booking request that does not need a phone call. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your salon or spa',
    intro:
        "A salon booking is planned around a time slot, which is why the service menu needs to carry a duration next to every treatment, not just a price. We build the page around what a client is actually deciding: what to book, how long it takes, and how to reserve the slot.",

    needs: [
        {
            name: 'A service menu with durations, not just prices',
            text: 'A client planning a morning around an appointment needs to know how long a treatment takes, not only what it costs. Every service on the page carries both.',
        },
        {
            name: 'A booking request without a phone call',
            text: 'A request with the service and preferred time, sent to WhatsApp. Confirming the slot is a quick reply back, which is faster for the front desk than a ringing phone mid-treatment.',
        },
        {
            name: 'Photos of the space, not stock images',
            text: 'What decides a first-time visit to a salon is often what the space looks like. Real photos of the salon, compressed to load fast, do more than any stock photo.',
        },
        {
            name: 'Found by people searching for a salon nearby',
            text: '"Salon near me" and similar local searches are how most new clients are found. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can the site show service durations alongside prices?',
            a: 'Yes, every service on the menu carries both, so a client can plan their time as well as their budget before booking.',
        },
        {
            q: 'Can clients book an appointment through the site?',
            a: 'The site sends a structured booking request with the service and preferred time already filled in, straight to WhatsApp. Confirming the slot is still a quick reply from the salon, which is how most booking already works.',
        },
        {
            q: 'Can I update the service menu myself as prices or offerings change?',
            a: 'Yes, we show you how during handover, so a new treatment or a price change does not need to come back to us.',
        },
    ],
};
