/**
 * VelBiz's own pitch to a real estate or plots business, not a
 * fictional business. See content/verticals/photo-studio.js for the
 * rule this file follows.
 *
 * NO INVENTED APPROVAL OR REGISTRATION NUMBERS ANYWHERE ON THIS PAGE OR
 * ITS COPY. A real-looking DTCP or RERA number on a page about land is a
 * claim someone might act on, whether it belongs to VelBiz's own copy or
 * a client's listing. This page describes the website's job (presenting
 * a seller's real paperwork clearly), never fabricates the paperwork.
 */

export default {
    slug: 'real-estate',
    trade: 'Real estate and plots',
    demoSlug: 'real-estate',

    metaTitle: 'Website for a Real Estate or Plots Business',
    metaDescription:
        'A website for a real estate or plots business: a spec table for every listing, filterable by budget and facing, that presents your real approvals clearly. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your real estate business',
    intro:
        "A plot buyer lives or dies on whether they believe the paperwork, so the page's job is to present your real approval numbers, survey details and what is laid and what is not, clearly and without embellishment. We build a spec table for that, and a way for a buyer to filter listings by what actually matters to them.",

    needs: [
        {
            name: 'A spec table for every listing',
            text: 'Approval number, survey number, extent, facing, and what infrastructure is actually laid. Presented plainly, using your real documents, not a rendering of something that does not exist yet.',
        },
        {
            name: 'A filter by budget and facing',
            text: 'A buyer narrows a list of plots by what matters to them in seconds, rather than scrolling every listing on the site.',
        },
        {
            name: 'An enquiry that captures which plot',
            text: 'A structured enquiry naming the specific plot, sent to WhatsApp, so the first call starts from the listing the buyer actually wants.',
        },
        {
            name: 'Found by people searching for plots in your area',
            text: '"Plots for sale" or "DTCP approved layout" plus a locality is how most buyers search. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Will the site display our real approval and survey numbers?',
            a: 'Yes, your actual documents and numbers are what belongs on the page. We never fabricate or dress up an approval number, since that is a claim a buyer might act on.',
        },
        {
            q: 'Can buyers filter listings by budget and facing?',
            a: 'Yes, a filter narrows the list live, so a buyer can find what fits their budget without scrolling past everything else.',
        },
        {
            q: 'Can I add or update listings myself?',
            a: 'Yes, we show you how during handover, so a sold plot or a new listing does not need to come back to us.',
        },
    ],
};
