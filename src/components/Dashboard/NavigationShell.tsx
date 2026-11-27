import React from 'react';
import {
  Activity,
  Download,
  FileSearch,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  Lock,
  Shield,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AmbientBackgroundWrapper } from '../common/AmbientBackgroundWrapper';
import { NavPage, usePrivyShield } from '../../context/PrivyShieldContext';
import { VisualEffectsMode } from '../../types/pii';

const NAV_ITEMS: Array<{ id: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workspace', label: 'Sanitize Workspace', icon: FileSearch },
  { id: 'lab', label: 'Detection Lab', icon: FlaskConical },
  { id: 'audit', label: 'Audit & Reports', icon: Activity },
  { id: 'privacy', label: 'Privacy Center', icon: Lock },
];

export const NavigationShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activePage,
    setActivePage,
    visualEffects,
    setVisualEffects,
    webglSupported,
    isOnline,
    isScanning,
    canInstallPWA,
    triggerPWAInstall,
    setOnboardingOpen,
  } = usePrivyShield();

  return (
    <div
      className={`min-h-screen flex flex-col ${
        visualEffects !== 'full' ? 'reduced-motion' : ''
      }`}
    >
      {/* Full-viewport 3D ambient background */}
      <AmbientBackgroundWrapper
        visualEffects={visualEffects}
        webglSupported={webglSupported}
        isScanning={isScanning}
      />

      <header className="sticky top-0 z-30 border-b border-purple-500/25 bg-[#050816]/90 backdrop-blur-2xl relative overflow-hidden" style={{ boxShadow: '0 4px 30px -4px rgba(168,85,247,0.22), 0 2px 16px -2px rgba(6,182,212,0.18)' }}>
        {/* Animated Cyber Aurora Ambient Wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-600/14 via-pink-500/10 to-teal-500/10 opacity-75" />

        {/* 3D Moving Cyber Laser Scanner Beam across the top horizontal bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
          <div className="animate-header-laser h-full w-2/5 bg-gradient-to-r from-transparent via-cyan-400 via-pink-400 to-transparent shadow-[0_0_12px_#22d3ee]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand with 3D Orbital Micro-Rings */}
          <button
            type="button"
            onClick={() => setActivePage('overview')}
            className="group flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-xl p-1"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/60 bg-gradient-to-br from-purple-600/50 via-pink-600/40 to-cyan-500/50 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all duration-300">
              {/* Rotating 3D micro orbital rings */}
              <div
                className="pointer-events-none absolute -inset-1 rounded-full border border-dashed border-cyan-400/60 animate-orbit"
                style={{ animationDuration: '9s' }}
              />
              <div
                className="pointer-events-none absolute -inset-2 rounded-full border border-dotted border-pink-400/50 animate-orbit-slow"
                style={{ animationDuration: '15s' }}
              />
              <Shield className="h-5 w-5 text-cyan-200 transition group-hover:scale-110 group-hover:text-pink-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wide text-rainbow">PRIVYSHIELD</span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-teal-400/40 bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300 shadow-sm shadow-teal-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                  Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">Detect. Understand. Sanitize. Verify.</p>
            </div>
          </button>

          {/* Primary Navigation with 3D Depth */}
          <nav aria-label="Main navigation" className="order-3 flex w-full items-center gap-1.5 overflow-x-auto pb-1 lg:order-2 lg:w-auto lg:pb-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`btn-glow relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    active
                      ? 'border border-purple-400/70 bg-gradient-to-r from-purple-500/35 via-pink-500/25 to-cyan-500/35 text-white shadow-[0_0_18px_rgba(168,85,247,0.4)]'
                      : 'border border-slate-800/80 bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-neon-cyan hover:border-cyan-400/40'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-neon-cyan' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute -bottom-1 left-2.5 right-2.5 h-[2.5px] rounded-full bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 shadow-[0_0_10px_#22d3ee]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Utility Controls */}
          <div className="order-2 flex items-center gap-2 lg:order-3">
            {/* Offline/Online Indicator */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm ${
                isOnline
                  ? 'border-cyan-500/35 bg-cyan-950/40 text-cyan-200 shadow-cyan-950/40'
                  : 'border-teal-400/50 bg-teal-500/20 text-teal-200 shadow-teal-950/40'
              }`}
              title={
                isOnline
                  ? 'Network connected. Document processing remains strictly local.'
                  : 'Offline mode active. Sanitization continues locally via cached assets.'
              }
            >
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-cyan-400" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-teal-300" />
              )}
              <span className="hidden sm:inline">{isOnline ? 'Local Engine' : 'Offline Ready'}</span>
            </div>

            {/* Visual Effects Control */}
            <label className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/35 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-200 hover:border-purple-400 transition">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="sr-only">Visual effects mode</span>
              <select
                aria-label="Visual effects mode"
                value={visualEffects}
                onChange={(e) => setVisualEffects(e.target.value as VisualEffectsMode)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="full" className="bg-slate-900">
                  3D: Full
                </option>
                <option value="reduced" className="bg-slate-900">
                  3D: Reduced
                </option>
                <option value="disabled" className="bg-slate-900">
                  3D: Off
                </option>
              </select>
            </label>

            {canInstallPWA && (
              <button
                type="button"
                onClick={() => void triggerPWAInstall()}
                className="btn-glow inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Install App</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              aria-label="Open guided tour"
              className="btn-glow inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">{children}</main>

      <footer className="border-t border-purple-500/15 bg-[#050816]/80 py-4 text-xs text-slate-400" style={{ boxShadow: '0 -1px 15px -5px rgba(168,85,247,0.1)' }}>
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-4 sm:flex-row sm:items-center sm:px-6">
          <p>
            <strong className="text-slate-200">PrivyShield</strong> — Your data stays yours. All PII
            detection, validation, and sanitization run locally in your browser.
          </p>
          <p className="text-slate-500">
            Zero document uploads • In-memory pseudonymization • Synthetic demos only
          </p>
        </div>
      </footer>
    </div>
  );
};
