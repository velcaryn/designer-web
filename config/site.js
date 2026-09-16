/**
 * ALL brand-specific data. The only file to edit when anything about the
 * business changes: name, number, address, handles, parent company.
 *
 * WHY THIS FILE EXISTS (docs/PLAYBOOK.md, section 2)
 * On the Liha build the phone number appeared in 8 files, 20 times. Cloning
 * that repo and missing one occurrence ships the previous client's phone
 * number on a live site. That is not an embarrassment, it is a lost client.
 *
 * The same rule applies to our own site for a different reason: the contact
 * details here are still placeholders, and when the real ones arrive there
 * must be exactly one place to put them.
 *
 * NEVER write a `wa.me` or `tel:` URL by hand anywhere else. Build it with
 * the helpers below. Guarded by `npm run check:brand`.
 */

export const brand = {
    name: 'VelBiz Digital',
    shortName: 'VelBiz',
    parent: 'A unit of Velcaryn LLP',
    tagline: 'Websites, launched and grown',
    domain: 'velbiz.com',
    description:
        'We design and build websites, take them live, and run the SEO, content and social work that brings people to them.',
    /* Kept here because it appears in more than one footer and would
       otherwise be hand-typed into prose in each. */
    base: 'Tirunelveli, Tamil Nadu, India',
};

/**
 * `phone` is digits only, country code included, no plus and no spaces.
 */
export const contact = {
    phone: '919944788655',
    phoneDisplay: '+91 99447 88655',
    email: 'help@velbiz.com',
    /* Both are real inboxes, not the primary contact route. Kept here, not
       hand-typed into a component, for the same reason `phone` is: one
       place to update if either changes. */
    emailContact: 'contact@velbiz.com',
    emailInfo: 'info@velbiz.com',
    instagram: 'https://instagram.com/velbiz.digital',
    instagramHandle: '@velbiz.digital',
    /* THE POSTS SHOWN ON THE LANDING PAGE, BY PERMALINK.

       Instagram's public feed cannot be fetched without an app token and
       a Business account, and the Basic Display API that used to allow
       it was retired in December 2024. So the grid is a list of post
       links kept here and rendered as Instagram's own embed frames.
       Paste the permalink of each post to show (the URL of the post,
       "https://www.instagram.com/p/<code>/"), newest first, four to six
       of them. With none listed the section shows the follow button
       alone. */
    instagramPosts: [],
};

export const phoneHref = `tel:+${contact.phone}`;
export const emailHref = `mailto:${contact.email}`;

/** Builds every WhatsApp URL on the site. Do not hand-roll one. */
export function waLink(message) {
    return `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
}

export const waDefault = waLink(
    `Hello ${brand.shortName}, I would like to talk about a project.`,
);

/**
 * The enquiry message, assembled from whatever the visitor gave us. Kept
 * here rather than in the form so the wording is consistent with every other
 * WhatsApp entry point.
 */
export function waEnquiry({ name, email, company, brief }) {
    const lines = [
        `Hello ${brand.shortName}.`,
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        company ? `Company: ${company}` : null,
        '',
        brief,
    ].filter((line) => line !== null);
    return waLink(lines.join('\n'));
}

/**
 * The two fixed plans.
 *
 * WHY FIXED NUMBERS RATHER THAN THE BAND THAT USED TO BE HERE
 *
 * `pricing` below still carries a band, and it still drives the home
 * page at `/` and the three service pages. This block is the newer,
 * narrower answer, and it exists because the band was the wrong shape
 * for the audience the simplified landing page is written for.
 *
 * A shop owner who has never bought a website cannot place themselves
 * inside "Rs 10,000 to 30,000". They do not know which end they are, so
 * they assume the top, and the range does the very thing it was added to
 * prevent. Two named things with two fixed numbers answers instead: this
 * one, or that one, and this is what separates them.
 *
 * THE OLD ARGUMENT AGAINST A PRICE TABLE STILL HAS A POINT
 *
 * It said a table invites line-item comparison against whoever is
 * cheapest. That is true, and it is the cost of being legible to
 * somebody who would otherwise not write at all. Two plans is not a
 * feature ladder: there is no third tier engineered to make the second
 * look reasonable, and the cheaper one is a complete website rather
 * than a crippled version of the expensive one.
 *
 * THE TIMELINE IS STATED, WHICH IS A CHANGE
 *
 * CLAUDE.md banned delivery estimates outside an estimator, on the
 * grounds that a number of weeks quoted against an undescribed project
 * is a promise made before anything is known. Confirmed with the user
 * that 5 and 7 days are real, sellable commitments against these two
 * defined scopes, which is the condition the old rule was protecting.
 * It is a promise against a KNOWN scope now, not an open one. Anything
 * outside these two plans goes back to being quoted after a
 * conversation, with no number of days attached.
 *
 * Written as words, never as a numeric range with a dash: "5 to 7", not
 * "5-7". The dash forms are what the en dashes in the previous draft
 * were, and they are what the house style bans.
 */
export const plans = [
    {
        id: 'starter',
        name: 'Starter Business Website',
        who: 'For local shops, clinics, consultants and service providers.',
        price: '9,999',
        /* ASCII hyphen, never an en dash: the dash forms are what the
           house style bans. Read as "5 to 7". */
        days: '5-7',
        lead: null,
        gets: [
            'Custom pages designed for your business',
            'Mobile-first layout that loads in under 2 seconds',
            '1-tap WhatsApp ordering and customer enquiry buttons',
            'Google Business Profile and Google Maps setup',
            'Professional copywriting in English and Tamil',
            '100% code and domain ownership in your name',
        ],
    },
    {
        id: 'advanced',
        name: 'Advanced Business Website',
        who: 'For established businesses that want to scale further.',
        price: '17,999',
        days: '10-14',
        /* Rendered as the first, bold line of the list. One line does
           the work of a column of repeated ticks. */
        lead: 'Everything in Starter, plus',
        gets: [
            'A dashboard to monitor your customers',
            'Inventory management',
            'Quotes and invoicing',
            'Business analytics',
        ],
        /* Sub-points under one line, keyed by that line's text. Kept
           beside `gets` rather than nested inside it so the older
           drafts, which render `gets` as plain strings, keep working. */
        details: {
            'A dashboard to monitor your customers': [
                'Add and edit the content on the website',
                'Upload photos and videos',
                'Update customer testimonials',
            ],
        },
    },
    {
        id: 'ecommerce',
        name: 'Full-Scale E-Commerce Suite',
        who: 'For stores, brands and sellers ready to take payments and ship anywhere.',
        price: '24,999',
        days: '10-14',
        lead: 'Everything in Advanced, plus',
        gets: [
            'Complete online store with shopping cart and checkout',
            'Direct UPI (Google Pay, PhonePe, Paytm), cards and net banking',
            'Merchant admin dashboard to manage orders, stock and customers',
            'Modern payment gateway (Razorpay) integration',
            'Zero platform commission taken by us on your sales',
        ],
    },
];

/**
 * How a plan's price is written on the landing page: "₹9,999/-", the
 * way a shop in Tamil Nadu writes a price on a board. `pricing.currency`
 * stays "Rs" for the band on the older pages. One function so the cards,
 * the FAQ answer and any future mention cannot spell it three ways.
 */
export function planPrice(plan) {
    return `₹${plan.price}/-`;
}

/**
 * The price band.
 *
 * STILL THE RIGHT ANSWER FOR THE PAGES THAT USE IT. The home page at
 * `/` and the three service pages describe work that genuinely varies:
 * a catalogue build and a five-page brochure are not the same job, and
 * quoting one number for both would be a lie in one direction or the
 * other. `plans` above is the answer for the two scopes that ARE fixed.
 *
 * NO TIMELINE HERE, STILL. The days in `plans` are attached to two
 * defined scopes. This band is not, so nothing here promises one.
 */
export const pricing = {
    from: '10,000',
    to: '30,000',
    currency: 'Rs',
    /* What actually moves a quote within the band. Honest inputs, not a
       feature ladder designed to push people upward.

       The last three are the ones that genuinely change the build rather
       than the page count: a dashboard means an admin surface and the
       auth behind it, a database means the site stops being static, and
       the WhatsApp Business API is an approved-sender process with its
       own per-conversation cost. Naming them is how somebody who needs
       them understands why their quote is not the lower number, and how
       somebody who does not need them understands why theirs is. */
    factors: [
        'How many pages, and how much of it is a catalogue',
        'Whether we write the words and take the photographs',
        'Whether you need the search and social work alongside it',
        'Whether you want a dashboard to run the site and see the numbers',
        'Whether it needs a database behind it rather than fixed pages',
        'Whether orders and replies go through the WhatsApp Business API',
    ],
    /* Cloud is quoted per business after a conversation. Stated so
       nobody reads the band as including it, but without a number:
       the pricing section on /cloud was deliberately removed and this
       is not the place to quietly reinstate it. */
    cloudNote: 'VelBiz Cloud is priced separately, once we know what you run.',
};

/**
 * The questions for the two-plan landing page.
 *
 * WHY A SECOND ARRAY RATHER THAN REUSING `faqs`
 *
 * The same one-array-two-consumers rule applies, just per page: the
 * component renders this and StructuredData receives the identical array
 * through `pageFaqs`, exactly as app/for/[slug]/page.js already does. The
 * drift the rule exists to prevent is JSON-LD claiming answers that are
 * not on the visible page, and that is a per-page property.
 *
 * It cannot reuse `faqs` because `faqs[0]` answers the BAND. A page whose
 * whole argument is two fixed numbers cannot carry an answer that says
 * the price is a range, and a crawler cannot be told both.
 *
 * SEVEN, NOT TEN. The previous draft of this page asked eight and
 * answered several of them in vocabulary the reader does not have: T+1
 * settlement cycles, ERP integrations, admin dashboards. What is left is
 * what somebody actually worries about before sending money to a website
 * company, in the words they would use.
 *
 * Numbers are derived from `plans` so the answer, the price cards and
 * the structured data cannot disagree.
 */
export const planFaqs = [
    {
        q: 'What does it cost?',
        a: `A website is ${pricing.currency} ${plans[0].price}. An online shop, where customers pay you on the site, is ${pricing.currency} ${plans[2].price}. That is the whole number. There is no hourly rate running in the background and no bill at the end that is bigger than the one you agreed to.`,
    },
    {
        q: 'Do I need the shop, or is the website enough?',
        /* The place where saying "not yet" earns more than an upsell.
           Carried over in substance from faqs, because it is the most
           useful answer on the page and it is still true. */
        a: 'Often the website is enough, and we will tell you when it is. If most of your orders come from people who live nearby and already know you, a website and a WhatsApp button will serve you better than a checkout nobody uses. The shop earns its keep when you are selling to people who cannot walk in, posting things beyond your own town, or retyping the same order into a bill every evening.',
    },
    {
        q: 'How does the money reach me?',
        /* "T+1 settlement cycle" in the previous draft. Same fact. */
        a: 'It goes straight into your bank account, usually the next working day. The payment account is opened in your name, not ours, so we never hold your money and we take nothing per sale.',
    },
    {
        q: 'Who owns it when it is finished?',
        a: 'You do, all of it. The domain, the website, the photographs and every account are in your name from the first day. If you ever want to move to somebody else you take the lot with you, and we will help you move it.',
    },
    {
        q: 'Can I change things myself afterwards?',
        a: 'Yes. Changing a price, adding something new or marking it sold out takes about a minute, on your phone. We show you how on a call at the end and record it, so you can watch it again rather than having to remember.',
    },
    {
        q: 'Do I have to write it all?',
        a: 'No. Most people find describing their own business harder than they expect, so we talk to you, write it, and you tell us what we got wrong. If you would rather write it yourself that is fine, and it costs less.',
    },
    {
        q: 'What happens after it goes live?',
        a: 'It is yours and it keeps working whether or not you carry on with us. There is no monthly fee you have to pay to keep it switched on. If you want something changed later you message us.',
    },
];

/**
 * The questions people actually ask before they get in touch.
 *
 * ONE ARRAY, TWO CONSUMERS. DO NOT DUPLICATE THIS TEXT.
 *
 * ClFaq renders it and StructuredData emits it as an FAQPage node. On an
 * earlier build the rendered FAQ and the JSON-LD FAQ were typed
 * separately, drifted apart, and Google was served answers that were no
 * longer on the page. Both read from here so that cannot happen again.
 *
 * Answers stay short and stay honest. An FAQ that dodges the cost
 * question is worse than no FAQ, because the visitor now knows you did
 * not want to answer it.
 */
export const faqs = [
    {
        q: 'What does a website cost?',
        /* Derived from `pricing` above rather than typed again, so the
           band in the FAQ, the band in the price block and the band
           Google is told about cannot drift apart. */
        /* THE BAND IS DERIVED. THE PROSE IS NOT, DELIBERATELY.

           A first attempt built this sentence by string-mangling
           pricing.factors, which produced "What moves it: many pages, and
           how much of it is a catalogue; we write the words..." That is
           broken English: the factors are written as bullet fragments
           starting "How" and "Whether", and no amount of trimming turns a
           bullet into a clause.

           So the sentence is written by hand and summarises rather than
           enumerates. It has to stay true to pricing.factors, which is
           what npm run check:brand cannot check for you: if a factor is
           added that changes the SHAPE of the answer, edit this too. */
        a: `Most small business sites land between ${pricing.currency} ${pricing.from} and ${pricing.currency} ${pricing.to}. What moves it is the number of pages, whether we write the content and take the photographs, and whether you want the search and social work alongside the build. Anything that runs behind the site costs more: a dashboard to manage it and see your numbers, a database rather than fixed pages, or orders and replies going through the WhatsApp Business API. We will give you a fixed number before anything starts.`,
    },
    {
        q: 'Who owns the site when it is finished?',
        a: 'You do, completely. The domain, the code, the content and every account are in your name from the start. If you ever want to move to another studio you take all of it with you, and we will help with the handover.',
    },
    {
        q: 'Do you write the content, or do I have to?',
        a: 'We can write it. Most people find describing their own business harder than they expect, so we talk to you, draft it, and you correct anything we got wrong. If you would rather write it yourself that is fine and it brings the cost down.',
    },
    {
        q: 'I already have a website. Can you work with it?',
        a: 'Usually yes. Sometimes the right answer is to rebuild rather than patch, and if that is the case we will tell you why rather than quietly quoting for the bigger job. Either way you keep your domain and your search history.',
    },
    {
        q: 'What happens after it goes live?',
        a: 'The site is yours and it keeps working whether or not you carry on with us. If you want us to keep it current, handle the search and listings, and post to social, that is an ongoing arrangement we agree separately.',
    },
    {
        q: 'Will it work properly on a phone?',
        a: 'It is designed on the phone first and widened from there, because that is where most of your customers will see it. Nothing is squeezed down from a desktop layout as an afterthought.',
    },
    {
        q: 'Can it be in Tamil as well as English?',
        a: 'Yes. We build in both and we make sure the Tamil is set properly rather than dropped into a font that was only ever tested with English.',
    },
    {
        q: 'How do orders and enquiries reach me?',
        /* Widened from "most of our clients use WhatsApp" because that
           read as though WhatsApp were the only thing we build. It is
           the right default for a shop taking twenty orders a day, and
           it is the wrong answer for someone who wants to sell online
           properly. Both are offered; the recommendation is honest
           rather than whichever is easier to build. */
        a: 'However suits the way you sell. Most of our clients start on WhatsApp: the buttons on your site open a chat already addressed to you, with nothing for the customer to sign up for. If you would rather take payment on the site, we build that too, and orders land in your inbox and your dashboard instead. Plenty of businesses run both, with a cart for the regulars and a WhatsApp button for everyone who would rather just ask.',
    },
    {
        q: 'Can you build a proper online shop, with payments?',
        /* Written as a capability, not a portfolio. We have not shipped
           one of these yet, so there is no "we have built" and no
           implied case study. Naming the payment gateways is the useful
           part: it is the first thing anyone selling online in India
           wants to know, and it is checkable. */
        a: 'Yes. A catalogue, a cart, online payment through the usual Indian gateways such as Razorpay or a UPI collect, delivery charges, and stock that goes down when something sells. You get an order dashboard rather than a spreadsheet. It costs more than a brochure site because there is more to build and more to test, and we will tell you honestly if your volume does not justify it yet.',
    },
    {
        q: 'Is an online shop worth it for a small business?',
        /* The question a shop owner is actually asking underneath the
           previous one, and the place where saying "not yet" earns more
           trust than an upsell. No swipe at anyone, and no invented
           threshold: the advice is about their situation, not a number
           we made up. */
        a: 'Sometimes not, and we will say so. If most of your orders are repeat customers within a few kilometres, a catalogue and a WhatsApp button will serve you better than a checkout nobody uses. A shop earns its keep when you are selling to people who cannot walk in, shipping beyond your own town, or spending time every day retyping the same order into a bill. We would rather build you the smaller thing that works than the bigger thing that sits idle.',
    },
];

/**
 * The ten home-page questions, with ONE answer rewritten, for /newlanding-v4.
 *
 * faqs[0] answers the BAND. v4 shows three fixed prices a few screens
 * above the FAQ, and a band under fixed tiers is the contradiction a
 * cautious buyer opens first. The other nine are shared by reference so
 * they cannot drift. StructuredData receives this same array from the
 * page, per the one-array-two-consumers rule. Replace `faqs` with this
 * at promotion.
 */
export const v4Faqs = [
    {
        q: faqs[0].q,
        a: `A website is ${planPrice(plans[0])}. An advanced website with a dashboard, inventory, quotes and analytics is ${planPrice(plans[1])}. A full online shop that takes payments is ${planPrice(plans[2])}. Each is a one-time price, agreed before anything starts, and there is no monthly fee to keep the website switched on.`,
    },
    ...faqs.slice(1),
];

/* The categories the landing page's FAQ filters by, as indexes into
   v4Faqs. Three, because ten questions under one heading is a wall and
   ten under five headings is a taxonomy. A question can belong to one
   group; the "All" chip shows everything. */
export const v4FaqGroups = [
    { id: 'cost', label: 'Cost and ownership', questions: [0, 1, 4] },
    { id: 'build', label: 'Building it', questions: [2, 3, 5, 6] },
    { id: 'shop', label: 'Selling online', questions: [7, 8, 9] },
];

/**
 * The three service pages.
 *
 * WHY THESE EXIST AT ALL
 *
 * Six static pages have nothing to rank for. Somebody searching "website
 * designer Tirunelveli" or "GST billing software for small business"
 * needs a page that is about that thing, and the home page is about all
 * three at once.
 *
 * They are also a sales asset independent of search: this is what you
 * paste into a WhatsApp reply when a prospect asks what the SEO work
 * actually involves, instead of typing it out again.
 *
 * WHY ONLY THREE
 *
 * They map to the three service lines already named in ClBento, which is
 * the set we actually sell. A fourth page for something we do
 * occasionally would be a thin page, and thin pages rank worse than no
 * page. Each carries enough genuinely distinct content to be worth
 * indexing on its own.
 *
 * Every price band here derives from `pricing` above rather than being
 * typed again, so the figure a visitor sees on a service page cannot
 * drift from the one on the home page.
 */
export const services = [
    {
        slug: 'websites',
        nav: 'Websites',
        title: 'Website design and development',
        kicker: 'What we build',
        headline: 'A website that works on the phone in your customer’s hand',
        lede: `Designed around your business rather than a template with the colours swapped, built to load fast, and handed over in your name. Most sites land between ${pricing.currency} ${pricing.from} and ${pricing.currency} ${pricing.to}.`,
        seo: 'Website design and development in Tirunelveli and across Tamil Nadu. Mobile-first, fast, and you own the code.',
        includes: [
            {
                name: 'Designed for your business',
                text: 'We look at what you sell and who buys it before anything is drawn. The layout, the words and the order of the page follow from that, not from whichever template was nearest.',
            },
            {
                name: 'Built for the phone first',
                text: 'Laid out at the narrowest screen and widened from there, because that is the device your customers are holding. Nothing is a desktop page squeezed down.',
            },
            {
                name: 'Fast, and measured',
                text: 'Pages are rendered ahead of time and served as files rather than assembled on every visit. We check the numbers on every build rather than promising a score.',
            },
            {
                name: 'In English and Tamil',
                text: 'Both, properly set, with a Tamil face that was actually tested rather than whatever the browser falls back to.',
            },
            {
                name: 'Yours outright',
                text: 'The domain, the code, the content and every account are in your name from the start. If you leave us you take all of it, and we help with the handover.',
            },
            {
                name: 'Enquiries to your phone',
                text: 'A WhatsApp button that opens a chat already addressed to you, with nothing for the customer to sign up for. A form as well, if you want one.',
            },
            {
                name: 'Found by search from day one',
                text: 'Titles, descriptions, a sitemap and the structured data that puts your hours and address into a search result. Not an upsell; a site without it is half built.',
            },
            {
                name: 'Nothing to maintain',
                text: 'No plugins to update, no licence renewals, no admin login to forget. If you want to change something you message us, and if you would rather do it yourself we will show you how.',
            },
        ],
        /* WHAT LANDS IN YOUR HANDS. Concrete, countable, checkable.
           `includes` says how we work; this says what you end up owning,
           which is the thing a person needs before they say yes. */
        deliverables: [
            'A site of five to nine pages, or more if you sell a catalogue',
            'Every page written, not filled with placeholder text',
            'Your domain, bought and configured in your name',
            'A WhatsApp enquiry button on every page',
            'Google Analytics, reading your real traffic from day one',
            'A one hour handover call, recorded, so you can rewatch it',
        ],
        /* No dates. CLAUDE.md allows a timeline only inside the
           estimator, and there is no estimator. These are stages in
           order, which is true whatever the calendar says. */
        stages: [
            { name: 'The conversation', text: 'What you sell, who buys it, and what the site has to do. Free, about an hour, and you get an honest answer on whether you need one.' },
            { name: 'A layout to react to', text: 'One page, designed properly, so you are reacting to something real rather than to a description. Changed until it is right.' },
            { name: 'The build', text: 'The rest of the pages follow the approved one. You see it on a live link as it goes, not at the end.' },
            { name: 'Content and checks', text: 'Words, photographs, speed, the phone, both languages. The things that get skipped when a build is running late.' },
            { name: 'Live, and yours', text: 'Domain pointed, analytics on, accounts transferred to your name, and the handover call.' },
        ],
        /* Says what the client has to do. Nobody else on a services page
           does this, and it is the question that actually stalls a
           project in week two. */
        fromYou: [
            'Your logo, if you have one. If not, we will sort it out.',
            'Photographs of the real place, or permission to come and take them',
            'Prices, or a decision that prices are not going on the site',
            'One person who can say yes. Two is slow; three does not finish.',
        ],
        faqRefs: ['What does a website cost?', 'Who owns the site when it is finished?', 'Will it work properly on a phone?'],
    },
    {
        slug: 'seo',
        nav: 'Getting found',
        title: 'SEO and local listings',
        kicker: 'Getting found',
        headline: 'Show up when somebody nearby searches for what you sell',
        lede: 'The search, maps and directory work that puts your business in front of people already looking for it. Set up properly once, then kept current.',
        seo: 'Local SEO and Google Business Profile setup for small businesses in Tirunelveli and Tamil Nadu.',
        includes: [
            {
                name: 'Google Business Profile',
                text: 'Claimed, verified, categorised correctly, and filled in properly. This is the single biggest lever for a local business and it is the one most often left half done.',
            },
            {
                name: 'The pages search can read',
                text: 'Titles, descriptions and structured data that describe what you actually do, in the words people actually search for, rather than the words the industry uses internally.',
            },
            {
                name: 'Local listings',
                text: 'The directories that matter in your district, with your name, address and hours identical across all of them. Inconsistency there is what stops a business ranking.',
            },
            {
                name: 'Reviews, asked for properly',
                text: 'A way to ask that does not annoy people, and a habit of replying. We do not buy reviews and we will not work with anyone who wants to.',
            },
            {
                name: 'Reporting you can read',
                text: 'What people searched, what they clicked, and whether it went up. In plain language, not a dashboard nobody opens.',
            },
            {
                name: 'The map pin, correct',
                text: 'Pin placed where the door actually is, service area drawn to what you genuinely cover, and the categories that decide which searches you appear in at all.',
            },
            {
                name: 'The competition, read honestly',
                text: 'Who ranks above you nearby, and whether it is something we can change or something that comes with being older than you. You get told which.',
            },
            {
                name: 'Photographs on the profile',
                text: 'A profile with photographs gets opened. We put real ones up, geotagged and sized properly, rather than leaving the slot empty.',
            },
        ],
        deliverables: [
            'Google Business Profile claimed, verified and filled in',
            'Listings on the directories that matter here, not a list of 200',
            'Every page given a title and description written for a human',
            'A sitemap and robots file that search engines can actually read',
            'Schema markup so your hours and address show in results',
            'A monthly note in plain English: what moved and what did not',
        ],
        stages: [
            { name: 'What is there now', text: 'Where you already rank, what your profile says, and which listings have your old number on them. Most businesses have at least one.' },
            { name: 'Fix the profile', text: 'Categories, hours, service area, photographs, the description. This is the biggest lever for a local business and it is usually half empty.' },
            { name: 'Fix the site', text: 'Titles, descriptions, headings and the structured data. The pages have to be readable by a search engine before anything else matters.' },
            { name: 'Listings and reviews', text: 'The directories worth being on, and a way of asking customers for reviews that does not feel like begging.' },
            { name: 'Watch and adjust', text: 'Rankings move slowly and unevenly. We report what actually changed rather than a chart that always goes up.' },
        ],
        fromYou: [
            'Access to your Google account, or ten minutes to create one together',
            'Your correct hours, including the ones you keep on a Sunday',
            'The service area you genuinely cover, not the one you wish you did',
            'A few customers willing to leave an honest review',
        ],
        faqRefs: ['What happens after it goes live?', 'I already have a website. Can you work with it?'],
    },
    {
        slug: 'content-and-social',
        nav: 'Content and social',
        title: 'Content and social',
        kicker: 'Words and posts',
        headline: 'The words on the site, and the posts that point back to it',
        lede: 'Most people find describing their own business harder than they expect. We talk to you, write it, and you correct whatever we got wrong.',
        seo: 'Website copywriting and social media content for small businesses in Tamil Nadu, in English and Tamil.',
        includes: [
            {
                name: 'The site’s own words',
                text: 'Written after a conversation with you, not from a brief. You get a draft, you mark it up, we fix it. That loop is usually two rounds.',
            },
            {
                name: 'Photographs that are yours',
                text: 'Your shop, your work, your people, taken on a real visit. Stock photography of somebody else’s bakery is the fastest way to look like everybody else.',
            },
            {
                name: 'Posts on a schedule',
                text: 'Planned a month at a time so there is something to say on a slow week, and written in the same voice as the site rather than a different one.',
            },
            {
                name: 'Both languages',
                text: 'English and Tamil, written rather than translated. A machine translation of marketing copy reads as a machine translation.',
            },
            {
                name: 'Replies, not just posts',
                text: 'A comment or a message that goes unanswered for a week costs more than the post earned. We flag anything that needs you and draft the rest.',
            },
            {
                name: 'What worked, monthly',
                text: 'Which posts were actually seen and which were not, in plain English. Where something is not working we stop doing it rather than doing more of it.',
            },
            {
                name: 'Festival and season copy',
                text: 'Pongal, Diwali, the wedding months, the monsoon. The calendar your customers actually live by, written ahead of time rather than the morning of.',
            },
            {
                name: 'Yours to keep',
                text: 'Every photograph, caption and file sits in your own drive from the first day. If we stop working together you lose nothing.',
            },
        ],
        deliverables: [
            'Every page on the site written, in English and Tamil',
            'A photograph session at your place, and the edited files',
            'Twelve posts a month, scheduled, not twelve posts in one day',
            'Captions in both languages, written rather than translated',
            'A simple calendar so you can see what is going out and when',
            'The raw files, in your own drive, from the first day',
        ],
        stages: [
            { name: 'Learning the voice', text: 'A conversation, recorded. Most people describe their own business better out loud than in writing, and that is what we write from.' },
            { name: 'The photographs', text: 'Half a day at your place. The room, the work, the people, the thing you actually sell. Not stock.' },
            { name: 'The first month', text: 'Written, shown to you, corrected. You mark up the first batch properly and the ones after it need almost no changes.' },
            { name: 'Running it', text: 'Posts go out on a schedule you can see. If something is wrong you say so and it is fixed before it publishes.' },
        ],
        fromYou: [
            'Half a day for the photographs, on a day the place looks normal',
            'Someone who can answer a question about the business quickly',
            'Access to the social accounts, or help setting them up',
            'A view on anything you would never want said publicly',
        ],
        faqRefs: ['Do you write the content, or do I have to?', 'Can it be in Tamil as well as English?'],
    },
];

export function findService(slug) {
    return services.find((s) => s.slug === slug) ?? null;
}
