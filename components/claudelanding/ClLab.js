'use client';

/**
 * The colour and font lab, as a normal section rather than a sticky bar.
 *
 * Everything that writes a theme is copied from components/BrandPreview.js
 * on purpose, not reimplemented: the camelCase-to-kebab token mapping, the
 * hardcoded property list in `clear()`, and the wall-clock countdown. Two
 * things are deliberately different from that file:
 *
 *   1. There is no `--nv-revert-h` measurement. That property exists so
 *      `.nv-nav`'s sticky `top` can offset below BrandPreview's sticky
 *      revert bar. This page has no `.nv-nav` and no sticky revert bar: the
 *      countdown is published to LabContext and rendered inside ClDock
 *      instead. Writing `--nv-revert-h` here would do nothing but leave a
 *      stale custom property on `.nv-root`.
 *   2. The countdown state itself is published outward on every tick via
 *      `useLabPublish`, so ClDock can show it without importing this file.
 *
 * THE HARDCODED PROPERTY LIST IN `clear()` MUST STAY IN SYNC WITH THEMES
 *
 * If a token is ever added to a THEMES entry in config/themes.js without
 * adding its kebab name here, that token sticks on `.nv-root` after the
 * countdown reaches zero: `clear()` only removes what it is told to.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check } from '@phosphor-icons/react/ssr';
import {
    THEMES, FONTS, DEFAULT_THEME, DEFAULT_FONT, PREVIEW_SECONDS,
} from '@/config/themes';
import Reveal from '@/components/Reveal';
import { useLabPublish } from './LabContext';

/** Writes a combination onto the element carrying `.nv-root`. Copied from
    components/BrandPreview.js; see that file for why camelCase must become
    kebab-case by hand rather than through a library. */
function apply(themeId, fontId) {
    const root = document.querySelector('.nv-root');
    if (!root) return;

    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    Object.entries(theme.tokens).forEach(([key, value]) => {
        const prop = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
        root.style.setProperty(`--t-${prop}`, value);
    });

    const font = FONTS.find((f) => f.id === fontId) || FONTS[0];
    root.style.setProperty('--nv-font-display', font.display);
    root.style.setProperty('--nv-font-text', font.text);
}

/** Removes every inline override, so the stylesheet's own defaults return.
    The property list is hand-maintained and must match THEMES' token keys;
    see the file header. */
function clear() {
    const root = document.querySelector('.nv-root');
    if (!root) return;
    const props = [
        'ink', 'paper', 'accent', 'support', 'soft', 'on-accent', 'fill', 'on-fill',
    ];
    props.forEach((p) => root.style.removeProperty(`--t-${p}`));
    root.style.removeProperty('--nv-font-display');
    root.style.removeProperty('--nv-font-text');
}

export default function ClLab() {
    const [themeId, setThemeId] = useState(DEFAULT_THEME);
    const [fontId, setFontId] = useState(DEFAULT_FONT);
    const [left, setLeft] = useState(0);
    const tick = useRef(null);
    const publish = useLabPublish();

    const isDefault = themeId === DEFAULT_THEME && fontId === DEFAULT_FONT;
    const activeTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const activeFont = FONTS.find((f) => f.id === fontId) || FONTS[0];

    const reset = useCallback(() => {
        clearInterval(tick.current);
        setThemeId(DEFAULT_THEME);
        setFontId(DEFAULT_FONT);
        setLeft(0);
        clear();
    }, []);

    /* One countdown, restarted on every pick. Driven by a wall-clock
       deadline rather than by decrementing a counter, so a backgrounded tab
       (where timers are throttled) reverts at the right moment instead of
       hanging on at "3 seconds left" indefinitely. Verbatim from
       BrandPreview.js. */
    const startCountdown = useCallback(() => {
        clearInterval(tick.current);
        const deadline = Date.now() + PREVIEW_SECONDS * 1000;
        setLeft(PREVIEW_SECONDS);
        tick.current = setInterval(() => {
            const remaining = Math.ceil((deadline - Date.now()) / 1000);
            if (remaining <= 0) reset();
            else setLeft(remaining);
        }, 250);
    }, [reset]);

    const choose = useCallback((nextTheme, nextFont) => {
        setThemeId(nextTheme);
        setFontId(nextFont);
        if (nextTheme === DEFAULT_THEME && nextFont === DEFAULT_FONT) {
            clearInterval(tick.current);
            setLeft(0);
            clear();
            return;
        }
        apply(nextTheme, nextFont);
        startCountdown();
    }, [startCountdown]);

    /* A preview must never outlive the component. */
    useEffect(() => () => {
        clearInterval(tick.current);
        clear();
    }, []);

    /* Publish to the dock on every change relevant to what it renders. */
    useEffect(() => {
        publish({
            secondsLeft: left,
            isDefault,
            themeName: activeTheme.name,
            fontName: activeFont.id !== DEFAULT_FONT ? activeFont.name : '',
            reset,
        });
    }, [left, isDefault, activeTheme.name, activeFont.id, activeFont.name, publish, reset]);

    return (
        <section
            id="lab"
            className="nv-section nv-ground--paper"
            aria-labelledby="cl-lab-title"
        >
            <div className="nv-shell">
                <div className="cl-head cl-head--wide cl-lab__head">
                    <h2 className="cl-h2" id="cl-lab-title">
                        As unique as your business actually is.
                    </h2>
                    <p className="nv-lede">
                        Your site gets built around your logo, your brand
                        book and your palette, not a theme with the colours
                        swapped. To show what that means, repaint this whole
                        page and watch it hold together.
                    </p>
                </div>

                <Reveal className="cl-lab__grid">
                    <div>
                        <h3 className="cl-lab__legend">Colour</h3>
                        <div className="cl-lab__options cl-lab__options--colour">
                            {THEMES.map((t) => {
                                const on = t.id === themeId;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`cl-lab__swatch${on ? ' is-active' : ''}`}
                                        aria-pressed={on}
                                        onClick={() => choose(t.id, fontId)}
                                    >
                                        <span
                                            className="cl-lab__chip"
                                            aria-hidden="true"
                                            style={{
                                                background: t.tokens.paper,
                                                borderColor: t.tokens.ink,
                                            }}
                                        >
                                            <span style={{ background: t.tokens.ink }} />
                                            <span style={{ background: t.tokens.accent }} />
                                            <span style={{ background: t.tokens.support }} />
                                        </span>
                                        <span className="cl-lab__swatchName">
                                            {t.name}
                                            {t.id === DEFAULT_THEME && (
                                                <span className="cl-lab__tag">Ours</span>
                                            )}
                                            {on && <Check size={15} weight="bold" aria-hidden="true" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="cl-lab__note">{activeTheme.note}</p>
                    </div>

                    <div>
                        <h3 className="cl-lab__legend">Typeface</h3>
                        <div className="cl-lab__options">
                            {FONTS.map((f) => {
                                const on = f.id === fontId;
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        className={`cl-lab__swatch cl-lab__swatch--font${on ? ' is-active' : ''}`}
                                        aria-pressed={on}
                                        onClick={() => choose(themeId, f.id)}
                                    >
                                        <span
                                            className="cl-lab__specimen"
                                            style={{ fontFamily: f.display }}
                                            aria-hidden="true"
                                        >
                                            Ag
                                        </span>
                                        <span className="cl-lab__swatchName">
                                            {f.name}
                                            {f.id === DEFAULT_FONT && (
                                                <span className="cl-lab__tag">Ours</span>
                                            )}
                                            {on && <Check size={15} weight="bold" aria-hidden="true" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="cl-lab__note">{activeFont.note}</p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
