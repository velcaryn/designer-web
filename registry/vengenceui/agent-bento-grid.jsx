'use client';

/* ──────────────────────────────────────────────────────
   Vendored from the vengenceui registry (agent-bento-grid),
   ported from TSX to plain JSX for this project (no TypeScript
   toolchain here).

   RE-LABELLED TO THIS SITE'S OWN CLAIMS. The source is a demo
   for a generic multi-agent LLM ops product: token spend, cost
   per run in dollars, a "Planner / Researcher / Coder" cast,
   retrieval over a codebase and Slack. None of that is what
   this site sells. Every panel now names what Cloud.js already
   promises: lead routing from the site, ads and WhatsApp into
   one pipeline; leads per week and time to first reply; an
   audit trail of what acted and when; retrieval scoped to a
   client's own catalogue and documents rather than a pooled
   index; and the systems the automation is actually wired into
   (WhatsApp, GST invoicing, the customer record).

   The animation and layout are unchanged from the source. Only
   copy, labels, log content and the trend-colour rule (see
   Card2) differ.

   Uses Tailwind utility classes, scoped via the `@source` line
   in app/globals.css alongside registry/magicui/. See that
   file's header comment for why Tailwind is scoped to registry/
   only rather than used across the app.
────────────────────────────────────────────────────── */
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    ChatCircle,
    Brain,
    Database,
    TerminalWindow,
    Code,
    FileText,
    SlackLogo,
    NotionLogo,
    Check,
    CircleNotch,
    Clock,
    Minus,
    Globe,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function FeatCard({
    title, description, children, className = '',
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                'group relative flex flex-col gap-2 overflow-hidden rounded-[20px] p-4',
                'bg-white dark:bg-neutral-900',
                'shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]',
                'dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_0_0_1px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.2)]',
                className,
            )}
        >
            <div className="z-10 flex flex-col gap-1.5">
                <h3 className="font-semibold text-foreground text-sm tracking-tight">{title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-[90%]">{description}</p>
            </div>
            <div className="relative mt-2 flex-1 w-full rounded-[14px] overflow-hidden border border-border/50 bg-background/50 dark:bg-neutral-950/50">
                {children}
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Card1 - Agent Pipeline
   ───────────────────────────────────────────── */
const VW = 320;
const VH = 240;

/* The graph the source ships is REQUEST -> router -> AGENT, with AGENT
   branching to MEMORY and TOOLS. That shape is exactly a lead arriving,
   being classified, then being written to the customer record and acted
   on, so the nodes keep their positions and only their labels change. */
const NODES = [
    {
        id: 'A', x: 50, y: 120, icon: ChatCircle, label: 'ENQUIRY', type: 'box',
    },
    { id: 'Router', x: 125, y: 120, type: 'circle' },
    {
        id: 'C', x: 200, y: 120, icon: Brain, label: 'SORTED', type: 'box',
    },
    {
        id: 'B', x: 280, y: 50, icon: Database, label: 'CRM', type: 'box',
    },
    {
        id: 'D', x: 280, y: 190, icon: TerminalWindow, label: 'ACTION', type: 'box',
    },
];

const PATHS = [
    {
        id: 'a-to-router', d: 'M 78 120 L 113 120', activeSteps: ['request'], colorClass: 'text-cyan-500 dark:text-cyan-400',
    },
    {
        id: 'router-to-agent', d: 'M 137 120 L 172 120', activeSteps: ['agent'], colorClass: 'text-violet-500 dark:text-violet-400',
    },
    {
        id: 'agent-to-memory', d: 'M 200 92 L 200 50 L 252 50', activeSteps: ['memory'], colorClass: 'text-fuchsia-500 dark:text-fuchsia-400',
    },
    {
        id: 'agent-to-tools', d: 'M 200 148 L 200 190 L 252 190', activeSteps: ['tools'], colorClass: 'text-emerald-500 dark:text-emerald-400',
    },
    {
        id: 'response-flow-1', d: 'M 172 120 L 137 120', activeSteps: ['response'], colorClass: 'text-cyan-500 dark:text-cyan-400',
    },
    {
        id: 'response-flow-2', d: 'M 113 120 L 78 120', activeSteps: ['response'], colorClass: 'text-cyan-500 dark:text-cyan-400',
    },
];

const NODE_COLORS = {
    A: {
        buttonBg: 'bg-cyan-500', buttonBorder: 'border-cyan-600',
    },
    Router: {
        buttonBg: 'bg-amber-500', buttonBorder: 'border-amber-600',
    },
    C: {
        buttonBg: 'bg-violet-500', buttonBorder: 'border-violet-600',
    },
    B: {
        buttonBg: 'bg-fuchsia-500', buttonBorder: 'border-fuchsia-600',
    },
    D: {
        buttonBg: 'bg-emerald-500', buttonBorder: 'border-emerald-600',
    },
};

export function Card1() {
    const [step, setStep] = useState('request');

    useEffect(() => {
        const steps = ['request', 'router', 'agent', 'memory', 'tools', 'response'];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % steps.length;
            setStep(steps[idx]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const isNodeActive = (nodeId) => {
        switch (step) {
            case 'request': return nodeId === 'A';
            case 'router': return nodeId === 'Router';
            case 'agent': return nodeId === 'C';
            case 'memory': return nodeId === 'C' || nodeId === 'B';
            case 'tools': return nodeId === 'C' || nodeId === 'D';
            case 'response': return nodeId === 'C' || nodeId === 'Router' || nodeId === 'A';
            default: return false;
        }
    };

    return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-50 dark:bg-neutral-950/80 rounded-xl flex items-center justify-center p-2">
            <svg className="absolute inset-0 w-full h-full" aria-hidden>
                <defs>
                    <pattern id="clean-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle cx="1.5" cy="1.5" r="0.75" fill="currentColor" className="text-zinc-200 dark:text-zinc-800/60" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#clean-grid)" />
            </svg>

            <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${VW} ${VH}`}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
            >
                <path d="M 78 120 L 113 120" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />
                <path d="M 137 120 L 172 120" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />
                <path d="M 200 92 L 200 50 L 252 50" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />
                <path d="M 200 148 L 200 190 L 252 190" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />

                {PATHS.map((p) => {
                    const isActive = p.activeSteps.includes(step);
                    if (!isActive) return null;
                    return (
                        <g key={p.id}>
                            <motion.path
                                d={p.d}
                                fill="none"
                                stroke="currentColor"
                                className={p.colorClass}
                                strokeWidth="3.5"
                                strokeOpacity="0.2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, ease: 'easeInOut' }}
                            />
                            <motion.path
                                d={p.d}
                                fill="none"
                                stroke="currentColor"
                                className={p.colorClass}
                                strokeWidth="1.5"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, ease: 'easeInOut' }}
                            />
                        </g>
                    );
                })}

                {NODES.map((node) => {
                    const isBox = node.type === 'box';
                    const w = isBox ? 56 : 24;
                    const h = isBox ? 56 : 24;
                    const isActive = isNodeActive(node.id);
                    const colorStyles = NODE_COLORS[node.id];

                    return (
                        <foreignObject
                            key={node.id}
                            x={node.x - w / 2}
                            y={node.y - h / 2}
                            width={w}
                            height={h}
                            className="overflow-visible"
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                {isBox && node.icon ? (
                                    <div
                                        className={`w-full h-full rounded-[14px] border flex flex-col items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),inset_4px_4px_0_0_rgba(255,255,255,0.06),inset_6px_6px_0_0_rgba(255,255,255,0.04),inset_8px_8px_0_0_rgba(255,255,255,0.02),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04),0_6px_8px_0_rgba(0,0,0,0.02)] text-white ${colorStyles.buttonBg} ${colorStyles.buttonBorder}`}
                                    >
                                        <div className="mb-0.5 flex items-center justify-center">
                                            <node.icon className="w-5 h-5" weight="fill" />
                                        </div>
                                        <span className="text-[8.5px] font-mono font-bold tracking-wider select-none">
                                            {node.label}
                                        </span>
                                    </div>
                                ) : (
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-all duration-300 ${isActive
                                            ? 'bg-amber-500/20 border-amber-500/70'
                                            : 'bg-background/80 border-zinc-300 dark:border-zinc-800'
                                        }`}
                                    >
                                        <motion.div
                                            className={`w-2.5 h-2.5 rounded-full border border-dashed ${isActive ? 'border-amber-500' : 'border-zinc-400 dark:border-zinc-600'}`}
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </foreignObject>
                    );
                })}
            </svg>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Card2 - Live Token / Cost Monitor
───────────────────────────────────────────── */
export function Card2() {
    const bars = [45, 75, 35, 85, 60, 95, 50];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const [activeIdx, setActiveIdx] = useState(0);
    const [hoveredIdx, setHoveredIdx] = useState(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIdx((prev) => (prev === 0 ? 1 : 0));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col gap-3.5 justify-between">
            <div className="flex gap-4 pt-[0.625rem] pr-[0.625rem] pb-0.5 pl-0.5">
                {/* Leads and reply time, not tokens and dollars. The source
                    component tracked LLM vendor metrics, which is the wrong
                    thing to put in front of a business owner and the wrong
                    currency for a site selling into India.

                    `good` rather than reading the +/- sign: a FALLING first
                    reply time is an improvement, so sign alone would paint
                    the best number on the panel in the failure colour. */}
                {[
                    { label: 'Leads / week', value: '128', trend: '+8%', good: true },
                    { label: 'First reply', value: '4 min', trend: '-3%', good: true },
                ].map((s, i) => {
                    const isActive = i === activeIdx || hoveredIdx === i;
                    return (
                        <div key={s.label} className="flex-1 h-[76px] relative select-none">
                            <div
                                className="absolute inset-0 rounded-xl border border-border/40 dark:border-border/20 bg-muted/5 text-border/30 dark:text-border/20"
                                style={{
                                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                                }}
                            />
                            <motion.div
                                className="absolute inset-0 w-full h-full rounded-xl bg-muted/20 dark:bg-neutral-950/80 border border-border/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.01)] p-3 hover:bg-muted/30 transition-colors duration-300 backdrop-blur-[2px] flex items-center justify-between gap-3 cursor-pointer"
                                animate={{
                                    x: isActive ? '0.5rem' : '0rem',
                                    y: isActive ? '-0.5rem' : '0rem',
                                }}
                                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] text-muted-foreground/80 font-mono uppercase tracking-widest leading-none">{s.label}</span>
                                    <span className="text-base font-bold font-mono text-foreground leading-none mt-1.5 tracking-tight">{s.value}</span>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <span className={`text-[8px] font-mono font-bold ${s.good ? 'text-emerald-500' : 'text-rose-400'}`}>
                                            {s.trend}
                                        </span>
                                        <span className="text-[8px] text-muted-foreground/50 font-mono">prev</span>
                                    </div>
                                </div>
                                <div className="w-12 h-6 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 48 24">
                                        <motion.path
                                            d={i === 0
                                                ? 'M 0 18 L 16 11 L 32 14 L 48 4'
                                                : 'M 0 4 L 16 12 L 32 8 L 48 18'}
                                            fill="none"
                                            stroke="currentColor"
                                            className="text-muted-foreground/30 dark:text-muted-foreground/20"
                                            strokeWidth="1"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: 'easeOut' }}
                                        />
                                        {(i === 0
                                            ? [{ x: 0, y: 18 }, { x: 16, y: 11 }, { x: 32, y: 14 }, { x: 48, y: 4 }]
                                            : [{ x: 0, y: 4 }, { x: 16, y: 12 }, { x: 32, y: 8 }, { x: 48, y: 18 }]
                                        ).map((pt, idx) => (
                                            <motion.circle
                                                key={idx}
                                                cx={pt.x}
                                                cy={pt.y}
                                                r="1.5"
                                                className="fill-background stroke-muted-foreground/40 dark:stroke-muted-foreground/30"
                                                strokeWidth="1"
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.5 + idx * 0.08, duration: 0.25 }}
                                            />
                                        ))}
                                    </svg>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            <div className="flex-1 flex items-end gap-2.5 px-0.5 min-h-[90px]">
                {bars.map((h, i) => (
                    <div
                        key={i}
                        className="flex-1 h-full rounded-xl dark:bg-neutral-950/80 border border-border/80 dark:border-border/30 relative overflow-hidden bg-muted/5 text-border/40 dark:text-border/20"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                        }}
                    >
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-primary border-t border-x border-primary/80 shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.6),inset_0_8px_12px_0_rgba(255,255,255,0.03),inset_0.5px_0_0_0_rgba(255,255,255,0.2),inset_0_2px_6px_0_rgba(255,255,255,0.3),inset_0_-0.5px_0_0_rgba(0,0,0,0.2),inset_-0.5px_0_0_0_rgba(0,0,0,0.1),inset_0_-2px_6px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04),inset_0_-4px_8px_0_rgba(0,0,0,0.05)] rounded-t-[10px]"
                            initial={{ height: '0%' }}
                            animate={{
                                height: [
                                    `${h}%`,
                                    `${Math.min(95, h + 15)}%`,
                                    `${Math.max(10, h - 20)}%`,
                                    `${Math.min(90, h + 8)}%`,
                                    `${h}%`,
                                ],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 3 + (i % 3) * 0.8,
                                ease: 'easeInOut',
                                delay: i * 0.1,
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="flex gap-2.5 px-0.5">
                {days.map((d) => (
                    <p key={d} className="flex-1 text-center text-[8px] text-muted-foreground font-mono font-medium">{d}</p>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Card3 - Stacked Activity Feed
   ───────────────────────────────────────────── */
const STATUS_ICONS = {
    done: {
        icon: Check, color: 'text-lime-500', bg: 'bg-lime-500/15', gradient: 'bg-gradient-to-b from-lime-400 to-lime-600', border: 'border-lime-600',
    },
    running: {
        icon: CircleNotch, color: 'text-blue-400', bg: 'bg-blue-400/15', gradient: 'bg-gradient-to-b from-blue-400 to-blue-600', border: 'border-blue-600',
    },
    waiting: {
        icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/15', gradient: 'bg-gradient-to-b from-amber-400 to-amber-600', border: 'border-amber-600',
    },
    idle: {
        icon: Minus, color: 'text-muted-foreground/60', bg: 'bg-muted/40', gradient: 'bg-gradient-to-b from-zinc-400 to-zinc-600', border: 'border-zinc-600',
    },
};

export function Card3() {
    /* Logged against a real VelBiz workflow (a new enquiry through the site's
       own estimator, see components/Estimator.js) rather than the source's
       generic "Planner / Researcher / Coder" cast, so this reads as our
       automation and not a stock demo. */
    const logs = [
        { agent: 'Intake agent', action: 'Parsed enquiry, matched to scope template', status: 'done', t: '0.4s' },
        { agent: 'CRM sync', action: 'Wrote lead to Velcaryn Cloud, tagged by sector', status: 'done', t: '1.1s' },
        { agent: 'Scheduler', action: 'Checking calendar for a same-day slot…', status: 'running', t: '2.6s' },
        { agent: 'Reply drafter', action: 'Awaiting output from Scheduler', status: 'waiting', t: '—' },
        { agent: 'Follow-up', action: 'Idle — queued for day 3', status: 'idle', t: '—' },
    ];

    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIdx((prev) => (prev + 1) % logs.length);
        }, 2400);
        return () => clearInterval(interval);
    }, [logs.length]);

    const getSlot = (i) => {
        const N = logs.length;
        let rel = i - activeIdx;
        if (rel > Math.floor(N / 2)) rel -= N;
        if (rel < -Math.floor(N / 2)) rel += N;
        return rel;
    };

    const Y = {
        '-2': -68, '-1': -38, 0: 0, 1: 38, 2: 68,
    };

    return (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
            {logs.map((l, i) => {
                const slot = getSlot(i);
                const si = STATUS_ICONS[l.status];
                const abs = Math.abs(slot);
                const isActive = slot === 0;
                const isVisible = abs <= 2;

                const yOffset = Y[String(slot)] ?? (slot < 0 ? -120 : 120);
                const scale = isActive ? 1 : abs === 1 ? 0.93 : 0.87;
                const opacity = isActive ? 1 : abs === 1 ? 0.65 : 0.38;
                const zIndex = isActive ? 30 : abs === 1 ? 20 : 10;

                return (
                    <motion.div
                        key={l.agent}
                        className="absolute left-0 right-0 mx-auto px-1.5"
                        style={{ zIndex }}
                        animate={{
                            y: isVisible ? yOffset : (slot < 0 ? -150 : 150),
                            scale,
                            opacity: isVisible ? opacity : 0,
                        }}
                        transition={{
                            y: { type: 'spring', stiffness: 500, damping: 35 },
                            scale: { type: 'spring', stiffness: 500, damping: 35 },
                            opacity: { duration: 0.25, ease: 'easeOut' },
                        }}
                    >
                        <div className={`w-full rounded-2xl border flex items-center gap-2.5 ${isActive
                            ? 'px-3 py-2.5 bg-background border-border'
                            : 'px-2.5 py-1.5 bg-muted/30 border-border/50'
                        }`}
                        >
                            <div className={`shrink-0 rounded-[8px] flex items-center justify-center font-bold text-white transition-all duration-300 ${si.gradient} border ${si.border} shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.6),inset_0.5px_0_0_0_rgba(255,255,255,0.2),inset_0_2px_6px_0_rgba(255,255,255,0.3),inset_0_-0.5px_0_0_rgba(0,0,0,0.3),inset_-0.5px_0_0_0_rgba(0,0,0,0.1),inset_0_-2px_6px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04)] ${isActive ? 'w-8 h-8' : 'w-5 h-5'}`}
                            >
                                <si.icon weight="bold" className={`${isActive ? 'w-4 h-4' : 'w-2.5 h-2.5'} ${l.status === 'running' ? 'animate-spin' : ''}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={`font-mono font-semibold text-foreground leading-none ${isActive ? 'text-[10px]' : 'text-[9px]'}`}>{l.agent}</span>
                                    <span className={`font-mono uppercase tracking-wide rounded px-1 py-0.5 ${si.bg} ${si.color} ${isActive ? 'text-[7px]' : 'text-[6px]'}`}>{l.status}</span>
                                </div>
                                {isActive && (
                                    <p className="text-[9px] text-muted-foreground truncate mt-0.5 leading-tight">{l.action}</p>
                                )}
                            </div>

                            {isActive && (
                                <span className="text-[9px] font-mono text-muted-foreground shrink-0">{l.t}</span>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                {logs.map((l, i) => (
                    <motion.div
                        key={l.agent}
                        className="rounded-full bg-foreground/25"
                        animate={{
                            width: i === activeIdx ? 14 : 4,
                            opacity: i === activeIdx ? 0.7 : 0.2,
                        }}
                        style={{ height: 3 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Card4 - Knowledge base namespaces
   ───────────────────────────────────────────── */
const NS_ICONS = {
    catalogue: Code, docs: FileText, whatsapp: SlackLogo, forms: NotionLogo,
};

const NS_COLORS = {
    catalogue: {
        bar: 'from-violet-500 to-violet-400', dot: 'bg-violet-500', badge: 'bg-violet-500/15 text-violet-400', buttonBg: 'bg-violet-500', buttonBorder: 'border-violet-600',
    },
    docs: {
        bar: 'from-sky-500    to-sky-400', dot: 'bg-sky-500', badge: 'bg-sky-500/15 text-sky-400', buttonBg: 'bg-sky-500', buttonBorder: 'border-sky-600',
    },
    whatsapp: {
        bar: 'from-emerald-500 to-emerald-400', dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400', buttonBg: 'bg-emerald-500', buttonBorder: 'border-emerald-600',
    },
    forms: {
        bar: 'from-amber-500  to-amber-400', dot: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-400', buttonBg: 'bg-amber-500', buttonBorder: 'border-amber-600',
    },
};

/* Retrieval sources rewritten to the kind of client data this actually
   indexes for a hospital or wholesale catalogue build, not a generic
   codebase/Slack/Notion demo. */
const RETRIEVAL_QUERIES = [
    { ns: 'catalogue', q: 'HSN codes, dialysis consumables', t: '0.2s' },
    { ns: 'docs', q: 'ABDM FHIR R4 field mapping', t: '1.1s' },
    { ns: 'catalogue', q: 'wholesale tier pricing, urology', t: '2.4s' },
    { ns: 'whatsapp', q: 'order confirmation template', t: '4.0s' },
    { ns: 'forms', q: 'DPDP consent capture, intake form', t: '5.8s' },
    { ns: 'docs', q: 'GST invoice schema', t: '7.2s' },
];

export function Card4() {
    const namespaces = [
        { name: 'catalogue', hits: 342, fill: 88 },
        { name: 'docs', hits: 218, fill: 56 },
        { name: 'whatsapp', hits: 97, fill: 25 },
        { name: 'forms', hits: 54, fill: 14 },
    ];

    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick((prev) => (prev + 1) % RETRIEVAL_QUERIES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const activeNs = RETRIEVAL_QUERIES[tick].ns;
    const recentQueries = [0, 1, 2, 3].map(
        (offset) => RETRIEVAL_QUERIES[(tick - offset + RETRIEVAL_QUERIES.length) % RETRIEVAL_QUERIES.length],
    );

    return (
        <div className="w-full h-full flex gap-5 py-2 px-3">
            <div className="flex-1 flex flex-col gap-0 min-w-0 pr-2">
                <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Sources</p>

                <div className="flex flex-col gap-3 flex-1">
                    {namespaces.map((ns, i) => {
                        const c = NS_COLORS[ns.name];
                        const isActive = ns.name === activeNs;
                        const Icon = NS_ICONS[ns.name] || Database;

                        return (
                            <div key={ns.name} className="flex items-center gap-3 group relative">
                                <div
                                    className={`relative flex shrink-0 items-center justify-center w-[36px] h-[36px] rounded-[12px] border transition-all duration-500 ${isActive ? `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),inset_4px_4px_0_0_rgba(255,255,255,0.06),inset_6px_6px_0_0_rgba(255,255,255,0.04),inset_8px_8px_0_0_rgba(255,255,255,0.02),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04),0_6px_8px_0_rgba(0,0,0,0.02)] text-white ${c.buttonBg} ${c.buttonBorder} scale-105` : 'dark:bg-neutral-950/80 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_2px_-1px_rgba(0,0,0,0.06),0_2px_4px_0px_rgba(0,0,0,0.04)] bg-white border-transparent text-[#A1A1A1]'}`}
                                >
                                    <Icon size={16} weight={isActive ? 'fill' : 'regular'} className="relative z-10" />
                                </div>

                                <span className={`text-[10px] font-mono w-16 shrink-0 transition-colors duration-400 ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground/70'}`}>
                                    {ns.name}
                                </span>

                                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden relative backdrop-blur-sm shadow-inner">
                                    <motion.div
                                        className={`absolute left-0 top-0 bottom-0 rounded-full overflow-hidden bg-gradient-to-r ${c.bar}`}
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${ns.fill}%`, opacity: isActive ? 1 : 0.25 }}
                                        transition={{
                                            width: {
                                                duration: 1.2, delay: i * 0.1, type: 'spring', bounce: 0.2,
                                            },
                                            opacity: { duration: 0.4 },
                                        }}
                                    >
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '100%' }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                            />
                                        )}
                                    </motion.div>
                                </div>

                                <div className={`flex items-center gap-1.5 w-10 justify-end transition-all duration-500 ${isActive ? 'opacity-100 scale-105' : 'opacity-60 scale-100'}`}>
                                    <span className={`text-[9px] font-mono font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {ns.hits}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            className={`w-1 h-1 rounded-full ${c.dot}`}
                                            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.5, 1] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 pt-3 mt-auto">
                    <div className="relative flex items-center justify-center w-2 h-2">
                        <motion.div
                            className="absolute inset-0 rounded-full bg-emerald-400/40"
                            animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[8px] font-mono text-muted-foreground font-medium tracking-wide">Live retrieval active</span>
                </div>
            </div>

            <div className="w-px bg-border/30 self-stretch shrink-0" />

            <div className="w-[172px] shrink-0 flex flex-col gap-0">
                <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground mb-2.5">Retrieval log</p>

                <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                    {recentQueries.map((q, qi) => {
                        const c = NS_COLORS[q.ns];
                        return (
                            <motion.div
                                key={`${q.ns}-${q.q}`}
                                className="rounded-xl border border-border/40 bg-muted/20 dark:bg-neutral-950/80 px-2.5 py-2"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{
                                    opacity: qi === 0 ? 1 : qi === 1 ? 0.8 : qi === 2 ? 0.5 : 0.25,
                                    y: 0,
                                }}
                                transition={{
                                    type: 'spring', stiffness: 500, damping: 35, delay: qi * 0.05,
                                }}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <span className={`text-[6.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-md ${c.badge}`}>
                                        {q.ns}
                                    </span>
                                    <span className="text-[7px] font-mono text-muted-foreground/50 ml-auto tabular-nums">{q.t}</span>
                                </div>
                                <p className="text-[8px] text-foreground/75 leading-tight font-mono truncate">{q.q}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Card5 - Tool call inspector
───────────────────────────────────────────── */
export function Card5() {
    const tools = [
        {
            name: 'whatsapp_send', calls: 14, icon: Globe, latency: '280ms', color: 'bg-gradient-to-b from-sky-400 to-sky-600', borderColor: 'border-sky-600',
        },
        {
            name: 'gst_invoice', calls: 8, icon: TerminalWindow, latency: '1.2s', color: 'bg-gradient-to-b from-emerald-400 to-emerald-600', borderColor: 'border-emerald-600',
        },
        {
            name: 'catalogue_read', calls: 22, icon: FileText, latency: '12ms', color: 'bg-gradient-to-b from-amber-400 to-amber-600', borderColor: 'border-amber-600',
        },
        {
            name: 'crm_write', calls: 31, icon: Brain, latency: '95ms', color: 'bg-gradient-to-b from-violet-400 to-violet-600', borderColor: 'border-violet-600',
        },
    ];

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 w-full">
                {tools.map((t, i) => (
                    <motion.div
                        key={t.name}
                        className="relative rounded-[16px] border border-border/50 bg-background dark:bg-neutral-950/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between p-2.5 group hover:border-border"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25,
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className={`w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-white ${t.color} border ${t.borderColor} shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.6),inset_0.5px_0_0_0_rgba(255,255,255,0.2),inset_0_2px_6px_0_rgba(255,255,255,0.3),inset_0_-0.5px_0_0_rgba(0,0,0,0.3),inset_-0.5px_0_0_0_rgba(0,0,0,0.1),inset_0_-2px_6px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04)] group-hover:scale-105 transition-transform duration-300`}>
                                <t.icon weight="fill" className="w-3.5 h-3.5 relative z-10" />
                            </div>

                            <div className="flex flex-col items-end gap-0.5 mt-0.5">
                                <span className="text-[12px] font-mono font-bold text-foreground leading-none">{t.calls}</span>
                                <span className="text-[7px] font-mono text-muted-foreground/80 uppercase tracking-widest leading-none">Calls</span>
                            </div>
                        </div>

                        <div className="mt-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-medium text-foreground tracking-tight">{t.name}</span>
                                <span className="text-[8px] font-mono text-muted-foreground tabular-nums">{t.latency}</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden shadow-inner relative">
                                <motion.div
                                    className={`absolute left-0 top-0 bottom-0 rounded-full ${t.color}`}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${(t.calls / 31) * 100}%` }}
                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main grid
   Copy rewritten around VelBiz's own automation work rather than a
   generic AI-agent-ops product, per the "AI and automation" claim
   already made in WhyUsBento.js.
───────────────────────────────────────────── */
const CARDS = [
    {
        title: 'Lead routing',
        description: 'Every enquiry from the site, the ads and WhatsApp takes the same path into one pipeline, with an owner and a due date.',
        visual: <Card1 />,
        colSpan: 'lg:col-span-1',
        height: 'h-[260px]',
    },
    {
        title: 'What it is doing for you',
        description: 'Volume in, and how long someone waits for a first reply. The two numbers that decide whether the automation earned its place.',
        visual: <Card2 />,
        colSpan: 'lg:col-span-1',
        height: 'h-[260px]',
    },
    {
        title: 'A record of what happened',
        description: 'Which system acted, what it did, and when. The audit trail the DPDP Act expects you to be able to produce.',
        visual: <Card3 />,
        colSpan: 'lg:col-span-1',
        height: 'h-[260px]',
    },
    {
        title: 'Answers from your own data',
        description: 'Retrieval scoped to your catalogue, your documents, your WhatsApp templates and your intake forms. Your instance, not a pool shared with other clients.',
        visual: <Card4 />,
        colSpan: 'lg:col-span-2',
        height: 'h-[260px]',
    },
    {
        title: 'What it can reach',
        description: 'The systems the automation is wired into: WhatsApp, GST invoicing, your catalogue and the customer record.',
        visual: <Card5 />,
        colSpan: 'lg:col-span-1',
        height: 'h-[260px]',
    },
];

export function AgentBentoGrid({ className }) {
    return (
        <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-5xl mx-auto', className)}>
            {CARDS.map((card) => (
                <FeatCard
                    key={card.title}
                    title={card.title}
                    description={card.description}
                    className={cn(card.colSpan, card.height)}
                >
                    {card.visual}
                </FeatCard>
            ))}
        </div>
    );
}

export default AgentBentoGrid;
