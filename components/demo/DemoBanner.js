/**
 * The legal frame. Top and bottom, on every demo, always.
 *
 * WHY IT LIVES IN THE LAYOUT AND NOT IN THE PAGE
 *
 * A demo page cannot omit what the layout renders. That is the whole
 * reason this is not a component each demo remembers to include: the one
 * time somebody forgets, a fictional business with a fictional address is
 * on the public internet with nothing saying so, and it is being
 * forwarded around WhatsApp.
 *
 * WHY IT IS STYLED FROM ITS OWN TOKENS
 *
 * Every other element on a demo route reads --vd-*, which the demo sets
 * to its own brand. This bar deliberately does not. It is VelBiz chrome
 * sitting outside the demo, and if it inherited the bakery's palette it
 * would read as part of the bakery. Fixed colours, stated here, so it
 * looks like the same frame on all sixteen.
 *
 * The height is fixed rather than measured for the same reason
 * --vd-frame-offset is a constant: a font swapping in must not reflow the
 * page under someone's thumb.
 */
import Link from 'next/link';
import { ArrowUpRight, CaretLeft, WhatsappLogo } from '@phosphor-icons/react/ssr';
import { brand, waLink } from '@/config/site';

/* The message the pitch button opens WhatsApp with.

   Built through waLink() rather than written by hand: a wa.me URL typed
   into a component is exactly what npm run check:brand exists to catch,
   and on an earlier build the phone number lived in eight files.

   It does not name the specific demo. The banner is rendered by
   app/demo-site/layout.js, which has no access to the slug, and threading
   the trade down would mean either a client component reading the
   pathname or every page passing it up. Neither is worth it: "one of your
   example sites" is what a person would actually type, and the visitor
   usually says which one in their next message anyway. */
const PITCH_MESSAGE = `Hello ${brand.shortName}, I saw one of your example sites. I would like something like this for my business.`;

export default function DemoBanner({ position = 'top' }) {
    if (position === 'top') {
        return (
            <div className="vd-frame vd-frame--top">
                {/* The only way back to the hub used to be a link at the
                    bottom of the switcher dialog, which a visitor had to
                    open and scroll to find. This is the way out, and it
                    lives on the VelBiz bar rather than in the demo's own
                    nav on purpose: putting "back to examples" inside the
                    business's chrome would break the illusion that you
                    are on a real business's website, which is the whole
                    point of the demo. */}
                <Link href="/demo-site" className="vd-frame__back">
                    <CaretLeft size={13} weight="bold" aria-hidden="true" />
                    Examples
                </Link>

                {/* Truncates to one line on a phone. Nothing legal is
                    lost: the full statement is in the bottom frame,
                    which has room for it. */}
                <p className="vd-frame__text">
                    <strong>Demonstration site.</strong>
                    {' '}
                    A sample build by {brand.name}. This business is
                    fictional and this page is for display and reference
                    only.
                </p>
            </div>
        );
    }

    return (
        <footer className="vd-frame vd-frame--bottom">
            {/* THE ASK, ABOVE THE LEGAL TEXT.

                A visitor who has scrolled the whole of a demo has just
                spent a minute inside a finished website. That is the
                moment the question "could I have this" is live, and until
                now the only thing waiting for them was a disclaimer and a
                domain name.

                It sits on the VelBiz frame rather than inside the demo's
                own footer deliberately, for the same reason the back link
                does: the demo is pretending to be a real business, and a
                VelBiz pitch inside its chrome would break that. Here it
                reads as the gallery frame around the picture, which is
                what it is. */}
            <div className="vd-pitch">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/vb-mark-light.svg"
                    alt=""
                    width={38}
                    height={29}
                    className="vd-pitch__mark"
                />

                <div className="vd-pitch__body">
                    <p className="vd-pitch__lead">
                        Want a site like this for your own business?
                    </p>
                    <p className="vd-pitch__sub">
                        This one was built by {brand.name}. Tell us what you
                        sell and we will tell you what it needs.
                    </p>
                </div>

                <a
                    href={waLink(PITCH_MESSAGE)}
                    className="vd-pitch__cta"
                    rel="noreferrer noopener"
                >
                    <WhatsappLogo size={19} weight="fill" aria-hidden="true" />
                    Ask about it
                </a>
            </div>

            <div className="vd-frame__inner">
                <p className="vd-frame__text">
                    This is a demonstration website built by {brand.name},
                    {' '}
                    {brand.parent}. The business shown here does not exist.
                    Names, addresses, prices and reviews are invented for
                    the purpose of showing what a finished site looks like.
                </p>
                <div className="vd-frame__actions">
                    <Link href="/demo-site" className="vd-frame__ghost">
                        See the other examples
                    </Link>
                    <a
                        href={`https://${brand.domain}`}
                        className="vd-frame__link"
                        rel="noreferrer noopener"
                    >
                        {brand.domain}
                        <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
