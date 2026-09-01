/**
 * VelBiz's own pitch to a D2C or electronics ecommerce brand, not a
 * fictional business. See content/verticals/photo-studio.js for the
 * rule this file follows.
 */

export default {
    slug: 'ecommerce',
    trade: 'Ecommerce store',
    demoSlug: 'ecommerce',

    metaTitle: 'Website for an Ecommerce Store',
    metaDescription:
        'A website for a D2C or electronics ecommerce store: a proper product catalogue with real specifications, a cart, and checkout without a marketplace commission. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your ecommerce store',
    intro:
        'A buyer comparing electronics or D2C products reads specifications, not adjectives, so the catalogue needs to present them properly: clear, comparable, and fast to load. We build the product grid, the cart and a checkout that puts every order in front of you directly.',

    needs: [
        {
            name: 'A catalogue built around specifications',
            text: 'For products a buyer compares on specs, a layout that surfaces them clearly does more than a paragraph of marketing copy ever will.',
        },
        {
            name: 'A cart and a real checkout',
            text: 'A customer builds an order, sees the total, and pays or sends the order through, without a marketplace percentage taken off every sale.',
        },
        {
            name: 'Fast on mobile data, even with a full catalogue',
            text: 'A catalogue of any size still needs to load fast on the connection most customers are actually using. We build and measure for that, not just for a demo on office wifi.',
        },
        {
            name: 'Found by people searching for the product, not just the brand',
            text: 'Product and category searches bring in customers who have never heard of your brand yet. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can the site take payments directly, or does it need a separate gateway?',
            a: 'We integrate a payment gateway so customers can pay directly on the site, or build the cart to send a structured order to WhatsApp for confirmation first, depending on how you want to run it.',
        },
        {
            q: 'Can I add or update products myself once the site is live?',
            a: 'Yes, we show you how during handover, so a new product or a price change does not depend on us.',
        },
        {
            q: 'Will the site stay fast as the catalogue grows?',
            a: 'We measure page weight on every build rather than assuming it, specifically so a growing catalogue does not quietly slow the site down over time.',
        },
    ],
};
