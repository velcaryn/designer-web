'use client';

/**
 * SparklesIcon, vendored from itshover.com (`shadcn add https://itshover.com/r/sparkles-icon.json`).
 * Types removed; hover trigger replaced by `loop` (see types.js). The
 * three sparkles spin and settle back so the loop reads as a twinkle.
 */
import { useCallback } from 'react';
import { motion, useAnimate } from 'motion/react';
import { useLoop } from './types';

export default function SparklesIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '', loop = true, everyMs = 2400 }) {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
        animate('.sparkle-main', { rotate: [0, 180], scale: [1, 1.2, 1] }, { duration: 0.6, ease: 'easeInOut' });
        animate('.sparkle-top', { rotate: [0, -90], scale: [1, 0.8, 1.1], opacity: [1, 0.6, 1] }, { duration: 0.5, ease: 'easeInOut', delay: 0.1 });
        await animate('.sparkle-bottom', { rotate: [0, 90], scale: [1, 1.15, 0.9], opacity: [1, 0.7, 1] }, { duration: 0.5, ease: 'easeInOut', delay: 0.05 });
        animate('.sparkle-main', { rotate: 0, scale: 1 }, { duration: 0.25 });
        animate('.sparkle-top', { rotate: 0, scale: 1, opacity: 1 }, { duration: 0.25 });
        animate('.sparkle-bottom', { rotate: 0, scale: 1, opacity: 1 }, { duration: 0.25 });
    }, [animate]);

    useLoop(start, loop, everyMs);

    return (
        <motion.svg
            ref={scope}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={{ overflow: 'visible' }}
            aria-hidden="true"
        >
            <motion.path className="sparkle-bottom" d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" style={{ transformOrigin: '18px 18px' }} />
            <motion.path className="sparkle-top" d="M16 6a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" style={{ transformOrigin: '18px 6px' }} />
            <motion.path className="sparkle-main" d="M9 18a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" style={{ transformOrigin: '9px 12px' }} />
        </motion.svg>
    );
}
