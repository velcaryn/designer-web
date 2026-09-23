/**
 * Shared vocabulary for the Accounting section.
 *
 * These lived inside the 1600-line page component, which meant every tab that
 * needed to label a voucher or format a rupee figure had the page as a
 * dependency. Pulled out so the tab components can be split apart without each
 * one growing its own slightly different copy of `money()` - two formatters
 * that round differently is exactly how a screen starts disagreeing with
 * itself.
 */

import {
    BookOpen,
    Scale,
    Receipt,
    Layers,
    Calendar,
    TrendingUp,
} from 'lucide-react';

/** Indian digit grouping, always two decimals. Money never renders ragged. */
export function money(n) {
    return (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/*
 * The tabs.
 *
 * `id` is the contract: it is what appears in `?tab=` and what the Accounting
 * entries in the Cloud sidebar link to. Renaming one silently breaks those
 * links, so scripts/check-accounting.mjs asserts the sidebar and this list
 * still agree, and scripts/verify-accounting-tabs.mjs proves it in a browser.
 */
export const TABS = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'coa', label: 'Chart of Accounts', icon: Layers },
    { id: 'khata', label: 'Ledger Statement', icon: BookOpen },
    { id: 'daybook', label: 'Daybook', icon: Calendar },
    { id: 'voucher', label: 'Voucher Entry', icon: Receipt },
    { id: 'reports', label: 'Financial Statements', icon: Scale },
];

/*
 * Voucher types, as Cloud's own.
 *
 * The labels carried Tally's function-key hints - "Contra (F4)", "Sales (F8)" -
 * which promised a keyboard shortcut this product does not implement and named
 * a different piece of software while doing it. "Voucher" itself stays: it is
 * ordinary Indian accounting vocabulary that every CA expects, not branding.
 *
 * Colours read from the semantic status tokens rather than hardcoded hex, so
 * they follow the tenant's theme like everything else on the screen.
 */
export const VOUCHER_TYPE_LABELS = {
    contra:      { label: 'Contra',      tone: 'info' },
    payment:     { label: 'Payment',     tone: 'danger' },
    receipt:     { label: 'Receipt',     tone: 'success' },
    journal:     { label: 'Journal',     tone: 'active' },
    sales:       { label: 'Sales',       tone: 'info' },
    purchase:    { label: 'Purchase',    tone: 'warning' },
    credit_note: { label: 'Credit Note', tone: 'neutral' },
    debit_note:  { label: 'Debit Note',  tone: 'neutral' },
};

/** Tone -> theme tokens, so a voucher chip re-themes with the rest of Cloud. */
export const toneStyle = (tone) => ({
    color: `var(--status-${tone}-fg)`,
    background: `var(--status-${tone}-bg)`,
    border: `1px solid var(--status-${tone}-border)`,
});

/*
 * An accountant writes Dr and Cr. A database writes DEBIT and CREDIT.
 * The screen used the second, in caps, in six places.
 */
export const drCr = (type) => (type === 'credit' ? 'Cr' : 'Dr');

/** Title-cases an unmapped voucher type instead of leaking the raw key. */
export const voucherLabel = (type) => VOUCHER_TYPE_LABELS[type]?.label
    || String(type || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    || 'Voucher';
