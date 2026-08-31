/**
 * CareLife Healthcare, RS Puram, Coimbatore. Entirely invented.
 *
 * NO ACCREDITATION NUMBERS, NO BED COUNTS DRESSED AS ACHIEVEMENTS, NO
 * "99.9% success rate". A hospital site is where invented metrics do the
 * most damage, because a patient may act on them. Departments, consulting
 * hours and what a check-up includes are all checkable by walking in.
 */

const hospital = {
    slug: 'hospital',
    layout: 'clinical',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'split' },
        { type: 'directory', title: 'Departments' },
        { type: 'proof' },
        { type: 'where', title: 'Where to go', lede: 'The board that hangs in the lobby, on the page. If you are unsure, the front office will walk you there.' },
        { type: 'roster' },
        { type: 'pricegrid' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Looking after Coimbatore families since 2003.',
        stats: [
            { value: '23', unit: 'years', label: 'of care' },
            { value: '14', unit: 'departments', label: 'under one roof' },
            { value: '240', unit: 'beds', label: 'including 40 critical care' },
        ],
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'card',
        landmark: 'Thadagam Road, RS Puram',
        direction: 'Emergency entrance is on the north side with its own parking.',
    },

    business: {
        name: 'CareLife Healthcare',
        tagline: 'Multi-speciality, with emergency through the night',
        trade: 'Hospital',
        area: 'RS Puram',
        city: 'Coimbatore',
        street: '9, Thadagam Road, RS Puram',
        pin: '641002',
        email: 'reception@carelifehealth.example',
        since: '2003',
        trust: ['Emergency open through the night', 'Pharmacy on site', 'Insurance desk on the ground floor'],
        hours: [
            { days: 'Emergency', open: 0, close: 24 },
            { days: 'Sunday', open: 0, close: 24 },
        ],
    },

    theme: {
        ink: '#082F49',
        paper: '#F2F9FE',
        accent: '#0284C7',
        support: '#41637A',
        soft: '#D9EDF9',
        onAccent: '#F2F9FE',
        fill: '#0284C7',
        onFill: '#F2F9FE',
        radiusSm: '6px',
        radiusLg: '12px',
        borderW: '1px',
        shadow: '0 4px 12px rgba(8, 47, 73, 0.08)',
        display: 'var(--f-jakarta)',
        text: 'var(--f-source)',
    },

    logo: { mark: 'cross', style: 'stamp' },

    hero: {
        kicker: 'Thadagam Road, RS Puram',
        headline: 'Emergency does not close, and someone is always in',
        sub: 'Casualty staffed through the night, a pharmacy that does not shut, and an insurance desk that answers first.',
        primaryCta: 'See the OPD roster',
        secondaryCta: 'Find the hospital',
    },

    module: {
        type: 'roster',
        title: 'Outpatient consulting hours',
        subtitle: 'Emergency is open through the night regardless of what is listed here.',
        doctors: [
            {
                name: 'Dr Meenakshi Sundaram',
                role: 'General medicine',
                qual: 'MBBS, MD',
                days: [{ day: 'Monday to Saturday', time: '9.00 am to 1.00 pm' }],
            },
            {
                name: 'Dr Ravi Shankar',
                role: 'Cardiology',
                qual: 'MBBS, DM',
                days: [
                    { day: 'Monday, Wednesday, Friday', time: '10.00 am to 1.00 pm' },
                    { day: 'Thursday', time: '5.00 pm to 7.30 pm' },
                ],
            },
            {
                name: 'Dr Kavitha Rajan',
                role: 'Obstetrics',
                qual: 'MBBS, MS',
                days: [{ day: 'Tuesday to Saturday', time: '10.00 am to 2.00 pm' }],
            },
            {
                name: 'Dr Arun Prabhu',
                role: 'Orthopaedics',
                qual: 'MBBS, MS',
                days: [
                    { day: 'Monday to Friday', time: '11.00 am to 2.00 pm' },
                    { day: 'Saturday', time: '9.00 am to 12.00 pm' },
                ],
            },
            {
                name: 'Dr Nirmala Devi',
                role: 'Paediatrics',
                qual: 'MBBS, DCH',
                days: [{ day: 'Monday to Saturday', time: '9.30 am to 12.30 pm' }],
            },
        ],
    },

    factsTitle: 'What things cost',
    factsLede: 'Before insurance. The desk confirms your cover first.',
    /* The lobby board, inverted from the directory: starts at the symptom,
       ends at a counter. Signposting, never triage. See the header of
       components/demo/sections/DeptFinder.js. */
    emergency: 'Go straight to the emergency entrance on the north side. Do not take a token, do not join a queue, and do not wait to be asked.',

    routes: [
        { complaint: 'Chest pain, breathlessness, one-sided weakness', dept: 'Emergency, straight in', at: 'Own entrance on the north side, open through the night' },
        { complaint: 'Fever, cough, stomach upset', dept: 'General medicine', at: 'Ground floor, counter 2' },
        { complaint: 'A child under twelve, anything at all', dept: 'Paediatrics', at: 'First floor, own waiting area' },
        { complaint: 'Pregnancy, and everything after', dept: 'Obstetrics and gynaecology', at: 'Second floor, counter 6' },
        { complaint: 'A fall, a fracture, a joint that has stopped working', dept: 'Orthopaedics', at: 'Ground floor, counter 4' },
        { complaint: 'Blood tests, scans, anything a doctor wrote down', dept: 'Diagnostics', at: 'Ground floor, rear block' },
        { complaint: 'Admission, insurance, a bill to settle', dept: 'Front office', at: 'Main lobby, first desk on the left' },
    ],

    treatments: [
        { name: 'Outpatient consultation', time: 'By department', price: 'Rs 600' },
        { name: 'Basic health check', time: 'Half a morning, fasting', price: 'Rs 2,400' },
        { name: 'Cardiac screening', time: 'ECG, echo, consultation', price: 'Rs 4,800' },
        { name: 'Antenatal package', time: 'Across the pregnancy', price: 'Rs 18,000' },
        { name: 'Emergency registration', time: 'Any hour', price: 'Rs 900' },
    ],

    directory: [
        { name: 'Emergency and trauma', lead: 'Open through the night', text: 'A doctor physically present rather than on call, with its own entrance and parking at the back.', when: 'Always open' },
        { name: 'General medicine', lead: 'Dr Meenakshi Sundaram', text: 'Fever, infection, diabetes review and the things that do not fit anywhere else.', when: 'Monday to Saturday, mornings' },
        { name: 'Cardiology', lead: 'Dr Ravi Shankar', text: 'ECG, echo and stress testing on site. Angiography referred out.', when: 'Mon, Wed, Fri and Thursday evening' },
        { name: 'Obstetrics', lead: 'Dr Kavitha Rajan', text: 'Antenatal through delivery, with the scan room on the same floor.', when: 'Tuesday to Saturday' },
        { name: 'Orthopaedics', lead: 'Dr Arun Prabhu', text: 'Fractures, joint pain and post-surgical follow up.', when: 'Weekdays and Saturday morning' },
        { name: 'Paediatrics', lead: 'Dr Nirmala Devi', text: 'Vaccination, growth review and the two in the morning fevers.', when: 'Monday to Saturday, mornings' },
    ],
    story: {
        title: 'What to bring',
        paragraphs: [
            'Any previous reports, the medicines you are currently taking in their own boxes, and your insurance card if you have one. The insurance desk is on the ground floor and open until eight; they will tell you what is covered before treatment starts, which is a conversation better had early.',
            'Casualty is round the back, with its own entrance and its own parking, because arriving at an emergency and finding no space is a particular kind of awful.',
        ],
    },

    voicesTitle: 'Patient families',
    faqTitle: 'Admissions and insurance',
    voices: [
        {
            text: 'Brought my father in at two in the morning with chest pain. The casualty team had him on an ECG inside four minutes and the cardiologist was there by half past.',
            who: 'Balaji R',
            where: 'Saibaba Colony',
        },
        {
            text: 'The insurance desk told me exactly what would not be covered before we started, in writing. Nobody had ever done that for us before.',
            who: 'Shanthi K',
            where: 'Peelamedu',
        },
        {
            text: 'My mother is eighty-one and the orthopaedic team explained the same thing to her three times without any impatience.',
            who: 'Deepak N',
            where: 'RS Puram',
        },
    ],

    faqs: [
        {
            q: 'Is emergency really open through the night?',
            a: 'Yes, every night, with a doctor physically present rather than on call. The pharmacy attached to casualty is also open through the night.',
        },
        {
            q: 'Do I need to book an outpatient appointment?',
            a: 'It is better to. Walk-ins are seen after the booked patients and the wait in a busy department can be two hours. Emergency is never a queue.',
        },
        {
            q: 'Which insurers do you work with?',
            a: 'Most major insurers for cashless treatment. Bring your card and the desk will confirm before admission. If yours is not on the list they will tell you straight away rather than after the paperwork.',
        },
        {
            q: 'Can a relative stay overnight?',
            a: 'One attendant per patient in the wards, and there is a chair that folds flat. Intensive care allows visits at fixed hours only, which is about infection rather than convenience.',
        },
    ],

    visit: {
        title: 'Finding us',
        note: 'On Thadagam Road, past the RS Puram junction. Outpatient entrance is the main one; casualty has its own entrance and parking round the back, signposted from the road.',
    },
};

export default hospital;
