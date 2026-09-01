/**
 * VelBiz's own pitch to a lodge or business hotel, not a fictional
 * business. See content/verticals/photo-studio.js for the rule this
 * file follows.
 */

export default {
    slug: 'lodging',
    trade: 'Lodge',
    demoSlug: 'lodging',

    metaTitle: 'Website for a Lodge or Business Hotel',
    metaDescription:
        'A website for a lodge or business hotel: room types and tariffs stated clearly, and an availability request without a phone call. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your lodge',
    intro:
        'A business traveller booking a lodge wants proximity, a clear tariff by room type, and a fast way to confirm a room is free on the date they need it, not atmosphere copy. We build the page around exactly that: room types, rates, and an availability check that does not need a phone call.',

    needs: [
        {
            name: 'Room types and tariffs, stated clearly',
            text: 'What each room type costs and what the rate includes. A traveller comparing lodges wants this on the page directly.',
        },
        {
            name: 'An availability request without a phone call',
            text: 'A request with the dates and room type, sent to WhatsApp. Confirming the room is still a reply from the front desk, which is how most bookings already get closed.',
        },
        {
            name: 'Proximity, stated plainly',
            text: 'Distance to the station, the highway, or the business district a traveller is actually visiting for. This is usually the deciding factor for a business stay.',
        },
        {
            name: 'Found by people searching your area',
            text: '"Lodge near [station or highway]" is how most business travellers find a place directly. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can guests check room availability through the site?',
            a: 'The site sends a structured request with the dates and room type already filled in, straight to WhatsApp. Confirming the room is still a reply from the front desk.',
        },
        {
            q: 'Can I update tariffs myself as rates change?',
            a: 'Yes, we show you how during handover, so a rate change does not need to come back to us.',
        },
        {
            q: 'Does the site work for both business and leisure travellers?',
            a: 'The layout and copy are built around what actually decides a booking for your lodge, whether that is proximity for business travel or the room and rate for a leisure stay.',
        },
    ],
};
