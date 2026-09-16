'use client';

/**
 * CurrencyRupeeIcon, vendored from itshover.com
 * (`shadcn add https://itshover.com/r/currency-rupee-icon.json`).
 * Types removed; the hover trigger replaced by `loop` (see types.js);
 * `cursor-pointer` dropped since this is decoration, not a control.
 * The symbol draws its two strokes and settles, on repeat.
 */
import { useCallback } from 'react';
import { motion, useAnimate } from 'motion/react';
import { useLoop } from './types';

export default function CurrencyRupeeIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '', loop = true, everyMs = 3200 }) {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
        await animate('.rupee-main, .rupee-line', { pathLength: 0, opacity: 0 }, { duration: 0 });
        await animate('.rupee-line', { pathLength: 1, opacity: 1 }, { duration: 0.25, ease: 'easeOut' });
        await animate('.rupee-main', { pathLength: 1, opacity: 1 }, { duration: 0.35, ease: 'easeOut' });
        animate('.rupee-symbol', { scale: [0.96, 1] }, { duration: 0.2, ease: 'easeOut' });
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
            aria-hidden="true"
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <motion.g className="rupee-symbol" style={{ transformOrigin: '50% 50%' }}>
                <motion.path className="rupee-main" d="M18 5h-11h3a4 4 0 0 1 0 8h-3l6 6" pathLength={1} />
                <motion.path className="rupee-line" d="M7 9l11 0" pathLength={1} />
            </motion.g>
        </motion.svg>
    );
}
