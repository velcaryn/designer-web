'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCloudUser } from '@/app/(erp)/cloud/dashboard/layout';
import toast from 'react-hot-toast';
import { Link2, Trash2 } from 'lucide-react';

const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#6b7280' };
const PRIORITY_LABELS = { urgent: '🔴 Urgent', high: '🟠 High', medium: '🟡 Medium', low: '⚪ Low' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', cancelled: 'Cancelled' };

export default function TasksPage() {
    const user = useCloudUser();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', status: 'todo' });

    const loadTasks = useCallback(async () => {
        try {
            const params = new URLSearchParams({ limit: '200' });
            if (filterStatus) params.set('status', filterStatus);
            if (filterPriority) params.set('priority', filterPriority);
            if (search) params.set('q', search);
            const res = await fetch(`/api/cloud/erp/tasks?${params}`);
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch { toast.error('Failed to load tasks'); }
        finally { setLoading(false); }
    }, [filterStatus, filterPriority, search]);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    async function handleCreate(e) {
        e.preventDefault();
        if (!form.title.trim()) return toast.error('Title is required');
        setSaving(true);
        try {
            const res = await fetch('/api/cloud/erp/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Task ${data.taskNumber} created`);
            setForm({ title: '', description: '', priority: 'medium', dueDate: '', status: 'todo' });
            setShowForm(false);
            loadTasks();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    }

    async function toggleComplete(task) {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        try {
            await fetch(`/api/cloud/erp/tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            loadTasks();
        } catch { toast.error('Failed to update task'); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this task?')) return;
        try {
            await fetch(`/api/cloud/erp/tasks/${id}`, { method: 'DELETE' });
            toast.success('Task deleted');
            loadTasks();
        } catch { toast.error('Failed to delete task'); }
    }

    // Group tasks: Overdue → Today → This Week → Later → Done
    const grouped = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const groups = { overdue: [], today: [], thisWeek: [], later: [], done: [] };
        tasks.forEach(t => {
            if (t.status === 'done' || t.status === 'cancelled') { groups.done.push(t); return; }
            if (!t.dueDate) { groups.later.push(t); return; }
            const due = new Date(t.dueDate);
            if (due < today) groups.overdue.push(t);
            else if (due < new Date(today.getTime() + 86400000)) groups.today.push(t);
            else if (due < weekEnd) groups.thisWeek.push(t);
            else groups.later.push(t);
        });
        return groups;
    }, [tasks]);

    const kpis = useMemo(() => ({
        total: tasks.length,
        overdue: grouped.overdue.length,
        dueToday: grouped.today.length,
        done: grouped.done.length,
    }), [tasks, grouped]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tasks...</div>;

    const groupSections = [
        { key: 'overdue', label: '🔴 Overdue', items: grouped.overdue, color: '#fef2f2', border: '#fecaca' },
        { key: 'today', label: '🟡 Due Today', items: grouped.today, color: '#fefce8', border: '#fde68a' },
        { key: 'thisWeek', label: '📅 This Week', items: grouped.thisWeek, color: '#eff6ff', border: '#bfdbfe' },
        { key: 'later', label: '📋 Later / No Date', items: grouped.later, color: '#f8fafc', border: 'var(--border)' },
        { key: 'done', label: '✅ Completed', items: grouped.done, color: '#f0fdf4', border: '#bbf7d0' },
    ];

    return (
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--secondary-color)', margin: 0 }}>My Tasks</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Track follow-ups, deadlines, and to-dos across your CRM</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                    {showForm ? '✕ Cancel' : '＋ New Task'}
                </button>
            </div>

            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total', value: kpis.total, color: '#482683' },
                    { label: 'Overdue', value: kpis.overdue, color: '#ef4444' },
                    { label: 'Due Today', value: kpis.dueToday, color: '#eab308' },
                    { label: 'Completed', value: kpis.done, color: '#22c55e' },
                ].map(k => (
                    <div key={k.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '1rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${k.color}` }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} style={{ background: 'var(--surface)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>Title *</label>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Follow up with Dr. Sharma about surgical kit order" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>Priority</label>
                            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>Due Date</label>
                            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>Description</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional details..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <button type="submit" disabled={saving} style={{ marginTop: '1rem', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', padding: '10px 28px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Creating...' : 'Create Task'}
                    </button>
                </form>
            )}

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." style={{ flex: 1, minWidth: 180, padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.875rem' }} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
                    <option value="">All Priorities</option>
                    {Object.keys(PRIORITY_LABELS).map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                </select>
            </div>

            {/* Grouped Task List */}
            {groupSections.map(sec => sec.items.length > 0 && (
                <div key={sec.key} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{sec.label} ({sec.items.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {sec.items.map(task => (
                            <div key={task._id} style={{ background: sec.color, border: `1px solid ${sec.border}`, borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'var(--transition)' }}>
                                {/* Checkbox */}
                                <button onClick={() => toggleComplete(task)} style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${task.status === 'done' ? '#22c55e' : '#d1d5db'}`, background: task.status === 'done' ? '#22c55e' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', flexShrink: 0 }}>
                                    {task.status === 'done' && '✓'}
                                </button>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.status === 'done' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {task.title}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <span>{task.taskNumber}</span>
                                        {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                                        {task.linkedLabel && <span><Link2 size={14} aria-hidden="true" /> {task.linkedLabel}</span>}
                                    </div>
                                </div>

                                {/* Priority Badge */}
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: `${PRIORITY_COLORS[task.priority]}18`, color: PRIORITY_COLORS[task.priority], whiteSpace: 'nowrap' }}>
                                    {task.priority.toUpperCase()}
                                </span>

                                {/* Delete */}
                                <button onClick={() => handleDelete(task._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.9rem', padding: 4 }} title="Delete"><Trash2 size={14} aria-hidden="true" /> </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {tasks.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No tasks yet</p>
                    <p>Create your first task to start tracking follow-ups and deadlines.</p>
                </div>
            )}
        </div>
    );
}
