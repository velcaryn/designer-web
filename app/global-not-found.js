/**
 * The 404 for a URL that matches no route at all.
 *
 * The app has two root layouts (app/(site) and app/(erp)), so Next cannot
 * compose this page from a layout and renders this file on its own. It
 * therefore brings its own <html>, <body>, global stylesheet and fonts, and
 * reuses the marketing site's 404 body so there is one design for it.
 * app/(site)/not-found.js still handles notFound() thrown inside the site.
 */
import './(site)/globals.css';
import { nvFontVariables } from './(site)/fonts';
import { labFontVariables } from './(site)/lab-fonts';
import NotFound from './(site)/not-found';

export const metadata = {
    title: 'Page not found',
    robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
    return (
        <html lang="en" className={labFontVariables}>
            <body className={`${nvFontVariables} nv-root`}>
                <NotFound />
            </body>
        </html>
    );
}
