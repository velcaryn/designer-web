/**
 * The demo business, and every number the five panels show.
 *
 * WHY ONE FICTIONAL BUSINESS AND NOT A REAL ONE
 *
 * The source of this content was Velcaryn's cloud page, whose demo data was
 * hospital procurement: named hospitals, catheter SKUs, and invoices in
 * lakhs. All of it is gone. A person running a shop cannot see themselves in
 * a ten lakh catheter tender, and using a real customer's name and figures
 * in a product mock implies a testimonial we do not have.
 *
 * So the demo is Anbu Traders: obviously invented, recognisably ordinary,
 * and sized like a real small business. Every amount here is in the tens of
 * thousands rather than the crores, because that is the scale of the
 * businesses this product is being sold to and an inflated demo just tells
 * the visitor the software is not for them.
 *
 * NO PHONE NUMBERS ANYWHERE IN THIS FILE
 *
 * Not a stylistic choice. scripts/check-brand-leak.mjs hard-fails on any
 * bare twelve-digit run, any `tel:` and any `wa.me` URL found outside
 * config/site.js, because on an earlier build the real phone number lived in
 * eight files and cloning that repo while missing one shipped the previous
 * client's number on a live site. A mock invoice with a plausible mobile
 * number on it would trip exactly that guard, and correctly so.
 */

export const DEMO = {
    business: 'Anbu Traders',
    domain: 'anbutraders.com',
};

/* ── Billing ──────────────────────────────────────────────────────────── */

export const BILLING_KPIS = [
    { label: 'Billed this month', value: 'Rs 4,82,000', note: 'Across 96 invoices' },
    { label: 'Collected', value: 'Rs 4,11,500', note: '85 percent settled' },
    { label: 'Awaiting payment', value: 'Rs 70,500', note: '11 invoices open' },
    { label: 'GST this quarter', value: 'Rs 62,180', note: 'Ready to file' },
];

export const INVOICE = {
    number: 'INV-0284',
    customer: 'Meenakshi Stores, Gandhipuram',
    method: 'Paid by UPI',
    lines: [
        { item: 'Filter coffee powder, 500g', hsn: '0901', qty: '40', rate: '260', gst: '5', amount: '10,400' },
        { item: 'Cold pressed groundnut oil, 1L', hsn: '1508', qty: '24', rate: '340', gst: '5', amount: '8,160' },
        { item: 'Delivery, within city', hsn: '9965', qty: '1', rate: '350', gst: '18', amount: '350' },
    ],
    /* The arithmetic has to survive being checked on a phone calculator.
       Lines add to 18,910; GST is 5 percent on the two goods lines and 18
       percent on delivery, which is 991; the total is 19,901. A demo
       invoice whose numbers do not reconcile tells a shop owner the
       software cannot add up. */
    subtotal: 'Rs 18,910',
    gst: 'Rs 991',
    total: 'Rs 19,901',
};

/* ── Customers ────────────────────────────────────────────────────────── */

export const PIPELINE = [
    {
        stage: 'New enquiry',
        cards: [
            { who: 'Bakery on Mettupalayam Road', what: 'Monthly flour and oil', value: 'Rs 28,000' },
            { who: 'Canteen, Peelamedu', what: 'Weekly provisions', value: 'Rs 16,500' },
        ],
    },
    {
        stage: 'Quote sent',
        cards: [
            { who: 'Sri Ganesh Mess', what: 'Six month supply contract', value: 'Rs 1,45,000' },
        ],
    },
    {
        stage: 'Won',
        cards: [
            { who: 'Meenakshi Stores', what: 'Standing weekly order', value: 'Rs 82,000' },
            { who: 'Hotel Vasantham', what: 'Annual contract', value: 'Rs 2,10,000' },
        ],
    },
];

/* ── Stock ────────────────────────────────────────────────────────────── */

export const STOCK = [
    { place: 'Shop, Gandhipuram', item: 'Filter coffee powder, 500g', have: '210', reorder: '80', status: 'Fine' },
    { place: 'Godown, Ganapathy', item: 'Cold pressed groundnut oil, 1L', have: '46', reorder: '60', status: 'Reorder' },
    { place: 'Shop, Gandhipuram', item: 'Idli rice, 25kg bag', have: '132', reorder: '40', status: 'Fine' },
    { place: 'Godown, Ganapathy', item: 'Jaggery block, 1kg', have: '18', reorder: '50', status: 'Reorder' },
];

/* ── Staff ────────────────────────────────────────────────────────────── */

export const PAYROLL = [
    { name: 'Kavitha R', role: 'Counter and billing', days: '26', pay: 'Rs 21,000', status: 'Paid' },
    { name: 'Selvam M', role: 'Godown and dispatch', days: '25', pay: 'Rs 19,500', status: 'Paid' },
    { name: 'Divya S', role: 'Accounts', days: '26', pay: 'Rs 24,000', status: 'Paid' },
    { name: 'Rajesh K', role: 'Delivery', days: '24', pay: 'Rs 17,200', status: 'Pending' },
];

/* ── Money ────────────────────────────────────────────────────────────── */

export const MONEY_KPIS = [
    { label: 'Sales this month', value: 'Rs 4,82,000', note: 'Up from Rs 4,38,000 in July' },
    { label: 'Money owed to you', value: 'Rs 70,500', note: 'Oldest is 22 days' },
    { label: 'Expenses logged', value: 'Rs 3,16,400', note: 'Rent, stock, salaries' },
    { label: 'Left over', value: 'Rs 1,65,600', note: 'Before tax' },
];

export const LEDGER = [
    { date: '18 Aug', entry: 'Sales, counter and delivery', debit: '', credit: '48,200' },
    { date: '18 Aug', entry: 'Purchase, groundnut oil', debit: '31,400', credit: '' },
    { date: '19 Aug', entry: 'Shop rent, August', debit: '42,000', credit: '' },
    { date: '20 Aug', entry: 'Payment received, Hotel Vasantham', debit: '', credit: '82,000' },
];
