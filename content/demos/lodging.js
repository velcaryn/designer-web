/**
 * The Grand Palms, Guindy, Chennai. Entirely invented.
 *
 * A business hotel is the counterweight to the home stay: same booking
 * module, entirely different register. Corporate, efficient, priced by
 * the room type, and the copy sells proximity and predictability rather
 * than atmosphere.
 */

const lodging = {
    slug: 'lodging',
    layout: 'clinical',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'fullbleed' },
        { type: 'booking' },
        { type: 'pricegrid' },
        { type: 'avail', title: 'Rooms and what they really cost', lede: 'The same room carries three prices depending on how you book. Rather than hide that, here it is.', note: 'The travel site rate is higher because roughly a fifth of it goes to the travel site. Booking direct is genuinely cheaper for you and better for us, which is why it is the only rate we advertise.' },
        { type: 'gallery', title: 'The hotel' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Open every day since 2015.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'card',
        landmark: 'Mount Poonamallee Road, Guindy',
        direction: 'Fifteen minutes from the airport outside peak hours. Airport drop included.',
    },

    business: {
        name: 'The Grand Palms',
        tagline: 'Business rooms and banquets, ten minutes from the airport',
        trade: 'Hotel',
        area: 'Guindy',
        city: 'Chennai',
        street: '112, Mount Poonamallee Road, Guindy',
        pin: '600032',
        email: 'reservations@grandpalms.example',
        since: '2015',
        trust: ['Airport pickup arranged', 'Late checkout on request', 'GST invoice on checkout'],
        hours: [
            { days: 'Reception', open: 0, close: 24 },
            { days: 'Sunday', open: 0, close: 24 },
        ],
    },

    theme: {
        ink: '#0F172A',
        paper: '#F8FAFC',
        accent: '#4F46E5',
        support: '#475569',
        soft: '#E2E8F0',
        onAccent: '#F8FAFC',
        fill: '#0F172A',
        onFill: '#F8FAFC',
        radiusSm: '6px',
        radiusLg: '12px',
        borderW: '1px',
        shadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
        display: 'var(--f-jakarta)',
        text: 'var(--f-inter)',
    },

    logo: { mark: 'arch', style: 'plate' },

    hero: {
        kicker: 'Mount Poonamallee Road, Guindy',
        headline: 'Ten minutes from the airport, and quiet',
        sub: 'Ninety-four rooms, three meeting rooms, and a banquet hall that seats two hundred.',
        primaryCta: 'Check availability',
        secondaryCta: 'Find us',
    },

    module: {
        type: 'booking',
        legends: { day: 'Arriving', time: 'How long', size: 'Which room', note: 'Anything to note' },
        title: 'Check availability',
        subtitle: 'Tell us when and what, and reception will confirm within the hour.',
        what: 'a room',
        slots: ['1 night', '2 nights', '3 nights', 'A week', 'Longer'],
        sizes: ['Deluxe, single', 'Deluxe, twin', 'Executive suite', 'Banquet hall'],
        preferences: ['No preference', 'High floor', 'Away from the lift', 'Early check in'],
    },

    factsTitle: 'Rooms and rates',
    factsLede: 'Breakfast included in the deluxe and executive rates.',
    /* The same room at three prices. Saying out loud that the travel site
       rate is higher, and why, is the point of the section. */
    channels: [
        { key: 'direct', label: 'Booked direct', best: true },
        { key: 'walkin', label: 'Walk in' },
        { key: 'ota', label: 'Through a travel site' },
    ],

    roomTypes: [
        { name: 'Deluxe, single', sleeps: 'One guest', has: ['King bed', 'Work desk', 'Breakfast', 'Airport drop'], rates: { direct: 'Rs 4,800', walkin: 'Rs 5,200', ota: 'Rs 5,900' } },
        { name: 'Deluxe, twin', sleeps: 'Two guests', has: ['Two single beds', 'Work desk', 'Breakfast', 'Airport drop'], rates: { direct: 'Rs 5,600', walkin: 'Rs 6,100', ota: 'Rs 6,800' } },
        { name: 'Executive', sleeps: 'Two guests', has: ['King bed', 'Sitting area', 'Breakfast', 'Airport drop', 'Late checkout'], rates: { direct: 'Rs 7,400', walkin: 'Rs 7,900', ota: 'Rs 8,700' }, note: 'Corner rooms on the seventh and eighth floors, quieter than the road side.' },
        { name: 'Suite', sleeps: 'Two guests, extra bed on request', has: ['Separate living room', 'Breakfast', 'Airport drop', 'Late checkout', 'Lounge access'], rates: { direct: 'Rs 11,200', walkin: 'Rs 11,900', ota: 'Rs 12,800' } },
    ],

    treatments: [
        { name: 'Deluxe room, single', time: 'Breakfast included', price: 'Rs 4,800' },
        { name: 'Deluxe room, twin', time: 'Breakfast included', price: 'Rs 5,600' },
        { name: 'Executive suite', time: 'Breakfast and lounge access', price: 'Rs 9,200' },
        { name: 'Meeting room, half day', time: 'Up to 20 people', price: 'Rs 12,000' },
        { name: 'Banquet hall', time: 'Up to 200, catering separate', price: 'From Rs 85,000' },
    ],

    story: {
        title: 'What to expect',
        paragraphs: [
            'Reception is staffed through the night and the kitchen runs until midnight. Airport pickup takes about fifteen minutes outside peak hours and closer to forty during them, which we will tell you honestly when you ask rather than after you have landed.',
            'Meeting rooms come with the things people actually need: power at every seat, a screen that works, and someone who will answer within a minute if it does not. The banquet hall is booked more often for weddings than for conferences and the catering is handled by a kitchen team who do this several times a week.',
        ],
    },

    voicesTitle: 'Guest feedback',
    faqTitle: 'Rooms, rates and check in',
    voices: [
        {
            text: 'I stay here four or five times a year. The room is the same room every time, which sounds like faint praise and is the entire reason I keep booking it.',
            who: 'Vikram S',
            where: 'Hyderabad',
        },
        {
            text: 'Held a two hundred person function in the banquet hall. The catering team had done the same thing the previous weekend and it showed.',
            who: 'Lakshmi and Ganesh',
            where: 'Chennai',
        },
        {
            text: 'Asked for a late checkout at eight in the morning and got it without a discussion about policy.',
            who: 'Rohan M',
            where: 'Mumbai',
        },
    ],

    faqs: [
        {
            q: 'How far is the airport?',
            a: 'About seven kilometres. Ten to fifteen minutes at night, up to forty in the morning peak. We will arrange a pickup if you send the flight number.',
        },
        {
            q: 'Is breakfast included?',
            a: 'In the deluxe and executive rates, yes. It runs from half past six to half past ten, which covers most early flights.',
        },
        {
            q: 'Do you give a GST invoice?',
            a: 'Yes, on checkout, with your company name and GSTIN if you give them at check in. Ask at reception rather than after you have left.',
        },
        {
            q: 'Can I book the banquet hall without catering?',
            a: 'Yes, though most people do not. The hall alone is priced separately and outside caterers are allowed with notice.',
        },
    ],

    visit: {
        title: 'Where we are',
        note: 'On Mount Poonamallee Road, past the Guindy junction heading west. Parking is under the building; the entrance ramp is on the left before the main door.',
    },
};

export default lodging;
