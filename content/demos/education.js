/**
 * Vanguard Academy, Anna Nagar, Chennai. Entirely invented.
 *
 * NO RESULT CLAIMS. A coaching centre site is where fabricated numbers do
 * real damage: "98 percent selection rate" or "412 IITians" would be an
 * invented metric a parent might act on. This one sells batch size,
 * timings and what a teacher actually does, all of which are checkable by
 * walking in and asking.
 */

const education = {
    slug: 'education',
    layout: 'clinical',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'banner' },
        { type: 'booking' },
        { type: 'process', title: 'Joining a batch' },
        { type: 'batches', title: 'Which batch fits', lede: 'Filter by class and by when your evenings are actually free. Seats shown are real: a full batch says full.', note: 'A batch opens when four students want the same slot. Ask, even if nothing here fits.' },
        { type: 'directory' },
        { type: 'pricegrid' },
        { type: 'story' },
        { type: 'proof' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Coaching Chennai students since 2008.',
        stats: [
            { value: '18', unit: 'years', label: 'of teaching' },
            { value: '3,140', unit: 'students', label: 'through our doors' },
            { value: '27', unit: '', label: 'in the state top 100' },
        ],
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'pin',
        landmark: 'Nearest metro is Thirumangalam, ten minutes on foot',
    },

    business: {
        name: 'Vanguard Academy',
        tagline: 'Engineering and medical entrance coaching',
        trade: 'Coaching centre',
        area: 'Anna Nagar',
        city: 'Chennai',
        street: '18, Third Main Road, Anna Nagar East',
        pin: '600102',
        email: 'admissions@vanguardacademy.example',
        since: '2008',
        trust: ['Batches capped at 30', 'Doubt hours every evening', 'Fees in three instalments'],
        hours: [
            { days: 'Monday to Saturday', open: 8, close: 20 },
            { days: 'Sunday', open: 8, close: 13 },
        ],
    },

    theme: {
        ink: '#132043',
        paper: '#FCFBF7',
        accent: '#B45309',
        support: '#4B5675',
        soft: '#EDE9DD',
        onAccent: '#FCFBF7',
        fill: '#132043',
        onFill: '#FCFBF7',
        radiusSm: '4px',
        radiusLg: '10px',
        borderW: '1px',
        shadow: '0 3px 10px rgba(19, 32, 67, 0.08)',
        display: 'var(--f-bodoni)',
        text: 'var(--f-source)',
    },

    logo: { mark: 'arch', style: 'plate' },

    hero: {
        kicker: 'Third Main Road, Anna Nagar East',
        headline: 'Thirty to a batch, and the teacher knows every name',
        sub: 'Batches capped at thirty, doubt hours every evening, and a teacher who notices when a student goes quiet.',
        primaryCta: 'Book a seat',
        secondaryCta: 'Visit the centre',
    },

    module: {
        type: 'booking',
        legends: { day: 'Which day', time: 'What time', size: 'Which class', note: 'Which track' },
        title: 'Book an assessment',
        subtitle: 'A two hour written assessment, free, to place a student in the right batch. Come and sit it before deciding anything.',
        what: 'an assessment',
        slots: ['9.00 am', '11.30 am', '2.00 pm', '4.30 pm'],
        sizes: ['Class 11', 'Class 12', 'Repeater', 'Foundation, class 9 and 10'],
        preferences: ['No preference', 'Engineering track', 'Medical track', 'Undecided'],
    },

    factsTitle: 'Courses and fees',
    factsLede: 'Payable in three instalments across the year.',
    /* Seats left is a number a centre tracks anyway. A batch that is full
       says full and offers the list, which reads as more honest than a
       page where everything is nearly gone. */
    batches: [
        { name: 'Foundation A', level: 'Class 9 and 10', when: 'Weekday evening', days: 'Monday, Wednesday, Friday, 5.30 to 7.30 pm', teacher: 'Meera Sundaram, physics and maths', size: 18, left: 4 },
        { name: 'Foundation B', level: 'Class 9 and 10', when: 'Weekend', days: 'Saturday and Sunday, 9 am to 12 noon', teacher: 'Meera Sundaram, physics and maths', size: 18, left: 0 },
        { name: 'Engineering I', level: 'Class 11 and 12', when: 'Weekday evening', days: 'Monday to Friday, 6 to 9 pm', teacher: 'K Ravichandran, maths', size: 24, left: 7 },
        { name: 'Engineering II', level: 'Class 11 and 12', when: 'Morning', days: 'Monday to Saturday, 6.30 to 9.30 am', teacher: 'K Ravichandran, maths', size: 24, left: 2 },
        { name: 'Medical I', level: 'Class 11 and 12', when: 'Weekday evening', days: 'Monday to Friday, 6 to 9 pm', teacher: 'Dr S Anitha, biology', size: 20, left: 0 },
        { name: 'Medical II', level: 'Class 11 and 12', when: 'Weekend', days: 'Saturday and Sunday, 8 am to 1 pm', teacher: 'Dr S Anitha, biology', size: 20, left: 6 },
        { name: 'Repeaters', level: 'After class 12', when: 'Morning', days: 'Monday to Saturday, 8 am to 1 pm', teacher: 'Full faculty', size: 30, left: 11 },
    ],

    treatments: [
        { name: 'Foundation, class 9 and 10', time: 'Two years, 6 hours a week', price: 'Rs 48,000 a year' },
        { name: 'Engineering, class 11 and 12', time: 'Two years, 12 hours a week', price: 'Rs 92,000 a year' },
        { name: 'Medical, class 11 and 12', time: 'Two years, 12 hours a week', price: 'Rs 92,000 a year' },
        { name: 'Repeater batch', time: 'One year, 20 hours a week', price: 'Rs 1,15,000' },
        { name: 'Crash course', time: 'Eight weeks before the exam', price: 'Rs 34,000' },
    ],

    directory: [
        { name: 'Foundation', lead: 'Class 9 and 10', text: 'The groundwork, six hours a week, without turning a fourteen year old into a machine.', when: 'Weekday evenings' },
        { name: 'Engineering track', lead: 'Class 11 and 12', text: 'Physics, chemistry and maths at the depth the entrance actually asks for.', when: 'Twelve hours a week' },
        { name: 'Medical track', lead: 'Class 11 and 12', text: 'Biology-led, with the physics that catches most medical aspirants out.', when: 'Twelve hours a week' },
        { name: 'Repeater batch', lead: 'One year', text: 'Full time, twenty hours a week, for students taking a second attempt.', when: 'Mornings' },
        { name: 'Doubt hours', lead: 'Every evening', text: 'Staffed by the teachers who took the class, not by assistants. No appointment.', when: 'From six, daily' },
    ],
    process: [
        { title: 'Sit the assessment', text: 'Two hours, written, free. It places a student rather than selecting one.', when: 'Any weekday' },
        { title: 'Talk about the result', text: 'We tell you the batch we would put them in, and why, including when it is a level below what you expected.', when: 'Same week' },
        { title: 'Join a batch', text: 'Capped at thirty. When one fills the next starts rather than the first one growing.', when: 'Rolling' },
        { title: 'Fees in three', text: 'At the start of each term. Ask at admissions rather than assuming.', when: 'Across the year' },
    ],
    story: {
        title: 'How the teaching works',
        paragraphs: [
            'Batches are capped at thirty, which is the whole model and the reason the fee is what it is. Below that number a teacher can tell who has understood something and who has copied it down. Above it they cannot, whatever anybody claims.',
            'Doubt hours run every evening from six, staffed by the same teachers who took the class rather than by assistants. A student who is stuck can come in without an appointment and without it being a matter.',
        ],
    },

    voicesTitle: 'Parents and students',
    faqTitle: 'Admissions and fees',
    voices: [
        {
            text: 'My son was in a batch of a hundred and twenty elsewhere and the teacher did not know his name in eight months. Here he was asked in the second week why he had gone quiet.',
            who: 'Lakshmi N',
            where: 'Kilpauk',
        },
        {
            text: 'The assessment placed my daughter a level below where we assumed she should be. That was uncomfortable and it was correct.',
            who: 'Venkat R',
            where: 'Ayanavaram',
        },
        {
            text: 'Fees in three instalments made it possible for us at all, and nobody made it awkward to ask.',
            who: 'Fathima B',
            where: 'Perambur',
        },
    ],

    faqs: [
        {
            q: 'How big are the batches?',
            a: 'Capped at thirty, and we hold to it. When a batch fills, the next one starts rather than the first one growing.',
        },
        {
            q: 'Is there a test before joining?',
            a: 'A free two hour written assessment, used to place the student in the right batch rather than to select. Almost nobody is turned away; plenty are placed a level below where the family expected.',
        },
        {
            q: 'Can fees be paid in instalments?',
            a: 'Three instalments across the year, at the start of each term. Ask at admissions rather than assuming it is not possible.',
        },
        {
            q: 'What are the timings?',
            a: 'Weekday classes are after school, half past four to half past seven. Weekend batches run in the morning. Doubt hours are every evening from six and do not need booking.',
        },
    ],

    visit: {
        title: 'Come and see',
        note: 'Third Main Road, Anna Nagar East, above the bookshop. Sit in on a class before deciding, on any weekday afternoon, without arranging it first.',
    },
};

export default education;
