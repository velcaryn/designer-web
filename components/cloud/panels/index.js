/**
 * The five demo panels that sit inside the Safari frame on /cloud.
 *
 * Hand-built markup rather than screenshots. There are no captures of the
 * product to use, and a screenshot would be stale the first time the UI
 * moves. These render at any width, animate in, and read correctly to a
 * screen reader, which a PNG does not.
 *
 * Every panel is a plain function of the data in demoData.js. None of them
 * hold state: the tab strip in CloudDemo.js decides which one is mounted,
 * and the entry animation is the `cl-fill` keyframe on `.cld-panel`, which
 * replays because switching tabs unmounts one panel and mounts another.
 */
import {
    BILLING_KPIS,
    INVOICE,
    PIPELINE,
    STOCK,
    PAYROLL,
    MONEY_KPIS,
    LEDGER,
} from './demoData';

function Kpis({ items }) {
    return (
        <div className="cld-kpis">
            {items.map((k) => (
                <div key={k.label} className="cld-kpi">
                    <span className="cld-kpi__label">{k.label}</span>
                    <span className="cld-kpi__value">{k.value}</span>
                    <span className="cld-kpi__note">{k.note}</span>
                </div>
            ))}
        </div>
    );
}

export function BillingPanel() {
    return (
        <div className="cld-panel">
            <div className="cld-panel__head">
                <h4 className="cld-panel__title">
                    Invoice {INVOICE.number}
                </h4>
                <span className="cld-panel__status">{INVOICE.method}</span>
            </div>

            <Kpis items={BILLING_KPIS} />

            <div className="cld-tableWrap">
                <table className="cld-table">
                    <caption className="nv-sr-only">
                        Line items on invoice {INVOICE.number} to{' '}
                        {INVOICE.customer}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col">Item</th>
                            <th scope="col">HSN</th>
                            <th scope="col" className="cld-table__num">Qty</th>
                            <th scope="col" className="cld-table__num">Rate</th>
                            <th scope="col" className="cld-table__num">GST</th>
                            <th scope="col" className="cld-table__num">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {INVOICE.lines.map((line) => (
                            <tr key={line.item}>
                                <td>{line.item}</td>
                                <td>{line.hsn}</td>
                                <td className="cld-table__num">{line.qty}</td>
                                <td className="cld-table__num">{line.rate}</td>
                                <td className="cld-table__num">{line.gst}%</td>
                                <td className="cld-table__num">{line.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Outside the scrolling wrapper on purpose. See .cld-totals. */}
            <div className="cld-totals">
                <div className="cld-totals__row">
                    <span>Subtotal</span>
                    <span>{INVOICE.subtotal}</span>
                </div>
                <div className="cld-totals__row">
                    <span>GST</span>
                    <span>{INVOICE.gst}</span>
                </div>
                <div className="cld-totals__row cld-totals__row--sum">
                    <span>Total</span>
                    <span>{INVOICE.total}</span>
                </div>
            </div>
        </div>
    );
}

export function CustomersPanel() {
    return (
        <div className="cld-panel">
            <div className="cld-panel__head">
                <h4 className="cld-panel__title">Who is asking, and where it got to</h4>
                {/* Counted, not typed. A hardcoded total drifts the moment
                    anyone edits the pipeline above it. */}
                <span className="cld-panel__status">
                    {PIPELINE.reduce((n, c) => n + c.cards.length, 0)} in play
                </span>
            </div>

            <div className="cld-kanban">
                {PIPELINE.map((col, ci) => (
                    <div key={col.stage} className="cld-kanban__col">
                        <span className="cld-kanban__name">
                            {col.stage} ({col.cards.length})
                        </span>
                        {col.cards.map((card, i) => (
                            <div
                                key={card.who}
                                className="cld-kanban__card"
                                style={{ '--cl-delay': `${0.08 * (ci * 2 + i)}s` }}
                            >
                                <span className="cld-kanban__who">
                                    {card.who}
                                </span>
                                <span className="cld-kanban__who">
                                    {card.what}
                                </span>
                                <span className="cld-kanban__val">
                                    {card.value}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StockPanel() {
    return (
        <div className="cld-panel">
            <div className="cld-panel__head">
                <h4 className="cld-panel__title">What is on the shelf</h4>
                <span className="cld-panel__status">
                    {STOCK.filter((r) => r.status !== 'Fine').length} need
                    reordering
                </span>
            </div>

            <div className="cld-tableWrap">
                <table className="cld-table">
                    <thead>
                        <tr>
                            <th scope="col">Where</th>
                            <th scope="col">Item</th>
                            <th scope="col" className="cld-table__num">Have</th>
                            <th scope="col" className="cld-table__num">Reorder at</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STOCK.map((row) => (
                            <tr key={`${row.place}-${row.item}`}>
                                <td>{row.place}</td>
                                <td>{row.item}</td>
                                <td className="cld-table__num">{row.have}</td>
                                <td className="cld-table__num">{row.reorder}</td>
                                <td>
                                    <span
                                        className={`cld-pill ${
                                            row.status === 'Fine'
                                                ? 'cld-pill--good'
                                                : 'cld-pill--warn'
                                        }`}
                                    >
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function StaffPanel() {
    return (
        <div className="cld-panel">
            <div className="cld-panel__head">
                <h4 className="cld-panel__title">August salaries</h4>
                <span className="cld-panel__status">
                    {PAYROLL.filter((r) => r.status === 'Paid').length} of{' '}
                    {PAYROLL.length} paid
                </span>
            </div>

            <div className="cld-tableWrap">
                <table className="cld-table">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Work</th>
                            <th scope="col" className="cld-table__num">Days</th>
                            <th scope="col" className="cld-table__num">Pay</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PAYROLL.map((row) => (
                            <tr key={row.name}>
                                <td>{row.name}</td>
                                <td>{row.role}</td>
                                <td className="cld-table__num">{row.days}</td>
                                <td className="cld-table__num">{row.pay}</td>
                                <td>
                                    <span
                                        className={`cld-pill ${
                                            row.status === 'Paid'
                                                ? 'cld-pill--good'
                                                : 'cld-pill--warn'
                                        }`}
                                    >
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function MoneyPanel() {
    return (
        <div className="cld-panel">
            <div className="cld-panel__head">
                <h4 className="cld-panel__title">Where the money went</h4>
                <span className="cld-panel__status">August</span>
            </div>

            <Kpis items={MONEY_KPIS} />

            <div className="cld-tableWrap">
                <table className="cld-table">
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Entry</th>
                            <th scope="col" className="cld-table__num">Out</th>
                            <th scope="col" className="cld-table__num">In</th>
                        </tr>
                    </thead>
                    <tbody>
                        {LEDGER.map((row) => (
                            <tr key={`${row.date}-${row.entry}`}>
                                <td>{row.date}</td>
                                <td>{row.entry}</td>
                                <td className="cld-table__num">
                                    {row.debit || '-'}
                                </td>
                                <td className="cld-table__num">
                                    {row.credit || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
