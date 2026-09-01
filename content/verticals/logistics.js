/**
 * VelBiz's own pitch to a logistics or courier business, not a
 * fictional business. See content/verticals/photo-studio.js for the
 * rule this file follows.
 */

export default {
    slug: 'logistics',
    trade: 'Logistics and courier',
    demoSlug: 'logistics',

    metaTitle: 'Website for a Logistics or Courier Business',
    metaDescription:
        'A website for a logistics or courier business: a quote priced by weight and route, and a consignment status a customer can check without calling. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your logistics business',
    intro:
        'A logistics customer wants two things fast: what a shipment will cost, and where it currently is. We build a quote tool priced by weight and route, and a consignment tracker, so both questions are answered on the page instead of by phone.',

    needs: [
        {
            name: 'A quote priced by weight and route',
            text: 'A customer enters what they are shipping and where, and gets an indicative price immediately, rather than waiting on a callback.',
        },
        {
            name: 'A consignment status customers can check themselves',
            text: 'A tracking lookup by consignment number cuts down the "where is my shipment" calls that otherwise land on your office phone all day.',
        },
        {
            name: 'A booking request that reaches you directly',
            text: 'Once a customer has a quote, a structured booking request sent to WhatsApp with the details already filled in moves things along faster than a form nobody reads.',
        },
        {
            name: 'Found by people searching for a courier or freight service nearby',
            text: '"Courier service" or "freight" plus a locality is how most new business customers find a logistics provider. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can the quote tool handle different vehicle types or routes?',
            a: 'Yes, the pricing logic is built around your actual rate structure, whichever weight bands and routes you quote by.',
        },
        {
            q: 'Can customers track their own shipment on the site?',
            a: 'Yes, a lookup by consignment number shows current status, which reduces the number of status calls your office fields directly.',
        },
        {
            q: 'Can I update rates and tracking status myself?',
            a: 'Yes, we show you how during handover, since freight rates and shipment status both change often.',
        },
    ],
};
