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
 * The price band shown near the contact section.
 *
 * A BAND, NOT A PRICE LIST, AND DELIBERATELY NOT A PRICING PAGE.
 *
 * Price is the objection that ends most enquiries before they start: a
 * small business owner who cannot guess whether this costs twenty
 * thousand or two lakh assumes the worse number and does not write. A
 * range near the CTA answers that. A pricing PAGE does the opposite, by
 * inviting line-item comparison against whoever is cheapest and turning
 * a conversation into a procurement exercise.
 *
 * NO TIMELINE HERE. CLAUDE.md allows delivery estimates only inside the
 * estimator, where a band is clamped against a scope the visitor
 * actually selected, and the estimator does not exist. A number of weeks
 * quoted against a project nobody has described yet is a promise made
 * before anything is known.
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
