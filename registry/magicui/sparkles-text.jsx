'use client';

/**
 * SparklesText, vendored from magicui (`shadcn add @magicui/sparkles-text`).
 *
 * Converted from TypeScript by hand. Small four-point stars pop in and
 * out around a word. Two changes:
 *
 *   1. The colours are tokens (the accent and its deep mix), passed as
 *      `style.fill` because a presentation attribute cannot carry a CSS
 *      custom property and the house rule forbids a raw colour here.
 *   2. The star set is created from a timer after mount and the interval
 *      recycles expired stars. Upstream called setState in the effect
 *      body (rejected by React's lint rule), and a first attempt here
 *      made the stars in the initial state, which differs between the
 *      server and the client and logged a hydration mismatch. Under
 *      reduced motion no stars are made at all.
 *
 * The text itself stays real text inside a <strong>; the stars are
 * aria-hidden decoration.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

function Sparkle({ x, y, color, delay, scale }) {
    return (
        <motion.svg
            className="pointer-events-none absolute z-20"
            initial={{ opacity: 0, left: x, top: y }}
            animate={{ opacity: [0, 1, 0], scale: [0, scale, 0], rotate: [75, 120, 150] }}
            transition={{ duration: 0.8, repeat: Infinity, delay }}
            width="21"
            height="21"
            viewBox="0 0 21 21"
            aria-hidden="true"
        >
            <path
                d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
                style={{ fill: color }}
            />
        </motion.svg>
    );
}

function makeStar(colors) {
    return {
        id: `${Math.random()}-${Date.now()}`,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        color: Math.random() > 0.5 ? colors.first : colors.second,
        delay: Math.random() * 2,
        scale: Math.random() * 1 + 0.3,
        lifespan: Math.random() * 10 + 5,
    };
}

export function SparklesText({
    children,
    colors = { first: 'var(--nv-lav)', second: 'var(--nv-lav-deep)' },
    className,
    sparklesCount = 10,
    as: Tag = 'div',
    ...props
}) {
    /* EMPTY ON THE SERVER AND ON THE FIRST CLIENT RENDER, BY DESIGN.
       Stars are random, and a random set made during render differs
       between the server pass and the client pass: React logs a
       hydration mismatch and keeps the server's markup. So the first
       set is created from a timer callback after mount, and the
       interval recycles expired stars from then on. Nothing random
       ever happens in render. */
    const [sparkles, setSparkles] = useState([]);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
        const start = setTimeout(() => {
            setSparkles(Array.from({ length: sparklesCount }, () => makeStar(colors)));
        }, 0);
        const interval = setInterval(() => {
            setSparkles((current) => current.map((star) => (
                star.lifespan <= 0 ? makeStar(colors) : { ...star, lifespan: star.lifespan - 0.1 }
            )));
        }, 100);
        return () => {
            clearTimeout(start);
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colors.first, colors.second, sparklesCount]);

    return (
        <Tag className={cn(className)} {...props}>
            <span className="relative inline-block">
                {sparkles.map((s) => <Sparkle key={s.id} {...s} />)}
                <strong>{children}</strong>
            </span>
        </Tag>
    );
}
