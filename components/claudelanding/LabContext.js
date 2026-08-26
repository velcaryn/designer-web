'use client';

/**
 * Shares the lab's revert countdown with the dock, without the dock having
 * to import ClLab's internals.
 *
 * ClLab is the writer: it owns the theme/font state and calls `publish()` on
 * every tick. ClDock is a reader: it renders the countdown pill and a reset
 * button by reading `secondsLeft` / `isDefault` / `reset` from this context.
 * Neither has to know how the other is built.
 *
 * The provider has to sit above both, so it wraps the whole page tree in
 * app/claudelanding/page.js rather than living inside ClLab's own section.
 */
import { createContext, useContext, useMemo, useRef, useState } from 'react';

const LabContext = createContext({
    secondsLeft: 0,
    isDefault: true,
    themeName: '',
    fontName: '',
    reset: () => {},
});

export function LabProvider({ children }) {
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isDefault, setIsDefault] = useState(true);
    const [themeName, setThemeName] = useState('');
    const [fontName, setFontName] = useState('');
    const resetRef = useRef(() => {});

    const value = useMemo(
        () => ({
            secondsLeft,
            isDefault,
            themeName,
            fontName,
            /* A stable function identity: ClLab replaces what it points at,
               so the dock's own effects do not have to depend on it. */
            reset: () => resetRef.current(),
            /* Called once by ClLab on mount to register the real reset
               function, and by its own reset handler on every publish. */
            _publish: (next) => {
                setSecondsLeft(next.secondsLeft);
                setIsDefault(next.isDefault);
                setThemeName(next.themeName);
                setFontName(next.fontName);
                if (next.reset) resetRef.current = next.reset;
            },
        }),
        [secondsLeft, isDefault, themeName, fontName],
    );

    return (
        <LabContext.Provider value={value}>{children}</LabContext.Provider>
    );
}

export function useLabPublish() {
    const ctx = useContext(LabContext);
    return ctx._publish;
}

export function useLabStatus() {
    const ctx = useContext(LabContext);
    return ctx;
}
