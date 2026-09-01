/**
 * VelBiz's own pitch to a car service centre, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 */

export default {
    slug: 'car-service',
    trade: 'Car service and repair',
    demoSlug: 'car-service',

    metaTitle: 'Website for a Car Service Centre',
    metaDescription:
        'A website for a car service centre: fixed-price packages stated upfront, and a booking with pickup and drop. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your car service centre',
    intro:
        'A car service customer wants a price agreed before the bonnet opens and to not lose the whole day to it. We build the page around fixed-price packages stated plainly, and a booking flow that includes pickup and drop, so both concerns are answered before anyone calls.',

    needs: [
        {
            name: 'Fixed-price packages, stated upfront',
            text: "What each service level includes and what it costs, so a customer is not quoted a surprise number after the car is already on the ramp.",
        },
        {
            name: 'A booking that includes pickup and drop',
            text: 'A slot booking that captures whether pickup and drop is needed, since that is often the deciding factor in whether someone books at all.',
        },
        {
            name: 'A service reminder based on the odometer',
            text: 'A simple due-service estimate based on kilometres run helps a customer decide when to book, rather than guessing.',
        },
        {
            name: 'Found by people searching for a service centre nearby',
            text: '"Car service" plus a locality is how most customers find a new service centre. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can customers see exact prices before booking?',
            a: 'Yes, fixed-price packages are shown plainly on the page, so a customer knows the cost before they book, not after the car is on the ramp.',
        },
        {
            q: 'Can the booking include pickup and drop?',
            a: 'Yes, the booking form captures this as part of the request, so it is arranged from the start rather than negotiated separately.',
        },
        {
            q: 'Can I update package prices myself?',
            a: 'Yes, we show you how during handover, so a price change does not need to come back to us.',
        },
    ],
};
