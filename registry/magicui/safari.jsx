'use client';

import { Lock, ArrowClockwise, CaretLeft, CaretRight, Share } from '@phosphor-icons/react';

export function Safari({
    url = 'velbiz.com',
    src,
    imageSrc,
    children,
    className = '',
    width,
    height,
    ...props
}) {
    const displaySrc = src || imageSrc;

    return (
        <div
            className={`relative w-full rounded-2xl border-[3px] border-[#0a0a0c] bg-white shadow-[6px_6px_0_#0a0a0c] overflow-hidden flex flex-col ${className}`}
            style={{ width, height }}
            {...props}
        >
            {/* Safari Window Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#f3f4f6] border-b-[2px] border-[#0a0a0c] select-none gap-2">
                {/* Traffic lights */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block shadow-sm" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block shadow-sm" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block shadow-sm" />
                </div>

                {/* Back / Forward Controls */}
                <div className="hidden sm:flex items-center gap-1 text-[#0a0a0c]/60 shrink-0">
                    <button type="button" className="p-1 rounded hover:bg-black/5" aria-label="Back">
                        <CaretLeft size={14} weight="bold" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-black/5" aria-label="Forward">
                        <CaretRight size={14} weight="bold" />
                    </button>
                </div>

                {/* URL Pill */}
                <div className="flex items-center justify-center gap-2 flex-1 max-w-[480px] mx-auto px-3 py-1 bg-white border-[1.5px] border-[#0a0a0c] rounded-full text-xs font-mono text-[#0a0a0c] shadow-[1.5px_1.5px_0_#0a0a0c] truncate">
                    <Lock size={12} weight="bold" className="text-[#1052df] shrink-0" />
                    <span className="truncate font-semibold">{url}</span>
                    <ArrowClockwise size={12} weight="bold" className="ml-auto text-[#0a0a0c]/50 shrink-0 cursor-pointer" />
                </div>

                {/* Window Action */}
                <div className="hidden sm:flex items-center gap-2 text-[#0a0a0c]/70 shrink-0">
                    <button type="button" className="p-1 rounded hover:bg-black/5" aria-label="Share">
                        <Share size={14} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative w-full flex-1 bg-white overflow-hidden flex items-center justify-center min-h-[360px] md:min-h-[440px]">
                {displaySrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={displaySrc}
                        alt={`Safari preview of ${url}`}
                        className="w-full h-full object-cover object-top transition-opacity duration-300 block"
                        loading="lazy"
                    />
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

export default Safari;
