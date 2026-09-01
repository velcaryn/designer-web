/**
 * VelBiz's own pitch to a used vehicle dealer, not a fictional
 * business. See content/verticals/photo-studio.js for the rule this
 * file follows.
 *
 * NO INVENTED REGISTRATION NUMBERS ANYWHERE ON THIS PAGE. A plausible
 * registration plate on a page people forward around is a real
 * vehicle's plate. Stock references, where shown as an example, stay
 * short and clearly not a real registration format.
 */

export default {
    slug: 'auto-resale',
    trade: 'Used vehicle dealer',
    demoSlug: 'auto-resale',

    metaTitle: 'Website for a Used Vehicle Dealer',
    metaDescription:
        'A website for a used vehicle dealer: a stock table a buyer can compare, and a way to pin two vehicles side by side. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your used vehicle business',
    intro:
        'A used vehicle buyer is comparing rows, not reading prose, so the page needs a proper stock table: year, kilometres run, condition and price, laid out so two or three options can be compared directly. We build that, not a gallery of photos with a caption underneath each one.',

    needs: [
        {
            name: 'A stock table built for comparison',
            text: 'Year, kilometres run, condition and price for every vehicle, laid out so a buyer can scan the whole lot at once rather than opening each listing separately.',
        },
        {
            name: 'A way to compare two vehicles side by side',
            text: 'A buyer choosing between two cars or bikes benefits from seeing the specs next to each other, not from switching between two open tabs.',
        },
        {
            name: 'An enquiry that names the specific vehicle',
            text: 'A structured enquiry naming the exact stock item, sent to WhatsApp, so the first conversation starts from the vehicle the buyer actually wants.',
        },
        {
            name: 'Found by people searching for a used vehicle in your area',
            text: '"Used cars" or "second hand bikes" plus a locality is how most buyers search. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can buyers compare two vehicles directly on the site?',
            a: 'Yes, a comparison view lets a buyer pin two stock items and see the specs side by side.',
        },
        {
            q: 'Will the site display real registration numbers?',
            a: 'No. A registration plate belongs to a specific vehicle and its owner, and it has no place being published on a public listing page.',
        },
        {
            q: 'Can I add or remove stock myself as vehicles sell?',
            a: 'Yes, we show you how during handover, so a sold vehicle can come off the list without needing to come back to us.',
        },
    ],
};
