'use client';

/**
 * TextType, from React Bits (JavaScript + CSS variant), vendored.
 *
 * Types one string at a time, pauses, deletes it, and moves to the next.
 * Two changes from upstream:
 *
 *   1. Its three CSS rules live in the page stylesheet rather than in a
 *      sibling `TextType.css`, which keeps this folder to components and
 *      keeps every stylesheet where the rest of the site keeps them.
 *   2. Under `prefers-reduced-motion: reduce` the component renders the
 *      first string complete and still, with no cursor blink and no
 *      typing loop. Text that rewrites itself every few seconds is
 *      exactly the category of motion that preference exists to stop.
 *
 * The cursor blink uses gsap, which this repo already carries.
 */
import { useEffect, useRef, useState, createElement, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';

const TextType = ({
    text,
    as: Component = 'div',
    typingSpeed = 50,
    initialDelay = 0,
    pauseDuration = 2000,
    deletingSpeed = 30,
    loop = true,
    className = '',
    showCursor = true,
    hideCursorWhileTyping = false,
    cursorCharacter = '|',
    cursorClassName = '',
    cursorBlinkDuration = 0.5,
    textColors = [],
    variableSpeed,
    onSentenceComplete,
    startOnVisible = false,
    reverseMode = false,
    ...props
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(!startOnVisible);
    const [reduceMotion, setReduceMotion] = useState(false);
    const cursorRef = useRef(null);
    const containerRef = useRef(null);

    const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

    useEffect(() => {
        setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }, []);

    const getRandomSpeed = useCallback(() => {
        if (!variableSpeed) return typingSpeed;
        const { min, max } = variableSpeed;
        return Math.random() * (max - min) + min;
    }, [variableSpeed, typingSpeed]);

    const getCurrentTextColor = () => {
        if (textColors.length === 0) return 'inherit';
        return textColors[currentTextIndex % textColors.length];
    };

    useEffect(() => {
        if (!startOnVisible || !containerRef.current) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setIsVisible(true);
                });
            },
            { threshold: 0.1 },
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [startOnVisible]);

    useEffect(() => {
        if (reduceMotion || !showCursor || !cursorRef.current) return undefined;
        gsap.set(cursorRef.current, { opacity: 1 });
        const tween = gsap.to(cursorRef.current, {
            opacity: 0,
            duration: cursorBlinkDuration,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
        });
        return () => tween.kill();
    }, [showCursor, cursorBlinkDuration, reduceMotion]);

    useEffect(() => {
        if (!isVisible || reduceMotion) return undefined;

        let timeout;
        const currentText = textArray[currentTextIndex];
        const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText;

        const executeTypingAnimation = () => {
            if (isDeleting) {
                if (displayedText === '') {
                    setIsDeleting(false);
                    if (currentTextIndex === textArray.length - 1 && !loop) return;
                    if (onSentenceComplete) onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
                    setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
                    setCurrentCharIndex(0);
                    timeout = setTimeout(() => {}, pauseDuration);
                } else {
                    timeout = setTimeout(() => {
                        setDisplayedText((prev) => prev.slice(0, -1));
                    }, deletingSpeed);
                }
            } else if (currentCharIndex < processedText.length) {
                timeout = setTimeout(() => {
                    setDisplayedText((prev) => prev + processedText[currentCharIndex]);
                    setCurrentCharIndex((prev) => prev + 1);
                }, variableSpeed ? getRandomSpeed() : typingSpeed);
            } else if (textArray.length >= 1) {
                if (!loop && currentTextIndex === textArray.length - 1) return;
                timeout = setTimeout(() => {
                    setIsDeleting(true);
                }, pauseDuration);
            }
        };

        if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
            timeout = setTimeout(executeTypingAnimation, initialDelay);
        } else {
            executeTypingAnimation();
        }

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentCharIndex, displayedText, isDeleting, typingSpeed, deletingSpeed,
        pauseDuration, textArray, currentTextIndex, loop, initialDelay, isVisible,
        reverseMode, variableSpeed, onSentenceComplete, reduceMotion,
    ]);

    const shouldHideCursor =
        hideCursorWhileTyping && (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

    /* Reduced motion: the first string, complete, still. */
    const shown = reduceMotion ? textArray[0] : displayedText;

    return createElement(
        Component,
        { ref: containerRef, className: `text-type ${className}`, ...props },
        <span className="text-type__content" style={{ color: getCurrentTextColor() || 'inherit' }}>
            {shown}
        </span>,
        showCursor && !reduceMotion && (
            <span
                ref={cursorRef}
                className={`text-type__cursor ${cursorClassName} ${shouldHideCursor ? 'text-type__cursor--hidden' : ''}`}
                aria-hidden="true"
            >
                {cursorCharacter}
            </span>
        ),
    );
};

export default TextType;
