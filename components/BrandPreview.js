'use client';

/**
 * Live brand preview: the visitor repaints this entire site in a different
 * direction and watches it hold together.
 *
 * WHY THIS IS A SALES ARGUMENT AND NOT A TOY
 * A studio claiming "we build to your brand, not to a template" is making a
 * claim every studio makes. This demonstrates it instead. The section, the
 * navigation, the cards, the buttons and the device illustration all repaint
 * from five variables, so what the visitor sees is a design system doing the
 * thing we say we build. Nothing else on the page argues as well.
 *
 * IT ALWAYS REVERTS, AND THAT IS THE POINT
 * A preview is a demonstration, not a preference. Left permanently in
 * someone else's palette, a visitor who returns later sees a site that looks
 * nothing like the one they remember and quite reasonably assumes something
 * is broken. So a chosen theme lasts PREVIEW_SECONDS and then goes back to
 * ours, with a visible countdown so the reversion is expected rather than
 * startling, and a reset control for anyone who wants it back sooner.
 *
 * Picking again restarts the countdown, so exploring never fights the timer.
 *
 * NOTHING IS PERSISTED. The earlier internal version saved the choice to
 * localStorage, which was right when the audience was two founders comparing
 * options and is wrong now: a returning visitor must always see the real
 * site.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ArrowClockwise } from '@phosphor-icons/react/ssr';
import SectionLink from './SectionLink';
import {
    THEMES, FONTS, DEFAULT_THEME, DEFAULT_FONT, PREVIEW_SECONDS,
} from '@/config/themes';

/** Writes a combination onto the element carrying `.nv-root`. */
function apply(themeId, fontId) {
    const root = document.querySelector('.nv-root');
    if (!root) return;

    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    Object.entries(theme.tokens).forEach(([key, value]) => {
        /* camelCase to kebab-case: `onFill` must become `--t-on-fill`.
           Custom property names are case-sensitive, so the mismatch fails
           silently, which once left every bright theme with an unreadable
           button. */
        const prop = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
        root.style.setProperty(`--t-${prop}`, value);
    });

    const font = FONTS.find((f) => f.id === fontId) || FONTS[0];
    root.style.setProperty('--nv-font-display', font.display);
    root.style.setProperty('--nv-font-text', font.text);
}

/** Removes every inline override, so the stylesheet's own defaults return. */
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

export default function BrandPreview() {
    const [themeId, setThemeId] = useState(DEFAULT_THEME);
    const [fontId, setFontId] = useState(DEFAULT_FONT);
    const [left, setLeft] = useState(0);
    const tick = useRef(null);

    const isDefault = themeId === DEFAULT_THEME && fontId === DEFAULT_FONT;

    const reset = useCallback(() => {
        clearInterval(tick.current);
        setThemeId(DEFAULT_THEME);
        setFontId(DEFAULT_FONT);
        setLeft(0);
        clear();
    }, []);

    /* One countdown, restarted on every pick. Driven by a wall-clock deadline
       rather than by decrementing a counter, so a backgrounded tab (where
       timers are throttled) reverts at the right moment instead of hanging
       on at "3 seconds left" indefinitely. */
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

    /* A preview must never outlive the component. Without this, navigating
       away mid-countdown leaves the whole site in a borrowed palette. */
    useEffect(() => () => {
        clearInterval(tick.current);
        clear();
    }, []);

    /* Publish the bar's real height so the page can reserve exactly that much
       space beneath it. Measuring beats a hardcoded number, which drifts the
       moment the copy wraps to a second line on a narrow phone. */
    const barRef = useRef(null);
    useEffect(() => {
        const root = document.querySelector('.nv-root');
        if (!root) return undefined;
        const el = barRef.current;
        if (!el) {
            root.style.removeProperty('--nv-revert-h');
            return undefined;
        }
        const ro = new ResizeObserver(([entry]) => {
            root.style.setProperty('--nv-revert-h', `${Math.ceil(entry.contentRect.height)}px`);
        });
        ro.observe(el);
        return () => {
            ro.disconnect();
            root.style.removeProperty('--nv-revert-h');
        };
    }, [left, themeId, fontId]);

    const activeTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const activeFont = FONTS.find((f) => f.id === fontId) || FONTS[0];

    return (
        <>
            <section className="nv-preview" id="preview" aria-labelledby="nv-preview-title">
                <div className="nv-shell">
                    <div className="nv-preview__head">
                        <h2 className="nv-preview__title" id="nv-preview-title">
                            As unique as your business actually is.
                        </h2>
                        <SectionLink target="preview" label="Brand preview" />
                        <p className="nv-lede nv-preview__lede">
                            Your site gets built around your logo, your brand book and
                            your palette. Not a theme with the colours swapped. To show
                            what that means, repaint this whole page and watch it hold
                            together.
                        </p>
                    </div>

                    <div className="nv-preview__grid">
                        <div>
                            <h3 className="nv-preview__legend">Colour</h3>
                            <div className="nv-preview__options">
                                {THEMES.map((t) => {
                                    const on = t.id === themeId;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`nv-swatch${on ? ' is-active' : ''}`}
                                            aria-pressed={on}
                                            onClick={() => choose(t.id, fontId)}
                                        >
                                            <span
                                                className="nv-swatch__chip"
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
                                            <span className="nv-swatch__name">
                                                {t.name}
                                                {t.id === DEFAULT_THEME && (
                                                    <span className="nv-swatch__tag">Ours</span>
                                                )}
                                                {on && <Check size={15} weight="bold" aria-hidden="true" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="nv-preview__note">{activeTheme.note}</p>
                        </div>

                        <div>
                            <h3 className="nv-preview__legend">Typeface</h3>
                            <div className="nv-preview__options">
                                {FONTS.map((f) => {
                                    const on = f.id === fontId;
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            className={`nv-swatch nv-swatch--font${on ? ' is-active' : ''}`}
                                            aria-pressed={on}
                                            onClick={() => choose(themeId, f.id)}
                                        >
                                            <span
                                                className="nv-swatch__specimen"
                                                style={{ fontFamily: f.display }}
                                                aria-hidden="true"
                                            >
                                                Ag
                                            </span>
                                            <span className="nv-swatch__name">
                                                {f.name}
                                                {f.id === DEFAULT_FONT && (
                                                    <span className="nv-swatch__tag">Ours</span>
                                                )}
                                                {on && <Check size={15} weight="bold" aria-hidden="true" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="nv-preview__note">{activeFont.note}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/*
              The countdown bar. Rendered only while a preview is running, and
              fixed to the bottom of the viewport so it stays visible after the
              visitor scrolls up to look at the page, which is the entire
              purpose of the exercise.

              `role="status"` with `aria-live="polite"` announces the preview
              once. The seconds are `aria-hidden`, because a screen reader
              counting down from ten out loud is unusable.
            */}
            {left > 0 && (
                <div className="nv-revert" role="status" aria-live="polite" ref={barRef}>
                    <div className="nv-revert__inner">
                        <span className="nv-revert__text">
                            Previewing <strong>{activeTheme.name}</strong>
                            {activeFont.id !== DEFAULT_FONT && (
                                <> with <strong>{activeFont.name}</strong></>
                            )}
                            . Back to ours in{' '}
                            <span className="nv-revert__count" aria-hidden="true">{left}s</span>
                        </span>
                        <button type="button" className="nv-revert__btn" onClick={reset}>
                            <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
                            Reset now
                        </button>
                    </div>
                    <span
                        className="nv-revert__bar"
                        aria-hidden="true"
                        style={{ transform: `scaleX(${left / PREVIEW_SECONDS})` }}
                    />
                </div>
            )}

            {/* Keeps the reset control reachable once the timer has gone. */}
            {!isDefault && left === 0 && (
                <div className="nv-revert" role="status" ref={barRef}>
                    <div className="nv-revert__inner">
                        <span className="nv-revert__text">Showing a preview palette.</span>
                        <button type="button" className="nv-revert__btn" onClick={reset}>
                            <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
                            Reset now
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
