/**
 * Footer.
 *
 * Light, like the rest of the page. A dark footer under a light site is the
 * conventional move and it is exactly the theme flip the stylesheet's theme
 * lock rules out: the page commits to one mode all the way down.
 *
 * The parent-company line is the point of the whole section. "A unit of
 * Velcaryn LLP" is what lets a new brand borrow an existing entity's
 * credibility, and it is why the wordmark was designed to sit next to that
 * sentence without either one shouting over the other.
 */
const COLUMNS = [
    {
        head: 'Studio',
        links: [
            { label: 'What we do', href: '#capabilities' },
            { label: 'Work', href: '#work' },
            { label: 'Process', href: '#process' },
            { label: 'Engagements', href: '#engagements' },
        ],
    },
    {
        head: 'Services',
        links: [
            { label: 'Website design and build', href: '#capabilities' },
            { label: 'SEO and content', href: '#capabilities' },
            { label: 'Social and paid media', href: '#capabilities' },
            { label: 'Cloud and ERP', href: '#cloud' },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="nv-footer">
            <div className="nv-shell">
                <div className="nv-footer__top">
                    <div>
                        <span className="nv-wordmark">
                            <span className="nv-wordmark__mark">Velbrant</span>
                            <span className="nv-wordmark__sub">Studios</span>
                        </span>
                        <p className="nv-footer__pitch">
                            We design and build websites, take them live, and run the growth
                            work that makes them worth having. Coimbatore, working across
                            India.
                        </p>
                    </div>

                    {COLUMNS.map(({ head, links }) => (
                        <nav key={head} aria-label={head}>
                            <p className="nv-footer__colhead">{head}</p>
                            {links.map(({ label, href }) => (
                                <a className="nv-footer__link" href={href} key={label}>
                                    {label}
                                </a>
                            ))}
                        </nav>
                    ))}
                </div>

                <div className="nv-footer__bottom">
                    <span>Velbrant Studios, a unit of Velcaryn LLP.</span>
                    <span>Built in-house. No templates were harmed.</span>
                </div>
            </div>
        </footer>
    );
}
