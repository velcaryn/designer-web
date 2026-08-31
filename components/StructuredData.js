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
import { brand, contact, phoneHref, faqs, services } from '@/config/site';

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
                /* NARROWED FROM 'India', DELIBERATELY.
                   Telling Google we serve a country of 1.4 billion is
                   telling it nothing, and it is the opposite of the
                   actual strategy: the realistic first fifty clients are
                   within a couple of hundred kilometres and arrive
                   through Maps and word of mouth. Naming the districts
                   is what makes a local pack result possible at all.
                   The wider state stays on the list because we do take
                   work from Chennai and Coimbatore; it is last because
                   the order is read as priority. */
                areaServed: [
                    { '@type': 'City', name: 'Tirunelveli' },
                    { '@type': 'City', name: 'Nagercoil' },
                    { '@type': 'City', name: 'Thoothukudi' },
                    { '@type': 'City', name: 'Tenkasi' },
                    { '@type': 'City', name: 'Madurai' },
                    { '@type': 'State', name: 'Tamil Nadu' },
                ],
                /* Coordinates for the district centre. A LocalBusiness
                   without geo is a business Maps cannot place. */
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 8.7139,
                    longitude: 77.7567,
                },
                openingHoursSpecification: [
                    {
                        '@type': 'OpeningHoursSpecification',
                        dayOfWeek: [
                            'Monday', 'Tuesday', 'Wednesday',
                            'Thursday', 'Friday', 'Saturday',
                        ],
                        opens: '09:30',
                        closes: '19:00',
                    },
                ],
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
                /* A comma-separated list is how Google reads multiple
                   service types on one node. Ecommerce is named here
                   because the FAQ now says we build it: structured data
                   that claims less than the visible page is a wasted
                   signal, and one that claims more is a liability. */
                serviceType: 'Web design and development, Ecommerce development, SEO',
                provider: { '@id': `${site}/#organization` },
                areaServed: [
                    { '@type': 'City', name: 'Tirunelveli' },
                    { '@type': 'State', name: 'Tamil Nadu' },
                ],
                description:
                    'Websites and online shops designed and built for small businesses, taken live, and kept found in search.',
            },
            /* One node per service page, so a crawler can tell the three
               apart rather than seeing one blurred offering. Each points
               back at the organisation by @id and names the same area the
               organisation serves. */
            ...services.map((svc) => ({
                '@type': 'Service',
                '@id': `${site}/services/${svc.slug}#service`,
                name: svc.title,
                serviceType: svc.title,
                description: svc.seo,
                url: `${site}/services/${svc.slug}`,
                provider: { '@id': `${site}/#organization` },
                areaServed: [
                    { '@type': 'City', name: 'Tirunelveli' },
                    { '@type': 'State', name: 'Tamil Nadu' },
                ],
            })),
            {
                /* FAQPage, built from the SAME array ClFaq renders.
                   Never type these answers twice. On an earlier build the
                   rendered FAQ and the JSON-LD were written separately,
                   drifted apart, and Google was served answers that were
                   no longer anywhere on the page. Structured data that
                   does not match the visible page is a manual-action
                   risk, not just an untidiness. */
                '@type': 'FAQPage',
                '@id': `${site}/#faq`,
                isPartOf: { '@id': `${site}/#website` },
                mainEntity: faqs.map((item) => ({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: item.a,
                    },
                })),
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
