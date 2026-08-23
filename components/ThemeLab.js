'use client';

/**
 * The theme and typography lab.
 *
 * PLACEMENT, DELIBERATELY BELOW THE FOOTER
 * The obvious build is a floating panel pinned to a corner. It was rejected:
 * a floating control sits on top of the very thing being judged, covers a
 * different part of the layout at every width, and is worst on a phone where
 * it would cover a third of the screen. Since the whole point is to look at
 * the page undisturbed, the controls live past the end of it. Nothing overlaps
 * the site, and the page above is exactly what a visitor would see.
 *
 * HOW IT REPAINTS THE SITE
 * A theme is five custom properties, so switching one sets five values on the
 * wrapper element that carries `.nv-root`. Every other token in globals.css
 * derives from those five, so the entire page repaints with no re-render of
 * any section and no reload.
 *
 * Fonts work the same way: two properties pointing at variables that
 * app/lab-fonts.js has already loaded.
 *
 * The choice persists in localStorage, so comparing options across a reload,
 * or sending the URL to someone and asking them to look, both work.
 *
 * THIS COMPONENT IS SCAFFOLDING. When a combination is chosen, its values go
 * into the token block at the top of globals.css and into app/fonts.js, and
 * this file, app/lab-fonts.js, config/themes.js and the /lab route are all
 * deleted. It is deliberately not reachable from the site navigation.
 */
import { useCallback, useEffect, useState } from 'react';
import { Check, ArrowClockwise } from '@phosphor-icons/react/ssr';
import { THEMES, FONTS, DEFAULT_THEME, DEFAULT_FONT } from '@/config/themes';

const STORE_KEY = 'nv-lab-choice';

/** Applies a combination to the element carrying `.nv-root`. */
function apply(themeId, fontId) {
    const root = document.querySelector('.nv-root');
    if (!root) return;

    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    Object.entries(theme.tokens).forEach(([key, value]) => {
        /* camelCase to kebab-case. `onFill` must become `--t-on-fill`, not
           `--t-onFill`: custom property names are case-sensitive, so the
           mismatch fails silently and the declaration is simply never found.
           That is exactly what happened, and it left every bright dark theme
           with an unreadable primary button at 1.1:1. */
        const prop = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
        root.style.setProperty(`--t-${prop}`, value);
    });

    const font = FONTS.find((f) => f.id === fontId) || FONTS[0];
    root.style.setProperty('--nv-font-display', font.display);
    root.style.setProperty('--nv-font-text', font.text);
}

/**
 * Reads the stored choice. Returns the defaults on the server, where there is
 * no localStorage, and on any unreadable or corrupt value.
 */
function readStored() {
    if (typeof window === 'undefined') {
        return { theme: DEFAULT_THEME, font: DEFAULT_FONT };
    }
    try {
        const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        return {
            theme: THEMES.some((x) => x.id === saved.theme) ? saved.theme : DEFAULT_THEME,
            font: FONTS.some((x) => x.id === saved.font) ? saved.font : DEFAULT_FONT,
        };
    } catch {
        return { theme: DEFAULT_THEME, font: DEFAULT_FONT };
    }
}

export default function ThemeLab() {
    /*
     * Lazy initialisers, not an effect that calls setState.
     *
     * The first version read localStorage inside useEffect and then called
     * three setters, which eslint rejects and React documents as cascading
     * renders: the component mounts with the defaults, then immediately
     * re-renders with the stored values. Passing a function to useState does
     * the same work once, before the first paint, with no second render.
     *
     * These run on the server too, where readStored() returns the defaults,
     * so the server and the first client render agree and hydration is clean.
     */
    const [themeId, setThemeId] = useState(() => readStored().theme);
    const [fontId, setFontId] = useState(() => readStored().font);

    /*
     * The effect does only what an effect is for: pushing state into an
     * external system, here the DOM element that carries the tokens. It
     * cannot run during render because it touches the document.
     *
     * There is no `ready` flag. An earlier version held one so the active
     * tick would not render until after hydration, but with lazy
     * initialisers the server and the first client render already agree on
     * the selection, so there was nothing to defer, and setting it here was
     * a second setState inside the effect for no benefit.
     */
    useEffect(() => {
        apply(themeId, fontId);
    }, [themeId, fontId]);

    const choose = useCallback((nextTheme, nextFont) => {
        setThemeId(nextTheme);
        setFontId(nextFont);
        /* No apply() here: the effect above reacts to the state change, so
           there is exactly one place that touches the DOM. */
        try {
            localStorage.setItem(
                STORE_KEY,
                JSON.stringify({ theme: nextTheme, font: nextFont }),
            );
        } catch {
            /* Private browsing can refuse writes. The choice still applies
               for this session, which is all the lab needs. */
        }
    }, []);

    const reset = () => choose(DEFAULT_THEME, DEFAULT_FONT);

    const activeTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const activeFont = FONTS.find((f) => f.id === fontId) || FONTS[0];

    return (
        <section className="nv-lab" id="lab" aria-label="Theme and typography lab">
            <div className="nv-shell">
                <div className="nv-lab__head">
                    <h2 className="nv-lab__title">Pick a look.</h2>
                    <p className="nv-lab__lede">
                        Every option repaints the whole page above. Scroll back up to
                        judge it against real content, then come back. Your choice is
                        remembered, so you can compare across a reload or send someone
                        the link and ask.
                    </p>
                </div>

                <div className="nv-lab__grid">
                    <div>
                        {/* Split into light and dark. Eighteen swatches in one
                            undifferentiated grid is a wall; the two groups are
                            the first decision anyone makes anyway. */}
                        <h3 className="nv-lab__legend">Colour, light</h3>
                        <div className="nv-lab__options">
                            {THEMES.filter((x) => !x.dark).map((t) => {
                                const on = t.id === themeId;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`nv-swatch${on ? ' is-active' : ''}`}
                                        aria-pressed={on}
                                        onClick={() => choose(t.id, fontId)}
                                    >
                                        {/* The swatch is the argument: three of the five
                                            tokens, in the proportion the page uses them. */}
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
                                            {on && <Check size={15} weight="bold" aria-hidden="true" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <h3 className="nv-lab__legend nv-lab__legend--spaced">Colour, dark</h3>
                        <div className="nv-lab__options">
                            {THEMES.filter((x) => x.dark).map((t) => {
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
                                            {on && <Check size={15} weight="bold" aria-hidden="true" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="nv-lab__note">{activeTheme.note}</p>
                    </div>

                    <div>
                        <h3 className="nv-lab__legend">Typeface</h3>
                        <div className="nv-lab__options">
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
                                        {/* Set in the face itself, so the button is a
                                            specimen rather than a label. */}
                                        <span
                                            className="nv-swatch__specimen"
                                            style={{ fontFamily: f.display }}
                                            aria-hidden="true"
                                        >
                                            Ag
                                        </span>
                                        <span className="nv-swatch__name">
                                            {f.name}
                                            {on && <Check size={15} weight="bold" aria-hidden="true" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="nv-lab__note">{activeFont.note}</p>
                    </div>
                </div>

                <div className="nv-lab__foot">
                    <p className="nv-lab__current">
                        Showing <strong>{activeTheme.name}</strong> with{' '}
                        <strong>{activeFont.name}</strong>.
                    </p>
                    <button type="button" className="nv-lab__reset" onClick={reset}>
                        <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
                        Reset
                    </button>
                </div>
            </div>
        </section>
    );
}
