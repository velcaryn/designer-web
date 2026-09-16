'use client';

/**
 * PenIcon, vendored from itshover.com (`shadcn add https://itshover.com/r/pen-icon.json`).
 * Types removed; hover trigger replaced by `loop` (see types.js).
 */
import { useCallback } from 'react';
import { motion, useAnimate } from 'motion/react';
import { scaledStrokeWidth, useLoop } from './types';

export default function PenIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '', loop = true, everyMs = 2800 }) {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
        await animate('.pen-group', {
            x: [0, 1, -1, 1, -1, 0],
            y: [0, -2, -4, -6, -8, -10],
            rotate: [0, -6, -4, -6, -4, 0],
        }, { duration: 0.8, ease: 'easeInOut' });
        await animate('.pen-slash', { pathLength: [0, 1], opacity: [0, 1] }, { duration: 0.3, ease: 'easeOut' });
        await animate('.pen-slash', { pathLength: 0, opacity: 0 }, { duration: 0.2, ease: 'easeInOut' });
        animate('.pen-group', { x: 0, y: 0, rotate: 0 }, { duration: 0.25, ease: 'easeInOut' });
    }, [animate]);

    useLoop(start, loop, everyMs);

    return (
        <motion.svg
            ref={scope}
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            stroke={color}
            strokeWidth={scaledStrokeWidth(strokeWidth, 32)}
            strokeLinecap="square"
            strokeMiterlimit="10"
            className={className}
            style={{ overflow: 'visible' }}
            aria-hidden="true"
        >
            <motion.g className="pen-group" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
                <motion.path className="pen-slash" d="M20 6 L26 12" initial={{ pathLength: 0, opacity: 0 }} />
                <motion.path className="pen-body" d="m10.5,27.5l-8,2 2-8L22.257,3.743c1.657-1.657,4.343-1.657,6,0s1.657,4.343,0,6L10.5,27.5Z" />
            </motion.g>
        </motion.svg>
    );
}
