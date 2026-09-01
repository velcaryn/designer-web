/**
 * VelBiz's own pitch to a dental clinic, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 *
 * REGULATED TRADE. No claims about patient outcomes, no "more patients",
 * no invented credentials or accreditations. This page describes the
 * website only, the same even-handed register content/demos/dental-clinic.js
 * already holds itself to for its own invented business.
 */

export default {
    slug: 'dental-clinic',
    trade: 'Dental clinic',
    demoSlug: 'dental-clinic',

    metaTitle: 'Website for a Dental Clinic',
    metaDescription:
        'A website for a dental clinic: treatments and timings stated plainly, an appointment request that does not need a phone call, and no invented claims. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your dental clinic',
    intro:
        'A dental clinic website needs to state what it treats and when it is open, clearly enough that a nervous first-time patient can decide to book without calling to ask basic questions first. We build the page to answer those questions directly, and we do not put invented claims or credentials on it.',

    needs: [
        {
            name: 'Treatments and timings, stated plainly',
            text: 'What the clinic treats, and when it is open, laid out clearly rather than buried in a paragraph. This is usually the first thing a new patient wants to confirm.',
        },
        {
            name: 'An appointment request without a phone call',
            text: 'A request with the preferred date and reason, sent to WhatsApp. Confirming the slot is still a call or a message back from the clinic, which is how appointment booking already works for most practices.',
        },
        {
            name: 'A clear before-and-after presentation, honestly labelled',
            text: 'Where a clinic has real, consented clinical images, we present them as a comparison. Where it does not, we do not fabricate one.',
        },
        {
            name: 'Found by people searching for a dentist nearby',
            text: '"Dental clinic near me" and similar local searches are how most patients find a new dentist. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Will the site make any claims about treatment outcomes?',
            a: 'No. The site describes what the clinic offers and how to reach it. Claims about outcomes belong to the clinic and its patients, not to a website.',
        },
        {
            q: 'Can patients request an appointment through the site?',
            a: 'The site sends a structured request with the preferred date and reason, straight to WhatsApp. Confirming the slot is still a conversation with the clinic, which is how appointment scheduling already works.',
        },
        {
            q: 'Can we use real before-and-after photos of consented patients?',
            a: 'Yes, if the clinic has them and the patient has consented. We will not invent or use stock images in their place.',
        },
    ],
};
