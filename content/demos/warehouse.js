/**
 * SafeVault Storage, Sriperumbudur. Entirely invented.
 *
 * WHAT THIS ONE PROVES
 *
 * The clinical layout and the tariff module, and the opposite end of the
 * token contract from the bakery: hard 2px radii, a visible hairline
 * border, no shadow at all. If a warehouse and a bakery built from one
 * stylesheet look like the same site, the whole architecture has failed,
 * so this is the demo that tests it.
 *
 * B2B copy is a different register: specific numbers about capacity and
 * temperature, no warmth, no story about a grandmother. That is what the
 * audience for a 3PL site is reading for.
 */

const warehouse = {
    slug: 'warehouse',
    layout: 'clinical',

    /* The page, in order. Composed here rather than hardcoded in
       app/demo-site/[slug]/page.js, so this demo's shape is its own. */
    sections: [
        { type: 'hero', variant: 'standard' },
        { type: 'proof' },
        { type: 'space', title: 'What would it cost', lede: 'Pallets and months in, an indicative figure out. The rate behind it is published underneath so you can check the arithmetic.', note: 'Racked storage, inward and outward handling included. Cross-docking and repacking are quoted separately because they vary far too much to guess.' },
        { type: 'tariff' },
        { type: 'spectable', title: 'The building' },
        { type: 'story' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: "Storing other people's stock since 2011.",
        stats: [
            { value: '15', unit: 'years', label: 'of racking' },
            { value: '84,000', unit: 'sq ft', label: 'under one roof' },
            { value: '11,600', unit: 'pallets', label: 'of live capacity' },
        ],
        award: 'Warehousing Safety Commendation, Kanchi Industrial Forum 2024',
    },

    business: {
        name: 'SafeVault Storage',
        tagline: 'Bonded and cold chain, on the Chennai to Bengaluru highway',
        trade: 'Warehouse',
        area: 'Sriperumbudur',
        city: 'Kanchipuram District',
        street: 'Plot 44, SIDCO Industrial Estate, Sriperumbudur',
        pin: '602105',
        email: 'enquiries@safevaultstorage.example',
        since: '2011',
        trust: ['GST registered', 'Insured to full stock value', 'Round the clock security'],
        hours: [
            { days: 'Monday to Saturday', open: 8, close: 20 },
            { days: 'Sunday', open: 9, close: 13 },
        ],
    },

    theme: {
        ink: '#090D16',
        paper: '#F4F4F5',
        accent: '#EAB308',
        support: '#52525B',
        soft: '#E4E4E7',
        onAccent: '#090D16',
        fill: '#090D16',
        onFill: '#F4F4F5',
        /* Hard, bordered, flat. The bakery is 28px, borderless and soft;
           this is the same stylesheet. */
        radiusSm: '2px',
        radiusLg: '4px',
        borderW: '1px',
        shadow: 'none',
        display: 'var(--f-archivo)',
        text: 'var(--f-source)',
    },

    logo: { mark: 'box', style: 'bare' },

    hero: {
        kicker: 'Sriperumbudur, on the NH48 corridor',
        headline: 'Storage that does not lose your stock',
        sub: 'Ambient, cold and bonded bays on the NH48 corridor. Racked, scanned, and counted the same way every time.',
        primaryCta: 'Work out a rate',
        secondaryCta: 'Where we are',
    },

    module: {
        type: 'tariff',
        ratePeriod: 'per month',
        title: 'Work out a monthly rate',
        subtitle: 'Rates below are per pallet position per month. This gives you a real number to start a conversation from, not a brochure range.',
        unitLabel: 'pallet positions',
        min: 10,
        max: 500,
        step: 10,
        options: [
            { id: 'ambient', label: 'Ambient', note: 'Racked, dry, 25 to 32 C', rate: 340 },
            { id: 'cold', label: 'Cold chain', note: 'Held at 2 to 8 C', rate: 890 },
            { id: 'frozen', label: 'Frozen', note: 'Held at minus 18 C', rate: 1450 },
        ],
        addons: [
            { id: 'pick', label: 'Pick and pack', note: 'Per position, per month', rate: 120 },
            { id: 'bonded', label: 'Bonded storage', note: 'Customs supervised', rate: 260 },
        ],
    },

    specs: [
        { label: 'Total built area', value: '84,000 sq ft' },
        { label: 'Pallet positions', value: '6,200' },
        { label: 'Dock levellers', value: '9' },
        { label: 'Clear height', value: '11.5 m' },
        { label: 'Cold chain capacity', value: '900 positions' },
        { label: 'Power backup', value: 'Full load, on site' },
    ],

    /* Feeds the calculator. Rate and minimum term are published beside it
       so the arithmetic is checkable. */
    space: { ratePerPallet: 95, sqftPerPallet: 12, minMonths: 3, capacity: 11600 },

    specGroups: [
        {
            label: 'The building',
            rows: [
                { name: 'Total built area', value: '84,000 sq ft', note: 'Across two blocks' },
                { name: 'Pallet positions', value: '6,200', note: 'Selective racking' },
                { name: 'Clear height', value: '11.5 m', note: 'To the underside of the haunch' },
                { name: 'Floor loading', value: '5 t per sq m', note: 'FM2 rated slab' },
                { name: 'Dock levellers', value: '9', note: 'Six at 40 ft, three at 20 ft' },
            ],
        },
        {
            label: 'Cold chain',
            rows: [
                { name: 'Chilled capacity', value: '900 positions', note: 'Held 2 to 8 C' },
                { name: 'Frozen capacity', value: '260 positions', note: 'Held at minus 18 C' },
                { name: 'Temperature logging', value: 'Every 15 min', note: 'Retained three years' },
                { name: 'Power backup', value: 'Full load', note: 'On site, auto changeover' },
            ],
        },
    ],
    story: {
        title: 'How it runs',
        paragraphs: [
            'Every pallet is scanned in at the dock and scanned again at the rack. The position is fixed, not floating, so a stock count is a report rather than a search. Cycle counts run weekly and the variance report goes to you whether or not there is a variance.',
            'Cold chain is on its own power train with full backup at load. Temperature is logged every fifteen minutes and the log is yours to download, which matters when your buyer asks for it and you have four hours to answer.',
        ],
    },

    voicesTitle: 'From our clients',
    faqTitle: 'Storage and handling',
    voices: [
        {
            text: 'We moved three thousand positions here after two years of arguing with our previous operator about stock that had gone missing. The variance report arrives whether there is a variance or not, which tells you something.',
            who: 'Suresh N',
            where: 'Operations, an FMCG distributor',
        },
        {
            text: 'The temperature log has been asked for by two auditors and one buyer. All three times it took about a minute to produce.',
            who: 'Anitha R',
            where: 'Quality, a pharma supplier',
        },
    ],

    faqs: [
        {
            q: 'What is the minimum commitment?',
            a: 'Ten pallet positions and three months. Below that the handling cost is more than the storage and neither of us gains anything.',
        },
        {
            q: 'How is the stock reported?',
            a: 'A daily position file and a weekly cycle count with variance. Both as CSV, both to whichever address you nominate. If you want it into your own system we will look at that, but we will not promise an integration before we have seen what you run.',
        },
        {
            q: 'Is the cold chain validated?',
            a: 'Temperature is logged every fifteen minutes across all cold bays and the logs are retained for three years. Mapping studies are re-run annually and the reports are available on request.',
        },
        {
            q: 'What happens if something is damaged?',
            a: 'It is insured to full stock value and it is our problem, not yours. Damage is reported the day it is found rather than at the month end when it is harder to trace.',
        },
    ],

    visit: {
        title: 'Getting here',
        note: 'Plot 44 in the SIDCO estate, about four kilometres off the NH48 at the Sriperumbudur exit. Trailers come in through the north gate; the office entrance is the smaller one on the east side.',
    },
};

export default warehouse;
