export function Skeleton({ className = '', style = {}, ...props }) {
    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={{ borderRadius: 'var(--radius-sm)', ...style }}
            {...props}
        />
    );
}

/**
 * Theme-aware skeleton bar - use this (not <Skeleton>) inside Cloud/Connect
 * pages, which run under [data-theme]. Renders as a plain shimmering block;
 * width/height/radius are passed as style overrides.
 */
export function Bone({ w = '100%', h = '14px', r = '6px', style = {}, className = '' }) {
    return <div className={`skeleton-shimmer ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** A row of KPI/stat chips, e.g. the stats bar atop CRM/Dashboard pages. */
export function SkeletonStatBar({ count = 3 }) {
    return (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{ background: 'var(--bg-white)', border: '1px solid var(--accent-subtle)', borderRadius: '12px', padding: '14px 20px', minWidth: '140px' }}>
                    <Bone w="70px" h="10px" style={{ marginBottom: '10px' }} />
                    <Bone w="60px" h="18px" />
                </div>
            ))}
        </div>
    );
}

/** A data-table skeleton - header row bones + N body rows. */
export function SkeletonTable({ rows = 6, cols = 5 }) {
    return (
        <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '16px', padding: '14px', background: 'var(--surface-sunken)', borderBottom: '2px solid var(--accent-subtle)' }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <Bone key={i} w={`${100 / cols}%`} h="11px" style={{ flex: 1 }} />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} style={{ display: 'flex', gap: '16px', padding: '14px', borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: cols }).map((_, c) => (
                        <Bone key={c} w={`${100 / cols}%`} h="13px" style={{ flex: 1, opacity: 1 - r * 0.06 }} />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** A Trello-style kanban board skeleton - matches CRM/Sales pipeline pages. */
export function SkeletonKanban({ columns = 5, cardsPerCol = 2 }) {
    return (
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '16px' }}>
            {Array.from({ length: columns }).map((_, i) => (
                <div key={i} style={{ minWidth: '260px', maxWidth: '300px', flexShrink: 0, background: 'var(--surface-sunken)', borderRadius: '12px', border: '1px solid var(--accent-subtle)' }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                        <Bone w="70%" h="13px" />
                    </div>
                    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Array.from({ length: cardsPerCol - Math.min(i, cardsPerCol - 1) }).map((_, c) => (
                            <div key={c} style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                                <Bone w="85%" h="12px" style={{ marginBottom: '8px' }} />
                                <Bone w="50%" h="10px" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/** A grid of cards - catalog/product-tile style pages. */
export function SkeletonCardGrid({ count = 8 }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                    <Bone h="90px" r="8px" style={{ marginBottom: '12px' }} />
                    <Bone w="80%" h="13px" style={{ marginBottom: '8px' }} />
                    <Bone w="50%" h="11px" />
                </div>
            ))}
        </div>
    );
}

/** A settings/profile-form skeleton - label+field pairs, for config/account pages. */
export function SkeletonForm({ fields = 5 }) {
    return (
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
            <Bone w="160px" h="16px" style={{ marginBottom: '20px' }} />
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} style={{ marginBottom: '18px' }}>
                    <Bone w="90px" h="10px" style={{ marginBottom: '8px' }} />
                    <Bone w="100%" h="38px" r="8px" />
                </div>
            ))}
        </div>
    );
}

/**
 * Full page skeleton: header bar + optional stat row + a table body.
 * Drop-in replacement for the generic "Loading…" div most Cloud/Connect
 * list pages return while their first fetch is in flight.
 */
export function SkeletonPage({ stats = 0, rows = 6, cols = 5 }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Bone w="180px" h="20px" style={{ marginBottom: '8px' }} />
                    <Bone w="260px" h="12px" />
                </div>
                <Bone w="120px" h="38px" r="8px" />
            </div>
            {stats > 0 && <SkeletonStatBar count={stats} />}
            <SkeletonTable rows={rows} cols={cols} />
        </div>
    );
}

/** Full-shell skeleton for the very first paint of a dashboard layout, before
 * auth resolves - replaces a bare centered spinner with sidebar/header bones
 * so the app feels instantly "there" rather than blank. */
export function SkeletonShell() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-light)' }}>
            {/*
              * The rail here must use the SAME --rail-* stops as the real
              * sidebar in ConnectShell. It previously painted
              * --secondary-color -> --accent, a noticeably brighter purple than
              * the rail that replaced it, so every mount showed a coloured
              * flash before settling. Matching the target means the skeleton
              * rail and the real rail are indistinguishable, and only the nav
              * items fade in.
              */}
            <div style={{
                width: '260px',
                flexShrink: 0,
                background: 'linear-gradient(180deg, var(--rail-from) 0%, var(--rail-mid) 55%, var(--rail-to) 100%)',
                borderRight: '1px solid var(--rail-border)',
                padding: '1.5rem',
            }}>
                <div style={{ width: '140px', height: '28px', borderRadius: '6px', background: 'var(--rail-hover)', marginBottom: '24px' }} />
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{ height: '38px', borderRadius: '8px', background: 'var(--rail-hover)', marginBottom: '6px' }} />
                ))}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ height: '58px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px' }}>
                    <Bone w="220px" h="12px" />
                </div>
                <div style={{ padding: '2rem' }}>
                    <SkeletonPage stats={3} rows={5} cols={5} />
                </div>
            </div>
        </div>
    );
}
