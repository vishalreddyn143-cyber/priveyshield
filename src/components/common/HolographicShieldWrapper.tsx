import React, { Suspense, lazy, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { VisualEffectsMode } from '../../types/pii';

const LazyShield3D = lazy(() => import('./HolographicShield3D'));

interface HolographicShieldWrapperProps {
  visualEffects: VisualEffectsMode;
  webglSupported: boolean;
  variant?: 'hero' | 'proof';
  statusState?: 'neutral' | 'passed' | 'warning';
  className?: string;
}

/**
 * Enhanced Holographic Shield Wrapper featuring:
 * - Animated rotating cyber aura rings
 * - Holographic HUD status indicators
 * - Lazy-loaded Three.js Quantum Defense Shield with graceful 2D fallback
 */
export const HolographicShieldWrapper: React.FC<HolographicShieldWrapperProps> = ({
  visualEffects,
  webglSupported,
  variant = 'hero',
  statusState = 'neutral',
  className = 'h-72 w-72 sm:h-80 sm:w-80',
}) => {
  const [contextLost, setContextLost] = useState(false);

  const canRender3D = visualEffects !== 'disabled' && webglSupported && !contextLost;

  const accentColor =
    statusState === 'passed'
      ? '#10b981'
      : statusState === 'warning'
        ? '#f59e0b'
        : '#06b6d4';

  const FallbackIcon =
    statusState === 'passed'
      ? ShieldCheck
      : statusState === 'warning'
        ? ShieldAlert
        : Shield;

  const fallbackGlow =
    statusState === 'passed'
      ? 'from-teal-500/25 via-emerald-500/15 to-cyan-500/20 border-teal-400/50 text-teal-300'
      : statusState === 'warning'
        ? 'from-amber-500/25 via-orange-500/15 to-rose-500/20 border-amber-400/50 text-amber-300'
        : 'from-purple-500/30 via-blue-500/25 to-cyan-500/30 border-cyan-400/50 text-cyan-300';

  const Fallback2D = (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="absolute inset-2 rounded-full border border-dashed border-cyan-400/40 animate-orbit"
        style={{ animationDuration: '20s' }}
      />
      <div
        className="absolute inset-6 rounded-full border border-dotted border-purple-400/30 animate-orbit-slow"
      />
      <div
        className={`flex h-32 w-32 items-center justify-center rounded-3xl border bg-gradient-to-br shadow-2xl shadow-cyan-500/20 ${fallbackGlow} ${
          visualEffects === 'full' ? 'animate-shield-float' : ''
        }`}
      >
        <FallbackIcon className="h-16 w-16" strokeWidth={1.8} />
      </div>
    </div>
  );

  return (
    <div className={`relative ${className} group`} data-testid="shield-visual">
      {/* Outer ambient glow circle */}
      <div
        className="pointer-events-none absolute inset-4 rounded-full blur-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background:
            statusState === 'passed'
              ? 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(6,182,212,0.15) 50%, transparent 70%)'
              : statusState === 'warning'
                ? 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(244,63,94,0.15) 50%, transparent 70%)'
                : 'radial-gradient(circle, rgba(6,182,212,0.38) 0%, rgba(168,85,247,0.22) 50%, transparent 70%)',
        }}
      />

      {/* Decorative Rotating Orbital HUD Rings */}
      <div
        className="pointer-events-none absolute -inset-2 rounded-full border border-cyan-400/20 border-dashed animate-orbit"
        style={{ animationDuration: '28s' }}
      />
      <div
        className="pointer-events-none absolute inset-3 rounded-full border border-purple-500/20 border-dotted animate-orbit-slow"
      />

      {/* 3D Canvas / 2D Fallback */}
      {canRender3D ? (
        <Suspense fallback={Fallback2D}>
          <LazyShield3D
            variant={variant}
            accentColor={accentColor}
            reducedMotion={visualEffects === 'reduced'}
            onContextLost={() => setContextLost(true)}
          />
        </Suspense>
      ) : (
        Fallback2D
      )}

      {/* Floating HUD Badges for Hero variant */}
      {variant === 'hero' && (
        <>
          <div className="pointer-events-none absolute -bottom-1 -left-2 rounded-full border border-cyan-400/50 bg-[#050816]/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-neon-cyan shadow-lg backdrop-blur-md">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            LOCAL ENGINE
          </div>
          <div className="pointer-events-none absolute -top-1 -right-2 rounded-full border border-purple-400/50 bg-[#050816]/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-neon-purple shadow-lg backdrop-blur-md">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            ZERO TRANSMIT
          </div>
        </>
      )}
    </div>
  );
};
