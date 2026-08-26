/**
 * The twenty sectors this studio actually works for, and everything the
 * page's mock devices need in order to be about one of them.
 *
 * WHY THIS REPLACED A FIVE-ENTRY LIST
 *
 * The first version offered Shop, Clinic, Salon, Services and Food. That is
 * a high-street list, and it told a factory owner, a freight forwarder or a
 * software vendor that the page was not for them. The work is broader than
 * that, so the list is too.
 *
 * WHY IT IS STILL SIX CHIPS ON THE PAGE
 *
 * Twenty options laid out flat is a taxonomy, and asking a shop owner to
 * read a taxonomy before anything happens loses exactly the visitor this
 * page was rewritten for. So the six most common carry `common: true` and
 * show as chips; the rest live behind a More panel, grouped. Someone who
 * runs a bakery never opens it. Someone who runs a warehouse can still find
 * themselves in two taps.
 *
 * THE SHAPE IS LOAD-BEARING
 *
 * `ClGrowth` reads `kicker`, `headline`, `cta`, `items`, `query`, `snippet`
 * and `thread`; `ClContact` reads `noun`. Every entry must carry all of
 * them or a mock renders blank. `names` is new: the placeholder cycles
 * through it so the field is alive before anyone types.
 *
 * `cta` IS THE BUTTON IN THE MOCK STOREFRONT, AND IT IS NOT ALWAYS WHATSAPP
 *
 * Every sector used to show "Order on WhatsApp", which was wrong for most
 * of this list: a clinic takes bookings, a manufacturer takes quote
 * requests, a software company takes demo requests, and none of them
 * "order". The button now says what that trade's customer actually does,
 * which is also the thing the storefront mock is there to demonstrate.
 *
 * `thread` IS A FULL CONVERSATION, NOT TWO LINES AND A REPLY
 *
 * Round three replaced the old `orders` (two customer lines) plus a single
 * `reply` with `thread`: five turns, alternating `them` (the customer) and
 * `you` (the business), because three total bubbles read as a stub rather
 * than a real exchange once the visitor actually looked at the phone
 * mock. Every entry ends on a `you` turn, so the conversation always
 * closes with the business responding.
 *
 * Everything here is written the way a customer would say it, not the way a
 * system would log it, and every price is the real order of magnitude for
 * that trade in India. An inflated demo tells the visitor the page is not
 * about their business.
 */

/**
 * The five families, in the order the More panel renders them. Consumer
 * work comes first because it is the largest share of the enquiries this
 * page is written to attract.
 */
export const GROUPS = [
    { id: 'consumer', label: 'Consumer and lifestyle' },
    { id: 'health', label: 'Healthcare' },
    { id: 'industry', label: 'Industry and operations' },
    { id: 'professional', label: 'Professional and technology' },
    { id: 'experience', label: 'Experience and media' },
];

export const SECTORS = [
    /* ── Consumer and lifestyle ──────────────────────────────────────── */
    {
        id: 'retail',
        group: 'consumer',
        common: true,
        label: 'Retail',
        noun: 'shop',
        cta: 'Order on WhatsApp',
        directoryLabel: 'Local shop directory',
        names: ['Sundar Stores', 'Amman Traders', 'Kovai Provisions'],
        kicker: 'Open six days a week',
        headline: 'Everything for the home, in one place',
        query: 'general store near me',
        snippet: 'See what is in stock, order on WhatsApp, and pick it up the same day or have it delivered.',
        items: [
            { name: 'Weekly basket', price: '890' },
            { name: 'Gift hamper', price: '1,450' },
            { name: 'Festive box', price: '2,200' },
        ],
        thread: [
            { from: 'them', text: 'Hi, is the festive box available this week?' },
            { from: 'you', text: 'Yes, made fresh this morning.' },
            { from: 'them', text: 'Two please, delivery to Saibaba Colony.' },
            { from: 'them', text: 'Can it reach by evening?' },
            { from: 'you', text: 'Yes, both ready. Sending the payment link now.' },
        ],
    },
    {
        id: 'food',
        group: 'consumer',
        common: true,
        label: 'Food and restaurants',
        noun: 'kitchen',
        cta: 'Order on WhatsApp',
        directoryLabel: 'Food delivery directory',
        names: ['Anbu Mess', 'The Filter Room', 'Ammas Kitchen'],
        kicker: 'Ordering now',
        headline: 'Cooked to order, ready when you are',
        query: 'food delivery near me',
        snippet: 'Today the menu, the real prices and a WhatsApp order button. Ready in twenty minutes.',
        items: [
            { name: 'Lunch box', price: '180' },
            { name: 'Family pack', price: '650' },
            { name: 'Party tray', price: '2,800' },
        ],
        thread: [
            { from: 'them', text: 'Three lunch boxes for one o clock?' },
            { from: 'you', text: 'Sure, what would you like in them?' },
            { from: 'them', text: 'Two veg, one chicken.' },
            { from: 'them', text: 'Same address as last time.' },
            { from: 'you', text: 'Got it. Ready by twelve forty five.' },
        ],
    },
    {
        id: 'wellness',
        group: 'consumer',
        common: true,
        label: 'Wellness and beauty',
        noun: 'studio',
        cta: 'Book an appointment',
        directoryLabel: 'Salon and spa finder',
        names: ['Studio Nila', 'The Glow Room', 'Aura Wellness'],
        kicker: 'Walk in or book ahead',
        headline: 'Look the way you meant to',
        query: 'salon near me open now',
        snippet: 'The full price list, pick your stylist and book the slot you want. No waiting on a call.',
        items: [
            { name: 'Cut and style', price: '750' },
            { name: 'Colour', price: '2,400' },
            { name: 'Bridal package', price: '8,500' },
        ],
        thread: [
            { from: 'them', text: 'Slot for cut and colour on Saturday?' },
            { from: 'you', text: 'We have a few slots open that day.' },
            { from: 'them', text: 'Morning if possible.' },
            { from: 'them', text: 'Does Priya do the colour too?' },
            { from: 'you', text: 'Ten thirty with Priya. Shall I hold it?' },
        ],
    },
    {
        id: 'local',
        group: 'consumer',
        common: true,
        label: 'Local services',
        noun: 'business',
        cta: 'Request a callback',
        directoryLabel: 'Local services directory',
        names: ['Ravi Electricals', 'CoolAir Service', 'Fixit Plumbing'],
        kicker: 'Free site visit',
        headline: 'The job done properly, the first time',
        query: 'electrician near me',
        snippet: 'Clear pricing, a written quote before any work starts, and a warranty on everything we fit.',
        items: [
            { name: 'Site visit', price: '0' },
            { name: 'Standard fit', price: '4,500' },
            { name: 'Annual contract', price: '12,000' },
        ],
        thread: [
            { from: 'them', text: 'Can someone come and look at the wiring?' },
            { from: 'you', text: 'Sure, what is the issue exactly?' },
            { from: 'them', text: 'Address is off Trichy Road.' },
            { from: 'them', text: 'Sockets keep tripping in the kitchen.' },
            { from: 'you', text: 'Tomorrow between ten and twelve works. Confirmed.' },
        ],
    },
    {
        id: 'online',
        group: 'consumer',
        common: true,
        label: 'Online shop',
        noun: 'brand',
        cta: 'Order online',
        directoryLabel: 'Online store directory',
        names: ['Karuppati Co', 'Thendral Naturals', 'Nilaa Living'],
        kicker: 'Ships across India',
        headline: 'Made in small batches, sent to your door',
        query: 'buy palm jaggery online',
        snippet: 'Order direct from the people who make it. Free shipping over a thousand rupees, returns for fourteen days.',
        items: [
            { name: 'Starter pack', price: '499' },
            { name: 'Monthly box', price: '1,250' },
            { name: 'Bulk order', price: '4,800' },
        ],
        thread: [
            { from: 'them', text: 'Do you ship to Bangalore?' },
            { from: 'you', text: 'Yes, we ship pan India.' },
            { from: 'them', text: 'Looking for the monthly box.' },
            { from: 'them', text: 'How long does delivery usually take?' },
            { from: 'you', text: 'We do. Dispatched tomorrow, three days to reach you.' },
        ],
    },
    {
        id: 'fmcg',
        group: 'consumer',
        common: false,
        label: 'FMCG and distribution',
        noun: 'distribution business',
        cta: 'Request a quote',
        directoryLabel: 'Distributor directory',
        names: ['Sri Balaji Agencies', 'Coimbatore Distributors'],
        kicker: 'Serving 400 retailers',
        headline: 'Stocked, dispatched and settled on time',
        query: 'fmcg distributor coimbatore',
        snippet: 'Standing orders, route-wise delivery and monthly statements every retailer can check for themselves.',
        items: [
            { name: 'Route order', price: '18,000' },
            { name: 'Half pallet', price: '46,000' },
            { name: 'Full load', price: '1,80,000' },
        ],
        thread: [
            { from: 'them', text: 'Need the usual order for Thursday route.' },
            { from: 'you', text: 'Noted, same quantities as last week?' },
            { from: 'them', text: 'Add two cases of the new SKU.' },
            { from: 'them', text: 'Can billing go on the usual credit terms.' },
            { from: 'you', text: 'Booked. Invoice and delivery note sent.' },
        ],
    },

    /* ── Healthcare ───────────────────────────────────────────────────── */
    {
        id: 'clinic',
        group: 'health',
        common: true,
        label: 'Clinics and hospitals',
        noun: 'clinic',
        cta: 'Book an appointment',
        directoryLabel: 'Clinic finder site',
        names: ['Sakthi Clinic', 'Wellspring Care', 'Dr Meena Clinic'],
        kicker: 'Appointments open',
        headline: 'Care you can book in under a minute',
        query: 'clinic open today near me',
        snippet: 'Book online, see the timings before you travel, and get your reports by message.',
        items: [
            { name: 'Consultation', price: '600' },
            { name: 'Health check', price: '1,900' },
            { name: 'Follow up', price: '350' },
        ],
        thread: [
            { from: 'them', text: 'Do you have a slot this evening?' },
            { from: 'you', text: 'What is this regarding?' },
            { from: 'them', text: 'Yes, for a general consultation.' },
            { from: 'them', text: 'Also want to carry forward old reports.' },
            { from: 'you', text: 'Six fifteen is free. Booked and confirmed.' },
        ],
    },
    {
        id: 'pharma',
        group: 'health',
        common: false,
        label: 'Pharma and devices',
        noun: 'supply business',
        cta: 'Request a quote',
        directoryLabel: 'Medical supplier directory',
        names: ['Medline Supplies', 'Curewell Distributors'],
        kicker: 'Supplying 60 hospitals',
        headline: 'The right stock, with the paperwork in order',
        query: 'surgical supplies distributor',
        snippet: 'Batch and expiry tracked on every line, with compliant documentation on each dispatch.',
        items: [
            { name: 'Standard kit', price: '2,400' },
            { name: 'Bulk carton', price: '28,000' },
            { name: 'Annual contract', price: '4,50,000' },
        ],
        thread: [
            { from: 'them', text: 'Need a quote for the quarterly order.' },
            { from: 'you', text: 'Sure, same list as last quarter?' },
            { from: 'them', text: 'Same items as last time.' },
            { from: 'them', text: 'Please include batch details this time.' },
            { from: 'you', text: 'Quote sent, with batch and expiry on each line.' },
        ],
    },

    /* ── Industry and operations ──────────────────────────────────────── */
    {
        id: 'manufacturing',
        group: 'industry',
        common: false,
        label: 'Manufacturing',
        noun: 'unit',
        cta: 'Request a quote',
        directoryLabel: 'Industrial supplier listing',
        names: ['Vel Precision Works', 'Sakthi Engineering'],
        kicker: 'Taking enquiries',
        headline: 'Built to spec, delivered to schedule',
        query: 'precision components manufacturer',
        snippet: 'Send us a drawing and get a quote back with a real lead time, not a placeholder.',
        items: [
            { name: 'Sample run', price: '6,500' },
            { name: 'Batch of 500', price: '85,000' },
            { name: 'Annual supply', price: '9,00,000' },
        ],
        thread: [
            { from: 'them', text: 'Sending a drawing, can you quote?' },
            { from: 'you', text: 'Got it, checking tolerances now.' },
            { from: 'them', text: 'Need 500 pieces by month end.' },
            { from: 'them', text: 'Material should be the same grade as before.' },
            { from: 'you', text: 'Quoted. We can hold that delivery date.' },
        ],
    },
    {
        id: 'logistics',
        group: 'industry',
        common: false,
        label: 'Logistics and warehousing',
        noun: 'operation',
        cta: 'Get a shipping quote',
        directoryLabel: 'Freight and logistics directory',
        names: ['Southline Logistics', 'Kongu Freight'],
        kicker: 'Tracked end to end',
        headline: 'You always know where the load is',
        query: 'freight forwarder coimbatore',
        snippet: 'Booking, pickup, transit and proof of delivery, all on one page your customer can open.',
        items: [
            { name: 'Local delivery', price: '850' },
            { name: 'Interstate load', price: '18,500' },
            { name: 'Monthly contract', price: '2,20,000' },
        ],
        thread: [
            { from: 'them', text: 'Where is the consignment from Tuesday?' },
            { from: 'you', text: 'Checking the manifest now.' },
            { from: 'them', text: 'Customer is asking.' },
            { from: 'them', text: 'Can you send them a tracking link directly.' },
            { from: 'you', text: 'Out for delivery. Tracking link sent to them directly.' },
        ],
    },
    {
        id: 'property',
        group: 'industry',
        common: false,
        label: 'Real estate and construction',
        noun: 'firm',
        cta: 'Arrange a viewing',
        directoryLabel: 'Property listing site',
        names: ['Nandhaa Builders', 'Vaas Constructions'],
        kicker: 'Site visits open',
        headline: 'See the plan, the progress and the price',
        query: 'apartments in coimbatore',
        snippet: 'Floor plans, real photographs of the current stage, and what is actually still available.',
        items: [
            { name: 'Site visit', price: '0' },
            { name: 'Booking amount', price: '1,00,000' },
            { name: 'Two bedroom', price: '58,00,000' },
        ],
        thread: [
            { from: 'them', text: 'Is the two bedroom on the fourth floor still free?' },
            { from: 'you', text: 'Yes, that one is still open.' },
            { from: 'them', text: 'Can we visit on Sunday?' },
            { from: 'them', text: 'Is parking included with it?' },
            { from: 'you', text: 'It is. Sunday eleven o clock works.' },
        ],
    },
    {
        id: 'agri',
        group: 'industry',
        common: false,
        label: 'Agriculture and agri-tech',
        noun: 'farm business',
        cta: 'Send an enquiry',
        directoryLabel: 'Agri produce directory',
        names: ['Green Fields Produce', 'Nilgiri Agro'],
        kicker: 'Harvest to order',
        headline: 'Straight from the field, at the right price',
        query: 'bulk vegetable supplier',
        snippet: 'Daily rates, grade-wise pricing and delivery to the mandi or direct to your kitchen.',
        items: [
            { name: 'Sample crate', price: '900' },
            { name: 'Half tonne', price: '22,000' },
            { name: 'Full load', price: '1,15,000' },
        ],
        thread: [
            { from: 'them', text: 'What is the rate for grade one today?' },
            { from: 'you', text: 'Rate updates every morning, checking now.' },
            { from: 'them', text: 'Need half a tonne by Friday.' },
            { from: 'them', text: 'Can it go straight to the mandi.' },
            { from: 'you', text: 'Rate sent. Friday delivery is confirmed.' },
        ],
    },

    /* ── Professional and technology ──────────────────────────────────── */
    {
        id: 'professional',
        group: 'professional',
        common: false,
        label: 'Professional services',
        noun: 'practice',
        cta: 'Book a consultation',
        directoryLabel: 'Professional services directory',
        names: ['Raman and Associates', 'Kovai Legal'],
        kicker: 'First consultation free',
        headline: 'Straight answers, in plain language',
        query: 'chartered accountant near me',
        snippet: 'What we do, what it costs and how long it takes, written where you can read it before calling.',
        items: [
            { name: 'Consultation', price: '1,500' },
            { name: 'Annual filing', price: '18,000' },
            { name: 'Retainer', price: '96,000' },
        ],
        thread: [
            { from: 'them', text: 'Need help with GST filing this quarter.' },
            { from: 'you', text: 'Sure, tell me a bit about the business.' },
            { from: 'them', text: 'Small business, one location.' },
            { from: 'them', text: 'What documents will you need from us.' },
            { from: 'you', text: 'Happy to help. Sending you the checklist now.' },
        ],
    },
    {
        id: 'software',
        group: 'professional',
        common: false,
        label: 'Software and IT',
        noun: 'company',
        cta: 'Book a demo',
        directoryLabel: 'Software vendor listing',
        names: ['Northbridge Labs', 'Kovai Systems'],
        kicker: 'Now onboarding',
        headline: 'Software that does one thing properly',
        query: 'billing software for small business',
        snippet: 'Try it before you pay, see the real pricing, and export your data whenever you want it.',
        items: [
            { name: 'Starter', price: '999' },
            { name: 'Team', price: '4,500' },
            { name: 'Enterprise', price: '24,000' },
        ],
        thread: [
            { from: 'them', text: 'Can we get a demo this week?' },
            { from: 'you', text: 'Of course, how big is the team?' },
            { from: 'them', text: 'Team of about twelve.' },
            { from: 'them', text: 'Also curious about onboarding time.' },
            { from: 'you', text: 'Yes. Thursday afternoon, I will send the link.' },
        ],
    },
    {
        id: 'finance',
        group: 'professional',
        common: false,
        label: 'Finance and insurance',
        noun: 'firm',
        cta: 'Book a consultation',
        directoryLabel: 'Financial advisor directory',
        names: ['Sundaram Capital', 'Trust Insurance Services'],
        kicker: 'Regulated and registered',
        headline: 'Know what you are paying for',
        query: 'insurance advisor near me',
        snippet: 'Every charge listed, every policy compared side by side, and no commission you cannot see.',
        items: [
            { name: 'Review', price: '0' },
            { name: 'Term plan', price: '14,000' },
            { name: 'Portfolio setup', price: '35,000' },
        ],
        thread: [
            { from: 'them', text: 'Want to compare two health policies.' },
            { from: 'you', text: 'Sure, who is it covering?' },
            { from: 'them', text: 'Family of four.' },
            { from: 'them', text: 'Want to see the claim process too.' },
            { from: 'you', text: 'Comparison sheet on the way, both side by side.' },
        ],
    },
    {
        id: 'education',
        group: 'professional',
        common: false,
        label: 'Education and training',
        noun: 'academy',
        cta: 'Enquire about admission',
        directoryLabel: 'Coaching centre directory',
        names: ['Bright Minds Academy', 'Kovai Skills Centre'],
        kicker: 'Admissions open',
        headline: 'Learn it properly, from people who do it',
        query: 'coaching centre near me',
        snippet: 'The syllabus, the timings, the fee and who teaches it, all before you visit.',
        items: [
            { name: 'Trial class', price: '0' },
            { name: 'Monthly', price: '2,500' },
            { name: 'Full course', price: '24,000' },
        ],
        thread: [
            { from: 'them', text: 'Is the weekend batch still open?' },
            { from: 'you', text: 'Yes, almost full though.' },
            { from: 'them', text: 'For my daughter, class eleven.' },
            { from: 'them', text: 'Can she attend a trial first.' },
            { from: 'you', text: 'Two seats left. Trial class is free this Saturday.' },
        ],
    },

    /* ── Experience and media ─────────────────────────────────────────── */
    {
        id: 'travel',
        group: 'experience',
        common: false,
        label: 'Travel and hospitality',
        noun: 'property',
        cta: 'Check availability',
        directoryLabel: 'Stay booking directory',
        names: ['Hill View Retreat', 'Coorg Stays'],
        kicker: 'Rooms available',
        headline: 'A place worth the drive',
        query: 'homestay near ooty',
        snippet: 'Real photographs, the actual tariff, and a booking you can make without a phone call.',
        items: [
            { name: 'Standard room', price: '3,200' },
            { name: 'Family suite', price: '6,500' },
            { name: 'Whole villa', price: '18,000' },
        ],
        thread: [
            { from: 'them', text: 'Two rooms for the long weekend?' },
            { from: 'you', text: 'Let me check availability for those dates.' },
            { from: 'them', text: 'Checking in Friday evening.' },
            { from: 'them', text: 'Is breakfast included in the rate.' },
            { from: 'you', text: 'Both available. Holding them for you now.' },
        ],
    },
    {
        id: 'events',
        group: 'experience',
        common: false,
        label: 'Events and entertainment',
        noun: 'company',
        cta: 'Check our dates',
        directoryLabel: 'Event planner directory',
        names: ['Mango Street Events', 'Studio Vault'],
        kicker: 'Booking this season',
        headline: 'The day runs itself, because we ran it before',
        query: 'wedding planner coimbatore',
        snippet: 'Past work you can look at, packages with the real numbers, and one person answering the phone.',
        items: [
            { name: 'Consultation', price: '0' },
            { name: 'Day package', price: '85,000' },
            { name: 'Full wedding', price: '4,50,000' },
        ],
        thread: [
            { from: 'them', text: 'Do you have December dates free?' },
            { from: 'you', text: 'A few, how many guests are you expecting?' },
            { from: 'them', text: 'About 300 guests.' },
            { from: 'them', text: 'Can you also handle the catering.' },
            { from: 'you', text: 'Two dates open. Sending the package sheet.' },
        ],
    },
    {
        id: 'content',
        group: 'experience',
        common: false,
        label: 'Content and social',
        noun: 'studio',
        cta: 'Start a project',
        directoryLabel: 'Creative agency directory',
        names: ['Frame Nine', 'Left Field Media'],
        kicker: 'Taking projects',
        headline: 'Work that gets watched, not just posted',
        query: 'social media agency near me',
        snippet: 'The work speaks first. Rates listed, turnaround stated, and you own every file we deliver.',
        items: [
            { name: 'Single reel', price: '4,000' },
            { name: 'Monthly retainer', price: '35,000' },
            { name: 'Full campaign', price: '1,20,000' },
        ],
        thread: [
            { from: 'them', text: 'Need eight reels a month, ongoing.' },
            { from: 'you', text: 'We can do that, what is the product?' },
            { from: 'them', text: 'Product is a food brand.' },
            { from: 'them', text: 'Can you send examples of past work first.' },
            { from: 'you', text: 'That fits the retainer. Sending three samples.' },
        ],
    },
];

/** The six that show as chips without opening the More panel. */
export const COMMON_SECTORS = SECTORS.filter((s) => s.common);

export const DEFAULT_SECTOR = 'retail';

/** Sectors belonging to one group, for rendering the More panel. */
export function sectorsInGroup(groupId) {
    return SECTORS.filter((s) => s.group === groupId);
}

export function findSector(id) {
    return SECTORS.find((s) => s.id === id) ?? SECTORS[0];
}
