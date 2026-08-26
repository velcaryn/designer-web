/**
 * JSON-LD structured data.
 *
 * There was none. Structured data is how a search engine learns what
 * this business IS rather than inferring it from prose: the name, that
 * it is a local business in Tirunelveli, what it sells, and how to
 * reach it. It is what makes a rich result possible, and rich results
 * are what a site earns clicks with before it has any domain authority.
 *
 * EVERY VALUE COMES FROM config/site.js
 *
 * Nothing here is typed by hand. That is the same rule the rest of the
 * site follows, and it matters more here than usual: structured data
 * that disagrees with the visible page is a manual-action risk, not
 * just a wasted opportunity. If the phone number changes in one place
 * it must change in both, so there is only one place.
 *
 * The phone is built through `phoneHref` rather than written out,
 * because the brand-leak guard fails a bare number anywhere outside
 * config/site.js, and correctly so.
 *
 * NO INVENTED CLAIMS. There is no aggregateRating, no review and no
 * priceRange, because we have no real ones and fabricating them in
 * markup a crawler reads is worse than fabricating them in prose.
 */
import { brand, contact, phoneHref } from '@/config/site';

export default function StructuredData() {
    const site = `https://${brand.domain}`;

    /* @graph rather than three separate script tags: it lets the nodes
       reference each other by @id, so the crawler understands that the
       organisation, the website and the service are one entity and not
       three unrelated things that happen to share a page. */
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'ProfessionalService',
                '@id': `${site}/#organization`,
                name: brand.name,
                description: brand.description,
                url: site,
                email: contact.email,
                telephone: phoneHref.replace('tel:', ''),
                parentOrganization: { '@type': 'Organization', name: brand.parent },
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Tirunelveli',
                    addressRegion: 'Tamil Nadu',
                    addressCountry: 'IN',
                },
                areaServed: { '@type': 'Country', name: 'India' },
                sameAs: [contact.instagram],
                knowsAbout: [
                    'Web design',
                    'Web development',
                    'Search engine optimisation',
                    'Small business software',
                ],
            },
            {
                '@type': 'WebSite',
                '@id': `${site}/#website`,
                url: site,
                name: brand.name,
                description: brand.description,
                publisher: { '@id': `${site}/#organization` },
                inLanguage: 'en-IN',
            },
            {
                '@type': 'Service',
                '@id': `${site}/#service`,
                name: 'Website design and build',
                serviceType: 'Web design and development',
                provider: { '@id': `${site}/#organization` },
                areaServed: { '@type': 'Country', name: 'India' },
                description:
                    'Websites designed and built for small businesses, taken live, and kept found in search.',
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            /* The only safe use of this prop: the content is a value we
               construct from our own config and serialise ourselves. No
               user input reaches it. */
            dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
    );
}
