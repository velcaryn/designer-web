/**
 * What /demo-site/plumbing shows.
 *
 * A prospect typing a URL from memory, or a sales message with a
 * mistyped slug, or someone guessing whether their trade is covered.
 * Any of those landing on a bare 404 is a lost conversation, so this
 * offers the nearest match and then the whole set.
 *
 * It is a server component with no client JavaScript: nearestSlug runs
 * at request time on a list of sixteen, which is not work worth shipping
 * to a browser.
 */
import Link from 'next/link';
import { DEMOS } from '@/content/demos';
import NearestMatch from '@/components/demo/NearestMatch';

export default function DemoNotFound() {

    return (
        <div className="vd-root vd-404">

            <main className="vd-section">
                <div className="vd-shell">
                    <h1 className="vd-404__title">We do not have that one</h1>
                    <p className="vd-404__lede">
                        There are sixteen examples and that is not one of
                        their names. It may still be here under a different
                        one.
                    </p>

                    {/* The slug is not passed to a not-found boundary
                        and Next 16 does not expose the requested path to
                        a server component here, so the match is worked
                        out in the browser from location.pathname. It is a
                        string comparison against a list of sixteen, which
                        is not worth a middleware hop, and the full list
                        below renders server-side regardless so the page
                        is useful with no JavaScript at all. */}
                    <NearestMatch />

                    <p className="vd-404__all">All sixteen</p>
                    <ul className="vd-404__list">
                        {DEMOS.map((d) => (
                            <li key={d.slug}>
                                <Link href={`/demo-site/${d.slug}`} className="vd-404__item">
                                    <span className="vd-switch__swatch" aria-hidden="true">
                                        {d.swatch.map((c) => (
                                            <span key={c} style={{ background: c }} />
                                        ))}
                                    </span>
                                    {d.trade}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
}
