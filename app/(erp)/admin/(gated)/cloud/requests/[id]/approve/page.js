'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const BIZ_TYPES = ['Manufacturing', 'Distribution', 'Services', 'Retail', 'Healthcare', 'Other'];

export default function CloudApproveRequestPage({ params }) {
    const router = useRouter();
    const { id } = React.use(params);

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        businessName: '',
        ownerName: '',
        businessType: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pin: '',
        gstin: '',
        username: '',
        password: '',
        docPrefix: '',
        brandColor: '#4A1088'
    });

    useEffect(() => {
        fetch('/api/admin/cloud/tenants?status=pending_approval')
            .then(res => res.json())
            .then(data => {
                const req = data.tenants?.find(r => r.tenantId === id);
                if (req) {
                    setRequest(req);
                    setForm({
                        businessName: req.businessName || '',
                        businessType: req.businessType || 'Manufacturing',
                        ownerName: req.contact?.owner || '',
                        phone: req.contact?.phone || '',
                        email: req.contact?.email || '',
                        addressLine1: req.contact?.address?.line1 || '',
                        addressLine2: req.contact?.address?.line2 || '',
                        city: req.contact?.address?.city || '',
                        state: req.contact?.address?.state || '',
                        pin: req.contact?.address?.pin || '',
                        gstin: req.contact?.gstin || '',
                        username: (req.tenantId || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        password: '',
                        docPrefix: req.branding?.docPrefix || '',
                        brandColor: req.branding?.customHexColor || '#4A1088'
                    });
                } else {
                    toast.error('Application request not found');
                    router.push('/admin/cloud/requests');
                }
            })
            .catch(() => toast.error('Failed to load request details'))
            .finally(() => setLoading(false));
    }, [id, router]);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    async function handleApprove(e) {
        e.preventDefault();
        setError('');

        if (!form.username.trim() || !form.password) {
            setError('Username and Password are required.');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (!form.docPrefix.trim()) {
            setError('Document prefix is required.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/cloud/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: id,
                    username: form.username.trim(),
                    password: form.password,
                    ownerName: form.ownerName.trim(),
                    email: form.email.trim(),
                    docPrefix: form.docPrefix.trim(),
                    brandColor: form.brandColor
                })
            });
            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || 'Failed to approve request');
            } else {
                toast.success(`Client approved successfully!`);
                router.push('/admin/cloud');
            }
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div style={{ padding: '40px' }}>Loading client request details...</div>;
    if (!request) return null;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="dashboard-header">
                <button onClick={() => router.back()} style={{ ...btnSecondary, marginBottom: '16px', padding: '6px 12px' }}>← Back</button>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#2d1752' }}>Approve Client Workspace</h1>
                <p style={{ color: '#6c757d' }}>Review details, update parameters and assign login credentials for <strong>{request.businessName}</strong></p>
            </div>

            <form onSubmit={handleApprove} style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '24px', border: '1px solid #e5e7eb' }}>
                
                {/* Section 1: Client Information */}
                <div>
                    <h3 style={{ fontSize: '13px', color: '#4A1088', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', letterSpacing: '0.5px' }}>1. Review & Edit Client Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Business / Company Name</label>
                            <input type="text" style={inputStyle} value={form.businessName} onChange={e => set('businessName', e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Business Type</label>
                            <select style={inputStyle} value={form.businessType} onChange={e => set('businessType', e.target.value)}>
                                {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Owner Name</label>
                            <input type="text" style={inputStyle} value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone Number</label>
                            <input type="text" style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email Address</label>
                            <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>GSTIN</label>
                            <input type="text" style={inputStyle} value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Address</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input type="text" placeholder="Line 1" style={inputStyle} value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} />
                                <input type="text" placeholder="Line 2" style={inputStyle} value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} />
                                <input type="text" placeholder="City" style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <input type="text" placeholder="State" style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)} />
                                    <input type="text" placeholder="PIN" style={inputStyle} value={form.pin} onChange={e => set('pin', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Branding Settings */}
                <div>
                    <h3 style={{ fontSize: '13px', color: '#4A1088', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', letterSpacing: '0.5px' }}>2. Document & Branding Config</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Document Prefix *</label>
                            <input type="text" style={inputStyle} value={form.docPrefix} onChange={e => set('docPrefix', e.target.value.toUpperCase())} maxLength="6" />
                        </div>
                        <div>
                            <label style={labelStyle}>Brand Theme Color (Hex)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="color" style={{ width: '40px', height: '40px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }} value={form.brandColor} onChange={e => set('brandColor', e.target.value)} />
                                <input type="text" style={inputStyle} value={form.brandColor} onChange={e => set('brandColor', e.target.value)} maxLength="7" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Credentials Setup */}
                <div>
                    <h3 style={{ fontSize: '13px', color: '#4A1088', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', letterSpacing: '0.5px' }}>3. Login Credentials</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Login Username * (lowercase, no spaces)</label>
                            <input type="text" style={inputStyle} value={form.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="e.g. apex-industrial" />
                        </div>
                        <div>
                            <label style={labelStyle}>Account Password * (min 8 characters)</label>
                            <input type="text" style={inputStyle} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Enter secure password" />
                        </div>
                    </div>
                </div>

                {error && <div style={{ color: '#dc2626', fontSize: '13.5px', padding: '12px 16px', background: '#fee2e2', borderRadius: '8px', border: '1px solid #fca5a5', fontWeight: 500 }}>⚠ {error}</div>}

                <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => router.back()} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
                    <button type="submit" disabled={saving} style={{ ...btnPrimary, flex: 2, height: '44px' }}>
                        {saving ? 'Creating Account & Activating...' : '✓ Approve & Create Client Workspace'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none', background: '#fff' };
const btnPrimary = { padding: '12px 24px', background: '#4A1088', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', minHeight: '44px', fontFamily: 'inherit', transition: 'all 0.2s' };
const btnSecondary = { padding: '12px 24px', background: '#f5f3f9', color: '#4A1088', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', minHeight: '44px', fontFamily: 'inherit' };
