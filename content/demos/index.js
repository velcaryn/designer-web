/**
 * The sixteen demo businesses.
 *
 * WHY THE REGISTRY IS SEPARATE FROM THE DATA
 *
 * The hub renders sixteen cards and needs a name, a trade, a city and a
 * palette for each. It does not need the menus, the FAQs, the testimonials
 * or the gallery copy, and pulling all sixteen full data files into the
 * hub's bundle to render sixteen cards would be most of a megabyte for
 * nothing.
 *
 * So: this file holds the card-sized summary of each demo, and the full
 * record lives in its own file loaded only by the route that renders it.
 *
 * WHY content/ AND NOT config/
 *
 * config/site.js is VelBiz's real contact data and is the single entry on
 * check-brand-leak's allowlist. Putting invented businesses beside it
 * would dilute exactly the thing that allowlist protects.
 *
 * THIS DIRECTORY IS SCANNED BY BOTH GUARDS. That is not incidental: it
 * was added to check-brand-leak.mjs and check-em-dash.mjs before the
 * first data file was written, because sixteen files of invented business
 * copy is simultaneously the largest prose surface in the repo and the
 * likeliest place for a plausible fake Indian mobile number to appear.
 *
 * NO PHONE NUMBERS ANYWHERE IN HERE. Not fake, not formatted, not masked.
 * These pages get forwarded around WhatsApp; a plausible number on one
 * means a real person starts taking calls for a bakery that does not
 * exist. Contact is an email at .example, which RFC 2606 reserves as
 * permanently unroutable, plus an address and opening hours.
 *
 * CREDIBILITY NUMBERS, AND THE FOUR RULES THAT BOUND THEM
 *
 * The corpus carried no quantified claims at all until now: no years, no
 * counts, nothing a visitor could read scale off. That was deliberate and
 * it went too far, so the position is narrowed rather than abandoned.
 * Every demo now has a `proof` block. The rules, all four enforced by
 * scripts/check-demo-proof.mjs:
 *
 *   1. Specific and odd beats round and large. 430+ reads as counted,
 *      500+ reads as invented. Round numbers are the tell, not quantity.
 *   2. Numbers are anchored to `business.since`. A demo trading since
 *      2011 cannot claim twenty-five years, and the guard does the
 *      arithmetic so nobody has to trust the copy.
 *   3. No fabricated regulator identifiers, ever. Bar Council enrolment
 *      numbers, ICAI membership numbers, FSSAI licences and GSTINs
 *      identify real people; an invented one is somebody's real number.
 *   4. Award bodies are invented and local, never real. "Nellai Motor
 *      Traders Association" is a prop. NABH or ISO is a false statement
 *      about an organisation that exists, so the guard denylists them,
 *      and the regulated trades (advocate, accountant, clinic, dental
 *      clinic, hospital) carry no award line at all.
 *
 * Only nine demos render the stats band. Nine more carry their numbers in
 * prose and six surface them inside their own interactive section. A wall
 * of figures suits a freight company and undermines an advocate.
 */

/* The sectors, in the order the hub renders them: the trades most people
   asking us for a site actually run, first. Each carries the lede its
   bento sits under, so the hub reads as six considered sections rather
   than one grid with a filter over it.
   `cells` names the bento composition, which is designed per count: two
   items cannot make a rhythm from spans, so they make one from shape. */
export const CATEGORIES = [
    {
        id: 'food',
        label: 'Food',
        lede: 'Counters and kitchens, where the order has to reach a phone in the back.',
        cells: 'pair',
    },
    {
        id: 'retail',
        label: 'Retail',
        lede: 'Shops that sell the same things every week to the same people.',
        cells: 'lead',
    },
    {
        id: 'health',
        label: 'Health',
        lede: 'Clinics and hospitals, where what a visitor wants is timings and a price.',
        cells: 'flip',
    },
    {
        id: 'services',
        label: 'Services',
        lede: 'Trades where the work is quoted before it starts.',
        cells: 'lead-right',
    },
    {
        id: 'property',
        label: 'Housing Services',
        /* The tile chip is 111px wide on a 320px phone; the full
           label needs 139. The filter chip above the grid still
           carries the whole thing. */
        short: 'Housing',
        lede: 'Building it, fixing it, or buying the land it stands on.',
        cells: 'plain',
    },
    {
        id: 'professional',
        label: 'Professional Services',
        /* The tile chip is 111px wide on a 320px phone; the full
           label needs 139. The filter chip above the grid still
           carries the whole thing. */
        short: 'Professional',
        lede: 'Sold on credentials and on being easy to reach when something is due.',
        cells: 'plain',
    },
    {
        id: 'automobile',
        label: 'Automobile Services',
        /* The tile chip is 111px wide on a 320px phone; the full
           label needs 139. The filter chip above the grid still
           carries the whole thing. */
        short: 'Automobile',
        lede: 'Servicing, repair and resale, where a customer wants a price before they hand over the keys.',
        cells: 'plain',
    },
    {
        id: 'stay',
        label: 'Stay',
        lede: 'Rooms sold on the look of the place.',
        cells: 'twin',
    },
    {
        id: 'industry',
        label: 'Industry',
        lede: 'B2B, where nobody is browsing and everybody is checking a number.',
        cells: 'plain',
    },
];

/* The demos in one sector, in registry order. */
export function demosInSector(id) {
    return DEMOS.filter((d) => d.category === id);
}

/* Card-sized. Order is the order the hub renders them in, chosen so the
   grid opens on the trades most people asking us for a site actually run,
   and so adjacent cards do not share a palette.

   `mark` duplicates the value in each demo's own data file, and that is
   deliberate: the hub renders sixteen cards and loading sixteen full
   business records to read one string off each would pull every menu,
   every FAQ and every testimonial into the hub's bundle. The two must be
   kept in step by hand, which is one line per demo and is checked by the
   registry test in verify. */
export const DEMOS = [
    {
        slug: 'bakery',
        mark: 'wheat',
        name: 'The Crust & Crumble',
        trade: 'Bakery',
        city: 'Bengaluru',
        category: 'food',
        blurb: 'Breads, cakes and a counter that sells out by ten.',
        swatch: ['#381E11', '#D97706', '#FFFBEB'],
    },
    {
        slug: 'restaurant',
        mark: 'mortar',
        name: 'Dakshin Aromas',
        trade: 'Restaurant',
        city: 'Chennai',
        category: 'food',
        blurb: 'Chettinad and coastal, with a table booking flow.',
        swatch: ['#180D07', '#EA580C', '#FFF7ED'],
    },
    {
        slug: 'retail',
        mark: 'leaf',
        name: 'Sri Murugan Supermarket',
        trade: 'Grocery shop',
        city: 'Chennai',
        category: 'retail',
        blurb: 'A daily shop with a basket that totals as you add.',
        swatch: ['#064E3B', '#F59E0B', '#F8FAFC'],
    },
    {
        slug: 'dental-clinic',
        mark: 'tooth',
        name: 'Apex Dental',
        trade: 'Dental clinic',
        city: 'Bengaluru',
        category: 'health',
        blurb: 'Treatments, timings and a before and after slider.',
        swatch: ['#042F2E', '#0D9488', '#F0FDFA'],
    },
    {
        slug: 'wellness-and-beauty',
        mark: 'spark',
        name: 'Aura Luxe',
        trade: 'Salon and spa',
        city: 'Hyderabad',
        category: 'health',
        blurb: 'A service menu with durations and a booking sheet.',
        swatch: ['#1E0A24', '#C084FC', '#FAF5FF'],
    },
    {
        slug: 'home-stay',
        mark: 'leaf',
        name: 'Misty Pines',
        trade: 'Home stay',
        city: 'Coonoor',
        category: 'stay',
        blurb: 'Rooms, tariffs and what the mornings are like.',
        swatch: ['#062C22', '#854D0E', '#F0FDF4'],
    },
    {
        slug: 'online-shop',
        mark: 'thread',
        name: 'Kavira Silks',
        trade: 'Online shop',
        city: 'Kanchipuram',
        category: 'retail',
        blurb: 'A saree catalogue that sends the order to your phone.',
        swatch: ['#4A0404', '#D4AF37', '#FFFDF7'],
    },
    {
        slug: 'photo-studio',
        mark: 'lens',
        name: 'Smiles & Shadows',
        trade: 'Photo studio',
        city: 'Kochi',
        category: 'services',
        blurb: 'Albums, packages and the dates still open.',
        swatch: ['#0B0D13', '#E0A96D', '#FAFAF9'],
    },
    {
        slug: 'clinic',
        mark: 'cross',
        name: 'Dr Radhakrishnan Clinic',
        trade: 'Family clinic',
        city: 'Chennai',
        category: 'health',
        blurb: 'Walk-in timings and who is in on which day.',
        swatch: ['#172554', '#2563EB', '#EFF6FF'],
    },
    {
        slug: 'hospital',
        mark: 'cross',
        name: 'CareLife Healthcare',
        trade: 'Hospital',
        city: 'Coimbatore',
        category: 'health',
        blurb: 'Departments, the OPD roster and emergency hours.',
        swatch: ['#082F49', '#0284C7', '#F0F9FF'],
    },
    {
        slug: 'lodging',
        mark: 'arch',
        name: 'The Grand Palms',
        trade: 'Hotel',
        city: 'Chennai',
        category: 'stay',
        blurb: 'Suites, the banquet hall and a booking sheet.',
        swatch: ['#0F172A', '#6366F1', '#F8FAFC'],
    },
    {
        slug: 'ecommerce',
        mark: 'wave',
        name: 'UrbanPulse',
        trade: 'Online brand',
        city: 'Gurugram',
        category: 'retail',
        blurb: 'A product range with a cart and real specifications.',
        swatch: ['#09090B', '#8B5CF6', '#FAFAFA'],
    },
    {
        slug: 'small-business',
        mark: 'spark',
        name: 'Vigneshwara Electricals',
        trade: 'Hardware shop',
        city: 'Bengaluru',
        category: 'services',
        blurb: 'A trade counter with a quote you can build yourself.',
        swatch: ['#0F172A', '#D97706', '#F1F5F9'],
    },
    {
        slug: 'education',
        mark: 'arch',
        name: 'Vanguard Academy',
        trade: 'Coaching centre',
        city: 'Chennai',
        category: 'services',
        blurb: 'Courses, batch timings and how to enrol.',
        swatch: ['#0F172A', '#F59E0B', '#FFFBEB'],
    },
    {
        slug: 'logistics',
        mark: 'wave',
        name: 'SpeedTrack Express',
        trade: 'Freight company',
        city: 'Mumbai',
        category: 'industry',
        blurb: 'Routes, transit times and a freight estimate.',
        swatch: ['#0A1128', '#2563EB', '#F1F5F9'],
    },
    {
        slug: 'warehouse',
        mark: 'box',
        name: 'SafeVault Storage',
        trade: 'Warehouse',
        city: 'Sriperumbudur',
        category: 'industry',
        blurb: 'Bays, cold chain and a rate you can work out.',
        swatch: ['#090D16', '#EAB308', '#F4F4F5'],
    },
    {
        slug: 'architecture',
        mark: 'compass',
        name: 'Kovai Design Collective',
        trade: 'Architects',
        city: 'Coimbatore',
        category: 'property',
        blurb: 'Drawings, stages and what each one costs.',
        swatch: ['#1C1917', '#A16207', '#FAFAF9'],
    },
    {
        slug: 'home-services',
        mark: 'spanner',
        name: 'Anna Home Care',
        trade: 'Home services',
        city: 'Madurai',
        category: 'property',
        blurb: 'Plumbing, wiring and painting, one number for all three.',
        swatch: ['#0C2A33', '#0891B2', '#F0FDFF'],
    },
    {
        slug: 'real-estate',
        mark: 'plot',
        name: 'Vaigai Land & Plots',
        trade: 'Plots and land',
        city: 'Trichy',
        category: 'property',
        blurb: 'DTCP plots with the approval papers on the page.',
        swatch: ['#14532D', '#CA8A04', '#F7FEE7'],
    },
    {
        slug: 'accountant',
        mark: 'ledger',
        name: 'Sundaram & Associates',
        trade: 'Chartered accountants',
        city: 'Tirunelveli',
        category: 'professional',
        blurb: 'Filings, deadlines and what each one costs.',
        swatch: ['#132A3E', '#0F766E', '#F5FAFB'],
    },
    {
        slug: 'advocate',
        mark: 'scales',
        name: 'R Krishnamoorthy, Advocate',
        trade: 'Advocate',
        city: 'Tirunelveli',
        category: 'professional',
        blurb: 'Practice areas, and what a first consultation involves.',
        swatch: ['#2A1B10', '#92400E', '#FCFAF6'],
    },
    {
        slug: 'car-service',
        mark: 'gauge',
        name: 'Sri Balaji Auto Care',
        trade: 'Car service centre',
        city: 'Tirunelveli',
        category: 'automobile',
        blurb: 'Service packages, pickup and drop, and a price before the work.',
        swatch: ['#111827', '#DC2626', '#F8FAFC'],
    },
    {
        slug: 'bike-service',
        mark: 'sprocket',
        name: 'Speedline Two Wheelers',
        trade: 'Bike service',
        city: 'Thoothukudi',
        category: 'automobile',
        blurb: 'Walk in, wait, and watch the job on a live board.',
        swatch: ['#1A1206', '#EA580C', '#FFFBF5'],
    },
    {
        slug: 'auto-resale',
        mark: 'key',
        name: 'Nellai Pre-Owned Motors',
        trade: 'Used cars and bikes',
        city: 'Tirunelveli',
        category: 'automobile',
        blurb: 'Stock in the yard, with the papers and the history.',
        swatch: ['#0F1A2E', '#2563EB', '#F6F9FF'],
    },
];

export const SLUGS = DEMOS.map((d) => d.slug);

export function findDemo(slug) {
    return DEMOS.find((d) => d.slug === slug) ?? null;
}

/* Used by the unknown-slug finder. Cheap string distance is enough: the
   set is sixteen and the input is a typed URL, so the realistic case is
   a near miss like "resturant" or a plural. */
export function nearestSlug(input) {
    const q = String(input || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!q) return null;
    let best = null;
    let bestScore = 0;
    for (const d of DEMOS) {
        const target = `${d.slug} ${d.trade}`.toLowerCase().replace(/[^a-z]/g, '');
        let score = 0;
        for (let i = 0; i < q.length - 2; i += 1) {
            if (target.includes(q.slice(i, i + 3))) score += 1;
        }
        if (score > bestScore) { bestScore = score; best = d; }
    }
    return bestScore >= 2 ? best : null;
}
