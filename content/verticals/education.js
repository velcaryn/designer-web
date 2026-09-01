/**
 * VelBiz's own pitch to a tuition or coaching centre, not a fictional
 * business. See content/verticals/photo-studio.js for the rule this
 * file follows.
 *
 * NO RESULT CLAIMS. A coaching centre page is where a fabricated number
 * does real damage to a parent's decision. This describes batch size,
 * timings and what a class actually covers, all checkable by walking in
 * and asking, and nothing about selection rates or ranks.
 */

export default {
    slug: 'education',
    trade: 'Tuition and coaching centre',
    demoSlug: 'education',

    metaTitle: 'Website for a Tuition or Coaching Centre',
    metaDescription:
        'A website for a tuition or coaching centre: batches, timings and seats left, stated plainly, with no invented result claims. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your coaching centre',
    intro:
        'A parent choosing a coaching centre wants to know the batch timings, how many seats are left, and what the class actually covers, not a percentage claim nobody can verify. We build the page around exactly that, and we do not put invented result numbers anywhere on it.',

    needs: [
        {
            name: 'Batches and timings, stated plainly',
            text: 'Which class, which stream, and when it meets, laid out clearly so a parent can check it fits before enquiring.',
        },
        {
            name: 'Seats left, shown honestly',
            text: 'A live seat count is useful to a parent deciding when to enquire, and it has to reflect the real number, not a manufactured sense of urgency.',
        },
        {
            name: 'An enquiry that does not need a phone call',
            text: 'A request with the class and preferred batch, sent to WhatsApp. Confirming a seat is still a conversation, which is how enrolment already works.',
        },
        {
            name: 'No invented result claims',
            text: 'What actually helps a parent decide is checkable by walking in and asking: batch size, who teaches, what the syllabus covers. We build the page around that.',
        },
    ],

    faqs: [
        {
            q: 'Will the site claim a selection rate or ranks achieved?',
            a: 'No. A number like that is either unverifiable or belongs to a specific student, not the centre, and a parent should not have to take it on faith from a website.',
        },
        {
            q: 'Can parents enquire about a specific batch through the site?',
            a: 'Yes, the site sends a structured enquiry with the class and preferred batch already filled in, straight to WhatsApp. Confirming the seat is still a conversation with the centre.',
        },
        {
            q: 'Can I update batch timings and seat counts myself?',
            a: 'Yes, we show you how during handover, so this stays accurate without needing us for every change.',
        },
    ],
};
