'use client';

/**
 * Vendored from Skiper UI (skiper39, "Canvas_Landing_004"), ported from TSX
 * to plain JS for this project (no TypeScript toolchain here). The animation
 * logic is unchanged from the source: a canvas sprite sheet of illustrated
 * figures (Open Peeps, openpeeps.com) walking across the bottom of the
 * screen on independent GSAP timelines, each on its own random speed and
 * restarting from the opposite edge on completion. Only the outer wrapper
 * (Skiper39 in the original) was dropped; the section around this component
 * is CrowdSection.js, styled with this project's own `nv-` rules instead of
 * the source's Tailwind wrapper.
 *
 * ATTRIBUTION, PER THE FREE-TIER LICENSE
 * "Attribution to Skiper UI is required when using the free version." That
 * attribution lives in CrowdSection.js, visible in the section, not hidden
 * in a code comment. The illustrations are openpeeps.com's; the animation
 * approach is adapted from a CodePen by zadvorsky, credited in the same
 * place per the source file's own header.
 *
 * WHY A LOCAL ASSET, NOT A HOTLINK
 * The source component points `src` at a URL on skiper-ui.com. Hot-linking a
 * decorative asset to a third party's server means this section silently
 * breaks if that server is slow, rate-limits, or goes away, for a site that
 * otherwise ships every image itself. The sprite sheet is downloaded once to
 * public/images/peeps/all-peeps.png and served from here instead.
 */
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

export function CrowdCanvas({ src, rows = 15, cols = 7 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        /* Every other animated piece on this site (Reveal.js, Ribbon.js's
           successor, BrandPreview.js) checks this before arming a timer or a
           timeline; a walking crowd is exactly the kind of motion someone
           who has asked for less of it does not want running behind a
           contact section. */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        const config = { src, rows, cols };

        const randomRange = (min, max) => min + Math.random() * (max - min);
        const randomIndex = (array) => randomRange(0, array.length) | 0;
        const removeFromArray = (array, i) => array.splice(i, 1)[0];
        const removeItemFromArray = (array, item) => removeFromArray(array, array.indexOf(item));
        const removeRandomFromArray = (array) => removeFromArray(array, randomIndex(array));
        const getRandomFromArray = (array) => array[randomIndex(array) | 0];

        const resetPeep = ({ stage, peep }) => {
            const direction = Math.random() > 0.5 ? 1 : -1;
            const offsetY = 100 - 250 * gsap.parseEase('power2.in')(Math.random());
            const startY = stage.height - peep.height + offsetY;
            let startX;
            let endX;

            if (direction === 1) {
                startX = -peep.width;
                endX = stage.width;
                peep.scaleX = 1;
            } else {
                startX = stage.width + peep.width;
                endX = 0;
                peep.scaleX = -1;
            }

            peep.x = startX;
            peep.y = startY;
            peep.anchorY = startY;

            return { startX, startY, endX };
        };

        const normalWalk = ({ peep, props }) => {
            const { startY, endX } = props;
            const xDuration = 10;
            const yDuration = 0.25;

            const tl = gsap.timeline();
            tl.timeScale(randomRange(0.5, 1.5));
            tl.to(peep, { duration: xDuration, x: endX, ease: 'none' }, 0);
            tl.to(peep, {
                duration: yDuration,
                repeat: xDuration / yDuration,
                yoyo: true,
                y: startY - 10,
            }, 0);

            return tl;
        };

        const walks = [normalWalk];

        const createPeep = ({ image, rect }) => {
            const peep = {
                image,
                rect: [],
                width: 0,
                height: 0,
                drawArgs: [],
                x: 0,
                y: 0,
                anchorY: 0,
                scaleX: 1,
                walk: null,
                setRect: (r) => {
                    peep.rect = r;
                    [, , peep.width, peep.height] = r;
                    peep.drawArgs = [peep.image, ...r, 0, 0, peep.width, peep.height];
                },
                render: (context) => {
                    context.save();
                    context.translate(peep.x, peep.y);
                    context.scale(peep.scaleX, 1);
                    context.drawImage(
                        peep.image,
                        peep.rect[0],
                        peep.rect[1],
                        peep.rect[2],
                        peep.rect[3],
                        0,
                        0,
                        peep.width,
                        peep.height,
                    );
                    context.restore();
                },
            };

            peep.setRect(rect);
            return peep;
        };

        const img = document.createElement('img');
        const stage = { width: 0, height: 0 };

        const allPeeps = [];
        const availablePeeps = [];
        const crowd = [];

        const createPeeps = () => {
            const { naturalWidth: width, naturalHeight: height } = img;
            const total = config.rows * config.cols;
            const rectWidth = width / config.rows;
            const rectHeight = height / config.cols;

            for (let i = 0; i < total; i += 1) {
                allPeeps.push(createPeep({
                    image: img,
                    rect: [
                        (i % config.rows) * rectWidth,
                        ((i / config.rows) | 0) * rectHeight,
                        rectWidth,
                        rectHeight,
                    ],
                }));
            }
        };

        function removePeepFromCrowd(peep) {
            removeItemFromArray(crowd, peep);
            availablePeeps.push(peep);
        }

        function addPeepToCrowd() {
            const peep = removeRandomFromArray(availablePeeps);
            const walk = getRandomFromArray(walks)({
                peep,
                props: resetPeep({ peep, stage }),
            }).eventCallback('onComplete', () => {
                removePeepFromCrowd(peep);
                addPeepToCrowd();
            });

            peep.walk = walk;

            crowd.push(peep);
            crowd.sort((a, b) => a.anchorY - b.anchorY);

            return peep;
        }

        const initCrowd = () => {
            while (availablePeeps.length) {
                addPeepToCrowd().walk.progress(Math.random());
            }
        };

        const render = () => {
            if (!canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(devicePixelRatio, devicePixelRatio);
            crowd.forEach((peep) => peep.render(ctx));
            ctx.restore();
        };

        const resize = () => {
            if (!canvas) return;
            stage.width = canvas.clientWidth;
            stage.height = canvas.clientHeight;
            canvas.width = stage.width * devicePixelRatio;
            canvas.height = stage.height * devicePixelRatio;

            crowd.forEach((peep) => peep.walk.kill());
            crowd.length = 0;
            availablePeeps.length = 0;
            availablePeeps.push(...allPeeps);

            initCrowd();
        };

        const init = () => {
            createPeeps();
            resize();
            gsap.ticker.add(render);
        };

        img.onload = init;
        img.src = config.src;

        const handleResize = () => resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            gsap.ticker.remove(render);
            crowd.forEach((peep) => {
                if (peep.walk) peep.walk.kill();
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <canvas ref={canvasRef} className="nv-crowd__canvas" />;
}

export default CrowdCanvas;
