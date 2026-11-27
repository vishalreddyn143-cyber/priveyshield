import React, { Suspense, lazy, useState } from 'react';
import { VisualEffectsMode } from '../../types/pii';

const LazyAmbientBackground3D = lazy(() => import('./AmbientBackground3D'));

interface AmbientBackgroundWrapperProps {
  visualEffects: VisualEffectsMode;
  webglSupported: boolean;
  isScanning: boolean;
}

const PARTICLE_CONFIG = [
  { x: '8%',   dur: '4.5s', delay: '0s',   color: '#06b6d4' },
  { x: '15%',  dur: '5.2s', delay: '0.4s', color: '#a855f7' },
  { x: '24%',  dur: '3.8s', delay: '1.1s', color: '#ec4899' },
  { x: '36%',  dur: '4.9s', delay: '0.7s', color: '#f59e0b' },
  { x: '48%',  dur: '5.5s', delay: '1.5s', color: '#10b981' },
  { x: '60%',  dur: '4.1s', delay: '0.3s', color: '#f43f5e' },
  { x: '72%',  dur: '5.8s', delay: '2.0s', color: '#3b82f6' },
  { x: '82%',  dur: '4.3s', delay: '0.9s', color: '#fb923c' },
  { x: '90%',  dur: '5.0s', delay: '1.8s', color: '#22d3ee' },
  { x: '55%',  dur: '6.0s', delay: '2.5s', color: '#8b5cf6' },
  { x: '30%',  dur: '4.7s', delay: '1.3s', color: '#14b8a6' },
  { x: '68%',  dur: '5.3s', delay: '0.6s', color: '#d946ef' },
];

/**
 * Renders the lazy-loaded 3D ambient background canvas when WebGL & 3D effects are enabled,
 * and falls back to a vivid multi-color CSS aurora/grid/particle backdrop otherwise.
 */
export const AmbientBackgroundWrapper: React.FC<AmbientBackgroundWrapperProps> = ({
  visualEffects,
  webglSupported,
  isScanning,
}) => {
  const [contextLost, setContextLost] = useState(false);

  const shouldRender3D = visualEffects !== 'disabled' && webglSupported && !contextLost;

  const isFull = visualEffects === 'full';

  const CssBackdrop = (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Purple aurora blob – top left */}
      <div
        className={`absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full blur-3xl ${
          isFull ? 'animate-pulse' : ''
        }`}
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.25), rgba(139,92,246,0.08), transparent 70%)' }}
      />
      {/* Cyan aurora blob – top right */}
      <div
        className={`absolute -right-24 top-[10%] h-[32rem] w-[32rem] rounded-full blur-3xl ${
          isFull ? 'animate-pulse' : ''
        }`}
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.22), rgba(34,211,238,0.08), transparent 70%)' }}
      />
      {/* Pink aurora blob – center */}
      <div
        className={`absolute left-1/3 top-[45%] h-[26rem] w-[26rem] rounded-full blur-3xl ${
          isFull ? 'animate-pulse' : ''
        }`}
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.18), rgba(244,63,94,0.06), transparent 70%)', animationDelay: '1.5s' }}
      />
      {/* Amber aurora blob – bottom right */}
      <div
        className={`absolute -bottom-20 right-1/4 h-[24rem] w-[24rem] rounded-full blur-3xl ${
          isFull ? 'animate-pulse' : ''
        }`}
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.16), rgba(251,146,60,0.06), transparent 70%)', animationDelay: '2.5s' }}
      />
      {/* Emerald aurora blob – bottom left */}
      <div
        className={`absolute -bottom-16 -left-10 h-[22rem] w-[22rem] rounded-full blur-3xl ${
          isFull ? 'animate-pulse' : ''
        }`}
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)', animationDelay: '3s' }}
      />
      {/* Grid overlay */}
      <div className="ps-grid-bg absolute inset-0 opacity-[0.07]" />
      {/* Spinning conic aura */}
      {isFull && (
        <div className="ps-aura animate-spin-aura absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full opacity-50" />
      )}
      {/* Colorful rising particles */}
      {isFull &&
        PARTICLE_CONFIG.map((p, i) => (
          <div
            key={i}
            className="ps-css-particle"
            style={{
              left: p.x,
              bottom: '0',
              '--dur': p.dur,
              '--delay': p.delay,
              '--color': p.color,
              backgroundColor: p.color,
              boxShadow: `0 0 6px 2px ${p.color}`,
            } as React.CSSProperties}
          />
        ))}
    </div>
  );

  if (!shouldRender3D) {
    return CssBackdrop;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-testid="ambient-3d-background"
      aria-hidden="true"
    >
      <Suspense fallback={CssBackdrop}>
        <LazyAmbientBackground3D
          reducedMotion={visualEffects === 'reduced'}
          isScanning={isScanning}
          onContextLost={() => setContextLost(true)}
        />
      </Suspense>
    </div>
  );
};
