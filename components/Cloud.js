/**
 * Velcaryn Cloud, ERP and the compliance position.
 *
 * This is the section that separates us from a design shop: the client can
 * run their own operations stack behind the site we built, on infrastructure
 * that is already handling regulated healthcare data inside Velcaryn.
 *
 * LAYOUT. A sticky heading beside three named clusters. Not a ten-row table
 * with a hairline under every line, which is the lazy shape for this content
 * and the hardest to read: three groups with one rule each is a rhythm, a
 * ten-row rule stack is a spreadsheet.
 *
 * COPY DISCIPLINE. Everything here is a capability we can actually deliver,
 * phrased as what it does. No certification is claimed that we do not hold.
 * DPDP readiness is described as how we build, which is true, rather than as
 * a certificate, which would not be.
 */
import { Cloud as CloudIcon, ShieldCheck, Buildings } from '@phosphor-icons/react/ssr';
import Reveal from './Reveal';

const CLUSTERS = [
    {
        name: 'Run your business on it',
        Icon: Buildings,
        items: [
            ['CRM and lead flow', 'Every enquiry from the site, the ads and WhatsApp lands in one pipeline with an owner and a due date.'],
            ['Sales and invoicing', 'Quotes, orders, invoices and payment status, with your GST format and your letterhead.'],
            ['Inventory and purchase', 'Stock, vendors, purchase orders and reorder points, for one location or twenty.'],
            ['People and payroll', 'Employee records, attendance, leave and payroll inputs, without a second subscription.'],
        ],
    },
    {
        name: 'Wired into the website',
        Icon: CloudIcon,
        items: [
            ['One customer record', 'The person who filled the form, the person who ordered and the person who called are the same row, not three.'],
            ['Live content', 'Products, prices and availability come from the ERP, so the site cannot drift from what you actually stock.'],
            ['Your data stays yours', 'It runs against your instance. We do not pool client data, and there is no shared analytics warehouse.'],
            ['Exportable, always', 'Full export on request, in open formats. An ERP you cannot leave is a hostage situation.'],
        ],
    },
    {
        name: 'Built to the DPDP Act',
        Icon: ShieldCheck,
        items: [
            ['Consent that is real', 'Analytics and marketing cookies stay off until the visitor agrees, and the choice is as easy to reverse as it was to give.'],
            ['Purpose and minimisation', 'Forms collect what the purpose needs and nothing extra, with retention set per field rather than kept forever.'],
            ['Data principal rights', 'Access, correction and erasure requests have a route and a named owner from day one.'],
            ['Sensitive sectors', 'Healthcare, finance, education and childrens services get a tightened build: stricter retention, audit logging, and residency confirmed in writing before launch.'],
        ],
    },
];

export default function Cloud() {
    return (
        <section className="nv-section nv-ground--storm" id="cloud">
            <div className="nv-shell nv-cloud__grid">
                <div className="nv-cloud__aside">
                    <Reveal>
                        <p className="nv-eyebrow">Cloud and ERP</p>
                        <h2 className="nv-cloud__title">
                            A website is the front door. This is the building behind it.
                        </h2>
                        <p className="nv-lede nv-cloud__body">
                            Velcaryn Cloud runs against your own instance, so the site, the
                            orders and the customer record are one system instead of three
                            that disagree. It is the same stack we run for regulated
                            healthcare clients, which is why the privacy posture is not an
                            afterthought.
                        </p>
                        <a href="#contact" className="nv-btn nv-btn--ghost" style={{ marginTop: '32px' }}>
                            Start a project
                        </a>
                    </Reveal>
                </div>

                <div>
                    {CLUSTERS.map(({ name, Icon, items }, i) => (
                        <Reveal className="nv-cluster" key={name} delay={i * 0.05}>
                            <h3 className="nv-cluster__name">
                                <Icon size={24} weight="bold" aria-hidden="true" />
                                {name}
                            </h3>
                            <dl className="nv-cluster__items">
                                {items.map(([term, detail]) => (
                                    <div className="nv-cluster__item" key={term}>
                                        <dt>{term}</dt>
                                        <dd>{detail}</dd>
                                    </div>
                                ))}
                            </dl>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
