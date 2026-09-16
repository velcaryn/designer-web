'use client';

/**
 * Dock, vendored from magicui (`shadcn add @magicui/dock`).
 *
 * The CLI was not run: pnpm is not installed here and the item ships as
 * TypeScript with a `class-variance-authority` import that this repo does
 * not carry and that only builds one static class string. Converted by
 * hand: types removed, cva replaced by the string it produced, and the
 * `supports-backdrop-blur:` variant classes dropped (that variant is
 * magicui's own, not Tailwind's). The bar's colours are NOT set here: the
 * caller styles the bar with a class and tokens, per the house rule that
 * no component carries a raw colour.
 *
 * WHAT IS KEPT: the interaction, which is the reason it was asked for.
 * One motion value carries the pointer's x; every icon derives its own
 * distance from that and springs its width and height between `size`
 * and `magnification`. Only `mouseX` is shared, so a hover on one icon
 * never re-renders the others.
 *
 * Magnification is mouse-only. `onMouseMove` does not fire for touch
 * pointers, so a finger dragging along the bar scrolls or taps and never
 * magnifies under itself.
 */
import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const DOCK_BASE = 'mx-auto flex w-max items-center justify-center gap-2 rounded-full p-2';

const Dock = React.forwardRef(function Dock(
    {
        className,
        children,
        iconSize = DEFAULT_SIZE,
        iconMagnification = DEFAULT_MAGNIFICATION,
        disableMagnification = false,
        iconDistance = DEFAULT_DISTANCE,
        direction = 'middle',
        ...props
    },
    ref,
) {
    const mouseX = useMotionValue(Infinity);

    const renderChildren = () =>
        React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === DockIcon) {
                return React.cloneElement(child, {
                    ...child.props,
                    mouseX,
                    size: iconSize,
                    magnification: iconMagnification,
                    disableMagnification,
                    distance: iconDistance,
                });
            }
            return child;
        });

    return (
        <motion.div
            ref={ref}
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            {...props}
            className={cn(DOCK_BASE, className, {
                'items-start': direction === 'top',
                'items-center': direction === 'middle',
                'items-end': direction === 'bottom',
            })}
        >
            {renderChildren()}
        </motion.div>
    );
});

function DockIcon({
    size = DEFAULT_SIZE,
    magnification = DEFAULT_MAGNIFICATION,
    disableMagnification,
    distance = DEFAULT_DISTANCE,
    mouseX,
    className,
    children,
    ...props
}) {
    const ref = useRef(null);
    const padding = Math.max(6, size * 0.2);
    const defaultMouseX = useMotionValue(Infinity);

    const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const targetSize = disableMagnification ? size : magnification;

    const sizeTransform = useTransform(
        distanceCalc,
        [-distance, 0, distance],
        [size, targetSize, size],
    );

    const scaleSize = useSpring(sizeTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });

    return (
        <motion.div
            ref={ref}
            style={{ width: scaleSize, height: scaleSize, padding }}
            className={cn(
                'flex aspect-square cursor-pointer items-center justify-center rounded-full',
                className,
            )}
            {...props}
        >
            <div>{children}</div>
        </motion.div>
    );
}

DockIcon.displayName = 'DockIcon';

export { Dock, DockIcon };
