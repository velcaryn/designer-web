'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import VelbizLockup from '@/components/cloud-app/VelbizLockup';
import { brand } from '@/config/site';
import { CLOUD_DEMO_FEATURES } from '@/lib/cloud/demoFeatures';
import { CLOUD_STATIC_PANELS } from '@/components/cloud-app/demo/StaticPanels';
import '@/components/cloud-app/demo/demo.css';
import './login.css';

/**
 * Cloud sign-in.
 *
 * A 70/30 split: brand and enterprise product showcase on the left, sign-in form on the right.
 * Renders cleanly with a rotating marquee and sample ERP stagecards.
 */

const ROTATE_MS = 3500;

export default function CloudLoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [feature, setFeature] = useState(0);

    useEffect(() => {
        let active = true;
        const timer = setTimeout(() => {
            if (active) setCheckingSession(false);
        }, 1200);

        fetch('/api/cloud/auth', { cache: 'no-store', credentials: 'same-origin' })
            .then(r => r.json())
            .then(d => {
                if (!active) return;
                clearTimeout(timer);
                if (d?.authenticated) {
                    router.replace('/cloud/dashboard');
                } else {
                    setCheckingSession(false);
                }
            })
            .catch(() => {
                if (active) {
                    clearTimeout(timer);
                    setCheckingSession(false);
                }
            });

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [router]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        let id = null;
        const start = () => {
            if (!id) {
                id = setInterval(() => setFeature(i => (i + 1) % CLOUD_DEMO_FEATURES.length), ROTATE_MS);
            }
        };
        const stop = () => {
            if (id) { clearInterval(id); id = null; }
        };
        const onVisibility = () => (document.hidden ? stop() : start());

        if (!document.hidden) start();
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    const pick = useCallback((i) => setFeature(i), []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/cloud/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Invalid username or password.');
            } else {
                router.push('/cloud/dashboard');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const current = CLOUD_DEMO_FEATURES[feature] || CLOUD_DEMO_FEATURES[0];
    const Panel = CLOUD_STATIC_PANELS[current.key] || CLOUD_STATIC_PANELS.invoicing;

    return (
        <div className="vcl">
            {/* Left: Brand and Product Showcase */}
            <section className="vcl-stage">
                <div className="vcl-brand">
                    <VelbizLockup height={48} className="vcl-logo" />
                    <div className="vcl-brand-line">
                        <span>Cloud</span>
                        <span className="vcl-brand-rule" aria-hidden="true" />
                    </div>
                </div>

                <div className="vcl-feature">
                    <div className="vcl-feature-body" key={current.key} aria-live="off">
                        <div className="vcl-feature-header">
                            <span className="vcl-feature-badge">{current.badge}</span>
                        </div>
                        <h2 className="vcl-feature-label">{current.label}</h2>
                        <p className="vcl-feature-blurb">{current.blurb}</p>

                        <div className="vcl-stagecard" aria-hidden="true">
                            <div className="vcl-stagecard-bar">
                                <span /><span /><span />
                                <span className="vcl-stagecard-label">VelBiz Cloud</span>
                            </div>
                            <div className="vcl-stagecard-body">
                                <Panel />
                            </div>
                        </div>
                    </div>

                    <ul className="vcl-ticks">
                        {CLOUD_DEMO_FEATURES.map((f, i) => (
                            <li key={f.key}>
                                <button
                                    type="button"
                                    className={`vcl-tick ${i === feature ? 'vcl-tick--on' : ''}`}
                                    aria-label={f.label}
                                    aria-current={i === feature ? 'true' : undefined}
                                    onClick={() => pick(i)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>

                <footer className="vcl-foot">
                    <div className="vcl-foot-co">
                        <span className="vcl-foot-name">{brand.name}</span>
                        <span>Enterprise ERP, CRM and Financial Systems, built in India.</span>
                        <span>&copy; {new Date().getFullYear()} {brand.name}, {brand.parent.charAt(0).toLowerCase() + brand.parent.slice(1)}. All rights reserved.</span>
                    </div>
                    <div className="vcl-foot-links">
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/cloud">About Cloud</Link>
                        <a href={`mailto:${brand.email}`}>{brand.email}</a>
                    </div>
                </footer>
            </section>

            {/* Right: Sign-in Form */}
            <main className="vcl-panel">
                <div className="vcl-form-wrap">
                    {checkingSession ? (
                        <div className="vcl-checking" role="status" aria-live="polite">
                            <span className="vcl-spinner" aria-hidden="true" />
                            Checking your session
                        </div>
                    ) : (
                        <>
                            <h1 className="vcl-title">Welcome back</h1>
                            <p className="vcl-sub">Sign in to your business workspace</p>

                            <form onSubmit={handleSubmit} className="vcl-form">
                                <div className="vcl-field">
                                    <label className="vcl-label" htmlFor="cloud-username">Username or Tenant ID</label>
                                    <div className="vcl-input-wrap">
                                        <User size={16} className="vcl-input-icon" aria-hidden="true" />
                                        <input
                                            id="cloud-username"
                                            type="text"
                                            autoComplete="username"
                                            placeholder="your-tenant-id"
                                            value={form.username}
                                            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                            required
                                            disabled={loading}
                                            className="vcl-input"
                                        />
                                    </div>
                                </div>

                                <div className="vcl-field">
                                    <label className="vcl-label" htmlFor="cloud-password">Password</label>
                                    <div className="vcl-input-wrap">
                                        <Lock size={16} className="vcl-input-icon" aria-hidden="true" />
                                        <input
                                            id="cloud-password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            placeholder="Enter password"
                                            value={form.password}
                                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                            required
                                            disabled={loading}
                                            className="vcl-input"
                                        />
                                        <button
                                            type="button"
                                            className="vcl-pw-toggle"
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            aria-pressed={showPassword}
                                        >
                                            {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="vcl-error" role="alert">
                                        <AlertTriangle size={15} aria-hidden="true" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="vcl-submit"
                                    disabled={loading}
                                    id="cloud-signin-btn"
                                    aria-busy={loading || undefined}
                                >
                                    {loading ? (
                                        <>
                                            <span className="vcl-spinner" aria-hidden="true" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in <ArrowRight size={16} aria-hidden="true" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="vcl-trust">
                                <ShieldCheck size={14} aria-hidden="true" />
                                Encrypted connection. Your business data stays in India.
                            </p>

                            <div className="vcl-help">
                                <p>Don&apos;t have an account?</p>
                                <Link href="/cloud/onboarding">Register your business &rarr;</Link>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
