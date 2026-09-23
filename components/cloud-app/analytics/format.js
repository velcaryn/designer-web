// Shared formatting + palette for the Cloud Analytics v2 dashboard.
// Kept dependency-free so every analytics component can import it cheaply.

/** Fixed categorical palette - fixed hue order, never cycled per-render. */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

export const SEVERITY = {
    critical: { fg: 'var(--status-danger-fg)', bg: 'var(--status-danger-bg)', border: 'var(--status-danger-border)', accent: 'var(--status-danger-fg)' },
    warning: { fg: 'var(--status-warning-fg)', bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', accent: 'var(--status-warning-fg)' },
    positive: { fg: 'var(--status-success-fg)', bg: 'var(--status-success-bg)', border: 'var(--status-success-border)', accent: 'var(--status-success-fg)' },
    info: { fg: 'var(--status-info-fg)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)', accent: 'var(--status-info-fg)' },
};

export function money(n) {
    return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export function compactNumber(n) {
    const v = Number(n || 0);
    if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toLocaleString('en-IN');
}

/** Format a value according to the contract's `format` field. */
export function formatValue(value, format, { compact = true } = {}) {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    switch (format) {
        case 'money': return compact ? compactMoney(value) : money(value);
        case 'percent': return `${Number(value).toFixed(1)}%`;
        case 'days': return `${Number(value).toFixed(1)}d`;
        case 'number':
        default: return compact ? compactNumber(value) : Number(value).toLocaleString('en-IN');
    }
}

/**
 * Resolve delta colour semantics. `direction` says which way it moved,
 * `goodWhen` says which way is desirable - so outstanding going UP renders red.
 */
export function deltaTone(direction, goodWhen) {
    if (!direction || direction === 'flat') return 'neutral';
    if (!goodWhen || goodWhen === 'neutral') return 'neutral';
    return direction === goodWhen ? 'good' : 'bad';
}

export const TONE_COLORS = {
    good: { fg: 'var(--status-success-fg)', bg: 'var(--status-success-bg)', border: 'var(--status-success-border)', accent: 'var(--status-success-fg)' },
    bad: { fg: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
    neutral: { fg: 'var(--status-neutral-fg)', bg: 'var(--status-neutral-bg)', border: 'var(--status-neutral-border)', accent: 'var(--status-neutral-fg)' },
};

export function ymd(d) {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    // Local-date safe (avoids the UTC off-by-one that bit the calendar page).
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function parseYmd(s) {
    const [y, m, d] = String(s).split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
}

export function shortDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || '');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

/** Shared recharts tooltip chrome so every chart reads as one system. */
export const TOOLTIP_STYLE = {
    borderRadius: 8,
    border: '1px solid var(--border)',
    fontSize: 12,
    boxShadow: '0 6px 18px rgba(45,23,83,0.10)',
    padding: '8px 10px',
};
export const TOOLTIP_LABEL_STYLE = { fontWeight: 700, color: '#2d1753', marginBottom: 2 };
export const AXIS_TICK = { fontSize: 11, fill: '#6c757d' };
export const GRID_STROKE = '#eef0f3';
