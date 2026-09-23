'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { THEMES } from '@/lib/themes';
import { Check, Sparkles, Shield, Palette } from 'lucide-react';

/**
 * Live-preview theme picker - shared by Cloud (Config page) and Connect
 * (account settings, and the per-doctor settings page). Renders the ready-made
 * themes with real color swatches and sample KPI preview cards.
 *
 * TWO SCOPES, ONE COMPONENT.
 *
 * `scope="client"` (the default) writes the HOSPITAL theme through `apiBase`,
 * which is what Hospital Config and Cloud have always done. `scope="user"`
 * writes only the caller's own override to /api/connect/me/appearance and offers
 * a reset back to the hospital theme.
 *
 * The reads come from the same GET either way, because that endpoint already
 * returns the effective theme plus both layers - so the "Active" badge marks
 * what the user is actually looking at, and `hospitalTheme` is what the reset
 * returns them to.
 */
const USER_SCOPE_API = '/api/connect/me/appearance';

export default function ThemePicker({ apiBase, scope = 'client' }) {
    const perUser = scope === 'user';
    const [current, setCurrent] = useState('velvet');
    const [hospitalTheme, setHospitalTheme] = useState(null);
    const [userTheme, setUserTheme] = useState(null);
    const [saving, setSaving] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(apiBase)
            .then(r => r.json())
            .then(d => {
                if (d.theme) setCurrent(d.theme);
                if (d.hospitalTheme) setHospitalTheme(d.hospitalTheme);
                setUserTheme(d.userTheme || null);
            })
            .finally(() => setLoading(false));
    }, [apiBase]);

    /**
     * `themeId` of null means "follow the hospital" and is only reachable in
     * user scope. It is a real value, not a missing one: without it a doctor who
     * once picked a theme could never get back to the hospital default.
     */
    async function applyTheme(themeId) {
        setSaving(themeId || 'reset');
        const prev = current;
        const prevUser = userTheme;
        const painted = themeId || hospitalTheme || 'velvet';
        setCurrent(painted);
        setUserTheme(perUser ? themeId : prevUser);
        document.documentElement.dataset.theme = painted;
        try {
            const res = await fetch(perUser ? USER_SCOPE_API : apiBase, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: themeId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            /* The shell caches the effective theme under this key and the
               pre-paint script in connect/layout.js reads it before first paint.
               Without this write the next hard reload paints the OLD theme for
               one frame, which is the flash this cache exists to prevent. */
            try { window.localStorage.setItem('velbiz.cloud.theme', painted); } catch { /* private mode */ }
            const chosen = THEMES.find(t => t.id === painted);
            toast.success(themeId
                ? `Theme updated to ${chosen?.name || painted}`
                : `Following the hospital theme (${chosen?.name || painted})`);
        } catch (err) {
            setCurrent(prev);
            setUserTheme(prevUser);
            document.documentElement.dataset.theme = prev;
            toast.error(err.message || 'Failed to change theme.');
        } finally {
            setSaving(null);
        }
    }

    if (loading) {
        return (
            <div style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid rgba(167,139,250,0.2)' }}>
                Loading theme palette options…
            </div>
        );
    }

    return (
        <>
        {perUser && userTheme ? (
            <div className="tp-override" role="status">
                <span>
                    You are using your own theme. Everyone else at this hospital sees{' '}
                    <strong>{THEMES.find(t => t.id === hospitalTheme)?.name || 'the hospital theme'}</strong>.
                </span>
                <button
                    type="button"
                    className="tp-override__reset"
                    onClick={() => applyTheme(null)}
                    disabled={saving === 'reset'}
                >
                    {saving === 'reset' ? 'Resetting…' : 'Follow the hospital theme'}
                </button>
            </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {THEMES.map(t => {
                const c = t.colors;
                const active = current === t.id || (current === 'ledger' && t.id === 'velvet');

                return (
                    <div
                        key={t.id}
                        /*
                         * Painted in the PREVIEWED theme's colours, not the
                         * active one - that is the entire point of a preview, so
                         * a light theme's card is correctly light even while the
                         * app around it is dark. Marked so a contrast/theme sweep
                         * can tell a deliberate preview from a surface that
                         * forgot to follow the theme.
                         */
                        data-theme-preview={t.id}
                        style={{
                            borderRadius: '16px',
                            overflow: 'hidden',
                            background: c.bgWhite,
                            border: active ? `2px solid ${c.primary}` : '1px solid rgba(255,255,255,0.12)',
                            boxShadow: active ? `0 10px 30px ${c.primary}44` : '0 4px 16px rgba(0,0,0,0.2)',
                            transition: 'all 0.25s ease',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Swatch & Preview Panel */}
                        <div style={{ background: c.bgLight, padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                                {[c.bgLight, c.primary, c.primaryLight, c.secondary].map((hex, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            height: '24px',
                                            borderRadius: '6px',
                                            background: hex,
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            boxShadow: i === 1 ? `0 0 10px ${hex}66` : 'none',
                                        }}
                                        title={hex}
                                    />
                                ))}
                            </div>

                            {/* Mini KPI Preview */}
                            <div
                                style={{
                                    background: c.bgWhite,
                                    borderRadius: '12px',
                                    padding: '14px',
                                    border: `1px solid ${c.primary}44`,
                                    boxShadow: `0 4px 16px ${c.primary}22`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textMuted }}>
                                        REVENUE KPI
                                    </span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: c.primaryLight, background: `${c.primary}22`, padding: '2px 6px', borderRadius: '4px' }}>
                                        +24.8%
                                    </span>
                                </div>
                                <div style={{ fontFamily: t.displayFont, fontSize: '1.25rem', fontWeight: 700, color: c.textMain }}>
                                    ₹4,89,200
                                </div>
                            </div>

                            {/* Action Button Sample */}
                            <button
                                type="button"
                                style={{
                                    marginTop: '12px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    letterSpacing: '0.04em',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                }}
                            >
                                <Sparkles size={14} /> Sample Primary Action
                            </button>
                        </div>

                        {/* Theme Info & Activation Footer */}
                        <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <strong style={{ fontSize: '1rem', color: c.textMain, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {t.name}
                                    </strong>
                                    {active && (
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                color: '#ffffff',
                                                background: c.primary,
                                                padding: '3px 8px',
                                                borderRadius: '20px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <Check size={12} /> Active
                                        </span>
                                    )}
                                    {/* In user scope the doctor needs to see which
                                        one the hospital chose, or "follow the
                                        hospital theme" is a blind button. */}
                                    {perUser && !active && hospitalTheme === t.id && (
                                        <span style={{
                                            fontSize: '10px', fontWeight: 700, color: c.textMuted,
                                            border: `1px solid ${c.primary}55`, padding: '3px 8px',
                                            borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em',
                                        }}>
                                            Hospital default
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: c.primaryLight, marginBottom: '8px' }}>
                                    {t.tagline}
                                </div>
                                <p style={{ fontSize: '12px', color: c.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
                                    {t.description}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => applyTheme(t.id)}
                                disabled={active || saving === t.id}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: active ? 'default' : 'pointer',
                                    fontFamily: 'inherit',
                                    /* Derived from THIS card's palette, not from
                                       rgba white. The card is painted in the
                                       previewed theme, so a white-on-white
                                       overlay made the "Currently Active" label
                                       unreadable on all three light themes. */
                                    background: active ? `${c.primary}1f` : `linear-gradient(135deg, ${c.primary}, ${c.primaryLight})`,
                                    color: active ? c.textMuted : '#ffffff',
                                    border: active ? `1px solid ${c.primary}44` : 'none',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                {active ? 'Currently Active' : saving === t.id ? 'Applying Theme…' : 'Activate Theme'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
        </>
    );
}
