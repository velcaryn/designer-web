/**
 * Aura Luxe, Jubilee Hills, Hyderabad. Entirely invented.
 *
 * A salon books appointments, so it shares the booking module with the
 * restaurant and the hotel. The service list carries durations because
 * that is what people are actually planning around.
 */

const wellness = {
    slug: 'wellness-and-beauty',
    layout: 'editorial',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'split' },
        { type: 'booking' },
        { type: 'pricegrid' },
        { type: 'lookbook', title: 'What actually happens', lede: 'The preparation nobody tells you about until you are already in the chair.' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Open in Jubilee Hills since 2017.',
        award: 'Salon of the Year, Hyderabad Style Guild 2024',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'pin',
        landmark: 'Road 36, Jubilee Hills',
    },

    business: {
        name: 'Aura Luxe',
        tagline: 'Salon and Ayurvedic treatments',
        trade: 'Salon and spa',
        area: 'Jubilee Hills',
        city: 'Hyderabad',
        street: 'Road 36, Jubilee Hills',
        pin: '500033',
        email: 'bookings@auraluxe.example',
        since: '2017',
        trust: ['Patch test before colour', 'Single use on everything disposable', 'Price confirmed before we start', '9 years in Jubilee Hills'],
        hours: [
            { days: 'Tuesday to Sunday', open: 10, close: 20.5 },
            { days: 'Sunday', open: 10, close: 19 },
        ],
    },

    theme: {
        ink: '#2A0F33',
        paper: '#FBF6FE',
        accent: '#9333EA',
        support: '#6B4E75',
        soft: '#F1E4FA',
        onAccent: '#FBF6FE',
        fill: '#2A0F33',
        onFill: '#FBF6FE',
        radiusSm: '14px',
        radiusLg: '26px',
        borderW: '0px',
        shadow: '0 10px 28px rgba(42, 15, 51, 0.10)',
        display: 'var(--f-bricolage)',
        text: 'var(--f-figtree)',
    },

    logo: { mark: 'spark', style: 'stamp' },

    hero: {
        kicker: 'Road 36, Jubilee Hills',
        headline: 'Told the price before the scissors, not after',
        sub: 'Cut, colour and Ayurvedic treatments. Every service carries a time and a price.',
        primaryCta: 'Book a slot',
        secondaryCta: 'See the salon',
    },

    module: {
        type: 'booking',
        legends: { day: 'Which day', time: 'What time', size: 'What for', note: 'Anything to note' },
        title: 'Book a slot',
        subtitle: 'Pick a day and a time and we will confirm who is free.',
        what: 'an appointment',
        slots: ['10.00 am', '11.30 am', '1.00 pm', '3.30 pm', '5.00 pm', '6.30 pm'],
        sizes: ['Cut and finish', 'Colour', 'Facial', 'Ayurvedic massage', 'Bridal trial'],
        preferences: ['No preference', 'Same stylist as last time', 'First appointment of the day', 'Quiet room'],
    },

    factsTitle: 'The service list',
    factsLede: 'Every service carries a time and a price.',
    looks: [
        { name: 'Global colour', time: 'About two hours', before: 'Do not wash your hair for a day or two. Colour takes better on hair that is not freshly stripped.', during: 'A patch test forty-eight hours earlier, every time, including for regulars. Then a strand test before the full application.', after: 'Sulphate-free shampoo, and leave it three days before the first wash.' },
        { name: 'Balayage', time: 'Three hours, sometimes four', before: 'Bring a photograph. Two people can say ash blonde and mean completely different things.', during: 'Painted freehand, so it grows out softly instead of leaving a line.', after: 'A gloss refresh at about ten weeks, not a full redo.' },
        { name: 'Cut and finish', time: '45 minutes', before: 'Come with your hair the way you usually wear it, not styled for the appointment.', during: 'Cut dry if the texture needs reading, wet if the shape does.', after: 'Nothing at all. That is the point of a cut that suits you.' },
        { name: 'Keratin treatment', time: 'Three hours', before: 'Tell us about any colour in the last two weeks. It changes what we can safely use.', during: 'Sectioned, sealed and cooled. The room smells for a while and there is no way around it.', after: 'No tying, no clips and no washing for three days. This is the part people skip and regret.' },
        { name: 'Ayurvedic head massage', time: 'An hour', before: 'Eat something light beforehand. On an empty stomach it can leave you lightheaded.', during: 'Warm oil, worked in slowly. Some people fall asleep and that is fine.', after: 'Leave the oil in overnight if you can manage it.' },
        { name: 'Bridal trial', time: 'Two hours, by appointment only', before: 'Bring the jewellery, the dupatta and the photographs. All three change the decisions.', during: 'Full hair and makeup as it would be on the day, photographed in daylight and in artificial light.', after: 'Nothing is booked until you have seen it in both. Trials are never charged twice.' },
    ],

    treatments: [
        { name: 'Cut and finish', time: '45 minutes', price: 'Rs 900' },
        { name: 'Global colour', time: '2 hours', price: 'From Rs 3,500' },
        { name: 'Balayage', time: '3 hours', price: 'From Rs 6,000' },
        { name: 'Classic facial', time: '60 minutes', price: 'Rs 1,800' },
        { name: 'Abhyanga massage', time: '75 minutes', price: 'Rs 2,600' },
        { name: 'Shirodhara', time: '60 minutes', price: 'Rs 3,200' },
        { name: 'Bridal package', time: 'Full day', price: 'From Rs 24,000' },
    ],

    story: {
        title: 'How we work',
        paragraphs: [
            'Colour starts with a patch test forty-eight hours before, every time, including for regulars. It is a nuisance and it is not negotiable, because the one time it matters it matters a great deal.',
            'The Ayurvedic room is separate from the salon floor and quieter. Oils are mixed for the treatment rather than poured from a shared bottle, and the therapist will ask about anything you are being treated for before starting.',
        ],
    },

    voicesTitle: 'From the chair',
    faqTitle: 'Booking and aftercare',
    voices: [
        {
            text: 'I asked for a big colour change and was talked out of it, into something that suited me better and cost less. That is not what usually happens in a salon.',
            who: 'Sneha R',
            where: 'Banjara Hills',
        },
        {
            text: 'Booked a bridal trial. They wrote down everything we settled on and did exactly that on the day, three months later.',
            who: 'Aarthi M',
            where: 'Madhapur',
        },
        {
            text: 'The shirodhara room is genuinely quiet. No music, no talking, nobody putting their head round the door.',
            who: 'Priyanka D',
            where: 'Jubilee Hills',
        },
    ],

    faqs: [
        {
            q: 'Do I need a patch test?',
            a: 'For any colour, yes, forty-eight hours ahead, and for every visit rather than once. Sensitivities develop. It takes two minutes and you can do it while collecting something else.',
        },
        {
            q: 'Can I ask for the same stylist?',
            a: 'Yes, say so when you book. If they are not free that day you will be told before you come rather than when you arrive.',
        },
        {
            q: 'What if it takes longer than quoted?',
            a: 'You are asked first. If a colour needs a second process, the price and the extra time are confirmed before it starts, not added at the counter.',
        },
        {
            q: 'Is the Ayurvedic treatment suitable during pregnancy?',
            a: 'Some of it, with modification, and some of it not. Tell the therapist when you book and they will say what is appropriate rather than working it out on the table.',
        },
    ],

    visit: {
        title: 'The salon',
        note: 'Road 36, first floor above the coffee shop, with the lift at the back of the building. Parking is on the road; it fills up after six.',
    },
};

export default wellness;
