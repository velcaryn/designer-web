'use client';

/**
 * The two-item dock, for every page that is not the home page.
 *
 * WHY NOT ClDock
 *
 * ClDock is the home page's own control: six sections, a scroll spy over
 * them, pointer-proximity magnification, and the lab countdown pill. None
 * of that means anything on /cloud or a service page, which have neither
 * those sections nor the lab.
 *
 * WHY A DOCK AT ALL ON THOSE PAGES
 *
 * The bottom of the screen is where a thumb rests, and until now only the
 * home page had anything there. A visitor who arrived on a service page
 * from search had the header and nothing else.
 *
 * ICONS ONLY, AND CONTACT CARRIES THE FILL
 *
 * Two words at the bottom of the screen is a label on a control that
 * needs none: a house and a speech bubble are unambiguous, and the
 * accessible name is on the link for anyone who needs it read out. The
 * Contact icon keeps the brand fill, which is the one piece of state
 * that IS true here: it is the action, not a place you might be.
 *
 * NOTHING IS HIGHLIGHTED BY DEFAULT
 *
 * Home and Contact are both destinations, not sections of the page you
 * are on, so neither is ever "where you are". On the home page the dock
 * tracks position because there is a position to track; here there is
 * not, and lighting one of two links permanently would be decoration
 * pretending to be state.
 *
 * The demo pages deliberately do not get this. They have the switcher
 * pill in the same corner, and two floating controls fighting over one
 * thumb is worse than either alone.
 */
import Link from 'next/link';
import { House, ChatCircle } from '@phosphor-icons/react/ssr';

export default function ClMiniDock() {
    return (
        <nav className="cl-minidock" aria-label="Quick links">
            <Link href="/" className="cl-minidock__item" aria-label="Home">
                <House size={21} weight="bold" aria-hidden="true" />
            </Link>
            <Link
                href="/#talk"
                className="cl-minidock__item cl-minidock__item--cta"
                aria-label="Contact us"
            >
                <ChatCircle size={21} weight="bold" aria-hidden="true" />
            </Link>
        </nav>
    );
}
