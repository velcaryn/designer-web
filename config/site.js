/**
 * ALL brand-specific data. The only file to edit when anything about the
 * business changes: name, number, address, handles, parent company.
 *
 * WHY THIS FILE EXISTS (docs/PLAYBOOK.md, section 2)
 * On the Liha build the phone number appeared in 8 files, 20 times. Cloning
 * that repo and missing one occurrence ships the previous client's phone
 * number on a live site. That is not an embarrassment, it is a lost client.
 *
 * The same rule applies to our own site for a different reason: the contact
 * details here are still placeholders, and when the real ones arrive there
 * must be exactly one place to put them.
 *
 * NEVER write a `wa.me` or `tel:` URL by hand anywhere else. Build it with
 * the helpers below. Guarded by `npm run check:brand`.
 */

export const brand = {
    name: 'VelBiz Digital',
    shortName: 'VelBiz',
    parent: 'A unit of Velcaryn LLP',
    tagline: 'Websites, launched and grown',
    domain: 'velbiz.com',
    description:
        'We design and build websites, take them live, and run the SEO, content and social work that brings people to them.',
    /* Kept here because it appears in more than one footer and would
       otherwise be hand-typed into prose in each. */
    base: 'Tirunelveli, Tamil Nadu, India',
};

/**
 * `phone` is digits only, country code included, no plus and no spaces.
 */
export const contact = {
    phone: '919944788655',
    phoneDisplay: '+91 99447 88655',
    email: 'help@velbiz.com',
    /* Both are real inboxes, not the primary contact route. Kept here, not
       hand-typed into a component, for the same reason `phone` is: one
       place to update if either changes. */
    emailContact: 'contact@velbiz.com',
    emailInfo: 'info@velbiz.com',
    instagram: 'https://instagram.com/velbiz.digital',
    instagramHandle: '@velbiz.digital',
};

export const phoneHref = `tel:+${contact.phone}`;
export const emailHref = `mailto:${contact.email}`;

/** Builds every WhatsApp URL on the site. Do not hand-roll one. */
export function waLink(message) {
    return `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
}

export const waDefault = waLink(
    `Hello ${brand.shortName}, I would like to talk about a project.`,
);

/**
 * The enquiry message, assembled from whatever the visitor gave us. Kept
 * here rather than in the form so the wording is consistent with every other
 * WhatsApp entry point.
 */
export function waEnquiry({ name, email, company, brief }) {
    const lines = [
        `Hello ${brand.shortName}.`,
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        company ? `Company: ${company}` : null,
        '',
        brief,
    ].filter((line) => line !== null);
    return waLink(lines.join('\n'));
}
