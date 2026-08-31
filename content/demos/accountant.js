/**
 * Sundaram & Associates, Tirunelveli. Entirely invented.
 *
 * NO MEMBERSHIP NUMBERS. An ICAI membership number belongs to a real
 * person and inventing one on a page that gets forwarded is a claim about
 * a regulated profession. What a client actually wants is: which filings
 * you handle, what they cost, and whether you will remind them before the
 * deadline. All three are on the page and none needs a number.
 *
 * The compliance calendar is the module. A small business owner's real
 * fear is missing a due date, so a page that shows the year's deadlines
 * and marks the next one is doing the job the firm is hired for.
 */

const accountant = {
    slug: 'accountant',
    layout: 'clinical',

    sections: [
        { type: 'hero', variant: 'split' },
        { type: 'directory', title: 'What we handle' },
        { type: 'calendar', title: 'Due dates that matter', lede: 'The recurring monthly ones. Every client on our books gets a reminder before each of these, not after.', note: 'Annual filings and audit dates move with extensions almost every year, so they are not listed here. We tell you yours directly.' },
        { type: 'pricegrid' },
        { type: 'process', title: 'Working with us' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Filing for Tirunelveli businesses since 1998.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'inline',
    },

    business: {
        name: 'Sundaram & Associates',
        tagline: 'Chartered accountants',
        trade: 'Chartered accountants',
        area: 'Palayamkottai',
        city: 'Tirunelveli',
        street: '14, Trivandrum Road, Palayamkottai',
        pin: '627002',
        email: 'office@sundaramca.example',
        since: '1998',
        trust: ['Deadline reminders before, not after', 'Fees quoted per filing', 'Books reviewed monthly', 'About 90 businesses on the books'],
        hours: [
            { days: 'Monday to Friday', open: 9.5, close: 18.5 },
            { days: 'Saturday', open: 10, close: 14 },
        ],
    },

    theme: {
        ink: '#132A3E',
        paper: '#F5FAFB',
        accent: '#0F766E',
        support: '#47616F',
        soft: '#DDEEEF',
        onAccent: '#F5FAFB',
        fill: '#132A3E',
        onFill: '#F5FAFB',
        radiusSm: '4px',
        radiusLg: '8px',
        borderW: '1px',
        shadow: 'none',
        display: 'var(--f-lexend)',
        text: 'var(--f-source)',
    },

    logo: { mark: 'ledger', style: 'plate' },

    voicesTitle: 'From the businesses we file for',
    faqTitle: 'Fees and filings',
    factsTitle: 'What each filing costs',
    factsLede: 'Per filing, quoted before we start. Nothing is billed as an hourly rate you cannot check.',

    hero: {
        kicker: 'Palayamkottai, since 1998',
        headline: 'You hear about the deadline before it passes',
        sub: 'GST, income tax and company filings for businesses around Tirunelveli. Fees quoted per filing, and a reminder before every due date.',
        primaryCta: 'What we handle',
        secondaryCta: 'The office',
    },

    module: {
        type: 'directory',
        title: 'What we handle',
        subtitle: 'The filings a small business actually needs. Anything outside this we will say so and point you somewhere sensible.',
    },

    directory: [
        { name: 'GST', lead: 'Monthly and annual', text: 'GSTR-1 and 3B every month, the annual return, and the reconciliation nobody enjoys. We chase you for the invoices rather than waiting.', when: 'Due by the 11th and 20th' },
        { name: 'Income tax', lead: 'Individual and business', text: 'Returns, advance tax working, and the notices that arrive two years later about something you had forgotten.', when: 'July, and quarterly advance' },
        { name: 'Company and LLP', lead: 'Annual compliance', text: 'Annual returns, board minutes, and the ROC filings that carry a daily penalty when they slip.', when: 'October and November' },
        { name: 'TDS', lead: 'Quarterly', text: 'Deduction working, challans and the quarterly statement, with the certificates issued to your vendors on time.', when: 'Quarterly' },
        { name: 'Bookkeeping', lead: 'Monthly review', text: 'We look at the books every month rather than in March, which is when errors are cheap to fix.', when: 'Monthly' },
        { name: 'Registration', lead: 'One off', text: 'GST, MSME, company or LLP incorporation, and the licences that go with them.', when: 'Two to four weeks' },
    ],

    /* Real statutory dates, invented firm. Monthly recurring only: annual
       deadlines shift with extensions nearly every year and a demo that
       states a stale one as fact is worse than one that omits it. See the
       header of components/demo/sections/FilingCalendar.js. */
    filings: [
        { day: 7, name: 'TDS and TCS deposited', who: 'Anyone who deducted tax last month' },
        { day: 11, name: 'GSTR-1 filed', who: 'Monthly filers, outward supplies' },
        { day: 13, name: 'GSTR-1 (IFF) filed', who: 'Quarterly filers who opted for the invoice facility' },
        { day: 15, name: 'PF and ESI paid', who: 'Anyone with staff on the roll' },
        { day: 20, name: 'GSTR-3B filed, tax paid', who: 'Monthly filers, the one people miss' },
        { day: 25, name: 'PMT-06 paid', who: 'QRMP businesses, first two months of the quarter' },
    ],

    prices: [
        {
            label: 'Monthly and quarterly',
            items: [
                { name: 'GST filing', time: 'Both returns, monthly', price: 'From Rs 1,500' },
                { name: 'TDS statement', time: 'Quarterly', price: 'Rs 2,500' },
                { name: 'Bookkeeping', time: 'Monthly, up to 200 entries', price: 'From Rs 4,000' },
            ],
        },
        {
            label: 'Annual',
            items: [
                { name: 'Income tax, individual', time: 'Salary and house property', price: 'Rs 2,500' },
                { name: 'Income tax, business', time: 'With accounts', price: 'From Rs 8,000' },
                { name: 'Company annual filing', time: 'ROC and returns', price: 'From Rs 12,000' },
            ],
        },
        {
            label: 'One off',
            items: [
                { name: 'GST registration', time: 'Two weeks', price: 'Rs 3,000' },
                { name: 'Company incorporation', time: 'Three to four weeks', price: 'From Rs 18,000' },
            ],
        },
    ],

    process: [
        { title: 'Bring what you have', text: 'Bank statements, invoices, and last year’s return if there is one. In whatever state they are in; sorting them out is the job.', when: 'First meeting, free' },
        { title: 'We tell you what is missing', text: 'A written list of what we need and what it will cost, before any work starts.', when: 'Within the week' },
        { title: 'Monthly rhythm', text: 'We ask for the month’s invoices by the fifth. If they do not arrive we ask again rather than filing late.', when: 'Every month' },
        { title: 'Before every deadline', text: 'A message a week before, with the figure and what you owe. Nobody should find out from a penalty notice.', when: 'A week ahead' },
    ],

    story: {
        title: 'How the office works',
        paragraphs: [
            'Two partners and four staff, working with about ninety businesses around Tirunelveli. That number is deliberate: past it a firm stops noticing when a client has gone quiet, and going quiet is what precedes a missed filing.',
            'We do not take a commission on anything we recommend, and we will tell you when something can be done without us. A GST registration is not worth eighteen thousand rupees and nobody should be charged that for it.',
        ],
    },

    voices: [
        {
            text: 'Twelve years and not one late filing. They ring me before the date rather than after, which sounds like the minimum and is apparently rare.',
            who: 'Selvaraj M',
            where: 'A textile trader, Tirunelveli',
        },
        {
            text: 'A notice arrived about a return from three years back. They handled it entirely and told me at the end, not at the beginning when I would have panicked.',
            who: 'Priya R',
            where: 'A clinic owner, Palayamkottai',
        },
        {
            text: 'They told me I did not need a private limited company yet and to come back when turnover doubled. That advice cost them the fee.',
            who: 'Arun V',
            where: 'A software consultant, Tirunelveli',
        },
    ],

    faqs: [
        {
            q: 'How are fees worked out?',
            a: 'Per filing, quoted before we start, and the same number every month unless the volume changes materially. No hourly billing you cannot check.',
        },
        {
            q: 'What if I have not filed for a few years?',
            a: 'Common, and fixable. Bring what you have and we will tell you what it costs to bring up to date, including any penalty, before you commit to anything.',
        },
        {
            q: 'Do you handle notices and scrutiny?',
            a: 'Yes, including for years we did not file. Assessment and appeal work is quoted separately because the effort genuinely varies.',
        },
        {
            q: 'Can everything be done remotely?',
            a: 'Most of it. Documents by email or WhatsApp, signatures digitally. Some registrations still need you in person and we will say which.',
        },
    ],

    visit: {
        title: 'The office',
        note: 'Trivandrum Road in Palayamkottai, first floor above the stationery shop. Come with whatever paperwork you have; a first meeting costs nothing.',
    },
};

export default accountant;
