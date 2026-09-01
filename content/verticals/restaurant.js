/**
 * VelBiz's own pitch to a restaurant, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 */

export default {
    slug: 'restaurant',
    trade: 'Restaurant',
    demoSlug: 'restaurant',

    metaTitle: 'Website for a Restaurant',
    metaDescription:
        'A website for a restaurant: the full menu with vegetarian marked clearly, a table booking that does not need a phone call, and a page built to be found by people searching for food nearby. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your restaurant',
    intro:
        'A restaurant is judged by its menu before anyone reads a word of the story section, so the menu comes first: readable on a phone, vegetarian dishes marked the way an Indian diner expects, and updated when a dish is off rather than left to disappoint someone who drove over for it.',

    needs: [
        {
            name: 'A menu that reads properly on a phone',
            text: 'Most people check a restaurant menu standing outside it or from the back seat of an auto. Large type, clear sections, and a vegetarian flag on every dish, not a PDF nobody can zoom.',
        },
        {
            name: 'A table booking that does not need a call during service',
            text: 'A booking request with the date, time and party size, sent to WhatsApp, so the person on the floor is not answering the phone mid-rush.',
        },
        {
            name: 'Found by people searching for food near them',
            text: '"Chettinad restaurant near me" and similar searches are how most diners actually find a place to eat. The page is built and described so search connects the two.',
        },
        {
            name: 'Photos that load fast on mobile data',
            text: 'A gallery of the dining room and a few signature dishes, compressed properly so it opens quickly on the connection most diners are actually using.',
        },
    ],

    faqs: [
        {
            q: 'Can the menu show which dishes are vegetarian at a glance?',
            a: 'Yes, every dish carries a vegetarian flag rendered clearly next to the item, the way an Indian diner expects a menu to work.',
        },
        {
            q: 'Can customers book a table through the site?',
            a: 'The site sends a structured booking request with the date, time and party size already filled in, straight to WhatsApp. Confirming the table is still a conversation, which is how most restaurants prefer to manage seating.',
        },
        {
            q: 'What if a dish runs out or the menu changes seasonally?',
            a: 'We show you how to mark an item unavailable or update the menu yourself during handover, so the page reflects what the kitchen is actually serving.',
        },
    ],
};
