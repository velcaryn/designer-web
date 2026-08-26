'use client';

import { WifiHigh, BatteryFull, Circle } from '@phosphor-icons/react';

export function Android({
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
            className={`relative rounded-[32px] border-[3px] border-[#0a0a0c] bg-[#1e293b] p-[5px] shadow-[6px_6px_0_#0a0a0c] overflow-hidden flex flex-col select-none ${className}`}
            style={{ width, height, aspectRatio: '9 / 19.5' }}
            {...props}
        >
            {/* Screen inner wrapper */}
            <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-white flex flex-col border border-[#0a0a0c]/20">
                {/* Android Status Bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-2 pb-1 text-[#0a0a0c] bg-white/70 backdrop-blur-md">
                    <span className="text-[11px] font-semibold font-mono tracking-tight">10:00</span>

                    {/* Punch Hole Camera */}
                    <div className="w-3.5 h-3.5 rounded-full bg-[#0a0a0c] flex items-center justify-center shadow-inner">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e1e24]" />
                    </div>

                    <div className="flex items-center gap-1.5 text-[#0a0a0c]">
                        <WifiHigh size={12} weight="bold" />
                        <span className="text-[9px] font-bold">5G</span>
                        <BatteryFull size={13} weight="fill" />
                    </div>
                </div>

                {/* Screen Content */}
                <div className="relative w-full h-full pt-7 pb-4 overflow-hidden bg-[#fafafa] flex items-center justify-center">
                    {displaySrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={displaySrc}
                            alt="Android screen preview"
                            className="w-full h-full object-cover object-top transition-opacity duration-300 block"
                            loading="lazy"
                        />
                    ) : (
                        children
                    )}
                </div>

                {/* Android Gesture Bar */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#0a0a0c] rounded-full z-20 opacity-75" />
            </div>
        </div>
    );
}

export default Android;
