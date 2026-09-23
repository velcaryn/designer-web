'use client';
import { useState, useEffect, useCallback } from 'react';
import { useCloudUser } from '@/app/(erp)/cloud/dashboard/layout';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export default function NotesPage() {
    const user = useCloudUser();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ title: '', body: '', isPinned: false });

    const loadNotes = useCallback(async () => {
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (search) params.set('q', search);
            const res = await fetch(`/api/cloud/erp/notes?${params}`);
            const data = await res.json();
            setNotes(data.notes || []);
        } catch { toast.error('Failed to load notes'); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { loadNotes(); }, [loadNotes]);

    async function handleSave(e) {
        e.preventDefault();
        if (!form.title.trim()) return toast.error('Title is required');
        setSaving(true);
        try {
            const url = editId ? `/api/cloud/erp/notes/${editId}` : '/api/cloud/erp/notes';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(editId ? 'Note updated' : `Note ${data.noteNumber} created`);
            setForm({ title: '', body: '', isPinned: false });
            setShowForm(false);
            setEditId(null);
            loadNotes();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    }

    function startEdit(note) {
        setForm({ title: note.title, body: note.body || '', isPinned: note.isPinned });
        setEditId(note._id);
        setShowForm(true);
    }

    async function togglePin(note) {
        try {
            await fetch(`/api/cloud/erp/notes/${note._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !note.isPinned }),
            });
            loadNotes();
        } catch { toast.error('Failed to update note'); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this note permanently?')) return;
        try {
            await fetch(`/api/cloud/erp/notes/${id}`, { method: 'DELETE' });
            toast.success('Note deleted');
            loadNotes();
        } catch { toast.error('Failed to delete'); }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading notes...</div>;

    return (
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--secondary-color)', margin: 0 }}>Notes</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Capture meeting notes, ideas, and context linked to clients and deals</p>
                </div>
                <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: '', body: '', isPinned: false }); }} style={{ background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                    {showForm ? '✕ Cancel' : '＋ New Note'}
                </button>
            </div>

            {/* Note Editor */}
            {showForm && (
                <form onSubmit={handleSave} style={{ background: 'var(--surface)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>Title *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Meeting with Apollo Hospital procurement team" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.95rem', fontWeight: 600, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>Content</label>
                        <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={8} placeholder="Write your note here... (Markdown supported)" style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', resize: 'vertical', fontFamily: "'Inter', monospace", lineHeight: 1.6, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })} />
                            📌 Pin to top
                        </label>
                        <button type="submit" disabled={saving} style={{ background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', padding: '10px 28px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, marginLeft: 'auto' }}>
                            {saving ? 'Saving...' : editId ? 'Update Note' : 'Save Note'}
                        </button>
                    </div>
                </form>
            )}

            {/* Search */}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: '0.9rem', marginBottom: '1.25rem', boxSizing: 'border-box' }} />

            {/* Notes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {notes.map(note => (
                    <div key={note._id} style={{ background: note.isPinned ? '#fefce8' : 'var(--surface)', borderRadius: 14, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', border: `1px solid ${note.isPinned ? '#fde68a' : '#e5e7eb'}`, transition: 'var(--transition)', cursor: 'pointer', display: 'flex', flexDirection: 'column', minHeight: 140 }} onClick={() => startEdit(note)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary-color)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {note.isPinned && '📌 '}{note.title}
                            </h3>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                <button onClick={e => { e.stopPropagation(); togglePin(note); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: 2 }} title={note.isPinned ? 'Unpin' : 'Pin'}>📌</button>
                                <button onClick={e => { e.stopPropagation(); handleDelete(note._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: 2, color: '#9ca3af' }} title="Delete"><Trash2 size={14} aria-hidden="true" /> </button>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                            {note.body || 'No content'}
                        </p>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{note.noteNumber}</span>
                            <span>{new Date(note.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                ))}
            </div>

            {notes.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No notes yet</p>
                    <p>Create your first note to capture meeting insights and client context.</p>
                </div>
            )}
        </div>
    );
}
