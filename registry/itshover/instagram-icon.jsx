'use client';

/**
 * InstagramIcon, vendored from itshover.com (`shadcn add https://itshover.com/r/instagram-icon.json`).
 * Types removed; hover trigger replaced by `loop` (see types.js); the
 * `inline-flex cursor-pointer` wrapper classes replaced by inline style.
 */
import { useCallback } from 'react';
import { motion, useAnimate } from 'motion/react';
import { useLoop } from './types';

export default function InstagramIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '', loop = true, everyMs = 3000 }) {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
        animate('.ig-body', { scale: [1, 1.05, 1] }, { duration: 0.3, ease: 'easeOut' });
        await animate('.ig-lens', { scale: [1, 1.2, 1] }, { duration: 0.25, ease: 'easeOut' });
        animate('.ig-dot', { opacity: [1, 0, 1] }, { duration: 0.2, ease: 'easeInOut' });
    }, [animate]);

    useLoop(start, loop, everyMs);

    return (
        <motion.span ref={scope} className={className} style={{ display: 'inline-flex' }} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
                <motion.path className="ig-body" style={{ transformOrigin: '50% 50%' }} d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
                <motion.path className="ig-lens" style={{ transformOrigin: '50% 50%' }} d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                <motion.path className="ig-dot" d="M16.5 7.5v.01" />
            </svg>
        </motion.span>
    );
}
