'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cloud, Settings, Building2 } from 'lucide-react';

export default function CloudClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/cloud/tenants')
            .then(r => r.json())
            .then(d => { setClients(d.tenants || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const statusColor = (s) => {
        if (s === 'active') return { bg: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' };
        if (s === 'past_due' || s === 'trialing' || s === 'pending_approval') return { bg: 'rgba(245, 158, 11, 0.25)', color: '#fcd34d' };
        if (s === 'canceled' || s === 'expired' || s === 'rejected') return { bg: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5' };
        return { bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' };
    };

    const tierLabel = (t) => {
        if (t === 'free_trial') return 'Free Trial';
        if (t === 'core_workspace') return 'Core Workspace';
        if (t === 'premium_command_tier') return 'Premium Command';
        return t;
    };

    if (loading) return <div style={{ padding: '40px', color: '#a78bfa', fontWeight: 600 }}>Loading clients…</div>;

    return (
        <div>
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                    <Cloud size={28} style={{ color: '#a78bfa' }} aria-hidden="true" /> Cloud Clients Overview
                </h1>
                <p style={{ color: 'rgba(167, 139, 250, 0.8)' }}>Manage SaaS business workspaces, configure profiles, and alter client credentials.</p>
            </div>

            <div style={{ background: 'rgba(18, 11, 38, 0.7)', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.18)', overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(167, 139, 250, 0.18)' }}>
                                <th style={thStyle}>Business Name</th>
                                <th style={thStyle}>Client ID</th>
                                <th style={thStyle}>Owner</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Tier</th>
                                <th style={thStyle}>Users</th>
                                <th style={thStyle}>Trial Ends</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length === 0 && (
                                <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'rgba(167, 139, 250, 0.7)' }}>No clients registered yet.</td></tr>
                            )}
                            {clients.map((c, i) => {
                                const sc = statusColor(c.subscription?.status);
                                return (
                                    <tr key={c._id || i} style={{ borderBottom: '1px solid rgba(167, 139, 250, 0.12)' }}>
                                        <td style={tdStyle}><strong style={{ color: '#ffffff', fontWeight: 800 }}>{c.businessName}</strong></td>
                                        <td style={tdStyle}><code style={{ background: 'rgba(124, 58, 237, 0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#c4b5fd', border: '1px solid rgba(167, 139, 250, 0.3)' }}>{c.tenantId}</code></td>
                                        <td style={tdStyle}>{c.contact?.owner || '-'}</td>
                                        <td style={tdStyle}>{c.contact?.email || '-'}</td>
                                        <td style={tdStyle}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: sc.bg, color: sc.color }}>
                                                {(c.subscription?.status || 'unknown').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td style={tdStyle}><span style={{ color: '#c4b5fd', fontWeight: 700 }}>{tierLabel(c.subscription?.tier)}</span></td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700 }}>{c.adminCount || 0} admin{(c.adminCount === 1) ? '' : 's'}</span>
                                            <span style={{ display: 'block', fontSize: '11px', color: 'rgba(167, 139, 250, 0.8)' }}>{c.subUserCount || 0} sub-user{(c.subUserCount === 1) ? '' : 's'}</span>
                                        </td>
                                        <td style={tdStyle}>{c.subscription?.trialEndsAt ? new Date(c.subscription.trialEndsAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <Link href={`/admin/cloud/${c.tenantId}/erp`} prefetch={false} style={btnSmall}>
                                                    <Building2 size={13} aria-hidden="true" /> ERP
                                                </Link>
                                                <Link href={`/admin/cloud/${c.tenantId}/edit`} prefetch={false} style={btnSmall}>
                                                    <Settings size={13} aria-hidden="true" /> Manage
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#a78bfa' };
const tdStyle = { padding: '12px 14px', color: 'rgba(255, 255, 255, 0.85)' };
const btnSmall = {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700,
    background: 'rgba(124, 58, 237, 0.2)', color: '#c4b5fd', border: '1px solid rgba(167, 139, 250, 0.3)',
    textDecoration: 'none', transition: 'all 0.15s'
};
