/**
 * Loads one demo's full record.
 *
 * WHY A SWITCH AND NOT A DYNAMIC IMPORT PATH
 *
 * `import('./' + slug + '.js')` looks tidier and is worse: a template
 * literal in an import defeats static analysis, so the bundler cannot
 * tell which files are reachable and pulls all sixteen into whichever
 * chunk touches this. A literal per case keeps each demo's data in its
 * own chunk, which is the difference between a demo route shipping its
 * own menu and shipping all sixteen businesses.
 *
 * All sixteen are present. The `default` branch returning null is kept
 * because generateStaticParams reads its slug list from the registry: if
 * a card is ever added there before its data file exists, the route
 * renders a themed placeholder rather than throwing at build time.
 */
export async function loadDemo(slug) {
    switch (slug) {
        case 'bakery':
            return (await import('./bakery.js')).default;
        case 'restaurant':
            return (await import('./restaurant.js')).default;
        case 'warehouse':
            return (await import('./warehouse.js')).default;
        case 'dental-clinic':
            return (await import('./dental-clinic.js')).default;
        case 'online-shop':
            return (await import('./online-shop.js')).default;
        case 'home-stay':
            return (await import('./home-stay.js')).default;
        case 'lodging':
            return (await import('./lodging.js')).default;
        case 'clinic':
            return (await import('./clinic.js')).default;
        case 'hospital':
            return (await import('./hospital.js')).default;
        case 'wellness-and-beauty':
            return (await import('./wellness-and-beauty.js')).default;
        case 'retail':
            return (await import('./retail.js')).default;
        case 'ecommerce':
            return (await import('./ecommerce.js')).default;
        case 'small-business':
            return (await import('./small-business.js')).default;
        case 'photo-studio':
            return (await import('./photo-studio.js')).default;
        case 'education':
            return (await import('./education.js')).default;
        case 'logistics':
            return (await import('./logistics.js')).default;
        case 'architecture':
            return (await import('./architecture.js')).default;
        case 'home-services':
            return (await import('./home-services.js')).default;
        case 'real-estate':
            return (await import('./real-estate.js')).default;
        case 'accountant':
            return (await import('./accountant.js')).default;
        case 'advocate':
            return (await import('./advocate.js')).default;
        case 'car-service':
            return (await import('./car-service.js')).default;
        case 'bike-service':
            return (await import('./bike-service.js')).default;
        case 'auto-resale':
            return (await import('./auto-resale.js')).default;
        default:
            return null;
    }
}
