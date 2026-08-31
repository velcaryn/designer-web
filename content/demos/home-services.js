/**
 * Anna Home Care, Madurai. Entirely invented.
 *
 * Plumbing, wiring and painting on one site, which is the actual shape of
 * this trade: one operator with three vans and a WhatsApp number, not
 * three separate businesses. The site's job is to make "one number for
 * all of it" the obvious thing, so the directory of trades comes first
 * and the booking is a callback rather than a slot.
 */

const homeServices = {
    slug: 'home-services',
    layout: 'clinical',

    sections: [
        { type: 'hero', variant: 'split' },
        { type: 'directory', title: 'What we come out for' },
        { type: 'dispatch', title: 'Which trade do you need', lede: 'Three trades, one number. The charge and the response are not the same for each, so pick one and see what today actually looks like.', note: 'Slots shown are indicative. What is genuinely available is confirmed when somebody rings you back.' },
        { type: 'booking' },
        { type: 'pricegrid' },
        { type: 'proof' },
        { type: 'process', title: 'How a call out works' },
        { type: 'voices' },
        { type: 'faq' },
        { type: 'visit' },
    ],

    proof: {
        line: 'One number for the whole house since 2013.',
        stats: [
            { value: '13', unit: 'years', label: 'of call-outs' },
            { value: '19', unit: 'tradesmen', label: 'on our own payroll' },
            { value: '41', unit: 'minutes', label: 'average time to your door' },
        ],
    },

    /* Area and city only, never the street number: the streets in
       these addresses are real. See lib/mapLink.js. */
    map: {
        variant: 'pin',
        landmark: 'Based on Bypass Road, Anna Nagar',
    },

    business: {
        name: 'Anna Home Care',
        tagline: 'Plumbing, electrical and painting',
        trade: 'Home services',
        area: 'Anna Nagar',
        city: 'Madurai',
        street: '7, Bypass Road, Anna Nagar',
        pin: '625020',
        email: 'work@annahomecare.example',
        since: '2013',
        trust: ['Same day for emergencies', 'Price agreed before we start', 'Own tools, own materials'],
        hours: [
            { days: 'Monday to Saturday', open: 8, close: 20 },
            { days: 'Sunday', open: 9, close: 13 },
        ],
    },

    theme: {
        ink: '#0C2A33',
        paper: '#F0FDFF',
        accent: '#0891B2',
        support: '#436B76',
        soft: '#D6F2F8',
        onAccent: '#0C2A33',
        fill: '#0891B2',
        onFill: '#F0FDFF',
        radiusSm: '6px',
        radiusLg: '12px',
        borderW: '1px',
        shadow: '0 3px 10px rgba(12, 42, 51, 0.08)',
        display: 'var(--f-outfit)',
        text: 'var(--f-work)',
    },

    logo: { mark: 'spanner', style: 'plate' },

    voicesTitle: 'From the houses we work in',
    faqTitle: 'Call outs and charges',
    factsTitle: 'What the common jobs cost',
    factsLede: 'Quoted before anyone starts. If it turns out to be bigger, we stop and tell you rather than carrying on and adding it to the bill.',

    hero: {
        kicker: 'Madurai, one number for all of it',
        headline: 'One call for the tap, the wiring and the painting',
        sub: 'Plumbing, electrical work and painting from the same team, so you are not chasing three people. Price agreed before anyone starts.',
        primaryCta: 'What we do',
        secondaryCta: 'Where we cover',
    },

    module: {
        type: 'booking',
        title: 'Ask for a call out',
        subtitle: 'Tell us the day and roughly what it is. Someone rings you back to confirm a time.',
        what: 'a call out',
        legends: { day: 'Which day', time: 'Morning or afternoon', size: 'What is it', note: 'How urgent' },
        slots: ['Morning, 8 to 12', 'Afternoon, 12 to 4', 'Evening, 4 to 8'],
        sizes: ['Plumbing', 'Electrical', 'Painting', 'Not sure'],
        preferences: ['Whenever suits', 'This week', 'Today if possible', 'It is an emergency'],
    },

    directory: [
        { name: 'Plumbing', lead: 'Leaks, blockages, fittings', text: 'Taps, mixers, flush tanks, blocked lines and the pipe behind the wall nobody wants to open. Motor and tank work too.', when: 'Same day for leaks' },
        { name: 'Electrical', lead: 'Wiring, points, fittings', text: 'New points, fan and light fitting, MCB trips that keep coming back, and full rewiring for older houses.', when: 'Same day for outages' },
        { name: 'Painting', lead: 'Interior and exterior', text: 'Putty, primer and two coats, done properly. Furniture covered and the site cleaned at the end of each day.', when: 'Booked a week ahead' },
        { name: 'Waterproofing', lead: 'Terrace and bathrooms', text: 'The leak that comes back every monsoon. We find where it is actually entering rather than coating the whole terrace.', when: 'Before the rains' },
    ],

    prices: [
        {
            label: 'Plumbing',
            items: [
                { name: 'Call out and inspection', time: 'Waived if we do the work', price: 'Rs 250' },
                { name: 'Tap or mixer replaced', time: 'Under an hour', price: 'Rs 450 plus part' },
                { name: 'Blocked line cleared', time: 'One to two hours', price: 'From Rs 900' },
            ],
        },
        {
            label: 'Electrical',
            items: [
                { name: 'New point', time: 'Per point', price: 'Rs 600' },
                { name: 'Fan or light fitted', time: 'Under an hour', price: 'Rs 400' },
                { name: 'Full rewiring', time: 'Quoted on site', price: 'From Rs 180 per sq ft' },
            ],
        },
        {
            label: 'Painting',
            items: [
                { name: 'Interior, per sq ft', time: 'Putty, primer, two coats', price: 'From Rs 28' },
                { name: 'Exterior, per sq ft', time: 'Weatherproof finish', price: 'From Rs 34' },
            ],
        },
    ],

    trades: [
        { trade: 'Plumbing', callout: 'Rs 250', calloutNote: 'Waived if the work goes ahead the same visit.', slots: ['9 am to 12 noon, two slots left', '2 pm to 5 pm, one slot left', 'Evening, full'], jobs: ['A tap or mixer that will not stop dripping', 'Blocked kitchen or bathroom line', 'Flush tank rebuilt or replaced', 'Motor not lifting, or lifting and losing pressure', 'The pipe behind the wall nobody wants to open'], urgent: 'A burst line or a leak reaching your neighbour below. Ring rather than message and somebody is moved.' },
        { trade: 'Electrical', callout: 'Rs 250', calloutNote: 'Waived if the work goes ahead the same visit.', slots: ['9 am to 12 noon, full', '2 pm to 5 pm, three slots left', 'Evening, two slots left'], jobs: ['A point that has stopped working', 'MCB tripping every time the geyser runs', 'Fan regulator, switchboard or socket replaced', 'New point run for an AC or a chimney', 'Earthing checked properly, with a meter'], urgent: 'A burning smell, a hot switchboard, or a shock from any fitting. Turn the mains off and ring.' },
        { trade: 'Painting', callout: 'Free', calloutNote: 'Measured and quoted at the visit, no charge either way.', slots: ['Measured any day, morning preferred', 'Work starts the following week', 'Two crews out at the moment'], jobs: ['One room repainted', 'Full interior, occupied or empty', 'Exterior and compound wall', 'Damp patch treated before painting, not painted over', 'Putty, primer and two coats, itemised separately'], urgent: 'Nothing in painting is urgent, and anyone who tells you otherwise is selling you something.' },
    ],

    process: [
        { title: 'Tell us what it is', text: 'A message with a photograph is usually enough. Two lines and a picture of the leak beats a paragraph.', when: 'Reply within the hour' },
        { title: 'We come and look', text: 'For anything beyond a tap, someone comes out and quotes on site. The call out is waived if you go ahead.', when: 'Same or next day' },
        { title: 'Price agreed', text: 'In writing on WhatsApp, before anyone opens a wall. If it turns out bigger we stop and tell you.', when: 'Before we start' },
        { title: 'Done and cleaned', text: 'The site is left swept. Materials we bought are itemised and the leftovers stay with you.', when: 'Same visit, usually' },
    ],

    voices: [
        {
            text: 'The bathroom leak had been fixed twice by other people. These men found it was coming from the terrace, two floors up.',
            who: 'Jaya S',
            where: 'K K Nagar',
        },
        {
            text: 'Painted the whole house in four days and moved the furniture back themselves. My mother could not find anything to complain about.',
            who: 'Muthu R',
            where: 'Anna Nagar',
        },
        {
            text: 'Wiring, plumbing and painting for a rental flat, one person coordinating all three. That is the whole reason I use them.',
            who: 'Kalaiselvi P',
            where: 'Villapuram',
        },
    ],

    faqs: [
        {
            q: 'Is there a call out charge?',
            a: 'Rs 250 for an inspection, and it comes off the bill if you go ahead with the work. For anything we can quote from a photograph there is no charge at all.',
        },
        {
            q: 'How far do you travel?',
            a: 'Anywhere in Madurai city and about twenty kilometres out. Further than that we will say so rather than quote you a travel charge afterwards.',
        },
        {
            q: 'Do you supply the materials?',
            a: 'We can, itemised at what we paid, or you buy them yourself and we fit them. Either is fine and neither changes the labour charge.',
        },
        {
            q: 'What if the job turns out to be bigger?',
            a: 'We stop and tell you before carrying on. A revised price in writing, and you can say no. Nothing is ever added to the bill at the end.',
        },
    ],

    visit: {
        title: 'Where we cover',
        note: 'The workshop is on the bypass at Anna Nagar, though you rarely need to come to us. We cover Madurai city and about twenty kilometres out.',
    },
};

export default homeServices;
