'use client';

/**
 * The one piece of state the landing page has.
 *
 * The visitor types their business name near the top of the page and picks a
 * sector. From there the name appears in the storefront mock, in the search
 * result, in the WhatsApp thread and in the Cloud teaser. That is the whole
 * point of the page: a visitor should be able to see their own business in
 * it rather than read a paragraph about ours.
 *
 * ROUND TWO: CYCLING UNTIL THE VISITOR COMMITS
 *
 * Before any input, the page should already be alive. Two things cycle on
 * their own timers while nothing is locked: the placeholder text (through
 * the current sector's `names`) and the sector itself (through the six
 * common sectors). Both stop the moment the visitor commits.
 *
 * "Commits" has two halves and both must be true before the page locks:
 * typing a real name, and choosing a sector deliberately. The auto-advance
 * changes `typeId` exactly like a click does, so a second flag,
 * `sectorChosen`, distinguishes "the timer moved this" from "the visitor
 * moved this". Only a real click sets it. Locking on typing alone would
 * freeze the sector on whatever the auto-advance happened to be showing,
 * which is a coin flip standing in for a decision.
 *
 * Once `locked` is true it stays true for the rest of the session. There is
 * no unlock: a visitor who deletes their typed name should not watch the
 * page start cycling again underneath the sector chip they already picked.
 *
 * THREE DELIBERATE ABSENCES, CARRIED OVER FROM ROUND ONE
 *
 * No persistence. No submit or validation; an empty field falls back to a
 * neutral placeholder so no downstream mock ever renders a blank. No route
 * crossing: /cloud does not read this context.
 *
 * DEBOUNCE
 *
 * `name` is the committed value the mocks read; `draft` is what the input
 * shows. Typing updates `draft` on every keystroke and `name` at most every
 * 120ms, so a keystroke does not re-render three device frames per press.
 */
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { SECTORS, COMMON_SECTORS, DEFAULT_SECTOR, findSector } from './sectors';
import useReducedMotionPref from './useReducedMotionPref';

/* Used wherever the visitor has not typed anything. Deliberately generic:
   it reads as a placeholder rather than as a real business we are naming. */
export const FALLBACK_NAME = 'Your Business';

/* Kept as aliases so nothing outside this file has to know the taxonomy
   moved to sectors.js. `type` in every consumer (ClGrowth, ClCloudTeaser,
   ClContact) still means "the active sector object". */
export const TYPES = SECTORS;
export const DEFAULT_TYPE = DEFAULT_SECTOR;

const NAME_CYCLE_MS = 2600;
const SECTOR_CYCLE_MS = 4200;

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
    const [draft, setDraft] = useState('');
    const [name, setName] = useState('');
    const [typeId, setTypeId] = useState(DEFAULT_SECTOR);
    const [sectorChosen, setSectorChosen] = useState(false);
    /* Which name in the current sector's `names[]` the placeholder shows.
       Reset to 0 whenever the sector changes so a fast sector-cycle never
       shows index 2 of a list that only has one name. */
    /* A raw counter that only ever increases, rather than an index reset on
       every sector change. Taking it modulo the CURRENT sector's name count
       at read time means a sector switch cannot land it out of range and
       nothing has to notice the switch and reset anything: there is no
       effect and no ref write during render for the lint rules to catch,
       because there is nothing left to synchronise. */
    const [nameTick, setNameTick] = useState(0);
    /* Whether the name field currently has focus. Both cycles stop the
       instant the visitor clicks into the field, not only once they have
       typed a full character: a sector chip swapping under a visitor who
       has merely clicked in to start typing is exactly the "bad
       experience" this flag exists to prevent. Set from onFocus/onBlur on
       the input in ClBusinessSetup.js. */
    const [fieldFocused, setFieldFocused] = useState(false);
    const timer = useRef(null);
    const reduceMotion = useReducedMotionPref();

    useEffect(() => {
        timer.current = window.setTimeout(() => setName(draft), 120);
        return () => window.clearTimeout(timer.current);
    }, [draft]);

    const trimmed = name.trim();
    const named = trimmed.length > 0;
    const locked = named && sectorChosen;

    /* Sector auto-advance. Stops the instant any of "commit", "chosen" or
       "the visitor is in the field" is true. Focus is included because a
       chip changing under a visitor who has clicked in to type, but has
       not typed a character yet, is the same jarring experience as one
       changing mid-keystroke. Off entirely under reduced motion, landing
       on the default with the cycle simply never starting. */
    useEffect(() => {
        if (locked || sectorChosen || reduceMotion || fieldFocused) {
            return undefined;
        }
        const id = window.setInterval(() => {
            setTypeId((current) => {
                const i = COMMON_SECTORS.findIndex((s) => s.id === current);
                const next = COMMON_SECTORS[(i + 1) % COMMON_SECTORS.length];
                return next ? next.id : current;
            });
        }, SECTOR_CYCLE_MS);
        return () => window.clearInterval(id);
    }, [locked, sectorChosen, reduceMotion, fieldFocused]);

    /* Placeholder name cycle. Stops once the visitor has typed anything at
       all, or has simply focused the field: a placeholder that keeps
       cross-fading behind an empty, focused input reads as the page typing
       over the visitor's shoulder. */
    useEffect(() => {
        if (named || reduceMotion || fieldFocused) return undefined;
        const activeSector = findSector(typeId);
        if (activeSector.names.length <= 1) return undefined;
        const id = window.setInterval(() => {
            setNameTick((t) => t + 1);
        }, NAME_CYCLE_MS);
        return () => window.clearInterval(id);
    }, [named, reduceMotion, typeId, fieldFocused]);

    /* The only way `sectorChosen` becomes true. Passed to every chip and
       every panel row; the auto-advance above calls `setTypeId` directly
       and never this, which is the whole distinction the file depends on. */
    function pickSector(id) {
        setTypeId(id);
        setSectorChosen(true);
    }

    const value = useMemo(() => {
        const activeSector = findSector(typeId);
        return {
            draft,
            setDraft,
            typeId,
            setTypeId: pickSector,
            pickSector,
            locked,
            sectorChosen,
            setFieldFocused,
            /* What every mock renders. Never empty. */
            displayName: trimmed || FALLBACK_NAME,
            /* True only once the visitor has actually typed something, so a
               section can acknowledge the moment rather than pretending the
               placeholder was their answer. */
            named,
            type: activeSector,
            /* The name the input SHOWS when empty. A real placeholder string,
               not the browser's static `placeholder` attribute, because it
               has to change every few seconds while unlocked. Taken modulo
               the current sector's own length, so `nameTick` never has to
               be reset when the sector changes underneath it. */
            placeholderName:
                activeSector.names[nameTick % activeSector.names.length],
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, name, typeId, locked, sectorChosen, nameTick]);

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const ctx = useContext(BusinessContext);
    if (!ctx) {
        throw new Error('useBusiness must be used inside a BusinessProvider');
    }
    return ctx;
}

/**
 * A business name turned into something that can sit in a URL bar or an
 * avatar. Both mocks need it and both were getting it slightly wrong
 * separately.
 */
export function slugify(value) {
    return (
        value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '')
            .slice(0, 22) || 'yourbusiness'
    );
}

export function initials(value) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'YB';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}
