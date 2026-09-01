/**
 * VelBiz's own pitch to a hospital, not a fictional business.
 * See content/verticals/photo-studio.js for the rule this file follows.
 *
 * REGULATED TRADE, AND THE MOST SENSITIVE ONE ON THE SITE. No
 * accreditation numbers, no bed counts dressed as achievements, no
 * success-rate figures. A hospital page is where an invented metric
 * could actually cause harm, since a patient may act on it.
 */

export default {
    slug: 'hospital',
    trade: 'Hospital',
    demoSlug: 'hospital',

    metaTitle: 'Website for a Hospital',
    metaDescription:
        'A website for a hospital: departments, consulting hours and what a visit involves, stated plainly, with an emergency contact pinned and no invented figures anywhere. Built in Tirunelveli and across Tamil Nadu.',

    h1: 'A website for your hospital',
    intro:
        'A hospital website has one urgent job above the rest: someone arriving in an emergency, or a family member searching for them, needs to reach the right department fast. We build that path first, then the rest of the site around departments and what a visit actually involves, without any invented figures.',

    needs: [
        {
            name: 'An emergency contact, pinned and always visible',
            text: 'The one thing that must never be a scroll away. We put the emergency line where it cannot be missed, on every page.',
        },
        {
            name: 'Departments, mapped to what a patient is actually looking for',
            text: 'A symptom-to-department guide helps a worried visitor find the right place to go, rather than a flat list of department names that mean nothing to someone outside medicine.',
        },
        {
            name: 'Consulting hours and what a check-up includes, stated plainly',
            text: 'What is checkable by walking in should be stated plainly on the page: hours, what a general check-up covers, and how to book one.',
        },
        {
            name: 'No accreditation numbers, no success-rate figures',
            text: 'We do not invent or dress up figures on a page where a patient might act on them. What the hospital offers is described plainly instead.',
        },
    ],

    faqs: [
        {
            q: 'Will the emergency number be easy to find on every page?',
            a: 'Yes. It is pinned in a fixed position across the whole site, not buried in a contact page.',
        },
        {
            q: 'Will the site show bed counts, accreditations or success rates?',
            a: 'No. This is a hospital site, where an invented or exaggerated figure could genuinely mislead a patient. We describe departments, hours and what a visit involves instead.',
        },
        {
            q: 'Can patients find the right department for a symptom?',
            a: 'We build a simple symptom-to-department guide so a worried visitor can find where to go without needing to already know how a hospital is organised.',
        },
    ],
};
