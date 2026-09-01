/**
 * VelBiz's own pitch to a photo studio, not a fictional business.
 *
 * NOTHING HERE IS INVENTED. Every claim is about what VelBiz builds, not
 * about a client's results ("more bookings", "more enquiries"), because
 * that is a claim about someone else's business outcomes we cannot make
 * true by writing it down. See content/demos/index.js's own rule against
 * fabricated metrics; this file follows the same discipline for the same
 * reason, on VelBiz's side of the page instead of a demo business's.
 */

export default {
    slug: 'photo-studio',
    trade: 'Photo studio',
    demoSlug: 'photo-studio',

    metaTitle: 'Website for a Photo Studio',
    metaDescription:
        'A website for a photography studio: a fast gallery, a booking enquiry that does not need a phone call, and a portfolio a client can send to a friend. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your photo studio',
    intro:
        'A photo studio sells on its portfolio, and a portfolio that takes ten seconds to load has already lost the visitor before they have seen a single photograph. We build the gallery to open fast, the booking enquiry to work without a phone call, and the whole site to be something a client forwards to a friend who just got engaged.',

    needs: [
        {
            name: 'A gallery that actually loads',
            text: 'Full-resolution wedding and portrait sets are large. We serve a compressed preview grid and only load the full image when someone opens it, so the first screen a visitor sees is fast on the mobile data they are actually using.',
        },
        {
            name: 'Enquiries that do not need a phone call',
            text: 'A shoot date, a package and a WhatsApp message, sent from the page. Nobody has to call during a shoot to ask what a studio charges.',
        },
        {
            name: 'A package list that answers the price question first',
            text: 'The question every visitor has and the one most studio sites make them ask by phone. We put it on the page, plainly, before anything else.',
        },
        {
            name: 'Before and after, shown honestly',
            text: 'A raw-to-graded comparison is the single most convincing thing a photo studio can show a visitor who is comparing studios. We build it as a real interactive slider, not a static split image.',
        },
        {
            name: 'Found by people planning a wedding or a shoot',
            text: 'Search terms like "wedding photographer" plus a town name are how most studios are actually found. The page is built and described so that search can find it.',
        },
    ],

    faqs: [
        {
            q: 'Can the gallery show video as well as photos?',
            a: 'Yes. Short reels and highlight videos sit alongside the photo grid, compressed and served the same way, so they do not slow the page down for visitors who only want to look at stills.',
        },
        {
            q: 'Can clients book a date directly from the site?',
            a: 'The site sends a structured enquiry with the date and package already filled in, straight to WhatsApp. Confirming the booking is still a conversation, which is how most studios prefer to close a wedding date.',
        },
        {
            q: 'What happens to the site once new work is ready to add?',
            a: 'You get a simple way to add new sets yourself, without needing to come back to us for every update. We show you how during handover.',
        },
    ],
};
