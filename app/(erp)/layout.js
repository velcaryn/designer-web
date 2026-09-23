/**
 * Root layout for VelBiz Cloud: the ERP (/cloud/login, /cloud/dashboard,
 * /cloud/doc) and its admin area (/admin/cloud).
 *
 * A separate root layout from the marketing site's app/(site)/layout.js, on
 * purpose. The site runs on Tailwind and the Pearl White tokens; the ERP runs
 * on its own tokens, reset and tenant themes. As two root layouts they never
 * load together: moving between them is a full page load, so neither
 * stylesheet can leak into the other.
 *
 * Nothing here is for search engines. Every page is either behind a sign-in
 * or a private document link, so the whole group is noindex.
 */
import './erp.css';
import { inter, erpFontVariables } from './fonts';
import { brand } from '@/config/site';

export const metadata = {
    metadataBase: new URL(`https://${brand.domain}`),
    title: { default: 'VelBiz Cloud', template: '%s | VelBiz Cloud' },
    robots: { index: false, follow: false },
};

export const viewport = {
    themeColor: '#482683',
};

export default function ErpRootLayout({ children }) {
    return (
        <html lang="en" className={erpFontVariables} suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
