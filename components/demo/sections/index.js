/**
 * The section palette, and the registry that resolves a section entry to
 * a component.
 *
 * WHY THIS EXISTS
 *
 * Section order used to be hardcoded in app/demo-site/[slug]/page.js as a
 * fixed run of JSX: module, then optional Facts, then Story, Voices, Faq,
 * Visit, in that order, on all sixteen demos. Nothing in a demo's data
 * could add a section, remove one, reorder them, or introduce a type that
 * did not already exist. Sixteen businesses in genuinely different trades
 * rendered the same page shape.
 *
 * Now each demo's data carries a `sections: []` array and the page is a
 * map over it. A restaurant leads with its menu; a warehouse leads with a
 * spec table; a photographer leads with a gallery.
 *
 * THE MAP IS LITERAL AND THE IMPORTS ARE STATIC, DELIBERATELY.
 *
 * `SECTIONS[type]` built from a template literal would defeat static
 * analysis. One literal key per component, no dynamic import paths.
 *
 * WHAT THIS DOES NOT DO, MEASURED
 *
 * An earlier version of this comment claimed the literal map let "the
 * bundler drop what a route does not use". That is not what happens, and
 * it is worth writing down so nobody re-derives it.
 *
 * check:demo-weight reports an identical JS figure for all twenty-four
 * demo routes. That looks like a tree-shaking failure and was treated as
 * one. It is not. Breaking the route's eleven script tags down by size:
 * three framework chunks account for roughly 151KB of the ~196KB total,
 * and every section component in this file put together is about 17KB,
 * under 9% of the route. The routes report the same number because they
 * genuinely share a framework baseline.
 *
 * Converting the eight client components to next/dynamic was tried and
 * reverted. Turbopack already groups them into shared chunks that the
 * route preloads either way, so the script set was byte-identical across
 * demos before and after, and the dynamic() loader machinery made every
 * route 1.5KB LARGER. The change cost bytes and bought nothing.
 *
 * The lever that would actually matter here is the framework baseline,
 * not this palette. Adding a section type costs on the order of 1KB.
 *
 * ADDING A TYPE
 *
 * Write the component, add one line here, use it from a demo's
 * `sections` array. A type that no demo uses should be deleted rather
 * than kept "in case": the palette is meant to be small and every entry
 * should be earning its place on at least two demos, or be the single
 * thing that makes one demo worth forwarding.
 */
import { Story, Voices, Faq, Visit, Facts } from '../DemoSections';
import Menu from './Menu';
import Process from './Process';
import PriceGrid from './PriceGrid';
import Directory from './Directory';
import Gallery from './Gallery';
import SpecTable from './SpecTable';
import Rooms from './Rooms';
import Proof from './Proof';
import ConsultDesk from './ConsultDesk';
import DeptFinder from './DeptFinder';
import TokenQueue from './TokenQueue';
import LookBook from './LookBook';
import PlotFinder from './PlotFinder';
import ProjectStages from './ProjectStages';
import TradeDispatch from './TradeDispatch';
import ServiceInterval from './ServiceInterval';
import VehicleCompare from './VehicleCompare';
import BatchPlanner from './BatchPlanner';
import SpaceCalculator from './SpaceCalculator';
import StockCheck from './StockCheck';
import RoomAvailability from './RoomAvailability';
import WeaverTrace from './WeaverTrace';
import SpecCompare from './SpecCompare';
import FreshToday from './FreshToday';
import FilingCalendar from './FilingCalendar';
import BakeSchedule from './BakeSchedule';
import Tracker from './Tracker';
import JobBoard from './JobBoard';
import Cart from '../modules/Cart';
import Booking from '../modules/Booking';
import Tariff from '../modules/Tariff';
import BeforeAfter from '../modules/BeforeAfter';
import Roster from '../modules/Roster';

export const SECTION_REGISTRY = {
    story: Story,
    voices: Voices,
    faq: Faq,
    visit: Visit,
    facts: Facts,
    cart: Cart,
    booking: Booking,
    tariff: Tariff,
    beforeafter: BeforeAfter,
    roster: Roster,

    /* The palette added in Phase 4. Six shared across two or more demos,
       three bespoke pieces that carry one demo each and are named in the
       plan as worth the exception. */
    menu: Menu,
    process: Process,
    pricegrid: PriceGrid,
    directory: Directory,
    gallery: Gallery,
    spectable: SpecTable,
    bakeschedule: BakeSchedule,
    tracker: Tracker,
    rooms: Rooms,
    jobboard: JobBoard,
    proof: Proof,
    consult: ConsultDesk,
    calendar: FilingCalendar,
    where: DeptFinder,
    queue: TokenQueue,
    lookbook: LookBook,
    plots: PlotFinder,
    stages: ProjectStages,
    dispatch: TradeDispatch,
    due: ServiceInterval,
    compare: VehicleCompare,
    batches: BatchPlanner,
    space: SpaceCalculator,
    stock: StockCheck,
    avail: RoomAvailability,
    weavers: WeaverTrace,
    specs: SpecCompare,
    fresh: FreshToday,
};

/* Which anchor id each section renders, so the nav can link to whatever a
   demo actually has rather than assuming a fixed set. Kept beside the
   registry so adding a type means touching one file. */
export const SECTION_ANCHOR = {
    cart: 'counter',
    booking: 'book',
    tariff: 'rate',
    beforeafter: 'compare',
    roster: 'roster',
    story: 'story',
    faq: 'faq',
    visit: 'visit',
    menu: 'menu',
    process: 'process',
    pricegrid: 'prices',
    directory: 'directory',
    gallery: 'gallery',
    spectable: 'specs',
    bakeschedule: 'schedule',
    tracker: 'track',
    rooms: 'rooms',
    jobboard: 'board',
    proof: 'proof',
    consult: 'consult',
    calendar: 'calendar',
    where: 'where',
    queue: 'queue',
    lookbook: 'lookbook',
    plots: 'plots',
    stages: 'stages',
    dispatch: 'dispatch',
    due: 'due',
    compare: 'compare',
    batches: 'batches',
    space: 'space',
    stock: 'stock',
    avail: 'rooms',
    weavers: 'weavers',
    specs: 'measured',
    fresh: 'fresh',
};

/* The label the nav shows for a demo's primary interactive section. */
export const SECTION_LABEL = {
    cart: 'Order',
    booking: 'Book',
    tariff: 'Rates',
    beforeafter: 'Results',
    roster: 'Timings',
    queue: 'The queue',
};
