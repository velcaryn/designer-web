/*
 * Metadata for the VelBiz Cloud signup page. The page is a client component
 * (a two-step form), which cannot export metadata. Without this it inherited
 * the site's home canonical, so search engines were told this URL was a
 * duplicate of the home page.
 */
export const metadata = {
    title: 'Sign Up for VelBiz Cloud',
    description: 'Request a VelBiz Cloud workspace for your business: GST invoicing, stock, accounts and payroll in one system. Two short steps; we set it up and send your login.',
    alternates: { canonical: '/cloud/onboarding' },
};

export default function CloudOnboardingLayout({ children }) {
    return children;
}
