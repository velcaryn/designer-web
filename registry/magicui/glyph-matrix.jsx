'use client';

/**
 * GlyphMatrix, vendored from magicui (`shadcn add @magicui/glyph-matrix`).
 *
 * Converted from TypeScript by hand; otherwise unchanged. A canvas of
 * faintly shifting glyphs. The `color` prop must be a value a canvas can
 * parse (a CSS custom property is not, since the canvas has no computed
 * style to resolve it against): the caller reads the token off the
 * document at runtime and passes the resolved colour in.
 *
 * Under reduced motion the grid draws once and never mutates: the
 * requestAnimationFrame loop is simply not started.
 */
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function GlyphMatrix({
    glyphs = '01·•+*/\\<>=',
    cellSize = 14,
    mutationRate = 0.04,
    interval = 90,
    className,
    fadeBottom = 0.6,
    color = '#6B7280',
    style,
    ...props
}) {
    const canvasRef = useRef(null);
    const rgbaRef = useRef({ r: 107, g: 114, b: 128, a: 1 });

    useEffect(() => {
        const probe = document.createElement('canvas');
        probe.width = 1;
        probe.height = 1;
        const probeCtx = probe.getContext('2d');
        if (!probeCtx) return;
        probeCtx.fillStyle = '#6B7280';
        probeCtx.fillStyle = color;
        probeCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data;
        rgbaRef.current = { r, g, b, a: a / 255 };
    }, [color]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let cols = 0;
        let rows = 0;
        let cells = [];
        let alphas = [];
        let raf = 0;
        let last = 0;
        let stopped = false;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const { clientWidth: w, clientHeight: h } = canvas;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cols = Math.ceil(w / cellSize);
            rows = Math.ceil(h / cellSize);
            cells = new Array(cols * rows).fill(0).map(() => glyphs[Math.floor(Math.random() * glyphs.length)]);
            alphas = new Array(cols * rows).fill(0).map(() => 0.05 + Math.random() * 0.35);
        };

        const draw = () => {
            const { clientWidth: w, clientHeight: h } = canvas;
            ctx.clearRect(0, 0, w, h);
            ctx.font = `${cellSize - 2}px ui-monospace, SFMono-Regular, Menlo, monospace`;
            ctx.textBaseline = 'top';
            const { r, g, b, a: colorAlpha } = rgbaRef.current;
            for (let y = 0; y < rows; y += 1) {
                const fade = fadeBottom > 0 ? 1 - (y / rows) * fadeBottom : 1;
                for (let x = 0; x < cols; x += 1) {
                    const i = y * cols + x;
                    const a = alphas[i] * fade * colorAlpha;
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    ctx.fillText(cells[i], x * cellSize, y * cellSize);
                }
            }
        };

        const tick = (t) => {
            if (stopped) return;
            if (t - last >= interval) {
                last = t;
                const total = cols * rows;
                const mutations = Math.max(1, Math.floor(total * mutationRate));
                for (let n = 0; n < mutations; n += 1) {
                    const i = Math.floor(Math.random() * total);
                    cells[i] = glyphs[Math.floor(Math.random() * glyphs.length)];
                    alphas[i] = 0.05 + Math.random() * 0.45;
                }
                draw();
            }
            raf = requestAnimationFrame(tick);
        };

        resize();
        draw();
        if (!reduce) raf = requestAnimationFrame(tick);

        const ro = new ResizeObserver(() => {
            resize();
            draw();
        });
        ro.observe(canvas);

        return () => {
            stopped = true;
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [glyphs, cellSize, mutationRate, interval, fadeBottom]);

    return (
        <canvas
            ref={canvasRef}
            className={cn('pointer-events-none', className)}
            style={{ width: '100%', height: '100%', display: 'block', ...style }}
            aria-hidden="true"
            {...props}
        />
    );
}
