'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ICON_PACKS as DEFAULT_ICON_PACKS } from '@/lib/iconPacks';

/**
 * `packs`/`storageKey`/`eventName` let this be reused outside Cloud (e.g.
 * Connect's Hospital Config page) without clobbering Cloud's own choice -
 * defaults preserve the original Cloud-only behavior exactly.
 */
export default function IconPackPicker({ packs = DEFAULT_ICON_PACKS, storageKey = 'cloud_icon_pack', eventName = 'cloud_icon_pack_changed' }) {
    // Read via a lazy initializer (not an effect) - avoids a cascading extra
    // render, same fix applied to the sidebar's own collapse-state read.
    const [currentPack, setCurrentPack] = useState(() => {
        if (typeof window === 'undefined') return 'emoji';
        return window.localStorage.getItem(storageKey) || 'emoji';
    });

    function handleSelectPack(packId) {
        setCurrentPack(packId);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(storageKey, packId);
            window.dispatchEvent(new Event(eventName));
        }
        const selected = packs.find(p => p.id === packId);
        toast.success(`Sidebar icon set to "${selected?.name}"!`);
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {packs.map(pack => {
                const isActive = currentPack === pack.id;
                return (
                    <div 
                        key={pack.id} 
                        onClick={() => handleSelectPack(pack.id)}
                        style={{
                            border: isActive ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                            borderRadius: 14, 
                            overflow: 'hidden', 
                            background: 'var(--surface)',
                            boxShadow: isActive ? '0 8px 24px rgba(72,38,131,0.15)' : '0 1px 4px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative'
                        }}
                    >
                        {/* Header preview area with 7 sample menu items */}
                        <div style={{ background: isActive ? 'var(--accent-subtle)' : 'var(--surface-sunken)', padding: '16px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 10 }}>
                                Live Preview (7 Sample Menu Items)
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {pack.preview.map((item, idx) => (
                                    <div key={idx} style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '6px', 
                                        background: 'var(--surface)', 
                                        padding: '5px 10px', 
                                        borderRadius: '6px', 
                                        fontSize: '12px', 
                                        fontWeight: 600, 
                                        color: '#334155',
                                        border: '1px solid var(--border)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                    }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Title & Selection status */}
                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <strong style={{ fontSize: 15, color: '#1e1b4b' }}>{pack.name}</strong>
                                    {isActive && (
                                        <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            ✓ Active
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-color)', marginBottom: 6 }}>
                                    {pack.subtitle}
                                </div>
                                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                                    {pack.description}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleSelectPack(pack.id); }}
                                style={{
                                    marginTop: 14,
                                    width: '100%', 
                                    padding: '9px 14px', 
                                    borderRadius: 8, 
                                    fontSize: 13, 
                                    fontWeight: 700,
                                    cursor: isActive ? 'default' : 'pointer', 
                                    fontFamily: 'inherit',
                                    background: isActive ? 'var(--primary-color)' : 'var(--surface)',
                                    /* --text-on-accent, not white: the gold theme puts BLACK ink on its
                                       accent, so a hardcoded white label vanishes there. */
                                    color: isActive ? 'var(--text-on-accent)' : 'var(--primary-color)',
                                    border: `1.5px solid ${isActive ? 'var(--primary-color)' : '#cbd5e1'}`,
                                    transition: 'all 0.15s'
                                }}
                            >
                                {isActive ? 'Currently Active Pack' : `Select ${pack.name}`}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
