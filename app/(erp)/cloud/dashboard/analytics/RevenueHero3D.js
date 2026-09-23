'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';

// Categorical palette slot 1 (dataviz skill) for the hero bars, with a highlight
// slot (slot 2) reserved for hover/click state - never a generated hue.
const BAR_COLOR = '#2a78d6';
const BAR_HOVER_COLOR = '#eb6834';

function money(n) {
    return `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function RevenueBar({ position, height, label, value, isHovered, onHover, onLeave, onClick }) {
    const meshRef = useRef();
    const targetHeight = Math.max(height, 0.05);
    useFrame(() => {
        if (!meshRef.current) return;
        // Smoothly animate toward target height/scale so period changes don't pop.
        meshRef.current.scale.y += (targetHeight - meshRef.current.scale.y) * 0.15;
        meshRef.current.position.y = (meshRef.current.scale.y * 1) / 2;
    });
    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                scale={[1, 0.001, 1]}
                onPointerOver={(e) => { e.stopPropagation(); onHover(); }}
                onPointerOut={onLeave}
                onClick={onClick}
            >
                <boxGeometry args={[0.6, 1, 0.6]} />
                <meshStandardMaterial color={isHovered ? BAR_HOVER_COLOR : BAR_COLOR} />
            </mesh>
            <Text position={[0, -0.35, 0]} fontSize={0.16} color="#6c757d" anchorX="center" anchorY="top" rotation={[-Math.PI / 6, 0, 0]}>
                {label}
            </Text>
            {isHovered && (
                <Html position={[0, targetHeight + 0.5, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: '#2d1753', color: '#fff', padding: '6px 10px', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    }}>
                        {label}<br />{money(value)}
                    </div>
                </Html>
            )}
        </group>
    );
}

function Scene({ series, autoRotate, selectedPeriod, onSelectPeriod }) {
    const [hoverIdx, setHoverIdx] = useState(null);
    const groupRef = useRef();

    const max = useMemo(() => Math.max(...series.map(s => s.revenue), 1), [series]);
    const spacing = 1.0;
    const startX = -((series.length - 1) * spacing) / 2;
    const selectedIdx = useMemo(() => series.findIndex(s => s.period === selectedPeriod), [series, selectedPeriod]);

    // Stop auto-rotating as soon as the user has interacted (hover/select), so
    // it doesn't fight with someone trying to read a specific bar.
    const [userInteracted, setUserInteracted] = useState(false);
    useFrame((state, delta) => {
        if (autoRotate && !userInteracted && groupRef.current) {
            groupRef.current.rotation.y += delta * 0.15;
        }
    });

    const activeIdx = hoverIdx ?? (selectedIdx >= 0 ? selectedIdx : null);

    return (
        <group ref={groupRef}>
            {series.map((s, i) => (
                <RevenueBar
                    key={s.period}
                    position={[startX + i * spacing, 0, 0]}
                    height={(s.revenue / max) * 2.6}
                    label={s.period}
                    value={s.revenue}
                    isHovered={activeIdx === i}
                    onHover={() => { setHoverIdx(i); setUserInteracted(true); }}
                    onLeave={() => setHoverIdx(null)}
                    onClick={() => { setUserInteracted(true); onSelectPeriod(cur => (cur === s.period ? null : s.period)); }}
                />
            ))}
        </group>
    );
}

export default function RevenueHero3D({ series, selectedPeriod = null, onSelectPeriod = () => {} }) {
    const [reducedMotion, setReducedMotion] = useState(() => (
        typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
    ));

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = (e) => setReducedMotion(e.matches);
        mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
        return () => {
            mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
        };
    }, []);

    // Cap to the most recent 24 periods so the scene doesn't get too crowded to read.
    const trimmed = useMemo(() => series.slice(-24), [series]);

    const setSelected = (updater) => {
        const next = typeof updater === 'function' ? updater(selectedPeriod) : updater;
        onSelectPeriod(next);
    };

    return (
        <Canvas camera={{ position: [0, 3.2, 7], fov: 45 }} dpr={[1, 2]}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 8, 5]} intensity={0.9} />
            <Scene series={trimmed} autoRotate={!reducedMotion} selectedPeriod={selectedPeriod} onSelectPeriod={setSelected} />
            <OrbitControls enablePan={false} minDistance={3} maxDistance={14} maxPolarAngle={Math.PI / 2.1} />
        </Canvas>
    );
}
