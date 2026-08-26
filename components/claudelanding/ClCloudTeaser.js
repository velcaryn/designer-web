'use client';

/**
 * The bridge from the website story to the back-office story.
 *
 * It is deliberately short. The full argument for VelBiz Cloud lives at
 * /cloud; this section exists only to make the visitor realise they have a
 * problem the website alone does not solve, and to give them the door.
 *
 * The invoice in the frame carries the visitor's business name, so the
 * connection between "your site" and "your back office" is made visually
 * rather than asserted.
 */
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import Safari from '@/registry/magicui/safari';
import Reveal from '@/components/Reveal';
import { useBusiness, slugify } from './BusinessContext';

const LINES = [
    { name: 'Item one', qty: '2', amount: '2,400' },
    { name: 'Item two', qty: '1', amount: '1,150' },
    { name: 'Delivery', qty: '1', amount: '120' },
];

const REPLACES = [
    'The order notebook',
    'The stock register',
    'A billing app',
    'A spreadsheet for the money',
];

function MiniInvoice() {
    const { displayName } = useBusiness();

    return (
        <div className="cld-panel">
            <div className="cld-panel__head">
                <h4 className="cld-panel__title">{displayName}</h4>
                <span className="cld-panel__status">Invoice 0142</span>
            </div>

            <div className="cld-tableWrap">
                <table className="cld-table">
                    <thead>
                        <tr>
                            <th scope="col">Item</th>
                            <th scope="col" className="cld-table__num">
                                Qty
                            </th>
                            <th scope="col" className="cld-table__num">
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {LINES.map((line, i) => (
                            <tr
                                key={line.name}
                                style={{ '--cl-delay': `${i * 0.5}s` }}
                            >
                                <td>{line.name}</td>
                                <td className="cld-table__num">{line.qty}</td>
                                <td className="cld-table__num">
                                    Rs {line.amount}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td>
                                <strong>Total with GST</strong>
                            </td>
                            <td className="cld-table__num" />
                            <td className="cld-table__num">
                                <strong>Rs 4,332</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function ClCloudTeaser() {
    const { displayName } = useBusiness();

    return (
        <section className="nv-section nv-ground--storm">
            <div className="nv-shell cl-teaser__grid">
                <Reveal>
                    <span className="nv-eyebrow">VelBiz Cloud</span>
                    <h2 className="cl-h2">
                        Once the orders arrive, they have to go somewhere.
                    </h2>
                    <p className="nv-lede">
                        Most businesses end up with a notebook, a billing app
                        and a spreadsheet that never quite agree. VelBiz Cloud
                        is one place for all of it, wired to the same site.
                    </p>

                    <ul className="cl-teaser__list">
                        {REPLACES.map((item) => (
                            <li key={item} className="cl-chip">
                                {item}
                            </li>
                        ))}
                    </ul>

                    <div className="cl-actions">
                        <Link href="/cloud" className="nv-btn nv-btn--primary">
                            See VelBiz Cloud
                            <ArrowRight size={18} weight="bold" />
                        </Link>
                    </div>
                </Reveal>

                <Reveal delay={0.08}>
                    <Safari url={`${slugify(displayName)}.com/billing`}>
                        <MiniInvoice />
                    </Safari>
                </Reveal>
            </div>
        </section>
    );
}
