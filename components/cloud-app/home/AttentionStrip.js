'use client';
import Link from 'next/link';
import { Check } from 'lucide-react';

const TONE = {
    critical: { fg: 'var(--status-danger-fg)', bg: 'var(--status-danger-bg)', border: 'var(--status-danger-border)', accent: 'var(--status-danger-fg)' },
    warning: { fg: 'var(--status-warning-fg)', bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', accent: 'var(--status-warning-fg)' },
    info: { fg: 'var(--status-info-fg)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)', accent: 'var(--status-info-fg)' },
    positive: { fg: 'var(--status-success-fg)', bg: 'var(--status-success-bg)', border: 'var(--status-success-border)', accent: 'var(--status-success-fg)' },
};

function compact(n) {
    const v = Number(n) || 0;
    if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
    if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`;
    if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
    return `₹${v.toFixed(0)}`;
}

/**
 * "What needs attention today", assembled from the alert and insight engines
 * that already exist rather than recomputed here.
 *
 * The old home page showed Outstanding as a flat number and never mentioned
 * that a large slice of it was months overdue - the figure was true but
 * useless. These cards lead with the actionable slice and link straight to it.
 */
export default function AttentionStrip({ alerts, insights, loading }) {
    if (loading) {
        return (
            <div className="as-grid">
                {[0, 1, 2].map(i => (
                    <div key={i} className="as-skel">
                        <div className="skeleton-shimmer" style={{ width: '45%', height: 10, borderRadius: 5 }} />
                        <div className="skeleton-shimmer" style={{ width: '70%', height: 22, borderRadius: 6, marginTop: 10 }} />
                        <div className="skeleton-shimmer" style={{ width: '90%', height: 10, borderRadius: 5, marginTop: 10 }} />
                    </div>
                ))}
                <style jsx>{`
                    .as-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin-bottom: 20px; }
                    .as-skel { background: var(--surface); border: 1px solid #e9ecf5; border-radius: 12px; padding: 14px 16px; }
                `}</style>
            </div>
        );
    }

    const s = alerts?.summary;
    const cards = [];

    // The overdue group mixes unpaid invoices with lapsed lead follow-ups. Only
    // invoices represent money owed, so they are counted and summed separately -
    // folding a lead's *expected* revenue into an "overdue payments" figure would
    // overstate real debt.
    const overdueItems = (alerts?.groups || []).find(g => g.key === 'overdue')?.items || [];
    const overdueInvoices = overdueItems.filter(i => i.type === 'invoice_due');
    const overdueFollowUps = overdueItems.filter(i => i.type === 'lead_followup');
    const overdueMoney = overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

    if (overdueInvoices.length > 0) {
        cards.push({
            key: 'overdue', tone: 'critical', label: 'Overdue payments',
            value: compact(overdueMoney),
            detail: `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? '' : 's'} past due - oldest first`,
            href: '/cloud/dashboard/calendar', cta: 'Chase now',
        });
    }
    if (overdueFollowUps.length > 0) {
        cards.push({
            key: 'followups', tone: 'warning', label: 'Missed follow-ups',
            value: String(overdueFollowUps.length),
            detail: `${overdueFollowUps.length} lead${overdueFollowUps.length === 1 ? '' : 's'} overdue for contact`,
            href: '/cloud/dashboard/erp/crm', cta: 'Open pipeline',
        });
    }
    if (s?.todayCount > 0) {
        cards.push({
            key: 'today', tone: 'warning', label: 'Due today',
            value: String(s.todayCount),
            detail: 'Items falling due today',
            href: '/cloud/dashboard/calendar', cta: 'Open calendar',
        });
    }
    if (s?.next7Count > 0 || s?.tomorrowCount > 0) {
        const n = (s.next7Count || 0) + (s.tomorrowCount || 0);
        cards.push({
            key: 'week', tone: 'info', label: 'Next 7 days',
            value: String(n),
            detail: 'Coming up this week',
            href: '/cloud/dashboard/calendar', cta: 'Plan ahead',
        });
    }

    // Highest-severity insight that isn't already represented by an alert card.
    const topInsight = (insights || []).find(i => i.severity === 'critical' || i.severity === 'warning');
    if (topInsight && cards.length < 5) {
        cards.push({
            key: 'insight', tone: topInsight.severity === 'critical' ? 'critical' : 'warning',
            label: 'Needs a look', value: topInsight.metric || '-',
            detail: topInsight.title,
            href: '/cloud/dashboard/analytics', cta: 'See analytics',
        });
    }

    if (cards.length === 0) {
        return (
            <div className="as-clear">
                <span className="as-clear-icon" aria-hidden="true"><Check size={14} aria-hidden="true" /> </span>
                <div>
                    <div className="as-clear-title">Nothing needs your attention</div>
                    <div className="as-clear-sub">No overdue payments, nothing due this week.</div>
                </div>
                <style jsx>{`
                    .as-clear {
                        display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
                        background: var(--status-success-bg); border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px;
                    }
                    .as-clear-icon {
                        width: 30px; height: 30px; border-radius: 50%; background: #16a34a; color: #fff;
                        display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0;
                    }
                    .as-clear-title { font-weight: 700; font-size: 14px; color: #166534; }
                    .as-clear-sub { font-size: 12.5px; color: #15803d; margin-top: 1px; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="as-grid">
            {cards.map(c => {
                const t = TONE[c.tone];
                return (
                    <Link
                        key={c.key} href={c.href} className="as-card"
                        style={{ background: t.bg, borderColor: t.border, borderLeftColor: t.accent }}
                    >
                        <span className="as-label" style={{ color: t.fg }}>{c.label}</span>
                        <span className="as-value" style={{ color: t.fg }}>{c.value}</span>
                        <span className="as-detail" style={{ color: t.fg }}>{c.detail}</span>
                        <span className="as-cta" style={{ color: t.accent }}>{c.cta} →</span>
                    </Link>
                );
            })}
            <style jsx>{`
                /* styled-jsx only injects its scoping class into DOM elements, not
                   into components, so a bare .as-card rule never matches the anchor
                   next/link renders and the card collapsed to unstyled inline text.
                   Scoping through the .as-grid parent keeps these rules local. */
                .as-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin-bottom: 20px; }
                .as-grid :global(.as-card) {
                    display: flex; flex-direction: column; gap: 2px; text-decoration: none;
                    border: 1px solid; border-left-width: 4px; border-radius: 12px; padding: 13px 15px;
                    font-variant-numeric: tabular-nums; transition: transform 0.18s ease, box-shadow 0.18s ease;
                }
                .as-grid :global(.as-card:hover) { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(15,23,42,0.1); }
                .as-grid :global(.as-card:focus-visible) { outline: 2px solid var(--primary-color); outline-offset: 2px; }
                .as-grid :global(.as-label) { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; opacity: 0.85; }
                .as-grid :global(.as-value) { font-size: 22px; font-weight: 800; line-height: 1.15; }
                .as-grid :global(.as-detail) { font-size: 12px; opacity: 0.9; }
                .as-grid :global(.as-cta) { font-size: 11.5px; font-weight: 700; margin-top: 6px; }
                @media (prefers-reduced-motion: reduce) {
                    .as-grid :global(.as-card) { transition: none; }
                    .as-grid :global(.as-card:hover) { transform: none; }
                }
            `}</style>
        </div>
    );
}
