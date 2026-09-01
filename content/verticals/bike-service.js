/**
 * VelBiz's own pitch to a bike service centre, not a fictional
 * business. See content/verticals/photo-studio.js for the rule this
 * file follows.
 *
 * DELIBERATELY NOT THE CAR SERVICE PAGE WITH SMALLER PRICES. A bike
 * service is walk in, wait, ride away, so the page this describes leads
 * with a live queue rather than a booking form, the same distinction
 * content/demos/bike-service.js draws for its own demo.
 */

export default {
    slug: 'bike-service',
    trade: 'Bike service and repair',
    demoSlug: 'bike-service',

    metaTitle: 'Website for a Bike Service Centre',
    metaDescription:
        'A website for a bike service centre: a live view of what is on the ramps right now, so a customer knows the wait before they walk in. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your bike service centre',
    intro:
        'A bike service is walk in, wait, ride away, and the only real question a customer has is how long the wait will be. We build the page around a live view of what is currently on the ramps, not a booking form that does not match how this trade actually works.',

    needs: [
        {
            name: 'A live view of the current queue',
            text: 'What is on the ramps right now, updated as jobs move through, so a customer can decide whether to walk in now or come back later.',
        },
        {
            name: 'Service prices, stated plainly',
            text: 'Basic service, full service, and common repairs, priced clearly so a customer has a rough idea before arriving.',
        },
        {
            name: 'Directions and hours, easy to find',
            text: 'The two things a walk-in customer needs fastest: where you are and when you are open.',
        },
        {
            name: 'Found by people searching for a bike mechanic nearby',
            text: '"Bike service" or "two wheeler mechanic" plus a locality is how most customers find a new service centre. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can the site show what is currently on the ramps?',
            a: 'Yes, a live queue view is built to reflect the actual jobs in progress, so a customer gets a real sense of the wait rather than a generic estimate.',
        },
        {
            q: 'Do customers need to book in advance?',
            a: "No, this page is built around how bike service actually works: walk in and wait. There is no booking form pretending otherwise.",
        },
        {
            q: 'Can I update the queue and prices myself?',
            a: 'Yes, we show you how during handover, since both change through the day.',
        },
    ],
};
