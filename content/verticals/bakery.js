/**
 * VelBiz's own pitch to a bakery, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows:
 * nothing invented, no claims about a client's results, VelBiz's own
 * pricing and identity only.
 */

export default {
    slug: 'bakery',
    trade: 'Bakery',
    demoSlug: 'bakery',

    metaTitle: 'Website for a Bakery',
    metaDescription:
        'A website for a bakery: the daily menu, what sells out and by when, and an order that reaches you on WhatsApp before someone drives over for nothing. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your bakery',
    intro:
        'A bakery sells on what is fresh today, and most bakery sites answer that with a menu photographed once and never touched again. We build a page that is easy for you to keep current, so a visitor sees what is actually in the case this morning, not what was there in March.',

    needs: [
        {
            name: 'A menu you can update yourself',
            text: 'Prices change, items sell out, a new cake goes up for the season. We hand over a way to edit the menu without calling us every time something changes.',
        },
        {
            name: 'Orders that do not need a phone call mid-shift',
            text: 'A cake order with the size, flavour and date, sent straight to WhatsApp. Nobody has to answer the phone with flour on their hands.',
        },
        {
            name: "What's fresh today, not what was fresh in a photoshoot",
            text: 'A simple way to flag what sold out or what is only available today, so a visitor is not disappointed after driving over.',
        },
        {
            name: 'Found by people searching your area, not just your name',
            text: 'Most bakery searches are "bakery near me" plus a locality. The page is built and described so that search connects the two.',
        },
        {
            name: 'A pre-order window for festival and event baking',
            text: 'Diwali sweets, wedding cakes, bulk orders. A form that captures the date and quantity in advance is worth more to a bakery than a contact page.',
        },
    ],

    faqs: [
        {
            q: 'Can I update the menu myself once the site is live?',
            a: 'Yes. We show you how to add, edit or remove items during handover, so a price change or a sold-out item does not need to come back to us.',
        },
        {
            q: 'Can customers place a custom cake order through the site?',
            a: 'The site sends a structured enquiry with the flavour, size and date already filled in, straight to WhatsApp. Confirming the order and the price is still a conversation, which is how most bakeries prefer to handle a custom cake.',
        },
        {
            q: 'Does the site help during festival season when orders spike?',
            a: 'A pre-order form with a cut-off date is the single biggest help during Diwali or wedding season, since it spreads the orders out instead of all of them arriving by phone on the same afternoon.',
        },
    ],
};
