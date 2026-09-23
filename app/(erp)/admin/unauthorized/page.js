import Link from 'next/link';
import { brand } from '@/config/site';

/**
 * Where a Google sign-in lands when the account is not on the admin list
 * (lib/auth.js), and where NextAuth sends its own errors. Deliberately says
 * nothing about who IS allowed.
 */
export const metadata = { title: 'Not authorised' };

export default function AdminUnauthorized() {
    return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'var(--bg-light)' }}>
            <div style={{ maxWidth: '420px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '22px', marginBottom: '12px' }}>This account cannot open the admin area</h1>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                    Sign in with an authorised {brand.shortName} account, or ask an administrator to add yours.
                </p>
                <Link href="/api/auth/signout" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '0 20px', borderRadius: '8px', background: 'var(--primary-color)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                    Use a different account
                </Link>
            </div>
        </main>
    );
}
