/**
 * One phone number, two shapes: how it is stored and how it is read.
 *
 * STORAGE is canonical and unambiguous: `+91` followed by exactly 10 digits,
 * no spaces. That is what search, deduplication, SMS and WhatsApp all need,
 * and it is what every comparison in the codebase assumes.
 *
 * DISPLAY is grouped for the eye: `+91 98xxx xxxxx`. A receptionist reading a
 * number back to a patient, or checking it against a slip, is scanning for
 * digits in chunks. An unbroken 10-digit run is where transcription errors
 * come from.
 *
 * WHY A `+91 ` PREFILL IN THE INPUT WAS THE WRONG SHAPE
 *
 * Several forms seed the field with the literal string `'+91 '`. It looks like
 * a fixed prefix but it is ordinary editable text, so it can be backspaced away
 * or typed over, and then the stored value silently loses its country code. It
 * also fights paste: pasting a number that already carries +91 gives `+91 +91
 * ...`. The fix is to render the prefix as static adornment OUTSIDE the input
 * and keep only the national digits inside it, which is what `PhoneInput` does.
 */

/** The only country this HMS registers patients in. Kept named rather than inline. */
export const DEFAULT_COUNTRY_CODE = '+91';

/** Indian mobile numbers are 10 digits and never start with 0 to 5. */
const IN_MOBILE = /^[6-9][0-9]{9}$/;

/**
 * Strip everything that is not a digit or a leading plus.
 *
 * Handles the shapes people actually paste: `98xxx xxxxx`, `+91-98xxx-xxxxx`,
 * `(+91) 98xxxxxxxx`, `098xxxxxxxx`, `9198xxxxxxxx`.
 */
export function normalizePhone(input, countryCode = DEFAULT_COUNTRY_CODE) {
    const raw = String(input ?? '').trim();
    if (!raw) return '';

    let digits = raw.replace(/[^\d]/g, '');
    const cc = countryCode.replace(/[^\d]/g, '');

    // A leading country code, with or without the plus that was stripped above.
    if (digits.length > 10 && digits.startsWith(cc)) digits = digits.slice(cc.length);
    // A domestic trunk prefix, as printed on most Indian visiting cards.
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

    if (!digits) return '';
    return `${countryCode}${digits}`;
}

/**
 * Clean a PASTED string down to national digits, without touching a partial one.
 *
 * This exists because `normalizePhone` cannot serve a field being typed into.
 * It strips a country code only when the string exceeds 10 digits, since it is
 * built for a complete number - correct there, wrong on every keystroke before
 * the last. Feeding it partial input made "9" become "+919", and the country
 * code then multiplied on each subsequent character.
 *
 * Here the rule is length-driven and applied ONCE, never iteratively:
 *   - 12 digits starting 91  -> a pasted +91 number, drop the code
 *   - 11 digits starting 0   -> a trunk prefix from a visiting card, drop it
 *   - anything else          -> exactly what the operator typed, untouched
 *
 * A 10-digit string starting "91" is deliberately left ALONE. Indian mobile
 * numbers may legitimately begin with 9 and 1, so stripping there would corrupt
 * a real number to chase a country code that is not present.
 */
export function stripPastedPrefix(digits, countryCode = DEFAULT_COUNTRY_CODE) {
    const d = String(digits ?? '').replace(/[^\d]/g, '');
    const cc = countryCode.replace(/[^\d]/g, '');
    if (d.length === cc.length + 10 && d.startsWith(cc)) return d.slice(cc.length);
    if (d.length === 11 && d.startsWith('0')) return d.slice(1);
    return d;
}

/** The 10 national digits, without the country code. What the input holds. */
export function nationalDigits(input, countryCode = DEFAULT_COUNTRY_CODE) {
    const normalized = normalizePhone(input, countryCode);
    return normalized ? normalized.slice(countryCode.length) : '';
}

/**
 * Group for reading: `+91 98xxx xxxxx`.
 *
 * Anything that is not a recognisable 10-digit Indian number is returned as it
 * was stored rather than being forced into 5+5. A partially entered number, a
 * landline, or a foreign number must stay legible instead of being chopped at
 * an arbitrary boundary.
 */
export function formatPhone(input, countryCode = DEFAULT_COUNTRY_CODE) {
    const raw = String(input ?? '').trim();
    if (!raw) return '';

    const digits = nationalDigits(raw, countryCode);
    if (digits.length === 10) return `${countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;

    // Not a 10-digit number: show what we hold, unmangled.
    return raw;
}

/** Display helper for a possibly-missing value, so call sites stop writing `|| '-'`. */
export function formatPhoneOr(input, fallback = '-') {
    return formatPhone(input) || fallback;
}

/** True for a storable Indian mobile number. */
export function isValidIndianMobile(input) {
    return IN_MOBILE.test(nationalDigits(input));
}
