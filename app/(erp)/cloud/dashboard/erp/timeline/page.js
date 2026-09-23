'use client';
import { useState, useEffect, useCallback } from 'react';
import { useCloudUser } from '@/app/(erp)/cloud/dashboard/layout';
import toast from 'react-hot-toast';

const TYPE_META = {
    note: { icon: '📝', color: '#6d28d9', label: 'Note' },
    email_sent: { icon: '📤', color: '#2563eb', label: 'Email Sent' },
    email_received: { icon: '📥', color: '#0891b2', label: 'Email Received' },
    call: { icon: '📞', color: '#059669', label: 'Call' },
    meeting: { icon: '🤝', color: '#d97706', label: 'Meeting' },
    stage_change: { icon: '🔄', color: '#7c3aed', label: 'Stage Change' },
    document_created: { icon: '📄', color: '#482683', label: 'Document' },
    order_placed: { icon: '🛒', color: '#0d9488', label: 'Order' },
    status_change: { icon: '🏷️', color: '#8b5cf6', label: 'Status Change' },
    payment_received: { icon: '💰', color: '#16a34a', label: 'Payment' },
    task_completed: { icon: '✅', color: '#22c55e', label: 'Task Done' },
    system: { icon: '⚙️', color: '#6b7280', label: 'System' },
};

export default function TimelinePage() {
    const user = useCloudUser();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [typeFilter, setTypeFilter] = useState('');
    const [form, setForm] = useState({ clientName: '', type: 'note', title: '', body: '' });
    const [clients, setClients] = useState([]);

    useEffect(() => {
        fetch('/api/cloud/erp/clients?limit=500')
            .then(res => res.json())
            .then(data => setClients(data.clients || []))
            .catch(() => {});
    }, []);

    const loadTimeline = useCallback(async () => {
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (typeFilter) params.set('type', typeFilter);
            const res = await fetch(`/api/cloud/erp/timeline?${params}`);
            const data = await res.json();
            setEntries(data.entries || []);
        } catch { toast.error('Failed to load timeline'); }
        finally { setLoading(false); }
    }, [typeFilter]);

    useEffect(() => { loadTimeline(); }, [loadTimeline]);

    async function handleCreate(e) {
        e.preventDefault();
        if (!form.title.trim()) return toast.error('Title is required');
        if (!form.clientName.trim()) return toast.error('Client Name is required');
        setSaving(true);
        try {
            const res = await fetch('/api/cloud/erp/timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Activity logged');
            setForm({ clientName: '', type: 'note', title: '', body: '' });
            setShowForm(false);
            loadTimeline();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    }

    // Group entries by date
    const grouped = entries.reduce((acc, entry) => {
        const dateKey = new Date(entry.occurredAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(entry);
        return acc;
    }, {});

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading timeline...</div>;

    return (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--secondary-color)', margin: 0 }}>Activity Timeline</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Every call, note, email, and update - one chronological feed</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                    {showForm ? '✕ Cancel' : '＋ Log Activity'}
                </button>
            </div>

            {/* Log Activity Form */}
            {showForm && (
                <form onSubmit={handleCreate} style={{ background: 'var(--surface)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Client / Vendor Name *</label>
                            <input list="timeline-clients" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="Type or select a client" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                            <datalist id="timeline-clients">
                                {clients.map(c => <option key={c._id} value={c.name} />)}
                            </datalist>
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Activity Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem', boxSizing: 'border-box' }}>
                                <option value="note">Note</option>
                                <option value="call">Call</option>
                                <option value="meeting">Meeting</option>
                                <option value="email_sent">Email Sent</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Title *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Discussed pricing for Q3 order" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Details</label>
                        <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} placeholder="Optional details..." style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                    <button type="submit" disabled={saving} style={{ background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Logging...' : 'Log Activity'}
                    </button>
                </form>
            )}

            {/* Filter */}
            <div style={{ marginBottom: '1.5rem' }}>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
                    <option value="">All Activities</option>
                    {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
            </div>

            {/* Timeline Feed */}
            {Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel} style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>{dateLabel}</h3>
                    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                        {/* Vertical line */}
                        <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #e5e7eb, transparent)' }} />

                        {items.map((entry, idx) => {
                            const meta = TYPE_META[entry.type] || TYPE_META.system;
                            return (
                                <div key={entry._id} style={{ position: 'relative', marginBottom: '1rem', paddingBottom: idx < items.length - 1 ? '0.5rem' : 0 }}>
                                    {/* Dot */}
                                    <div style={{ position: 'absolute', left: -25, top: 6, width: 14, height: 14, borderRadius: '50%', background: meta.color, border: '2px solid #fff', boxShadow: '0 0 0 2px ' + meta.color + '33', zIndex: 1 }} />

                                    {/* Card */}
                                    <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '0.85rem 1rem', boxShadow: 'var(--shadow-sm)', border: '1px solid #f3f4f6', transition: 'var(--transition)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                            <span style={{ fontSize: '1rem' }}>{meta.icon}</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: meta.color + '14', color: meta.color }}>{meta.label}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                                <span style={{ fontWeight: 600, color: '#374151' }}>{entry.clientName || 'Unknown Client'}</span> • {new Date(entry.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{entry.title}</div>
                                        {entry.body && <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.35rem 0 0', lineHeight: 1.5 }}>{entry.body.slice(0, 300)}{entry.body.length > 300 ? '...' : ''}</p>}
                                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.4rem' }}>
                                            by {entry.actorName} · {entry.targetType}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {entries.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No activities yet</p>
                    <p>Log your first call, meeting, or note to build your activity history.</p>
                </div>
            )}
        </div>
    );
}
