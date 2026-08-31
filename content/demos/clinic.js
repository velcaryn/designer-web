/**
 * Dr Radhakrishnan Family Clinic, Anna Nagar, Chennai. Invented.
 *
 * NO REGISTRATION NUMBERS. A doctor's medical council registration is a
 * real identifier belonging to a real person, and inventing one on a page
 * that gets forwarded is a claim about a regulated profession. The
 * doctors here have names, qualifications and consulting hours, which is
 * what a patient is actually looking for, and no numbers.
 */

const clinic = {
    slug: 'clinic',
    layout: 'clinical',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'split' },
        { type: 'queue', title: 'How long is the wait', lede: 'Tokens are issued at the desk from the start of each session. This is an estimate, not a promise: one difficult consultation moves everything behind it.', note: 'Anyone who arrives genuinely unwell is seen out of turn, and nobody in the room has ever objected.' },
        { type: 'pricegrid' },
        { type: 'directory', title: 'What we do here' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'The same doctor, the same room, since 1996.',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'pin',
        landmark: 'Second Avenue, Anna Nagar West',
    },

    business: {
        name: 'Dr Radhakrishnan Family Clinic',
        tagline: 'General practice and diagnostics since 1996',
        trade: 'Family clinic',
        area: 'Anna Nagar',
        city: 'Chennai',
        street: '44, Second Avenue, Anna Nagar West',
        pin: '600040',
        email: 'appointments@drrfamilyclinic.example',
        since: '1996',
        trust: ['Walk in or book', 'Lab on site', 'Vaccination records kept', 'The same doctor since 1996'],
        hours: [
            { days: 'Monday to Saturday', open: 9, close: 20.5 },
            { days: 'Sunday', open: 9, close: 12.5 },
        ],
    },

    theme: {
        ink: '#172554',
        paper: '#F5F8FF',
        accent: '#2563EB',
        support: '#4C5B7A',
        soft: '#DCE7FB',
        onAccent: '#F5F8FF',
        fill: '#2563EB',
        onFill: '#F5F8FF',
        radiusSm: '8px',
        radiusLg: '14px',
        borderW: '1px',
        shadow: '0 4px 14px rgba(23, 37, 84, 0.08)',
        display: 'var(--f-lexend)',
        text: 'var(--f-inter)',
    },

    logo: { mark: 'cross', style: 'plate' },

    hero: {
        kicker: 'Second Avenue, Anna Nagar West',
        headline: 'The clinic your family has been going to since 1996',
        sub: 'General practice, childhood vaccinations, and a lab on the premises. Walk in, or book a slot.',
        primaryCta: 'How long is the wait',
        secondaryCta: 'Find the clinic',
    },

    module: {
        /* Drives the hero CTA anchor and the nav label, so it has to name a
           section this demo actually renders. The roster was replaced by the
           token queue: a family clinic's patients already know the doctor,
           and the only live question is the wait. */
        type: 'queue',
        title: 'Who is in, and when',
        subtitle: 'Consulting hours change occasionally. What is here is this week.',
        doctors: [
            {
                name: 'Dr S Radhakrishnan',
                role: 'General physician',
                qual: 'MBBS, MD',
                days: [
                    { day: 'Monday to Friday', time: '9.00 am to 1.00 pm' },
                    { day: 'Monday, Wednesday, Friday', time: '5.00 pm to 8.00 pm' },
                ],
            },
            {
                name: 'Dr Anjali Menon',
                role: 'Paediatrics',
                qual: 'MBBS, DCH',
                days: [
                    { day: 'Tuesday, Thursday, Saturday', time: '10.00 am to 1.00 pm' },
                    { day: 'Saturday', time: '4.00 pm to 7.00 pm' },
                ],
            },
            {
                name: 'Dr Prakash Iyer',
                role: 'Diabetology',
                qual: 'MBBS, DNB',
                days: [{ day: 'Tuesday and Friday', time: '6.00 pm to 8.30 pm' }],
            },
        ],
    },

    factsTitle: 'Consultations and tests',
    factsLede: 'Paid at the desk. No package, no upsell.',
    /* Decimal-free minutes from midnight, matching the hours convention
       used elsewhere in the corpus. 9.5 hours is 570. */
    sessions: [
        { label: 'Morning', from: 8 * 60 + 30, to: 12 * 60 + 30, cap: 30 },
        { label: 'Evening', from: 17 * 60, to: 20 * 60 + 30, cap: 26 },
    ],

    treatments: [
        { name: 'General consultation', time: 'Walk in or booked', price: 'Rs 400' },
        { name: 'Paediatric consultation', time: 'Booked', price: 'Rs 500' },
        { name: 'Blood sugar, fasting', time: 'Report same day', price: 'Rs 120' },
        { name: 'Full blood count', time: 'Report same day', price: 'Rs 350' },
        { name: 'Lipid profile', time: 'Report same day', price: 'Rs 700' },
        { name: 'Childhood vaccination', time: 'By schedule', price: 'At cost, plus Rs 100' },
    ],

    directory: [
        { name: 'General practice', lead: 'Walk in or book', text: 'The everyday things. Take a number in the morning or book a slot for the evening session.', when: 'Every day' },
        { name: 'Paediatrics', lead: 'Dr Anjali Menon', text: 'Childhood illness, growth checks and the vaccination card we keep on file.', when: 'Tue, Thu, Sat' },
        { name: 'Diabetology', lead: 'Dr Prakash Iyer', text: 'Review, dose adjustment and the foot check people skip.', when: 'Tuesday and Friday evening' },
        { name: 'Lab', lead: 'On the premises', text: 'Routine blood work reported the same day rather than sent out and chased.', when: 'Mornings, fasting from 8' },
    ],
    story: {
        title: 'How it works',
        paragraphs: [
            'Walk in and take a number, or book a slot and come at that time. Mornings are busiest between half past nine and eleven; the evening session is usually quieter after seven.',
            'The lab is on the premises, so routine blood work is reported the same day rather than sent out and chased. Vaccination records are kept here and a card is issued, which matters more than people expect when a school asks for it eight years later.',
        ],
    },

    voicesTitle: 'From the neighbourhood',
    faqTitle: 'Timings and appointments',
    voices: [
        {
            text: 'Three generations of my family have seen Dr Radhakrishnan. He remembers which of us is allergic to what without looking it up.',
            who: 'Suresh K',
            where: 'Anna Nagar',
        },
        {
            text: 'Took my daughter in with a fever at seven in the evening and we were seen in twenty minutes. The paediatrician explained everything to her, not to me.',
            who: 'Divya R',
            where: 'Mogappair',
        },
        {
            text: 'The lab report came the same afternoon. At the corporate place it took three days and two phone calls.',
            who: 'Ganesh V',
            where: 'Villivakkam',
        },
    ],

    faqs: [
        {
            q: 'Do I need an appointment?',
            a: 'Not for general consultation. Take a number and wait. For paediatrics and diabetology it is better to book, because those are specific sessions and they fill up.',
        },
        {
            q: 'How long do lab reports take?',
            a: 'Routine blood work the same day, usually within four hours. Anything sent to an outside lab takes two to three days and you will be told which is which before you pay.',
        },
        {
            q: 'Do you keep vaccination records?',
            a: 'Yes, and a card is issued. Bring the card each time. If it is lost we can reprint from the file, which is the reason the file exists.',
        },
        {
            q: 'What if it is an emergency?',
            a: 'Come straight in and say so at the desk. If it needs a hospital we will stabilise and send you to one rather than keep you here.',
        },
    ],

    visit: {
        title: 'Where we are',
        note: 'Second Avenue, opposite the park, ground floor with the blue board. Parking on the street is easier in the evening session than in the morning.',
    },
};

export default clinic;
