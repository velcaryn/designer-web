'use client';
import { 
    LayoutDashboard, Calendar, TrendingUp, Package, 
    Briefcase, Users, FileText, ShoppingCart, 
    Receipt, Wallet, Percent, UserCheck, 
    Files, Layers, Settings,
    Target, CheckSquare, StickyNote, Activity
} from 'lucide-react';

import { 
    SquaresFour, CalendarBlank, TrendUp, Package as PhosphorPackage, 
    Handshake, UsersThree, FileText as PhosphorFileText, ShoppingCartSimple, 
    CreditCard, Bank, Percent as PhosphorPercent, IdentificationCard, 
    Folders, Layout, Gear,
    Crosshair, CheckSquare as PhosphorCheckSquare, NotePencil, Pulse
} from '@phosphor-icons/react';

/**
 * The pack a tenant gets before anyone picks one. Lucide, not emoji, matching
 * Connect's DEFAULT_ICON_PACK and for the same reason recorded there: colourful
 * emoji read as consumer-app decoration on a business screen, and they render
 * differently on every OS. Emoji stays available as an explicit choice.
 *
 * Cloud defaulted to 'emoji' while Connect defaulted to 'lucide', so the two
 * halves of the same product opened with different iconography.
 *
 * Anyone who already chose a pack keeps it: this only decides what an unset
 * localStorage key falls back to.
 */
export const DEFAULT_ICON_PACK = 'lucide';

export const ICON_PACKS = [
    {
        id: 'emoji',
        name: 'Colourful userfriendly',
        subtitle: 'Expressive & High Visibility',
        description: 'Vibrant emojis that make menu items instant to recognize at a glance.',
        preview: [
            { label: 'Dashboard', icon: '🏠' },
            { label: 'Inventory', icon: '📦' },
            { label: 'CRM', icon: '💼' },
            { label: 'Clients', icon: '👥' },
            { label: 'Purchases', icon: '🛒' },
            { label: 'Expenses', icon: '🧾' },
            { label: 'Accounting', icon: '💰' },
        ]
    },
    {
        id: 'lucide',
        name: 'Minimal & Modern',
        subtitle: 'Clean Vector Line Art (Lucide)',
        description: 'Sleek, lightweight outline vectors used by top enterprise SaaS dashboards.',
        preview: [
            { label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
            { label: 'Inventory', icon: <Package size={18} /> },
            { label: 'CRM', icon: <Briefcase size={18} /> },
            { label: 'Clients', icon: <Users size={18} /> },
            { label: 'Purchases', icon: <ShoppingCart size={18} /> },
            { label: 'Expenses', icon: <Receipt size={18} /> },
            { label: 'Accounting', icon: <Wallet size={18} /> },
        ]
    },
    {
        id: 'phosphor',
        name: 'Bold & Technical',
        subtitle: 'Solid Stroke Icons (Phosphor)',
        description: 'Distinct, bold-weight technical icons for high contrast and precision.',
        preview: [
            { label: 'Dashboard', icon: <SquaresFour size={18} weight="bold" /> },
            { label: 'Inventory', icon: <PhosphorPackage size={18} weight="bold" /> },
            { label: 'CRM', icon: <Handshake size={18} weight="bold" /> },
            { label: 'Clients', icon: <UsersThree size={18} weight="bold" /> },
            { label: 'Purchases', icon: <ShoppingCartSimple size={18} weight="bold" /> },
            { label: 'Expenses', icon: <CreditCard size={18} weight="bold" /> },
            { label: 'Accounting', icon: <Bank size={18} weight="bold" /> },
        ]
    }
];

export function getNavIcon(href, packId = 'emoji') {
    if (packId === 'lucide') {
        switch (href) {
            case '/cloud/dashboard': return <LayoutDashboard size={18} />;
            case '/cloud/dashboard/calendar': return <Calendar size={18} />;
            case '/cloud/dashboard/analytics': return <TrendingUp size={18} />;
            case '/cloud/dashboard/items': return <Package size={18} />;
            case '/cloud/dashboard/erp/crm': return <Briefcase size={18} />;
            case '/cloud/dashboard/clients': return <Users size={18} />;
            case '/cloud/dashboard/erp/sales-orders': return <FileText size={18} />;
            case '/cloud/dashboard/erp/purchases': return <ShoppingCart size={18} />;
            case '/cloud/dashboard/erp/expenses': return <Receipt size={18} />;
            case '/cloud/dashboard/erp/accounting': return <Wallet size={18} />;
            case '/cloud/dashboard/config/tax-profiles': return <Percent size={18} />;
            case '/cloud/dashboard/erp/hr/employees': return <UserCheck size={18} />;
            case '/cloud/dashboard/documents': return <Files size={18} />;
            case '/cloud/dashboard/templates': return <Layers size={18} />;
            case '/cloud/dashboard/erp/tasks': return <CheckSquare size={18} />;
            case '/cloud/dashboard/erp/notes': return <StickyNote size={18} />;
            case '/cloud/dashboard/erp/timeline': return <Activity size={18} />;
            case '/cloud/dashboard/config': return <Settings size={18} />;
            default: return <LayoutDashboard size={18} />;
        }
    }

    if (packId === 'phosphor') {
        switch (href) {
            case '/cloud/dashboard': return <SquaresFour size={18} weight="bold" />;
            case '/cloud/dashboard/calendar': return <CalendarBlank size={18} weight="bold" />;
            case '/cloud/dashboard/analytics': return <TrendUp size={18} weight="bold" />;
            case '/cloud/dashboard/items': return <PhosphorPackage size={18} weight="bold" />;
            case '/cloud/dashboard/erp/crm': return <Handshake size={18} weight="bold" />;
            case '/cloud/dashboard/clients': return <UsersThree size={18} weight="bold" />;
            case '/cloud/dashboard/erp/sales-orders': return <PhosphorFileText size={18} weight="bold" />;
            case '/cloud/dashboard/erp/purchases': return <ShoppingCartSimple size={18} weight="bold" />;
            case '/cloud/dashboard/erp/expenses': return <CreditCard size={18} weight="bold" />;
            case '/cloud/dashboard/erp/accounting': return <Bank size={18} weight="bold" />;
            case '/cloud/dashboard/config/tax-profiles': return <PhosphorPercent size={18} weight="bold" />;
            case '/cloud/dashboard/erp/hr/employees': return <IdentificationCard size={18} weight="bold" />;
            case '/cloud/dashboard/documents': return <Folders size={18} weight="bold" />;
            case '/cloud/dashboard/templates': return <Layout size={18} weight="bold" />;
            case '/cloud/dashboard/erp/tasks': return <PhosphorCheckSquare size={18} weight="bold" />;
            case '/cloud/dashboard/erp/notes': return <NotePencil size={18} weight="bold" />;
            case '/cloud/dashboard/erp/timeline': return <Pulse size={18} weight="bold" />;
            case '/cloud/dashboard/config': return <Gear size={18} weight="bold" />;
            default: return <SquaresFour size={18} weight="bold" />;
        }
    }

    // Default to 'emoji' ("Colourful userfriendly")
    switch (href) {
        case '/cloud/dashboard': return '🏠';
        case '/cloud/dashboard/calendar': return '📅';
        case '/cloud/dashboard/analytics': return '📊';
        case '/cloud/dashboard/items': return '📦';
        case '/cloud/dashboard/erp/crm': return '💼';
        case '/cloud/dashboard/clients': return '👥';
        case '/cloud/dashboard/erp/sales-orders': return '📑';
        case '/cloud/dashboard/erp/purchases': return '🛒';
        case '/cloud/dashboard/erp/expenses': return '🧾';
        case '/cloud/dashboard/erp/accounting': return '💰';
        case '/cloud/dashboard/config/tax-profiles': return '📋';
        case '/cloud/dashboard/erp/hr/employees': return '👷';
        case '/cloud/dashboard/documents': return '📄';
        case '/cloud/dashboard/templates': return '🧩';
        case '/cloud/dashboard/erp/tasks': return '✅';
        case '/cloud/dashboard/erp/notes': return '📝';
        case '/cloud/dashboard/erp/timeline': return '📊';
        case '/cloud/dashboard/config': return '⚙️';
        default: return '🏠';
    }
}
