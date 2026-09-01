/**
 * VelBiz's own pitch to a family clinic, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 *
 * REGULATED TRADE. No claims about patient outcomes, no invented
 * registration numbers, no "more patients" framing. Describes the
 * website only.
 */

export default {
    slug: 'clinic',
    trade: 'Clinic',
    demoSlug: 'clinic',

    metaTitle: 'Website for a Clinic',
    metaDescription:
        'A website for a family clinic: doctors, qualifications and consulting hours stated plainly, and an appointment request that does not need a phone call. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your clinic',
    intro:
        'A patient choosing a clinic wants to know who they will see, what that doctor is qualified in, and when the clinic is open, before anything else. We build the page around exactly that, and we do not put invented registration numbers or outcome claims anywhere on it.',

    needs: [
        {
            name: 'Doctors, qualifications and consulting hours, stated plainly',
            text: 'Who a patient will see and when, laid out clearly. This is what most patients are actually trying to confirm before they decide to visit.',
        },
        {
            name: 'An appointment request without a phone call',
            text: 'A request with the preferred date and doctor, sent to WhatsApp. Confirming the slot is still a reply from the clinic, the way appointment booking already works.',
        },
        {
            name: 'A token or queue status, where the clinic wants one',
            text: 'Some clinics benefit from showing a live token number so patients know roughly when to arrive rather than waiting in a crowded room. We build this only where it reflects something real.',
        },
        {
            name: 'Found by people searching for a clinic nearby',
            text: '"Family clinic near me" and similar local searches are how most patients find a new clinic. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Will the site show doctor registration numbers or claims about outcomes?',
            a: 'No. The site states qualifications and consulting hours, which is what a patient is actually looking for. It does not carry invented registration numbers or claims about treatment outcomes.',
        },
        {
            q: 'Can patients request an appointment through the site?',
            a: 'The site sends a structured request with the preferred date and doctor already filled in, straight to WhatsApp. Confirming the slot is still a reply from the clinic.',
        },
        {
            q: 'Can we show a live token or queue number?',
            a: 'Yes, if the clinic already tracks this in some form. We build it to reflect the real queue, not a number for decoration.',
        },
    ],
};
