/**
 * Shared, non-visual helpers for the calendar components.
 *
 * Styling lives in each component's own <style jsx> block (component-scoped in
 * this codebase, so shared class names have to be redefined per component) -
 * only data/formatting is shared from here.
 *
 * All date math is UTC-consistent: `new Date('YYYY-MM-DD')` parses as UTC
 * midnight, which is how manual entries are stored by the POST handler, and the
 * grid is built with setUTCDate/getUTCDate. Mixing local getters with
 * toISOString() is what caused the "clicking the 15th opens the 14th" bug.
 */

/*
 * Per-type identity colours. The hue tells one event type from another at a
 * glance and is genuinely useful in a month grid, so it stays a literal.
 *
 * `bg` is MIXED against the current surface rather than being a fixed pastel.
 * The literals it replaced (#f3f0ff, #fff7ed, #ecfeff, ...) were authored for a
 * white page, so on the dark themes every active filter pill and event chip
 * painted a near-white block. Mixing 18% of the hue into --surface keeps the
 * same tint relationship on any theme.
 *
 * The hues themselves are a step brighter than the originals (#0369a1 ->
 * #38bdf8, #be185d -> #f472b6). A mid-tone blue reads fine as ink on white and
 * disappears against a dark surface, and these double as the border and label
 * colour on their own tint.
 */
const tint = hue => `color-mix(in srgb, ${hue} 18%, var(--surface) 82%)`;

export const EVENT_STYLES = {
    lead_followup: { icon: '📞', label: 'Lead Follow-ups', color: '#a78bfa', bg: tint('#a78bfa') },
    invoice_due: { icon: '💰', label: 'Invoices Due', color: '#fb923c', bg: tint('#fb923c') },
    reminder: { icon: '⏰', label: 'Reminders', color: '#22d3ee', bg: tint('#22d3ee') },
    meeting: { icon: '🗓️', label: 'Meetings', color: '#4ade80', bg: tint('#4ade80') },
    purchase_order: { icon: '📦', label: 'Purchase Orders', color: '#38bdf8', bg: tint('#38bdf8') },
    sales_order: { icon: '📑', label: 'Sales Orders', color: '#c4b5fd', bg: tint('#c4b5fd') },
    recurring_invoice: { icon: '🔁', label: 'Recurring', color: '#f472b6', bg: tint('#f472b6') },
    other: { icon: '📌', label: 'Other', color: '#94a3b8', bg: tint('#94a3b8') },
};

export const MANUAL_TYPES = ['reminder', 'meeting', 'other'];

/* Severity reads off the shared status tokens, so an alert in Cloud looks like
   a status pill everywhere else and re-themes with them. */
export const SEVERITY_COLORS = {
    critical: { color: 'var(--status-danger-fg)', bg: 'var(--status-danger-bg)', border: 'var(--status-danger-border)' },
    warning: { color: 'var(--status-warning-fg)', bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)' },
    info: { color: 'var(--status-info-fg)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)' },
};

export function styleFor(type) {
    return EVENT_STYLES[type] || EVENT_STYLES.other;
}

/** UTC calendar-day key, e.g. "2026-07-29". */
export function ymd(d) {
    return new Date(d).toISOString().slice(0, 10);
}

export function sameUtcDay(a, b) {
    return ymd(a) === ymd(b);
}

/** Human, informative lateness copy - the whole point of the notification panel. */
export function relativeDayLabel(days) {
    if (days === null || days === undefined || Number.isNaN(days)) return '';
    if (days < 0) {
        const n = Math.abs(days);
        if (n === 1) return '1 day overdue';
        if (n < 30) return `${n} days overdue`;
        const months = Math.round(n / 30);
        return `${n} days overdue (~${months} month${months === 1 ? '' : 's'})`;
    }
    if (days === 0) return 'due today';
    if (days === 1) return 'due tomorrow';
    if (days <= 7) return `in ${days} days`;
    return `in ${days} days`;
}

export function urgencyTone(urgency) {
    if (urgency === 'overdue') return SEVERITY_COLORS.critical;
    if (urgency === 'today') return SEVERITY_COLORS.warning;
    return SEVERITY_COLORS.info;
}

/** ₹34,73,818 - full Indian-grouped rupees, no paise (figures read cleaner). */
export function money(amount, currency = 'INR') {
    if (amount === null || amount === undefined) return '';
    const n = Math.round(Number(amount) || 0);
    if (currency === 'INR') return `₹${n.toLocaleString('en-IN')}`;
    return `${currency} ${n.toLocaleString('en-IN')}`;
}

/** Compact form for group headers: ₹34.74L / ₹1.20Cr. */
export function moneyCompact(amount, currency = 'INR') {
    const n = Number(amount) || 0;
    if (currency !== 'INR') return money(n, currency);
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
    return money(n, currency);
}

export function formatDate(date, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
    return new Date(date).toLocaleDateString('en-IN', { timeZone: 'UTC', ...opts });
}
