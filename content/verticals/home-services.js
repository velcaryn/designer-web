/**
 * VelBiz's own pitch to a home services operator (plumbing, electrical,
 * painting), not a fictional business. See content/verticals/photo-studio.js
 * for the rule this file follows.
 */

export default {
    slug: 'home-services',
    trade: 'Home services (plumbing, electrical, painting)',
    demoSlug: 'home-services',

    metaTitle: 'Website for Home Services',
    metaDescription:
        'A website for a plumbing, electrical or painting operator: one number for every trade you cover, and a callback request without the customer needing to know which trade they need. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your home services business',
    intro:
        "Most home services operators run plumbing, wiring and painting as one business with one WhatsApp number, not three separate outfits. We build the page around that reality: a directory of what you cover, and a callback request that does not force a customer to already know which trade they need.",

    needs: [
        {
            name: 'A directory of every trade you cover, in one place',
            text: 'One page, all your services, so a customer who is not sure whether their problem is plumbing or electrical can still find you.',
        },
        {
            name: 'A callback request instead of a booked slot',
            text: "Most home service work is same-day and depends on who is free, so a request that reaches you directly works better than a rigid booking calendar.",
        },
        {
            name: 'A callout charge stated upfront, where you have one',
            text: 'If you charge for a visit regardless of the job, stating it plainly avoids an awkward conversation at the door.',
        },
        {
            name: 'Found by people searching for a trade near them',
            text: '"Plumber near me" or "electrician" plus a locality is how most home service work is found. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Can customers request a callback without knowing exactly which trade they need?',
            a: 'Yes, the request form is built around describing the problem, not picking a trade first, so a customer who is unsure can still reach you.',
        },
        {
            q: 'Does the site handle emergency or same-day requests differently?',
            a: 'We can flag urgent requests separately so they stand out from routine enquiries, if that matches how you actually triage jobs.',
        },
        {
            q: 'Can I update which trades or areas I cover myself?',
            a: 'Yes, we show you how during handover, so adding a new service or area does not need to come back to us.',
        },
    ],
};
