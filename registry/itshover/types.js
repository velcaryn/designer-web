'use client';

/**
 * Shared pieces for the icons vendored from itshover.com.
 *
 * `scaledStrokeWidth` is upstream's, unchanged: a 32-unit viewBox needs a
 * thicker stroke to match a 24-unit one. `useLoop` is ours: upstream
 * animates on hover only, and the owner asked for these to run on a
 * loop, so each icon calls its own `start()` every `everyMs` while
 * `loop` is true and the page is not under reduced motion. The interval
 * is cleared on unmount, and a tab in the background is left alone by
 * the browser's own timer throttling.
 */
import { useEffect } from 'react';

export function scaledStrokeWidth(strokeWidth, viewBoxSize) {
    return strokeWidth * (viewBoxSize / 24);
}

export function useLoop(start, loop, everyMs = 2600) {
    useEffect(() => {
        if (!loop) return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
        const first = setTimeout(start, 400);
        const id = setInterval(start, everyMs);
        return () => {
            clearTimeout(first);
            clearInterval(id);
        };
    }, [start, loop, everyMs]);
}
