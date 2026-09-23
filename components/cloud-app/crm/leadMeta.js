// Shared formatting, tone and date maths for the CRM pipeline UI.
//
// All date maths here is UTC-consistent: every timestamp is collapsed to its
// UTC midnight before differencing, so "days overdue"/"days in stage" never
// swing by one depending on the viewer's timezone (the bug previously fixed in
// the calendar). Dependency-free so every CRM component can import it cheaply.

export const TONES = {
    critical: { fg: 'var(--status-danger-fg)', bg: 'var(--status-danger-bg)', border: 'var(--status-danger-border)', accent: 'var(--status-danger-fg)' },
    warning: { fg: 'var(--status-warning-fg)', bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', accent: 'var(--status-warning-fg)' },
    good: { fg: 'var(--status-success-fg)', bg: 'var(--status-success-bg)', border: 'var(--status-success-border)', accent: 'var(--status-success-fg)' },
    info: { fg: 'var(--status-info-fg)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)', accent: 'var(--status-info-fg)' },
    neutral: { fg: 'var(--status-neutral-fg)', bg: 'var(--status-neutral-bg)', border: 'var(--status-neutral-border)', accent: 'var(--status-neutral-fg)' },
};

/** A lead untouched for this many days is "stale". */
export const STALE_DAYS = 14;

export function money(n) {
    return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function compactMoney(n) {
    const v = Number(n || 0);
    const s = v < 0 ? '-' : '';
    const a = Math.abs(v);
    if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(2)}Cr`;
    if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(2)}L`;
    if (a >= 1e3) return `${s}₹${(a / 1e3).toFixed(1)}K`;
    return money(v);
}

/** UTC midnight of a date-ish value, or null. */
export function utcDay(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** UTC midnight of "today", evaluated once per call. */
export function todayUtc() {
    const n = new Date();
    return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}

const DAY_MS = 86400000;

/** Whole days from `value` to today (positive = in the past). Null if unparseable. */
export function daysAgo(value, today = todayUtc()) {
    const d = utcDay(value);
    if (d === null) return null;
    return Math.round((today - d) / DAY_MS);
}

/** Whole days from today until `value` (negative = overdue). Null if unparseable. */
export function daysUntil(value, today = todayUtc()) {
    const d = utcDay(value);
    if (d === null) return null;
    return Math.round((d - today) / DAY_MS);
}

export function formatDate(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (!value || Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateTime(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (!value || Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: '2-digit',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    });
}

/** "Today" / "in 3d" / "5d overdue" for a follow-up offset. */
export function relativeDayLabel(days) {
    if (days === null || days === undefined) return '-';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return '1d overdue';
    if (days < 0) return `${Math.abs(days)}d overdue`;
    return `in ${days}d`;
}

/** Prettify stored source slugs (`cold_call` → `Cold Call`). */
export function sourceLabel(source) {
    if (!source) return 'Unspecified';
    return String(source)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/** The most recent activity entry (by `at`), or null. */
export function lastActivity(lead) {
    const acts = Array.isArray(lead?.activities) ? lead.activities : [];
    let best = null;
    for (const a of acts) {
        if (!a?.at) continue;
        if (!best || new Date(a.at) > new Date(best.at)) best = a;
    }
    return best;
}

/**
 * Everything the board needs to know about a lead's health, derived once and
 * reused by the card, the list row, the filters and the KPI strip so all four
 * agree exactly on what "stale" and "overdue" mean.
 */
export function leadHealth(lead, today = todayUtc()) {
    const closed = lead.stage === 'won' || lead.stage === 'lost';
    const followUpIn = daysUntil(lead.followUpDate, today);
    const overdue = !closed && followUpIn !== null && followUpIn < 0;
    const dueSoon = !closed && followUpIn !== null && followUpIn >= 0 && followUpIn <= 2;

    const last = lastActivity(lead);
    const lastTouchSource = last?.at || lead.updatedAt || lead.createdAt;
    // Seeded/clock-skewed records can carry future timestamps - clamp to 0 so a
    // lead never reports "-6 days since last touch".
    const idleDays = Math.max(0, daysAgo(lastTouchSource, today) ?? 0);

    // Days in the current stage = since the latest stage_change, else since creation.
    const stageChanges = (Array.isArray(lead.activities) ? lead.activities : [])
        .filter(a => a?.type === 'stage_change' && a.at);
    const stageSince = stageChanges.length
        ? stageChanges.reduce((m, a) => (new Date(a.at) > new Date(m.at) ? a : m)).at
        : lead.createdAt;
    const daysInStage = Math.max(0, daysAgo(stageSince, today) ?? 0);

    const stale = !closed && idleDays >= STALE_DAYS;

    return {
        closed, followUpIn, overdue, dueSoon, stale,
        idleDays, daysInStage, lastActivity: last, stageSince,
    };
}

/** Tone for a lead card's left rail / badge emphasis. */
export function healthTone(health) {
    if (health.overdue) return 'critical';
    if (health.stale) return 'warning';
    if (health.dueSoon) return 'info';
    return 'neutral';
}

/** Value bands used by the filter bar (in ₹). */
export const VALUE_BANDS = [
    { key: 'lt50k', label: 'Under ₹50K', test: v => v < 50000 },
    { key: '50k-2l', label: '₹50K – ₹2L', test: v => v >= 50000 && v < 200000 },
    { key: '2l-5l', label: '₹2L – ₹5L', test: v => v >= 200000 && v < 500000 },
    { key: 'gte5l', label: '₹5L+', test: v => v >= 500000 },
];

export const ACTIVITY_STYLES = {
    created: { icon: '✦', color: '#4a3aa7', bg: '#f3f0ff', label: 'Created' },
    stage_change: { icon: '⇄', color: '#1e40af', bg: '#eff6ff', label: 'Stage change' },
    note: { icon: '✎', color: '#92400e', bg: '#fffbeb', label: 'Note' },
    default: { icon: '•', color: '#475569', bg: '#f8fafc', label: 'Activity' },
};

export function activityStyle(type) {
    return ACTIVITY_STYLES[type] || ACTIVITY_STYLES.default;
}

/** `<input type="date">` value for a stored timestamp, UTC-safe. */
export function ymdUtc(value) {
    const d = utcDay(value);
    if (d === null) return '';
    return new Date(d).toISOString().slice(0, 10);
}
