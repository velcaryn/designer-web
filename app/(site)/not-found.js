/**
 * The 404 page.
 *
 * Playbook section 7b: a 404 must carry the brand logo, name the site,
 * and give one obvious route home. Next serves this with a real 404
 * status, which is the honest answer for a crawler.
 *
 * The background is magicui's GlyphMatrix (vendored in registry/magicui),
 * a canvas of faintly shifting glyphs. It is decoration and is marked
 * aria-hidden by the component; it draws once and stays still under
 * reduced motion. The glyph colour is a token read off the document at
 * runtime by the client leaf below, because a canvas cannot resolve a
 * CSS custom property itself.
 */
import './claudelanding.css';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ssr';
import { brand } from '@/config/site';
import ClLegalNav from '@/components/claudelanding/ClLegalNav';
import NotFoundMatrix from '@/components/NotFoundMatrix';

export const metadata = {
    title: 'Page not found',
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <>
            <ClLegalNav />
            <main className="nv-notfound">
                <NotFoundMatrix />
                <div className="nv-shell nv-notfound__inner">
                    <p className="nv-notfound__code" aria-hidden="true">404</p>
                    <h1 className="nv-notfound__title">That page is not here.</h1>
                    <p className="nv-lede nv-notfound__lede">
                        The link may be old, or the address may have a typo in
                        it. Everything {brand.shortName} builds is still where
                        it was.
                    </p>
                    <Link href="/" className="nv-btn nv-btn--primary">
                        <ArrowLeft size={18} weight="bold" aria-hidden="true" />
                        <span>Back to the home page</span>
                    </Link>
                </div>
            </main>
        </>
    );
}
