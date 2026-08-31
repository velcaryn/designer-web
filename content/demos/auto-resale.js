/**
 * Nellai Pre-Owned Motors, Tirunelveli. Entirely invented.
 *
 * The third automobile demo and the third distinct shape: the car service
 * leads with fixed-price packages and a booking, the bike service with a
 * live ramp board, and this one with a stock table. A used-vehicle buyer
 * is comparing rows, which is what a spec table is for.
 *
 * NO REGISTRATION NUMBERS. A plausible TN registration on a page people
 * forward is a real vehicle's plate. Stock references carry a letter
 * prefix and stay short, for the same reason the freight demo's
 * consignment numbers do.
 */

const autoResale = {
    slug: 'auto-resale',
    layout: 'catalogue',

    sections: [
        { type: 'hero', variant: 'banner' },
        { type: 'spectable', title: 'In the yard this week' },
        { type: 'compare', title: 'Put two side by side', lede: 'Nobody buys off a list. Narrow it to two and see them against each other, including the checks each one passed.', note: 'Where one is plainly better on a number, it is marked. Fuel and transmission are not marked, because neither is better and anyone who tells you otherwise is steering you.' },
        { type: 'process', title: 'How a purchase works' },
        { type: 'pricegrid' },
        { type: 'proof' },
        { type: 'story' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'Buying and selling used vehicles since 2012.',
        stats: [
            { value: '14', unit: 'years', label: 'in the yard' },
            { value: '1,870', unit: 'vehicles', label: 'sold on' },
            { value: '126', unit: 'checks', label: 'before anything is listed' },
        ],
        award: 'Fair Dealing Award, Nellai Motor Traders Association 2023',
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'card',
        landmark: 'Tenkasi Road, near the Junction',
        direction: 'Parking inside the yard. Do not leave anything on Tenkasi Road itself.',
    },

    business: {
        name: 'Nellai Pre-Owned Motors',
        tagline: 'Used cars and two wheelers',
        trade: 'Used cars and bikes',
        area: 'Tirunelveli Junction',
        city: 'Tirunelveli',
        street: '8, Tenkasi Road, near the Junction',
        pin: '627001',
        email: 'yard@nellaimotors.example',
        since: '2012',
        trust: ['RC and insurance checked before we buy', 'Transfer handled by us', 'Test drive before anything'],
        hours: [
            { days: 'Monday to Saturday', open: 9.5, close: 20 },
            { days: 'Sunday', open: 10, close: 18 },
        ],
    },

    theme: {
        ink: '#0F1A2E',
        paper: '#F6F9FF',
        accent: '#2563EB',
        support: '#4C5A73',
        soft: '#E2EAF8',
        onAccent: '#F6F9FF',
        fill: '#0F1A2E',
        onFill: '#F6F9FF',
        radiusSm: '6px',
        radiusLg: '12px',
        borderW: '1px',
        shadow: '0 4px 14px rgba(15, 26, 46, 0.08)',
        display: 'var(--f-jakarta)',
        text: 'var(--f-inter)',
    },

    logo: { mark: 'key', style: 'plate' },

    voicesTitle: 'From buyers',
    faqTitle: 'Papers, transfer and finance',
    factsTitle: 'What we charge',
    factsLede: 'The vehicle price is the vehicle price. These are the only other charges and they are on the invoice.',

    hero: {
        kicker: 'Tenkasi Road, since 2012',
        headline: 'The papers, before the test drive',
        sub: 'Used cars and two wheelers with the RC, insurance and service history checked before we buy them. Transfer handled by us.',
        primaryCta: 'See the stock',
        secondaryCta: 'Find the yard',
    },

    module: {
        type: 'spectable',
        title: 'In the yard this week',
        subtitle: 'Everything here has been through our own check. Ask for the service record of any of them before you come.',
    },

    /* No registration numbers anywhere, deliberately: a plausible TN plate
       on a page that gets forwarded is a real vehicle's number. */
    compareRows: [
        { key: 'price', label: 'Price', better: 'low' },
        { key: 'year', label: 'Year', better: 'high' },
        { key: 'km', label: 'Odometer', better: 'low' },
        { key: 'owners', label: 'Owners', better: 'low' },
        { key: 'fuel', label: 'Fuel' },
        { key: 'transmission', label: 'Transmission' },
        { key: 'insurance', label: 'Insurance valid to' },  /* not marked: a date string, and a fresh policy is cheap to buy */
        { key: 'checked', label: 'Checks passed', better: 'high' },
    ],

    stock: [
        { name: 'Hatchback, 2019, petrol', price: 'Rs 4,85,000', year: '2019', km: '42,000 km', owners: '1', fuel: 'Petrol', transmission: 'Manual', insurance: 'March 2027', checked: '126 of 126' },
        { name: 'Sedan, 2018, diesel', price: 'Rs 6,20,000', year: '2018', km: '68,000 km', owners: '2', fuel: 'Diesel', transmission: 'Manual', insurance: 'November 2026', checked: '124 of 126' },
        { name: 'Compact SUV, 2020, petrol', price: 'Rs 7,95,000', year: '2020', km: '31,000 km', owners: '1', fuel: 'Petrol', transmission: 'Automatic', insurance: 'July 2027', checked: '126 of 126' },
        { name: 'Hatchback, 2016, petrol', price: 'Rs 3,10,000', year: '2016', km: '81,000 km', owners: '2', fuel: 'Petrol', transmission: 'Manual', insurance: 'January 2027', checked: '119 of 126' },
        { name: 'Commuter bike, 2021', price: 'Rs 62,000', year: '2021', km: '18,000 km', owners: '1', fuel: 'Petrol', transmission: 'Manual', insurance: 'September 2026', checked: '48 of 48' },
        { name: 'Scooter, 2022', price: 'Rs 71,000', year: '2022', km: '9,400 km', owners: '1', fuel: 'Petrol', transmission: 'Automatic', insurance: 'May 2027', checked: '48 of 48' },
    ],

    specGroups: [
        {
            label: 'Cars',
            rows: [
                { name: 'Hatchback, 2019, petrol', value: 'Rs 4,85,000', note: '42,000 km, one owner' },
                { name: 'Sedan, 2018, diesel', value: 'Rs 6,20,000', note: '68,000 km, two owners' },
                { name: 'Compact SUV, 2020, petrol', value: 'Rs 7,90,000', note: '31,000 km, one owner' },
                { name: 'Hatchback, 2016, petrol', value: 'Rs 2,95,000', note: '74,000 km, two owners' },
            ],
        },
        {
            label: 'Two wheelers',
            rows: [
                { name: 'Commuter 125cc, 2021', value: 'Rs 62,000', note: '18,000 km, one owner' },
                { name: 'Scooter 110cc, 2020', value: 'Rs 54,000', note: '22,000 km, one owner' },
                { name: 'Sports 150cc, 2019', value: 'Rs 78,000', note: '29,000 km, one owner' },
            ],
        },
    ],

    prices: [
        {
            label: 'On top of the vehicle price',
            items: [
                { name: 'Transfer and paperwork', time: 'RTO, handled by us', price: 'Rs 3,500' },
                { name: 'Insurance transfer', time: 'Or a fresh policy', price: 'At actuals' },
                { name: 'Finance arrangement', time: 'If you need a loan', price: 'No charge' },
            ],
        },
        {
            label: 'Optional',
            items: [
                { name: 'Full service before delivery', time: 'Two days', price: 'From Rs 3,800' },
                { name: 'Six month warranty', time: 'Engine and gearbox', price: 'From Rs 9,000' },
            ],
        },
    ],

    process: [
        { title: 'See the papers first', text: 'RC, insurance, service record and the previous owner count. By message before you come, if you want.', when: 'Same day' },
        { title: 'Test drive', text: 'On the road, not around the yard. Take it to your own mechanic if you would rather; we will hand you the keys.', when: 'Any day' },
        { title: 'Agree the price', text: 'The number on the page is the number. Anything else you want done is quoted separately before you commit.', when: 'At the yard' },
        { title: 'Transfer', text: 'We handle the RTO work and the insurance. The vehicle is delivered once the transfer is filed, not before.', when: 'Seven to fourteen days' },
    ],

    story: {
        title: 'What we will not sell',
        paragraphs: [
            'Nothing with a chassis or engine number that does not match the RC, nothing with a loan still running against it, and nothing that has been in a total-loss claim. Those three account for most of the trouble people get into buying used, and the check happens before we buy, not before you do.',
            'Odometer readings are what the vehicle showed when it came in, and we say so if the record looks inconsistent. A dealer who cannot explain a gap in the service history is a dealer who has not looked.',
        ],
    },

    faqs: [
        {
            q: 'How do I know the vehicle is clean?',
            a: 'RC, insurance, service record and a loan-status check on every vehicle before we buy it. We show you all four, and you are welcome to run your own check before paying anything.',
        },
        {
            q: 'Can I take it to my own mechanic?',
            a: 'Yes. Take the vehicle, not just a photograph. We will hand you the keys and the papers for the afternoon.',
        },
        {
            q: 'Do you arrange finance?',
            a: 'We introduce you to two banks and an NBFC and charge nothing for it. The loan is between you and them and we take no commission on the rate.',
        },
        {
            q: 'How long does transfer take?',
            a: 'Seven to fourteen days at the RTO. We file it and the vehicle is delivered once it is filed, so the papers never sit in limbo with you holding the keys.',
        },
    ],

    visit: {
        title: 'The yard',
        note: 'Tenkasi Road near the Junction, the open yard with the blue boundary wall. Everything listed is physically there; ring ahead only if you want a specific one kept aside.',
    },
};

export default autoResale;
