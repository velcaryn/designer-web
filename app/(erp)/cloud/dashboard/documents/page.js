'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { generateWhatsAppPayload } from '@/lib/shareEngine';
import { SkeletonPage } from '@/components/ui/skeleton';
import { CheckCircle2, Link2, MessageSquare, Pencil, Trash2 } from 'lucide-react';

export default function CloudDocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [noteInvoice, setNoteInvoice] = useState(null);
    const [noteForm, setNoteForm] = useState({ noteType: 'CreditNote', amount: '', reason: '' });

    function loadDocs() {
        fetch('/api/cloud/documents').then(r => r.json()).then(d => { setDocuments(d.documents || []); setLoading(false); }).catch(() => setLoading(false));
    }
    useEffect(() => { loadDocs(); }, []);

    const filtered = filter === 'all' ? documents
        : filter === 'Notes' ? documents.filter(d => d.docType === 'CreditNote' || d.docType === 'DebitNote')
        : documents.filter(d => d.docType === filter);

    async function handleCreateNote() {
        if (!noteForm.amount || Number(noteForm.amount) <= 0) return toast.error('Enter a valid amount.');
        if (!noteForm.reason.trim()) return toast.error('Reason is required.');
        try {
            const res = await fetch('/api/cloud/erp/accounting/credit-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId: noteInvoice._id, noteType: noteForm.noteType, amount: Number(noteForm.amount), reason: noteForm.reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${noteForm.noteType === 'CreditNote' ? 'Credit' : 'Debit'} Note ${data.docNumber} issued!`);
            setNoteInvoice(null);
            setNoteForm({ noteType: 'CreditNote', amount: '', reason: '' });
            loadDocs();
        } catch (err) { toast.error(err.message || 'Failed to issue note.'); }
    }
    const money = (n, cur = 'INR') => `${cur} ${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    function getPublicUrl(doc) {
        if (!doc.docNumber || !doc.secretKey) return null;
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        return `${base}/cloud/doc/${doc.docNumber}/${doc.secretKey}`;
    }

    function handleShare(doc) {
        const url = getPublicUrl(doc);
        if (!url) { toast.error('Document must be sent first to generate a share link.'); return; }
        const whatsappUrl = generateWhatsAppPayload(doc.businessName || 'My Business', doc.docType || 'Quote', doc.docNumber, doc.grandTotal, url);
        window.open(whatsappUrl, '_blank');
    }

    async function handleMarkPaid(doc) {
        if (!confirm(`Record a payment of ${money(doc.balanceDue, doc.currency)} against ${doc.docNumber} and mark it fully paid?`)) return;
        try {
            const res = await fetch('/api/cloud/erp/accounting/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: doc._id, amount: doc.balanceDue, method: 'other', reference: 'Marked as paid from Documents' }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || 'Failed to record payment.'); return; }
            toast.success(`${doc.docNumber} marked as paid.`);
            loadDocs();
        } catch { toast.error('Network error.'); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this draft?')) return;
        try {
            const res = await fetch(`/api/cloud/documents/${id}`, { method: 'DELETE' });
            if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Delete failed.'); return; }
            toast.success('Document deleted.');
            loadDocs();
        } catch { toast.error('Network error.'); }
    }

    if (loading) return <SkeletonPage rows={6} cols={5} />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>📄 Documents</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Manage your quotes and invoices.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/cloud/dashboard/documents/new?type=Quote" style={btnPrimary}>📝 New Quote</Link>
                    <Link href="/cloud/dashboard/documents/new?type=Invoice" style={{ ...btnPrimary, background: 'var(--secondary-color)' }}>🧾 New Invoice</Link>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-light)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
                {[{ k: 'all', l: 'All' }, { k: 'Quote', l: 'Quotes' }, { k: 'Invoice', l: 'Invoices' }, { k: 'Notes', l: 'Credit/Debit Notes' }].map(t => (
                    <button key={t.k} onClick={() => setFilter(t.k)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: filter === t.k ? 'var(--primary-color)' : 'transparent', color: filter === t.k ? '#fff' : 'var(--primary-color)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                        {t.l} {t.k === 'all' ? `(${documents.length})` : t.k === 'Notes' ? `(${documents.filter(d => d.docType === 'CreditNote' || d.docType === 'DebitNote').length})` : `(${documents.filter(d => d.docType === t.k).length})`}
                    </button>
                ))}
            </div>

            <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-sunken)' }}>
                                <th style={thStyle}>Document</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Client</th>
                                <th style={thStyle}>Total</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No documents found.</td></tr>
                            )}
                            {filtered.map((doc, i) => {
                                const publicUrl = getPublicUrl(doc);
                                return (
                                    <tr key={doc._id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td data-label="Document" style={tdStyle}>
                                            <strong style={{ color: 'var(--secondary-color)' }}>{doc.docNumber || 'Draft'}</strong>
                                        </td>
                                        <td data-label="Type" style={tdStyle}>
                                            {(() => {
                                                const typeColors = {
                                                    Invoice: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
                                                    Quote: { bg: '#e0f2fe', color: '#0369a1' },
                                                    CreditNote: { bg: 'var(--status-success-bg)', color: 'var(--status-success-fg)' },
                                                    DebitNote: { bg: 'var(--status-danger-bg)', color: 'var(--status-danger-fg)' },
                                                };
                                                const tc = typeColors[doc.docType] || { bg: '#f3f4f6', color: 'var(--text-muted)' };
                                                return (
                                                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: tc.bg, color: tc.color }}>
                                                        {doc.docType === 'CreditNote' ? 'Credit Note' : doc.docType === 'DebitNote' ? 'Debit Note' : doc.docType}
                                                    </span>
                                                );
                                            })()}
                                            {doc.linkedInvoiceNumber && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>vs {doc.linkedInvoiceNumber}</div>}
                                        </td>
                                        <td data-label="Client" style={tdStyle}>{doc.customer?.name || '-'}</td>
                                        <td data-label="Total" style={tdStyle}><strong>{money(doc.grandTotal, doc.currency)}</strong></td>
                                        <td data-label="Status" style={tdStyle}>
                                            {(() => {
                                                const s = doc.docType === 'Invoice' ? (doc.computedStatus || doc.status) : doc.status;
                                                const colors = {
                                                    paid: { bg: 'var(--status-success-bg)', color: 'var(--status-success-fg)' },
                                                    partially_paid: { bg: 'var(--status-info-bg)', color: 'var(--status-info-fg)' },
                                                    overdue: { bg: 'var(--status-danger-bg)', color: 'var(--status-danger-fg)' },
                                                    sent: { bg: 'var(--status-success-bg)', color: 'var(--status-success-fg)' },
                                                    draft: { bg: 'var(--status-warning-bg)', color: 'var(--status-warning-fg)' },
                                                };
                                                const c = colors[s] || { bg: '#f3f4f6', color: 'var(--text-muted)' };
                                                return (
                                                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: c.bg, color: c.color }}>
                                                        {String(s).replace(/_/g, ' ')}
                                                    </span>
                                                );
                                            })()}
                                            {doc.docType === 'Invoice' && doc.balanceDue > 0 && doc.status !== 'draft' && (
                                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>Bal: {money(doc.balanceDue, doc.currency)}</div>
                                            )}
                                        </td>
                                        <td data-label="Date" style={tdStyle}>{new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td data-label="Actions" style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {publicUrl && (
                                                    <>
                                                        <a href={publicUrl} target="_blank" rel="noreferrer" style={btnSmall}><Link2 size={14} aria-hidden="true" /> View</a>
                                                        <button onClick={() => handleShare(doc)} style={{ ...btnSmall, background: 'var(--status-success-bg)', color: '#166534' }}><MessageSquare size={14} aria-hidden="true" /> Share</button>
                                                    </>
                                                )}
                                                {doc.docType !== 'CreditNote' && doc.docType !== 'DebitNote' && (
                                                    <Link href={`/cloud/dashboard/documents/new?edit=${doc._id}`} style={{ ...btnSmall, background: 'var(--accent-subtle)', color: '#6d28d9' }}><Pencil size={14} aria-hidden="true" /> Edit</Link>
                                                )}
                                                {doc.docType === 'Quote' && (
                                                    <Link href={`/cloud/dashboard/documents/new?convert=${doc._id}`} style={{ ...btnSmall, background: 'var(--status-success-bg)', color: '#166534' }}>
                                                        🧾 Convert to Inv
                                                    </Link>
                                                )}
                                                {doc.docType === 'Invoice' && doc.status !== 'draft' && doc.balanceDue > 0 && (
                                                    <button onClick={() => handleMarkPaid(doc)} style={{ ...btnSmall, background: 'var(--status-success-bg)', color: '#166534' }}><CheckCircle2 size={14} aria-hidden="true" /> Mark Paid</button>
                                                )}
                                                {doc.docType === 'Invoice' && doc.status !== 'draft' && (
                                                    <button onClick={() => setNoteInvoice(doc)} style={{ ...btnSmall, background: 'var(--status-warning-bg)', color: '#92400e' }}>📝 Note</button>
                                                )}
                                                {doc.status === 'draft' && (
                                                    <button onClick={() => handleDelete(doc._id)} style={{ ...btnSmall, background: 'var(--status-danger-bg)', color: '#991b1b' }}><Trash2 size={14} aria-hidden="true" /> </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {noteInvoice && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)' }} onClick={() => setNoteInvoice(null)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 60px rgba(45,23,82,0.25)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'var(--secondary-color)' }}>Issue Note for {noteInvoice.docNumber}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Note Type</span>
                                <select value={noteForm.noteType} onChange={e => setNoteForm(p => ({ ...p, noteType: e.target.value }))} style={{ border: '1.5px solid #e2e0ea', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }}>
                                    <option value="CreditNote">Credit Note (reduces balance owed)</option>
                                    <option value="DebitNote">Debit Note (increases balance owed)</option>
                                </select>
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Amount (₹) *</span>
                                <input type="number" onFocus={(e) => e.target.select()} step="0.01" value={noteForm.amount} onChange={e => setNoteForm(p => ({ ...p, amount: e.target.value }))} style={{ border: '1.5px solid #e2e0ea', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Reason *</span>
                                <textarea rows={2} value={noteForm.reason} onChange={e => setNoteForm(p => ({ ...p, reason: e.target.value }))} placeholder="e.g. Damaged goods returned, pricing correction..." style={{ border: '1.5px solid #e2e0ea', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button onClick={() => setNoteInvoice(null)} style={btnSmall}>Cancel</button>
                            <button onClick={handleCreateNote} style={btnPrimary}>Issue Note</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--secondary-color)', borderBottom: '2px solid var(--border)' };
const tdStyle = { padding: '12px 14px', color: 'var(--text-main)' };
const btnPrimary = { padding: '10px 18px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', minHeight: '40px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' };
const btnSmall = { padding: '6px 10px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' };
