'use client';

import { WifiHigh, BatteryFull } from '@phosphor-icons/react';

export function Iphone({
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
            className={`relative rounded-[38px] border-[3px] border-[#0a0a0c] bg-[#0a0a0c] p-[6px] shadow-[6px_6px_0_#0a0a0c] overflow-hidden flex flex-col select-none ${className}`}
            style={{ width, height, aspectRatio: '9 / 19' }}
            {...props}
        >
            {/* Screen inner wrapper */}
            <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-white flex flex-col border border-[#0a0a0c]/20">
                {/* iOS Status Bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 pt-2.5 pb-1 text-[#0a0a0c] bg-white/70 backdrop-blur-md">
                    <span className="text-[11px] font-bold tracking-tight font-sans">9:41</span>

                    {/* Dynamic Island */}
                    <div className="w-[84px] h-[22px] bg-[#0a0a0c] rounded-full flex items-center justify-end px-2 gap-1.5 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b] border border-[#334155]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0369a1]" />
                    </div>

                    <div className="flex items-center gap-1.5 text-[#0a0a0c]">
                        <span className="text-[9px] font-extrabold tracking-tighter">5G</span>
                        <WifiHigh size={12} weight="bold" />
                        <BatteryFull size={14} weight="fill" />
                    </div>
                </div>

                {/* Screen Content */}
                <div className="relative w-full h-full pt-8 pb-4 overflow-hidden bg-[#fafafa] flex items-center justify-center">
                    {displaySrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={displaySrc}
                            alt="iOS screen preview"
                            className="w-full h-full object-cover object-top transition-opacity duration-300 block"
                            loading="lazy"
                        />
                    ) : (
                        children
                    )}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-[#0a0a0c] rounded-full z-20 opacity-80" />
            </div>
        </div>
    );
}

export default Iphone;
