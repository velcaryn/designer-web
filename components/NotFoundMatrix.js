'use client';

/**
 * The 404 page's background: GlyphMatrix with the glyph colour resolved
 * from the site's own token. The canvas cannot read `var(--nv-storm)`, so
 * the computed value is read off `.nv-root` and handed in as a literal.
 *
 * Read lazily in the initial state, not in an effect: the value exists
 * the moment the component mounts on the client, and reading it once
 * there avoids a second render. On the server there is no document, so
 * the component's neutral default stands until hydration.
 */
import { useState } from 'react';
import { GlyphMatrix } from '@/registry/magicui/glyph-matrix';

function tokenColor() {
    if (typeof document === 'undefined') return '#6B7280';
    const root = document.querySelector('.nv-root');
    const value = root && getComputedStyle(root).getPropertyValue('--nv-storm').trim();
    return value || '#6B7280';
}

export default function NotFoundMatrix() {
    const [color] = useState(tokenColor);

    return (
        <div className="nv-notfound__bg">
            <GlyphMatrix color={color} cellSize={16} mutationRate={0.03} interval={110} fadeBottom={0.7} />
        </div>
    );
}
