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
    name: 'Velbrant Studios',
    shortName: 'Velbrant',
    parent: 'A unit of Velcaryn LLP',
    tagline: 'Websites, launched and grown',
    domain: 'velbrant.studio',
    description:
        'We design and build websites, take them live, and run the SEO, content and social work that brings people to them.',
    /* Coimbatore, working across India. Kept here because it appears in the
       footer and would otherwise be typed into prose. */
    base: 'Coimbatore',
};

/**
 * PLACEHOLDERS. Both must be replaced before this site is public.
 *
 * `phone` is digits only, country code included, no plus and no spaces.
 *
 * It is deliberately an unroutable number rather than a plausible one. A
 * plausible placeholder is a real person's line that then receives your
 * enquiries: an earlier draft of this site briefly carried a number lifted
 * from a client's website for exactly that reason.
 */
export const contact = {
    phone: '910000000000',
    phoneDisplay: '+91 00000 00000',
    email: 'hello@velbrant.studio',
    instagram: 'https://instagram.com/velbrant.studio',
    instagramHandle: '@velbrant.studio',
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
