import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Cloud, Inbox, LogOut, Sparkles } from 'lucide-react';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import ToasterProvider from '@/components/dashboard/ToasterProvider';
import VelbizLockup from '@/components/cloud-app/VelbizLockup';
import './admin.css';
import '@/components/ui/ui.css';
import '@/components/ui/app-reset.css';

/**
 * The VelBiz Cloud admin area: every page under /admin except the
 * not-authorised page, which sits outside this (gated) group so a refused
 * visitor is not redirected in a loop.
 *
 * The gate runs on the server, before anything renders. Each /api/admin/cloud
 * route re-checks the same list itself, because hiding a page is not
 * authorisation.
 */
export const metadata = { title: 'Admin' };

export default async function AdminLayout({ children }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/api/auth/signin?callbackUrl=/admin/cloud');
    }
    if (!ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
        redirect('/admin/unauthorized');
    }

    const email = session.user.email;

    return (
        <div className="vc-app dashboard-layout" data-theme="velvet">
            <ToasterProvider />
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <Link href="/admin/cloud" className="brand-logo-link" aria-label="VelBiz Cloud admin">
                        <VelbizLockup height={30} />
                    </Link>
                    <div className="brand-badge-row">
                        <span className="brand-badge">
                            <Sparkles size={11} aria-hidden="true" /> Cloud Admin
                        </span>
                    </div>
                </div>

                <nav className="sidebar-nav" aria-label="Admin">
                    <Link href="/admin/cloud" className="nav-item">
                        <Cloud size={16} aria-hidden="true" /> Clients
                    </Link>
                    <Link href="/admin/cloud/requests" className="nav-item">
                        <Inbox size={16} aria-hidden="true" /> Onboarding Requests
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-info">
                        <div className="user-avatar">{email.charAt(0).toUpperCase()}</div>
                        <div className="user-details">
                            <span className="user-role">Administrator</span>
                            <span className="user-email" title={email}>{email}</span>
                        </div>
                    </div>
                    <Link href="/api/auth/signout" className="signout-btn">
                        <LogOut size={14} aria-hidden="true" /> Sign Out
                    </Link>
                </div>
            </aside>
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}
