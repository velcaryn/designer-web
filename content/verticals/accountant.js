/**
 * VelBiz's own pitch to an accounting firm, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 *
 * REGULATED TRADE. No invented ICAI membership numbers, no claims about
 * client outcomes. Describes the website only: what filings the firm
 * covers, what they cost, and whether it reminds a client before a
 * deadline, which is what a client actually wants.
 */

export default {
    slug: 'accountant',
    trade: 'Accountant',
    demoSlug: 'accountant',

    metaTitle: 'Website for an Accounting Firm',
    metaDescription:
        'A website for an accounting firm: which filings you handle, what they cost, and a due-date calendar that reminds a client before a deadline. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your accounting firm',
    intro:
        "A small business owner's real fear with an accountant is missing a due date, so a page that shows the year's statutory deadlines and highlights the next one is doing the job clients actually hire a firm for. We build that, along with what filings you handle and what a client can expect to pay, plainly stated.",

    needs: [
        {
            name: 'A statutory due-date calendar',
            text: 'GST, TDS, advance tax and annual filing deadlines, laid out for the year with the next one highlighted against today\'s date, so a client always knows what is coming.',
        },
        {
            name: 'Which filings you handle, stated plainly',
            text: 'A prospective client wants to know upfront whether you cover their specific need, GST returns, ITR filing, company compliance, before they enquire.',
        },
        {
            name: 'An enquiry that does not need a phone call',
            text: 'A request naming the filing type and rough timeline, sent to WhatsApp. Confirming the engagement and fee is still a conversation, as it should be.',
        },
        {
            name: 'Found by people searching for a filing service near them',
            text: '"CA near me" or "GST filing" plus a locality is how most small business owners search for an accountant. The page is built and described so search connects the two.',
        },
    ],

    faqs: [
        {
            q: 'Will the site show membership numbers or claim specific client outcomes?',
            a: 'No. It states what filings the firm handles and what a client can expect to pay, which is what a client is actually looking for. It does not carry invented membership numbers or outcome claims.',
        },
        {
            q: 'Can the due-date calendar reflect the current statutory deadlines?',
            a: 'Yes, it is built to be updated as deadlines are announced or change, so it stays accurate rather than becoming stale.',
        },
        {
            q: 'Can clients enquire about a specific filing through the site?',
            a: 'The site sends a structured enquiry naming the filing type, straight to WhatsApp. Confirming the engagement is still a conversation with the firm.',
        },
    ],
};
