'use client';

import {
    useEffect, useMemo, useRef, useState,
} from 'react';

/**
 * 3D Interactive Icon Cloud Component
 * Renders icons on a rotating 3D sphere with mouse/touch drag and inertia.
 */
export function IconCloud({ images = [], iconSlugs = [] }) {
    const canvasRef = useRef(null);
    const [loadedImages, setLoadedImages] = useState([]);
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const rotationVelocityRef = useRef({ x: 0.002, y: 0.003 });
    const rotationRef = useRef({ x: 0, y: 0 });

    /* Derived from props, not a ref: a ref mutated during render is a value
       React cannot see change, so a re-render with a different `images` prop
       would silently keep rendering the previous cloud. useMemo recomputes
       whenever the prop actually changes, and reads as a value rather than a
       side effect smuggled into the render body. */
    const iconUrls = useMemo(() => {
        if (images && images.length > 0) return images;
        if (iconSlugs && iconSlugs.length > 0) {
            return iconSlugs.map((slug) => `https://cdn.simpleicons.org/${slug}`);
        }
        return [];
    }, [images, iconSlugs]);

    // Preload image elements
    useEffect(() => {
        let isMounted = true;
        const urls = iconUrls;
        if (!urls || urls.length === 0) return undefined;

        const imageElements = [];
        let loadedCount = 0;

        urls.forEach((url, index) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            img.onload = () => {
                if (!isMounted) return;
                loadedCount++;
                if (loadedCount >= Math.min(urls.length, 10)) {
                    setLoadedImages([...imageElements]);
                }
            };
            img.onerror = () => {
                // If specific url fails, keep placeholder
                loadedCount++;
            };
            imageElements[index] = img;
        });

        return () => {
            isMounted = false;
        };
    }, [iconUrls]);

    // Canvas 3D rendering loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;
        let width = canvas.clientWidth || 360;
        let height = canvas.clientHeight || 360;

        const handleResize = () => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            width = rect.width;
            height = rect.height;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // Precompute sphere points using Fibonacci lattice
        const count = Math.max(iconUrls.length, 20);
        const spherePoints = [];
        const baseRadius = Math.min(width, height) * 0.38;

        for (let i = 0; i < count; i++) {
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;
            spherePoints.push({
                x: baseRadius * Math.cos(theta) * Math.sin(phi),
                y: baseRadius * Math.sin(theta) * Math.sin(phi),
                z: baseRadius * Math.cos(phi),
                iconIndex: i % iconUrls.length,
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const currentRadius = Math.min(width, height) * 0.38;

            // Apply inertia / auto-rotation
            if (!isDraggingRef.current) {
                rotationVelocityRef.current.x *= 0.96;
                rotationVelocityRef.current.y *= 0.96;

                // Base constant rotation drift
                rotationRef.current.y += rotationVelocityRef.current.y + 0.003;
                rotationRef.current.x += rotationVelocityRef.current.x + 0.0015;
            }

            const rotX = rotationRef.current.x;
            const rotY = rotationRef.current.y;

            const cosX = Math.cos(rotX);
            const sinX = Math.sin(rotX);
            const cosY = Math.cos(rotY);
            const sinY = Math.sin(rotY);

            // Project 3D points
            const projectedPoints = spherePoints.map((pt) => {
                // Scale according to dynamic radius
                const factor = currentRadius / baseRadius;
                const px = pt.x * factor;
                const py = pt.y * factor;
                const pz = pt.z * factor;

                // Rotate around Y axis
                const x1 = px * cosY - pz * sinY;
                const z1 = pz * cosY + px * sinY;

                // Rotate around X axis
                const y2 = py * cosX - z1 * sinX;
                const z2 = z1 * cosX + py * sinX;

                // Perspective calculation
                const focalLength = 320;
                const scale = focalLength / (focalLength - z2);
                const projX = centerX + x1 * scale;
                const projY = centerY + y2 * scale;
                const depth = (z2 + currentRadius) / (2 * currentRadius); // 0 (back) to 1 (front)
                const alpha = Math.max(0.18, Math.min(1, depth * 0.8 + 0.2));
                const iconSize = Math.max(20, Math.min(46, 32 * scale));

                return {
                    x: projX,
                    y: projY,
                    z: z2,
                    scale,
                    alpha,
                    iconSize,
                    iconIndex: pt.iconIndex,
                };
            });

            // Sort by depth (z) so back items render first
            projectedPoints.sort((a, b) => a.z - b.z);

            // Draw all icons
            projectedPoints.forEach((pt) => {
                const img = loadedImages[pt.iconIndex];
                const size = pt.iconSize;

                ctx.save();
                ctx.globalAlpha = pt.alpha;

                // Draw neo-brutalist icon pill badge background for crisp readability
                const bgSize = size + 14;
                const halfBg = bgSize / 2;
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#0a0a0c';
                ctx.lineWidth = Math.max(1.5, 2 * pt.scale);

                // Rounded background rectangle
                const rx = pt.x - halfBg;
                const ry = pt.y - halfBg;
                const radius = Math.min(10 * pt.scale, bgSize / 2);

                ctx.beginPath();
                ctx.roundRect(rx, ry, bgSize, bgSize, radius);
                ctx.fill();
                ctx.stroke();

                // Draw actual icon image, preserving its own aspect ratio.
                // `simpleicons.org` SVGs are not all square (some pad their
                // viewBox differently per mark), and forcing every one into
                // a size x size box with drawImage stretched and
                // off-centred a visible number of them against the square
                // badge drawn above, which is what looked "misaligned"
                // against the grid of badges. Fitting inside the box on
                // its longer side and centring the shorter side keeps every
                // icon's own proportions intact and visually centred in the
                // same badge every other icon uses.
                if (img && img.complete && img.naturalWidth > 0) {
                    try {
                        const ratio = img.naturalWidth / img.naturalHeight;
                        const drawW = ratio >= 1 ? size : size * ratio;
                        const drawH = ratio >= 1 ? size / ratio : size;
                        ctx.drawImage(
                            img,
                            pt.x - drawW / 2,
                            pt.y - drawH / 2,
                            drawW,
                            drawH,
                        );
                    } catch {
                        // Ignore drawImage render errors if image is busy
                    }
                } else {
                    // Fallback marker if image is still loading
                    ctx.fillStyle = '#1052df';
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 4 * pt.scale, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [loadedImages, iconUrls]);

    // Mouse / Touch Drag handlers
    const handlePointerDown = (e) => {
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;

        rotationVelocityRef.current = {
            x: dy * 0.005,
            y: dx * 0.005,
        };

        rotationRef.current.y += dx * 0.008;
        rotationRef.current.x -= dy * 0.008;

        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
        isDraggingRef.current = false;
    };

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            style={{ width: '100%', height: '100%', minHeight: '340px', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            aria-label="Interactive 3D Technology Stack Sphere"
            role="img"
        />
    );
}

export default IconCloud;
