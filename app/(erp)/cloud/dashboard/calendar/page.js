'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import NotificationBell from '@/components/cloud-app/calendar/NotificationBell';
import MonthGrid from '@/components/cloud-app/calendar/MonthGrid';
import AgendaView from '@/components/cloud-app/calendar/AgendaView';
import EventRow from '@/components/cloud-app/calendar/EventRow';
import { EVENT_STYLES, MANUAL_TYPES, styleFor, ymd, money, moneyCompact } from '@/components/cloud-app/calendar/eventMeta';
import { CheckCircle2, Trash2, X } from 'lucide-react';

/**
 * Calendar v2.
 *
 * Two independent data sources, deliberately:
 *   - `events`  - GET ?scope=month, the visible window only. Drives the grid,
 *                 the agenda and the filter chips.
 *   - `alerts`  - GET ?scope=alerts, an ALL-TIME scan. Drives the notification
 *                 bell and the summary strip, and is never derived from
 *                 `events`. Deriving it from the grid is what made the bell
 *                 report 5 overdue invoices when 16 were actually overdue.
 *
 * Type filters affect the grid/agenda only - never the alerts. Alerts are the
 * true picture regardless of what you have chosen to look at.
 *
 * All date maths is UTC-consistent (see eventMeta.js).
 */
export default function CalendarPage() {
    const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); });
    const [view, setView] = useState('month');
    const [events, setEvents] = useState([]);
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertsLoading, setAlertsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState(new Set(Object.keys(EVENT_STYLES)));
    const [selectedDay, setSelectedDay] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addForm, setAddForm] = useState({ title: '', date: '', eventType: 'reminder', notes: '' });
    const [savingEntry, setSavingEntry] = useState(false);
    const [actionEvent, setActionEvent] = useState(null);

    const monthStart = useMemo(() => new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1)), [cursor]);
    const monthEnd = useMemo(() => new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0, 23, 59, 59)), [cursor]);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            // Pad the window so leading/trailing days of the grid still show events.
            const from = new Date(monthStart); from.setUTCDate(from.getUTCDate() - 7);
            const to = new Date(monthEnd); to.setUTCDate(to.getUTCDate() + 7);
            const res = await fetch(`/api/cloud/erp/calendar?scope=month&from=${from.toISOString()}&to=${to.toISOString()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            setEvents(data.events || []);
        } catch {
            toast.error('Failed to load calendar events.');
        } finally {
            setLoading(false);
        }
    }, [monthStart, monthEnd]);

    // Independent of `cursor` on purpose - alerts must not change when you
    // navigate months.
    const loadAlerts = useCallback(async () => {
        setAlertsLoading(true);
        try {
            const res = await fetch('/api/cloud/erp/calendar?scope=alerts');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            setAlerts(data);
        } catch {
            toast.error('Failed to load alerts.');
        } finally {
            setAlertsLoading(false);
        }
    }, []);

    useEffect(() => { loadEvents(); }, [loadEvents]);
    useEffect(() => { loadAlerts(); }, [loadAlerts]);

    const refreshAll = useCallback(() => { loadEvents(); loadAlerts(); }, [loadEvents, loadAlerts]);

    // Counts must describe what the CURRENT view actually renders, or the chips
    // contradict the list below them. Month view shows only the visible window;
    // agenda additionally pins all-time overdue, so those are counted there too.
    // (Without this, "Invoices Due | 5" sat directly above a 16-item overdue
    // section - two different scopes presented as if they were one.)
    const typeCounts = useMemo(() => {
        const counts = {};
        const seen = new Set();
        const tally = (e) => {
            if (seen.has(e.id)) return; // an overdue item inside the window would double-count
            seen.add(e.id);
            counts[e.type] = (counts[e.type] || 0) + 1;
        };
        if (view === 'agenda') {
            const g = (alerts?.groups || []).find(x => x.key === 'overdue');
            for (const e of (g?.items || [])) tally(e);
        }
        for (const e of events) tally(e);
        return counts;
    }, [events, alerts, view]);

    const visibleEvents = useMemo(() => events.filter(e => activeFilters.has(e.type)), [events, activeFilters]);

    const eventsByDay = useMemo(() => {
        const map = {};
        for (const e of visibleEvents) {
            const key = ymd(e.date);
            if (!map[key]) map[key] = [];
            map[key].push(e);
        }
        return map;
    }, [visibleEvents]);

    // Agenda's pinned overdue section comes from the all-time alerts payload,
    // not the visible window - same reasoning as the bell.
    const overdueForAgenda = useMemo(() => {
        const g = (alerts?.groups || []).find(x => x.key === 'overdue');
        return (g?.items || []).filter(e => activeFilters.has(e.type));
    }, [alerts, activeFilters]);

    function toggleFilter(type) {
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type); else next.add(type);
            return next;
        });
    }

    function openAddForm(dateStr) {
        setAddForm({ title: '', date: dateStr || ymd(new Date()), eventType: 'reminder', notes: '' });
        setShowAddForm(true);
    }

    async function saveManualEntry(e) {
        e.preventDefault();
        if (!addForm.title.trim()) return toast.error('Title is required.');
        setSavingEntry(true);
        try {
            const res = await fetch('/api/cloud/erp/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Added to calendar!');
            setShowAddForm(false);
            refreshAll();
        } catch (err) {
            toast.error(err.message || 'Failed to add entry.');
        } finally {
            setSavingEntry(false);
        }
    }

    async function deleteManualEntry(ev) {
        if (!confirm(`Delete "${ev.title}"?`)) return;
        try {
            const res = await fetch(`/api/cloud/erp/calendar/${ev.linkedId}`, { method: 'DELETE' });
            if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Delete failed.'); return; }
            toast.success('Entry deleted.');
            setActionEvent(null);
            refreshAll();
        } catch { toast.error('Network error.'); }
    }

    async function markInvoicePaid(ev) {
        const due = ev.meta?.balanceDue || 0;
        if (!confirm(`Record a payment of ${money(due, ev.currency)} against ${ev.title.replace('Payment due: ', '')} and mark it fully paid?`)) return;
        try {
            const res = await fetch('/api/cloud/erp/accounting/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: ev.linkedId, amount: due, method: 'other', reference: 'Marked as paid from Calendar' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Invoice marked as paid - ${money(due, ev.currency)} recorded.`);
            setActionEvent(null);
            refreshAll();
        } catch (err) { toast.error(err.message || 'Failed to record payment.'); }
    }

    async function changeLeadStage(ev, stage) {
        try {
            const res = await fetch(`/api/cloud/erp/crm/leads/${ev.linkedId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Lead moved to ${stage}.`);
            setActionEvent(null);
            refreshAll();
        } catch (err) { toast.error(err.message || 'Failed to update lead.'); }
    }

    // Inline action buttons on every rich row route through here.
    const handleAction = useCallback((key, ev) => {
        if (key === 'markPaid') return markInvoicePaid(ev);
        if (key === 'deleteEntry') return deleteManualEntry(ev);
        if (key === 'changeStage') return setActionEvent(ev);
        return setActionEvent(ev);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshAll]);

    const summary = alerts?.summary;

    if (loading && events.length === 0 && !alerts) {
        return <SkeletonPage stats={0} rows={6} cols={7} />;
    }

    return (
        <div className="cal-page">
            <div className="cal-topbar">
                <div>
                    <h1 className="cal-title">📅 Calendar</h1>
                    <p className="cal-subtitle">Invoice dues, follow-ups, orders and reminders - with what actually needs attention, always.</p>
                </div>
                <div className="cal-topbar-actions">
                    <NotificationBell
                        alerts={alerts}
                        loading={alertsLoading}
                        onAction={handleAction}
                        onOpen={(ev) => setActionEvent(ev)}
                    />
                    <button type="button" onClick={() => openAddForm()} className="erp-btn-primary">+ Add Entry</button>
                </div>
            </div>

            {/* All-time actionable summary - independent of the viewed month and of filters. */}
            {summary && (
                <div className="cal-summary" data-testid="cal-summary">
                    <div className={`cal-stat ${summary.overdueCount > 0 ? 'cal-stat-critical' : ''}`} data-testid="stat-overdue">
                        <span className="cal-stat-label">Overdue</span>
                        <span className="cal-stat-value">{summary.overdueCount}</span>
                        <span className="cal-stat-sub">{moneyCompact(summary.overdueAmount, summary.currency)} outstanding</span>
                    </div>
                    <div className="cal-stat">
                        <span className="cal-stat-label">Due today</span>
                        <span className="cal-stat-value">{summary.todayCount}</span>
                        <span className="cal-stat-sub">across all types</span>
                    </div>
                    <div className="cal-stat">
                        <span className="cal-stat-label">Tomorrow</span>
                        <span className="cal-stat-value">{summary.tomorrowCount}</span>
                        <span className="cal-stat-sub">coming up</span>
                    </div>
                    <div className="cal-stat">
                        <span className="cal-stat-label">Next 7 days</span>
                        <span className="cal-stat-value">{summary.next7Count}</span>
                        <span className="cal-stat-sub">{summary.totalActionable} actionable in total</span>
                    </div>
                </div>
            )}

            <div className="cal-controls">
                <div className="cal-nav">
                    <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - 1, 1)))} className="cal-nav-btn">◀</button>
                    <span className="cal-nav-label" data-testid="cal-month-label">{monthStart.toLocaleDateString('en-IN', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</span>
                    <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)))} className="cal-nav-btn">▶</button>
                    <button type="button" onClick={() => { const d = new Date(); setCursor(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))); }} className="cal-today-btn">Today</button>
                    <div className="cal-viewtoggle" role="tablist" aria-label="Calendar view">
                        <button type="button" role="tab" aria-selected={view === 'month'} className={`cal-viewbtn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>Month</button>
                        <button type="button" role="tab" aria-selected={view === 'agenda'} className={`cal-viewbtn ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}>Agenda</button>
                    </div>
                </div>
                <div className="cal-filters">
                    {Object.entries(EVENT_STYLES).map(([type, s]) => {
                        const on = activeFilters.has(type);
                        return (
                            <button
                                key={type}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggleFilter(type)}
                                className={`cal-pill ${on ? 'active' : ''}`}
                                style={on ? { background: s.bg, borderColor: s.color, color: s.color } : undefined}
                            >
                                {s.icon} {s.label} <span className="cal-pill-count">{typeCounts[type] || 0}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {view === 'month' ? (
                <MonthGrid
                    monthStart={monthStart}
                    eventsByDay={eventsByDay}
                    onSelectDay={setSelectedDay}
                    onSelectEvent={setActionEvent}
                />
            ) : (
                <AgendaView
                    events={visibleEvents}
                    overdueItems={overdueForAgenda}
                    onAction={handleAction}
                    onOpen={setActionEvent}
                />
            )}

            {/* Day detail modal */}
            {selectedDay && (
                <div className="erp-modal-overlay" onClick={() => setSelectedDay(null)}>
                    <div className="erp-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2 data-testid="day-modal-title">{new Date(selectedDay).toLocaleDateString('en-IN', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                            <button type="button" className="erp-modal-close" onClick={() => setSelectedDay(null)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body" style={{ padding: 16 }}>
                            {(eventsByDay[selectedDay] || []).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Nothing scheduled for this day.</p>
                            ) : (
                                <div className="cal-daylist">
                                    {eventsByDay[selectedDay].map(ev => (
                                        <EventRow key={ev.id} event={ev} onAction={handleAction} onOpen={(e) => { setSelectedDay(null); setActionEvent(e); }} />
                                    ))}
                                </div>
                            )}
                            <button type="button" onClick={() => { const d = selectedDay; setSelectedDay(null); openAddForm(d); }} className="erp-btn-secondary" style={{ marginTop: 14, width: '100%' }}>+ Add Entry for this day</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add manual entry modal */}
            {showAddForm && (
                <div className="erp-modal-overlay" onClick={() => setShowAddForm(false)}>
                    <div className="erp-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>+ Add Calendar Entry</h2>
                            <button type="button" className="erp-modal-close" onClick={() => setShowAddForm(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <form id="cal-add-form" onSubmit={saveManualEntry} className="erp-lead-form">
                                <label className="erp-form-field">
                                    <span>Title *</span>
                                    <input value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Call vendor about pricing" />
                                </label>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Date *</span>
                                    <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} />
                                </label>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Type</span>
                                    <select value={addForm.eventType} onChange={e => setAddForm(f => ({ ...f, eventType: e.target.value }))}>
                                        {MANUAL_TYPES.map(t => <option key={t} value={t}>{EVENT_STYLES[t].label}</option>)}
                                    </select>
                                </label>
                                <label className="erp-form-field" style={{ marginTop: 12 }}>
                                    <span>Notes</span>
                                    <textarea rows={3} value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
                                </label>
                            </form>
                        </div>
                        <div className="erp-modal-footer">
                            <button type="button" onClick={() => setShowAddForm(false)} className="erp-btn-secondary" disabled={savingEntry}>Cancel</button>
                            <button type="submit" form="cal-add-form" className="erp-btn-primary" disabled={savingEntry}>{savingEntry ? 'Saving…' : 'Add Entry'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event action modal */}
            {actionEvent && (
                <div className="erp-modal-overlay" onClick={() => setActionEvent(null)}>
                    <div className="erp-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>{styleFor(actionEvent.type).icon} {actionEvent.title}</h2>
                            <button type="button" className="erp-modal-close" onClick={() => setActionEvent(null)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body" style={{ padding: 20 }}>
                            <div className="cal-modal-facts">
                                {actionEvent.subtitle && <div><strong>{actionEvent.subtitle}</strong></div>}
                                <div>{new Date(actionEvent.date).toLocaleDateString('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                {actionEvent.urgency === 'overdue' && (
                                    <div className="cal-modal-late">⚠️ {Math.abs(actionEvent.daysFromToday)} days overdue</div>
                                )}
                            </div>

                            {actionEvent.type === 'lead_followup' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <Link href="/cloud/dashboard/erp/crm" className="erp-btn-secondary" style={{ textAlign: 'center' }}>Open in CRM Pipeline</Link>
                                    <label className="erp-form-field">
                                        <span>Move stage to…</span>
                                        <select defaultValue="" onChange={e => e.target.value && changeLeadStage(actionEvent, e.target.value)}>
                                            <option value="" disabled>Select a stage…</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="proposal">Proposal</option>
                                            <option value="negotiation">Negotiation</option>
                                            <option value="won">Won</option>
                                            <option value="lost">Lost</option>
                                        </select>
                                    </label>
                                </div>
                            )}

                            {actionEvent.type === 'invoice_due' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div className="cal-modal-amount">{money(actionEvent.meta.balanceDue, actionEvent.currency)} due</div>
                                    {actionEvent.meta.noteAdjustment ? (
                                        <div className="cal-modal-note">Includes {money(actionEvent.meta.noteAdjustment)} of credit/debit note adjustments.</div>
                                    ) : null}
                                    {actionEvent.meta.paid ? (
                                        <div className="cal-modal-note">{money(actionEvent.meta.paid)} already received of {money(actionEvent.meta.grandTotal)}.</div>
                                    ) : null}
                                    <a href={`/api/cloud/documents/${actionEvent.linkedId}/pdf`} target="_blank" rel="noreferrer" className="erp-btn-secondary" style={{ textAlign: 'center' }}>🧾 View / Print Invoice</a>
                                    <button type="button" onClick={() => markInvoicePaid(actionEvent)} className="erp-btn-primary" data-testid="modal-mark-paid"><CheckCircle2 size={14} aria-hidden="true" /> Mark as Paid</button>
                                </div>
                            )}

                            {(actionEvent.type === 'purchase_order' || actionEvent.type === 'recurring_invoice' || actionEvent.type === 'sales_order') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {actionEvent.amount ? <div className="cal-modal-amount">{money(actionEvent.amount, actionEvent.currency)}</div> : null}
                                    <Link href={actionEvent.type === 'purchase_order' ? '/cloud/dashboard/erp/purchases' : actionEvent.type === 'sales_order' ? '/cloud/dashboard/erp/sales-orders' : '/cloud/dashboard/erp/accounting'} className="erp-btn-secondary" style={{ textAlign: 'center' }}>
                                        {actionEvent.type === 'purchase_order' ? 'Open Purchase Orders' : actionEvent.type === 'sales_order' ? 'Open Sales Orders' : 'Open Recurring Schedules'}
                                    </Link>
                                </div>
                            )}

                            {MANUAL_TYPES.includes(actionEvent.type) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {actionEvent.meta?.notes && <p style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{actionEvent.meta.notes}</p>}
                                    <button type="button" onClick={() => deleteManualEntry(actionEvent)} className="erp-action-btn erp-action-btn-del"><Trash2 size={14} aria-hidden="true" /> Delete Entry</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .cal-page { font-family: 'Inter', sans-serif; }

                /* Scoped copies of the shared ERP primitives - <style jsx> is
                   component-scoped in this codebase, so each page/component
                   redefines the class names it uses. */
                .erp-btn-primary {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: white;
                    border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600;
                    font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: none;
                    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 4px 12px rgba(72,38,131,0.25);
                    display: inline-flex; align-items: center; gap: 6px; justify-content: center;
                }
                .erp-btn-primary:hover { background: linear-gradient(135deg, var(--secondary-color), var(--primary-color)); transform: translateY(-2px); }
                .erp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                .erp-btn-primary:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 2px; }
                .erp-btn-secondary {
                    background: var(--bg-light); color: var(--primary-color); border: 1.5px solid #e2e0ea;
                    padding: 10px 20px; border-radius: 10px; font-weight: 600;
                    font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: none;
                    transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px; justify-content: center;
                }
                .erp-btn-secondary:hover { background: var(--accent-subtle); border-color: var(--primary-color); }
                .erp-btn-secondary:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
                .erp-action-btn {
                    padding: 8px 12px; border: 1px solid var(--border); background: var(--bg-light);
                    border-radius: 8px; cursor: pointer; font-size: 12.5px; color: var(--text-muted); font-family: inherit;
                }
                .erp-action-btn-del:hover { background: var(--status-danger-bg); border-color: #fca5a5; color: #991b1b; }

                .erp-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; padding: 20px; backdrop-filter: blur(4px);
                }
                .erp-modal {
                    background: var(--surface); border-radius: 16px; width: 100%; max-width: 620px;
                    max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column;
                    box-shadow: 0 20px 60px rgba(45,23,82,0.25);
                    animation: modalIn 200ms cubic-bezier(0.25,0.8,0.25,1);
                }
                @keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(0.99); } to { opacity: 1; transform: none; } }
                .erp-modal-header {
                    flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center;
                    padding: 18px 22px; border-bottom: 1px solid #f0edf5; gap: 10px;
                }
                .erp-modal-header h2 { margin: 0; font-size: 17px; font-weight: 800; color: var(--secondary-color); }
                .erp-modal-close {
                    background: none; border: none; font-size: 18px; cursor: pointer;
                    color: #6c757d; width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                }
                .erp-modal-close:hover { background: var(--bg-light); color: var(--secondary-color); }
                .erp-modal-body { flex: 1 1 auto; overflow-y: auto; min-height: 0; }
                .erp-modal-footer {
                    flex: 0 0 auto; display: flex; gap: 12px; justify-content: flex-end;
                    padding: 16px 24px; border-top: 1px solid #f0edf5;
                }
                .erp-lead-form { padding: 24px; }
                .erp-form-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
                .erp-form-field span {
                    font-size: 12px; font-weight: 600; color: var(--primary-color);
                    text-transform: uppercase; letter-spacing: 0.04em;
                }
                .erp-form-field input, .erp-form-field select, .erp-form-field textarea {
                    width: 100%; box-sizing: border-box; min-width: 0;
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 10px 12px;
                    font-size: 14px; font-family: inherit; outline: none;
                    transition: border-color 0.2s ease; background: var(--surface-sunken);
                }
                .erp-form-field input:focus, .erp-form-field select:focus, .erp-form-field textarea:focus {
                    border-color: var(--primary-color); background: var(--surface);
                }

                /* NOTE: a <div>, never a semantic <header> - globals.css sets
                   header { position: fixed } globally, which pins card headers
                   to the viewport corner. */
                .cal-topbar {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 14px; flex-wrap: wrap; gap: 12px;
                    background: var(--bg-white); border: 1px solid var(--border); border-radius: 14px;
                    padding: 18px 22px;
                }
                .cal-topbar-actions { display: flex; gap: 10px; align-items: center; }
                .cal-title { font-size: clamp(1.3rem, 3vw, 1.6rem); font-weight: 800; color: var(--secondary-color); margin: 0 0 4px; }
                .cal-subtitle { color: #6c757d; font-size: 13.5px; margin: 0; }

                .cal-summary {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 10px; margin-bottom: 14px;
                }
                .cal-stat {
                    background: var(--bg-white); border: 1px solid var(--border); border-radius: 12px;
                    padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; min-width: 0;
                }
                .cal-stat-critical { border-color: #fca5a5; background: var(--status-danger-bg); }
                .cal-stat-label { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
                .cal-stat-value { font-size: 24px; font-weight: 800; color: var(--secondary-color); font-variant-numeric: tabular-nums; line-height: 1.15; }
                .cal-stat-critical .cal-stat-value { color: #b91c1c; }
                .cal-stat-sub { font-size: 11.5px; color: var(--text-muted); font-variant-numeric: tabular-nums; }

                .cal-controls {
                    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
                    gap: 12px; margin-bottom: 14px;
                }
                .cal-nav { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .cal-nav-btn {
                    width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
                    background: var(--bg-white); cursor: pointer; font-size: 12px; color: var(--text-muted);
                }
                .cal-nav-btn:hover { background: var(--bg-light); color: var(--primary-color); }
                .cal-nav-btn:focus-visible, .cal-today-btn:focus-visible, .cal-viewbtn:focus-visible, .cal-pill:focus-visible {
                    outline: 2px solid var(--primary-color); outline-offset: 2px;
                }
                .cal-nav-label { font-weight: 800; font-size: 15px; color: var(--secondary-color); min-width: 150px; text-align: center; }
                .cal-today-btn {
                    padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-light);
                    color: var(--primary-color); font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
                }
                .cal-viewtoggle {
                    display: inline-flex; background: var(--bg-light); border: 1px solid var(--border);
                    border-radius: 9px; padding: 2px; margin-left: 4px;
                }
                .cal-viewbtn {
                    border: none; background: none; padding: 5px 14px; border-radius: 7px; cursor: pointer;
                    font-family: inherit; font-size: 12px; font-weight: 700; color: var(--text-muted);
                    transition: background 0.2s ease, color 0.2s ease;
                }
                .cal-viewbtn.active { background: var(--bg-white); color: var(--primary-color); box-shadow: 0 1px 3px rgba(45,23,82,0.12); }

                .cal-filters { display: flex; gap: 6px; flex-wrap: wrap; }
                .cal-pill {
                    border: 1.5px solid var(--border); background: var(--bg-white); color: var(--text-muted);
                    border-radius: 20px; padding: 5px 11px; font-size: 11.5px; font-weight: 600; cursor: pointer;
                    transition: opacity 0.2s ease, background 0.2s ease; opacity: 0.55; font-family: inherit;
                }
                .cal-pill.active { opacity: 1; }
                .cal-pill-count {
                    font-variant-numeric: tabular-nums; font-weight: 800; opacity: 0.75;
                    margin-left: 2px; padding-left: 5px; border-left: 1px solid currentColor;
                }

                .cal-daylist { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
                .cal-modal-facts { font-size: 12.5px; color: var(--text-muted); margin-bottom: 16px; display: flex; flex-direction: column; gap: 3px; }
                .cal-modal-facts strong { color: var(--text-main); font-size: 13.5px; }
                .cal-modal-late { color: #b91c1c; font-weight: 800; }
                .cal-modal-amount { font-size: 22px; font-weight: 800; color: #ea580c; font-variant-numeric: tabular-nums; }
                .cal-modal-note { font-size: 12px; color: var(--text-muted); }

                @media (max-width: 640px) {
                    .cal-topbar { padding: 14px 16px; }
                    .cal-nav-label { min-width: 120px; font-size: 14px; }
                    .cal-stat-value { font-size: 21px; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .erp-modal { animation: none; }
                    .erp-btn-primary, .erp-btn-secondary, .cal-viewbtn, .cal-pill { transition: none; }
                    .erp-btn-primary:hover { transform: none; }
                }
            `}</style>
        </div>
    );
}
