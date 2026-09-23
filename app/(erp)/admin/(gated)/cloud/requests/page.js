'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Cloud, Inbox, Check, X } from 'lucide-react';

export default function CloudPendingRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    function loadRequests() {
        fetch('/api/admin/cloud/tenants?status=pending_approval')
            .then(r => r.json())
            .then(d => { setRequests(d.tenants || []); setLoading(false); })
            .catch(() => { toast.error('Failed to load requests'); setLoading(false); });
    }

    useEffect(() => { loadRequests(); }, []);

    async function handleReject(tenantId) {
        if (!confirm(`Reject application for ${tenantId}?`)) return;
        setActionLoading(p => ({ ...p, [tenantId]: 'reject' }));
        try {
            const res = await fetch('/api/admin/cloud/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId }),
            });
            if (!res.ok) { toast.error('Rejection failed'); return; }
            toast.success('Application rejected.');
            loadRequests();
        } catch { toast.error('Network error'); }
        finally { setActionLoading(p => ({ ...p, [tenantId]: null })); }
    }

    if (loading) return <div style={{ padding: '40px', color: '#a78bfa', fontWeight: 600 }}>Loading pending requests…</div>;

    return (
        <div>
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                    <Cloud size={28} style={{ color: '#a78bfa' }} aria-hidden="true" /> Cloud Clients - Pending Requests
                </h1>
                <p style={{ color: 'rgba(167, 139, 250, 0.8)' }}>Review and approve new SaaS client business registration applications.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {requests.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(18, 11, 38, 0.7)', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.18)', color: 'rgba(167, 139, 250, 0.8)', backdropFilter: 'blur(12px)' }}>
                        <Inbox size={40} style={{ color: '#a78bfa', marginBottom: '12px' }} aria-hidden="true" />
                        <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>No pending applications at this time.</p>
                    </div>
                ) : (
                    requests.map((t, i) => (
                        <div key={t._id || i} style={{ background: 'rgba(18, 11, 38, 0.7)', border: '1px solid rgba(167, 139, 250, 0.18)', borderRadius: '12px', overflow: 'hidden', backdropFilter: 'blur(12px)', color: '#ffffff' }}>
                            {/* Card Header */}
                            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px 24px', borderBottom: '1px solid rgba(167, 139, 250, 0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t.businessName}</h3>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                                        <code style={{ background: 'rgba(124, 58, 237, 0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#c4b5fd', fontWeight: 800, border: '1px solid rgba(167, 139, 250, 0.3)' }}>{t.tenantId}</code>
                                        <span style={{ fontSize: '12px', color: 'rgba(167, 139, 250, 0.8)' }}>· {t.businessType}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Link
                                        href={`/admin/cloud/requests/${t.tenantId}/approve`}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '13px', textDecoration: 'none', minHeight: '38px' }}
                                    >
                                        <Check size={16} aria-hidden="true" /> Review & Approve
                                    </Link>
                                    <button
                                        onClick={() => handleReject(t.tenantId)}
                                        disabled={!!actionLoading[t.tenantId]}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '13px', minHeight: '38px' }}
                                    >
                                        {actionLoading[t.tenantId] === 'reject' ? 'Rejecting…' : <><X size={16} aria-hidden="true" /> Reject</>}
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <h4 style={sectionHeading}>Owner / Contact</h4>
                                    <div style={infoText}>
                                        <strong style={{ color: '#ffffff' }}>{t.contact?.owner || '-'}</strong>
                                        <div>Email: {t.contact?.email || '-'}</div>
                                        <div>Phone: {t.contact?.phone || '-'}</div>
                                        {t.contact?.gstin && <div style={{ marginTop: '4px' }}>GSTIN: <strong style={{ color: '#c4b5fd' }}>{t.contact.gstin}</strong></div>}
                                    </div>
                                </div>
                                <div>
                                    <h4 style={sectionHeading}>Registered Address</h4>
                                    <div style={{ ...infoText, color: 'rgba(255, 255, 255, 0.85)' }}>
                                        {t.contact?.address ? (
                                            <>
                                                <div>{t.contact.address.line1}</div>
                                                {t.contact.address.line2 && <div>{t.contact.address.line2}</div>}
                                                <div>{t.contact.address.city}, {t.contact.address.state} - {t.contact.address.pin}</div>
                                            </>
                                        ) : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const sectionHeading = { fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', margin: '0 0 8px 0' };
const infoText = { fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6' };
