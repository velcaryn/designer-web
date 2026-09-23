'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { hasPermission } from '@/lib/permissions';
import '@/components/ui/app-reset.css';
import ToasterProvider from '@/components/dashboard/ToasterProvider';
import VelbizLockup from '@/components/cloud-app/VelbizLockup';
import { SkeletonShell } from '@/components/ui/skeleton';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getNavIcon, DEFAULT_ICON_PACK } from '@/lib/iconPacks';

const CloudUserContext = createContext(null);
export function useCloudUser() { return useContext(CloudUserContext); }

// One flat list, grouped by where each feature sits in how a sale actually
// flows through the business: catalog it -> sell it (CRM/Clients/Orders) ->
// fulfil it (Purchasing/Inventory) -> account for it (Finance) -> staff behind
// it (People) -> paperwork (Records). No collapsible nesting - everything is
// visible at a glance.
const NAV_GROUPS = [
    {
        label: null, // Dashboard sits above any section label
        items: [
            { href: '/cloud/dashboard', label: 'Dashboard', exact: true },
            { href: '/cloud/dashboard/calendar', label: 'Calendar', perm: 'calendar' },
            { href: '/cloud/dashboard/analytics', label: 'Analytics', perm: 'analytics' },
        ],
    },
    {
        label: 'Catalog',
        items: [
            { href: '/cloud/dashboard/items', label: 'Items & Inventory', perm: ['items', 'inventory'] },
        ],
    },
    {
        label: 'Sales',
        items: [
            { href: '/cloud/dashboard/erp/crm', label: 'CRM', perm: 'crm' },
            { href: '/cloud/dashboard/clients', label: 'Clients & Vendors', perm: 'clients' },
            { href: '/cloud/dashboard/erp/sales-orders', label: 'Sales Orders', perm: 'crm' },
            { href: '/cloud/dashboard/erp/tasks', label: 'Tasks', perm: 'crm' },
            { href: '/cloud/dashboard/erp/notes', label: 'Notes', perm: 'crm' },
            { href: '/cloud/dashboard/erp/timeline', label: 'Timeline', perm: 'crm' },
        ],
    },
    {
        label: 'Procurement',
        items: [
            { href: '/cloud/dashboard/erp/purchases', label: 'Purchases', perm: 'purchases' },
        ],
    },
    {
        /*
         * Accounting is its own section rather than one link under Finance.
         *
         * It was a single entry pointing at a 1600-line tabbed page, so the
         * general ledger, the day book and three financial statements were all
         * one indistinguishable destination - you could not link somebody to the
         * trial balance, and nothing in the nav suggested those views existed.
         *
         * The sub-items are deep links into the same page's tabs. Splitting the
         * page into real routes is worth doing and is a bigger job; making the
         * tabs addressable is most of the value for a fraction of the risk, and
         * it is a prerequisite for that split rather than a detour from it.
         */
        label: 'Accounting',
        items: [
            { href: '/cloud/dashboard/erp/accounting', label: 'Overview', perm: 'accounting', tab: 'overview' },
            { href: '/cloud/dashboard/erp/accounting', label: 'Chart of Accounts', perm: 'accounting', tab: 'coa' },
            { href: '/cloud/dashboard/erp/accounting', label: 'Vouchers', perm: 'accounting', tab: 'voucher' },
            { href: '/cloud/dashboard/erp/accounting', label: 'Daybook', perm: 'accounting', tab: 'daybook' },
            { href: '/cloud/dashboard/erp/accounting', label: 'Ledger Statement', perm: 'accounting', tab: 'khata' },
            { href: '/cloud/dashboard/erp/accounting', label: 'Financial Statements', perm: 'accounting', tab: 'reports' },
            { href: '/cloud/dashboard/erp/accounting/recurring-invoices', label: 'Recurring Invoices', perm: 'accounting' },
        ],
    },
    {
        label: 'Finance',
        items: [
            { href: '/cloud/dashboard/erp/expenses', label: 'Expenses', perm: 'expenses' },
            { href: '/cloud/dashboard/config/tax-profiles', label: 'Tax Profiles & GST', perm: 'accounting' },
        ],
    },
    {
        label: 'People',
        items: [
            { href: '/cloud/dashboard/erp/hr/employees', label: 'HR', perm: 'hr' },
        ],
    },
    {
        label: 'Records',
        items: [
            { href: '/cloud/dashboard/documents', label: 'Documents', perm: 'documents' },
            { href: '/cloud/dashboard/templates', label: 'Templates', perm: 'templates' },
        ],
    },
];

const BOTTOM_NAV = [
    { href: '/cloud/dashboard/config', label: 'Config', perm: 'config' },
];

// Dashboard home has no `perm` (always visible); everything else is gated for
// role: 'custom' sub-users. Owner/admin always see everything (hasPermission short-circuits).
function visibleNav(items, user) {
    return items.filter(item => {
        if (!item.perm) return true;
        const perms = Array.isArray(item.perm) ? item.perm : [item.perm];
        return perms.some(p => hasPermission(user, p));
    });
}

export default function CloudDashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    /*
     * The active tab, read from the URL WITHOUT useSearchParams.
     *
     * useSearchParams in a layout opts every page beneath it into client-side
     * rendering and demands a Suspense boundary around each one - the build
     * fails on unrelated pages like hr/employees. Reading location.search in an
     * effect keeps that cost off eleven other screens for a nav highlight.
     *
     * Client-only by construction, so the first server paint simply has no tab
     * highlighted rather than mismatching one.
     */
    const [activeTab, setActiveTab] = useState(null);
    useEffect(() => {
        const read = () => setActiveTab(new URLSearchParams(window.location.search).get('tab'));
        read();
        window.addEventListener('popstate', read);
        return () => window.removeEventListener('popstate', read);
    }, [pathname]);

    /*
     * Whether a nav item is the current page.
     *
     * Previously written inline as
     *   item.exact ? pathname === item.href : pathname.startsWith(item.href) ? 'active' : ''
     * which parses as `item.exact ? (pathname === item.href) : (... ? 'active' : '')`,
     * so an item with `exact: true` produced the STRING "true" or "false" as its
     * class name and could never be highlighted. Dashboard and Home have been
     * unable to show as active since that line was written.
     *
     * Tabbed items additionally compare the tab, or every sub-item of a section
     * would light up at once.
     */
    const isActive = (item) => {
        const pathMatches = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        if (!pathMatches) return false;
        if (!item.tab) return true;
        // The first tab is also what an untabbed URL lands on.
        return activeTab ? activeTab === item.tab : item.tab === 'overview';
    };
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    // Sidebar collapse state persists across visits
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('cloud_sidebar_collapsed') === '1';
    });

    // Icon Pack Selection State (defaults to 'emoji' "Colourful userfriendly")
    const [iconPack, setIconPack] = useState(() => {
        if (typeof window === 'undefined') return DEFAULT_ICON_PACK;
        return window.localStorage.getItem('cloud_icon_pack') || DEFAULT_ICON_PACK;
    });

    useEffect(() => {
        function handlePackChange() {
            if (typeof window !== 'undefined') {
                setIconPack(window.localStorage.getItem('cloud_icon_pack') || DEFAULT_ICON_PACK);
            }
        }
        window.addEventListener('cloud_icon_pack_changed', handlePackChange);
        return () => window.removeEventListener('cloud_icon_pack_changed', handlePackChange);
    }, []);

    function toggleCollapsed() {
        setCollapsed(prev => {
            const next = !prev;
            window.localStorage.setItem('cloud_sidebar_collapsed', next ? '1' : '0');
            return next;
        });
    }

    useEffect(() => {
        fetch('/api/cloud/auth')
            .then(r => r.json())
            .then(d => {
                if (!d.authenticated) { router.replace('/cloud/login'); return; }
                setUser(d.user);
                setLoading(false);
            })
            .catch(() => router.replace('/cloud/login'));
    }, [router]);

    useEffect(() => {
        fetch('/api/cloud/theme')
            .then(r => r.json())
            .then(d => { if (d.theme) document.documentElement.dataset.theme = d.theme; })
            .catch(() => {});
        return () => { delete document.documentElement.dataset.theme; };
    }, []);

    async function handleLogout() {
        await fetch('/api/cloud/auth', { method: 'DELETE' });
        router.push('/cloud/login');
    }

    if (loading) {
        return <SkeletonShell />;
    }

    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

    return (
        <CloudUserContext.Provider value={user}>
            <ToasterProvider />
            {/*
              * vc-app is the scope boundary for src/components/ui/app-reset.css.
              * Without it Cloud inherited the marketing site's unlayered
              * element rules, most visibly header{position:fixed;background:
              * rgba(255,255,255,.97)}, which painted an opaque white bar across
              * the top of all 19 dashboard pages on a dark theme. Connect has
              * had this boundary since its UI refactor; Cloud never got it.
              */}
            <div className="vc-app cloud-layout">
                {/* Floating Vertically-Centered Sidebar Toggle Button */}
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    className={`cloud-sidebar-toggle-floating ${collapsed ? 'collapsed' : ''}`}
                    aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
                    title={collapsed ? 'Expand menu' : 'Collapse menu'}
                >
                    {collapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
                </button>

                {/* Sidebar - hidden on mobile */}
                <aside className={`cloud-sidebar ${collapsed ? 'cloud-sidebar-collapsed' : ''}`}>
                    <div className="cloud-sidebar-brand-row">
                        <div className="cloud-sidebar-brand">
                            <Link href="/cloud/dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <VelbizLockup height={26} className="cloud-sidebar-logo" />
                            </Link>
                            {!collapsed && (
                                <span className="v2-logo-badge v2-logo-badge-always" style={{ fontSize: '0.65rem', padding: '2px 8px', width: 'fit-content', marginTop: '4px' }}>
                                    CLOUD ERP
                                </span>
                            )}
                        </div>
                    </div>
                    <nav className="cloud-nav">
                        {NAV_GROUPS.map(group => {
                            const items = visibleNav(group.items, user);
                            if (items.length === 0) return null;
                            return (
                                <div key={group.label || 'top'} className="cloud-nav-group">
                                    {group.label && !collapsed && <div className="cloud-nav-group-label">{group.label}</div>}
                                    {items.map(item => (
                                        <Link
                                            key={item.tab ? `${item.href}#${item.tab}` : item.href}
                                            href={item.tab ? `${item.href}?tab=${item.tab}` : item.href}
                                            className={`cloud-nav-item ${isActive(item) ? 'active' : ''}`}
                                            data-tip={item.label}
                                        >
                                            <span className="cloud-nav-icon">{getNavIcon(item.href, iconPack)}</span>
                                            <span className="cloud-nav-label">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            );
                        })}

                        {visibleNav(BOTTOM_NAV, user).map(item => (
                            <Link
                                key={item.tab ? `${item.href}#${item.tab}` : item.href}
                                href={item.href}
                                className={`cloud-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
                                data-tip={item.label}
                            >
                                <span className="cloud-nav-icon">{getNavIcon(item.href, iconPack)}</span>
                                <span className="cloud-nav-label">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                    <div className="cloud-sidebar-footer">
                        {!collapsed && (
                            <div className="cloud-tenant-info">
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff', marginBottom: '2px' }}>{user?.businessName || 'My Business'}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{user?.tenantId}</div>
                            </div>
                        )}
                        <button onClick={handleLogout} className="cloud-signout-btn" data-tip="Sign Out">
                            {collapsed ? '⏻' : 'Sign Out'}
                        </button>
                    </div>
                </aside>

                {/* Right Area (Header + Main) */}
                <div className={`cloud-right ${collapsed ? 'cloud-right-collapsed' : ''}`}>
                    <header className="cloud-header">
                        <div className="cloud-header-inner">
                            {/* Mobile brand in header */}
                            <div className="cloud-header-brand-mobile">
                                <VelbizLockup height={22} className="cloud-header-logo-mobile" />
                                <span className="v2-logo-badge v2-logo-badge-always" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>CLOUD</span>
                            </div>

                            {/* Greeting - the logged-in person, not the tenant's business name.
                                For a sub-user this must read "Emp 01 (RK Traders)", not just
                                the business name, or there's no way to tell which login is active. */}
                            <div className="cloud-header-greeting">
                                Logged in as: <strong>{user?.name || user?.username || user?.email}</strong>
                                {user?.businessName && <span className="cloud-header-tenant"> ({user.businessName})</span>}
                            </div>
                        </div>
                    </header>

                    <main className="cloud-main">
                        {!isProd && (
                            <div style={{ background: 'repeating-linear-gradient(45deg, var(--primary-color), var(--primary-color) 10px, #3a0d6e 10px, #3a0d6e 20px)', color: '#fff', textAlign: 'center', padding: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '20px' }}>
                                ⚠ DEV ENVIRONMENT - Data stored in the development database
                            </div>
                        )}
                        {children}
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="cloud-bnav">
                    {[
                        { href: '/cloud/dashboard', icon: '🏠', label: 'Home', exact: true },
                        { href: '/cloud/dashboard/clients', icon: '👥', label: 'Clients' },
                        { href: '/cloud/dashboard/erp/crm', icon: '🏢', label: 'ERP' },
                        { href: '/cloud/dashboard/config', icon: '⚙️', label: 'Config' },
                    ].map(item => (
                        <Link
                            key={item.tab ? `${item.href}#${item.tab}` : item.href}
                            href={item.href}
                            className={`cloud-bnav-item ${isActive(item) ? 'active' : ''}`}
                        >
                            <span className="cloud-bnav-icon">{item.icon}</span>
                            <span className="cloud-bnav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@700;800&family=Inter:wght@400;500;600;700;800&display=swap');

                /*
                 * The self-hosted Inter from next/font (src/lib/fonts.js), not
                 * the bare family name. Naming 'Inter' asks the OS for a font
                 * almost nobody has installed, so the shell silently rendered in
                 * whatever the fallback sans was while the rest of the product
                 * used the real face.
                 */
                .cloud-layout {
                    display: flex; min-height: 100vh;
                    background: var(--bg-light);
                    font-family: var(--v2-font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                /* Headings follow the tenant's chosen typography, the same as
                   Connect. Without this the shell forced Inter onto every h1/h2
                   and --display-font (Cormorant on the default theme) applied
                   nowhere in Cloud. */
                .cloud-layout :is(h1, h2) { font-family: var(--display-font, inherit); font-weight: 600; }

                .cloud-sidebar {
                    width: 260px; background: linear-gradient(180deg, #0b0619 0%, #120b26 50%, #190e38 100%);
                    color: white; display: flex; flex-direction: column; padding: 1.5rem;
                    position: fixed; height: 100vh; overflow-y: auto; overflow-x: hidden; z-index: 1010;
                    border-right: 1px solid rgba(167, 139, 250, 0.18);
                    transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                    scrollbar-width: thin;
                    scrollbar-color: rgba(167, 139, 250, 0.25) transparent;
                }
                .cloud-sidebar::-webkit-scrollbar {
                    width: 4px;
                }
                .cloud-sidebar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .cloud-sidebar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                }
                .cloud-sidebar::-webkit-scrollbar-thumb:hover {
                    background: rgba(167, 139, 250, 0.5);
                }

                .cloud-sidebar-collapsed { width: 76px; padding: 1.5rem 12px; }

                /* Brand + toggle share one row, both fully inside the sidebar's own
                   box - the toggle never straddles the boundary with the main content,
                   so there's no overlap seam between the two panes at any width. */
                .cloud-sidebar-brand-row {
                    display: flex; align-items: flex-start; justify-content: space-between;
                    gap: 8px;
                    padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 1.5rem;
                }
                .cloud-sidebar-collapsed .cloud-sidebar-brand-row {
                    flex-direction: column; align-items: center; gap: 12px;
                    padding-bottom: 1rem; margin-bottom: 1rem;
                }

                .cloud-sidebar-toggle-floating {
                    position: fixed;
                    top: 50%;
                    left: 246px;
                    transform: translateY(-50%);
                    z-index: 1020;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: 1.5px solid #cbd5e1;
                    background: var(--surface);
                    color: var(--secondary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
                    transition: left 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .cloud-sidebar-toggle-floating.collapsed {
                    left: 62px;
                }
                .cloud-sidebar-toggle-floating:hover {
                    background: var(--primary-color);
                    color: #ffffff;
                    border-color: var(--primary-color);
                    transform: translateY(-50%) scale(1.15);
                    box-shadow: 0 6px 18px rgba(72,38,131,0.35);
                }
                .cloud-sidebar-toggle-floating:focus-visible {
                    outline: 2px solid #a78bfa; outline-offset: 2px;
                }

                @media (max-width: 768px) {
                    .cloud-sidebar-toggle-floating { display: none; }
                }

                .cloud-sidebar-brand {
                    display: flex; flex-direction: column; align-items: flex-start; min-width: 0;
                }
                .cloud-sidebar-collapsed .cloud-sidebar-brand { align-items: center; }
                .cloud-sidebar-logo { width: 140px; margin-bottom: 4px; transition: width 0.22s ease; }
                .cloud-sidebar-collapsed .cloud-sidebar-logo { width: 34px; margin-bottom: 0; }
                .cloud-badge {
                    font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px;
                    background: rgba(167,139,250,0.2); color: #a78bfa; padding: 3px 10px;
                    border-radius: 12px; margin-top: 6px; font-weight: 700;
                }
                .cloud-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
                .cloud-nav-item {
                    position: relative;
                    color: rgba(255,255,255,0.7); text-decoration: none; padding: 9px 14px;
                    border-radius: 8px; transition: background 0.2s, color 0.2s, box-shadow 0.2s; font-weight: 500; font-size: 14px;
                    display: flex; align-items: center; gap: 12px; white-space: nowrap;
                }
                .cloud-nav-item:hover {
                    background: rgba(255,255,255,0.1); color: white;
                }
                .cloud-nav-item.active {
                    background: linear-gradient(90deg, rgba(167,139,250,0.28), rgba(167,139,250,0.12));
                    color: white; font-weight: 700; box-shadow: inset 3px 0 0 #a78bfa;
                }
                .cloud-nav-icon { 
                    display: flex; align-items: center; justify-content: center; 
                    flex-shrink: 0; width: 20px; height: 20px; 
                }
                .cloud-nav-label { 
                    display: flex; align-items: center; line-height: 1.2;
                    overflow: hidden; text-overflow: ellipsis; opacity: 1; transition: opacity 0.15s ease; 
                }

                .cloud-nav-group { display: flex; flex-direction: column; gap: 3px; }
                .cloud-nav-group + .cloud-nav-group {
                    margin-top: 10px; padding-top: 10px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                }
                .cloud-nav-group-label {
                    font-size: 10px; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.09em; color: rgba(196,181,253,0.6);
                    padding: 2px 14px 4px;
                }
                .cloud-nav-sub { font-size: 13px !important; padding: 7px 12px !important; }

                /* Collapsed / icon-only mode */
                .cloud-sidebar-collapsed .cloud-nav-item { justify-content: center; padding: 11px 0; gap: 0; }
                .cloud-sidebar-collapsed .cloud-nav-label { display: none; }
                .cloud-sidebar-collapsed .cloud-nav-icon { width: 24px; height: 24px; }

                /* Flyout tooltip on hover - the "amazing element" for the collapsed rail:
                   a soft pill with an arrow, sliding in from the icon rather than just
                   appearing, so a purely icon-only nav never loses discoverability. */
                .cloud-sidebar-collapsed .cloud-nav-item[data-tip]::after,
                .cloud-sidebar-collapsed .cloud-signout-btn[data-tip]::after {
                    content: attr(data-tip);
                    position: absolute; left: calc(100% + 14px); top: 50%;
                    transform: translate(-6px, -50%); transform-origin: left center;
                    background: #1a0a2e; color: #fff; font-size: 12.5px; font-weight: 600;
                    padding: 7px 12px; border-radius: 8px; white-space: nowrap;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(167,139,250,0.3);
                    opacity: 0; visibility: hidden; pointer-events: none;
                    transition: opacity 0.16s ease, transform 0.16s ease;
                    z-index: 1030;
                }
                .cloud-sidebar-collapsed .cloud-nav-item[data-tip]::before,
                .cloud-sidebar-collapsed .cloud-signout-btn[data-tip]::before {
                    content: ''; position: absolute; left: calc(100% + 7px); top: 50%;
                    transform: translate(-6px, -50%) rotate(45deg);
                    width: 8px; height: 8px; background: #1a0a2e;
                    box-shadow: -1px -1px 0 rgba(167,139,250,0.3);
                    opacity: 0; visibility: hidden; pointer-events: none;
                    transition: opacity 0.16s ease, transform 0.16s ease;
                    z-index: 1029;
                }
                .cloud-sidebar-collapsed .cloud-nav-item[data-tip]:hover::after,
                .cloud-sidebar-collapsed .cloud-nav-item[data-tip]:hover::before,
                .cloud-sidebar-collapsed .cloud-signout-btn[data-tip]:hover::after,
                .cloud-sidebar-collapsed .cloud-signout-btn[data-tip]:hover::before {
                    opacity: 1; visibility: visible; transform: translate(0, -50%);
                }
                .cloud-sidebar-collapsed .cloud-nav-item[data-tip]:hover::before,
                .cloud-sidebar-collapsed .cloud-signout-btn[data-tip]:hover::before {
                    transform: translate(0, -50%) rotate(45deg);
                }

                .cloud-sidebar-footer {
                    padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);
                }
                .cloud-tenant-info { margin-bottom: 12px; }
                .cloud-signout-btn {
                    position: relative;
                    width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: none;
                    border-radius: 8px; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 13px;
                    font-weight: 600; transition: all 0.2s; font-family: inherit;
                }
                .cloud-signout-btn:hover { background: rgba(239,68,68,0.25); color: #fca5a5; }
                .cloud-sidebar-collapsed .cloud-signout-btn { font-size: 16px; padding: 10px 0; }

                /* Right Area */
                .cloud-right {
                    margin-left: 260px;
                    flex: 1;
                    /* A flex item defaults to min-width:auto, which refuses to shrink
                       below its content's intrinsic width - one wide table or chart then
                       pushes the whole page into horizontal scroll on mobile. min-width:0
                       lets it shrink so inner containers do their own overflow handling. */
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    transition: margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .cloud-right-collapsed { margin-left: 76px; }

                /* Header */
                .cloud-header {
                    position: sticky;
                    top: 0;
                    z-index: 90;
                    background: var(--surface);
                    border-bottom: 1px solid rgba(72,38,131,0.1);
                    box-shadow: 0 2px 8px rgba(72,38,131,0.06);
                }
                .cloud-header-inner {
                    padding: 0 28px;
                    height: 58px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .cloud-header-brand-mobile { display: none; align-items: center; gap: 8px; flex-shrink: 0; }
                .cloud-header-logo-mobile { height: 28px; }
                .cloud-header-tag-mobile {
                    font-family: inherit; /* was 'Open Sans', which this app never loads */
                    font-weight: 800;
                    font-size: 11px;
                    letter-spacing: 0.35em;
                    color: var(--primary-color);
                    text-transform: uppercase;
                }
                .cloud-header-greeting {
                    font-size: 13.5px;
                    color: #6b7280;
                    flex: 1;
                }
                .cloud-header-greeting strong { color: var(--secondary-color); }
                .cloud-header-tenant { color: #9ca3af; }

                /* Main */
                .cloud-main { flex: 1; padding: 2rem; overflow-y: auto; }

                /* Bottom Nav */
                .cloud-bnav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--primary-color);
                    border-top: 1px solid rgba(255,255,255,0.1);
                    z-index: 1020;
                    padding: 6px 0 env(safe-area-inset-bottom, 0);
                }
                .cloud-bnav-item {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                    padding: 8px 4px;
                    text-decoration: none;
                    color: rgba(255,255,255,0.45);
                    transition: color 0.15s;
                }
                .cloud-bnav-item.active { color: #c4b5fd; }
                .cloud-bnav-icon { font-size: 20px; }
                .cloud-bnav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.03em; }

                @media (max-width: 1024px) {
                    .cloud-sidebar { width: 220px; }
                    .cloud-right { margin-left: 220px; }
                    .cloud-sidebar-collapsed { width: 76px; }
                    .cloud-right-collapsed { margin-left: 76px; }
                }

                @media (max-width: 768px) {
                    .cloud-sidebar, .cloud-sidebar-collapsed { display: none; }
                    .cloud-right, .cloud-right-collapsed { margin-left: 0; }
                    .cloud-bnav { display: flex; }
                    .cloud-main { padding: 16px 16px 80px; }
                    .cloud-header-brand-mobile { display: flex; }
                    .cloud-header-greeting { display: none; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .cloud-sidebar, .cloud-right, .cloud-sidebar-logo, .cloud-nav-item,
                    .cloud-sidebar-toggle, .cloud-nav-item[data-tip]::after, .cloud-nav-item[data-tip]::before {
                        transition: none !important;
                    }
                }

                .responsive-form {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }
                .responsive-form.responsive-form-3 {
                    grid-template-columns: 1fr 1fr 1fr;
                }
                .responsive-form .full-width {
                    grid-column-start: 1;
                    grid-column-end: -1;
                }

                @media (max-width: 768px) {
                    .responsive-form, .responsive-form.responsive-form-3 {
                        grid-template-columns: 1fr;
                    }
                    /* Overrides any inline minWidth (e.g. a wide desktop line-items table) -
                       without this the table stays desktop-wide even after rows stack into cards. */
                    .responsive-table {
                        min-width: 0 !important;
                        width: 100% !important;
                    }
                    .responsive-table thead {
                        display: none;
                    }
                    .responsive-table tr {
                        display: block;
                        border-bottom: 2px solid var(--border);
                        padding: 12px 8px;
                    }
                    .responsive-table td {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 4px !important;
                        border-bottom: 1px dashed var(--border) !important;
                        text-align: right;
                    }
                    .responsive-table td::before {
                        content: attr(data-label);
                        font-weight: 700;
                        color: #64748b;
                        text-align: left;
                        flex-shrink: 0;
                        padding-right: 10px;
                    }
                    .responsive-table td:last-child {
                        border-bottom: none !important;
                    }
                    /* Cells holding form inputs (e.g. an editable line-items table) need to
                       shrink below the input's default intrinsic width, or they overflow the
                       row instead of sitting neatly to the right of the label. */
                    .responsive-table td input,
                    .responsive-table td select,
                    .responsive-table td textarea {
                        min-width: 0;
                        flex: 1;
                    }
                    .responsive-table td.cd-stack-cell {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .responsive-table td.cd-stack-cell::before {
                        margin-bottom: 6px;
                    }
                }
            `}</style>
        </CloudUserContext.Provider>
    );
}
