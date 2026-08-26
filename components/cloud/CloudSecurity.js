/**
 * The trust section: what happens to a business's data once it is in the
 * system.
 *
 * Ported from the Velcaryn Cloud page's security content. Every claim
 * here is a statement about how the system is built, never a number:
 * the source page carried "99.9% uptime SLA" and "100% tenant data
 * isolation", and this site does not publish metrics it cannot show the
 * working for (see the content rules in CLAUDE.md). An uptime figure in
 * particular is a contractual promise, and we are not making one on a
 * marketing page.
 *
 * A server component. Nothing here is interactive.
 */
import {
    Database,
    Lock,
    ArrowsClockwise,
    ClipboardText,
    Key,
} from '@phosphor-icons/react/ssr';
import Reveal from '@/components/Reveal';

const POINTS = [
    {
        Icon: Database,
        title: 'Your data sits on its own',
        body: 'Every business gets its own isolated store. Nobody else’s records share a table with yours.',
    },
    {
        Icon: Lock,
        title: 'Encrypted in transit and at rest',
        body: 'Traffic runs over HTTPS and the stored data is encrypted on disk, so a stolen drive is not a stolen ledger.',
    },
    {
        Icon: ArrowsClockwise,
        title: 'Backed up automatically',
        body: 'Regular snapshots you do not have to remember to take, and a documented path to restore one.',
    },
    {
        Icon: ClipboardText,
        title: 'Every change leaves a trail',
        body: 'Who edited an invoice, and when. An audit trail is the difference between a disagreement and a dispute.',
    },
    {
        Icon: Key,
        title: 'Staff see only their part',
        body: 'Role-based access, so the person doing billing is not also looking at payroll.',
    },
];

export default function CloudSecurity() {
    return (
        <section id="security" className="nv-section nv-ground--paper">
            <div className="nv-shell">
                <div className="cl-head cl-head--wide">
                    <span className="nv-eyebrow">Built to be trusted</span>
                    <h2 className="cl-h2">
                        Your books, kept the way a business needs them kept.
                    </h2>
                </div>

                <div className="cld-security">
                    {POINTS.map(({ Icon, title, body }, i) => (
                        <Reveal
                            key={title}
                            delay={0.04 * i}
                            className="cld-security__item"
                        >
                            <span className="cld-security__icon" aria-hidden="true">
                                <Icon size={20} weight="bold" />
                            </span>
                            <h3 className="cld-security__title">{title}</h3>
                            <p className="cld-security__body">{body}</p>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
