'use client';

import { RunnerSVG } from './RunnerSVG';

export function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#FF6B35',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      {/* Runner logo mark */}
      <div style={{ marginBottom: 24 }}>
        <RunnerSVG size={64} color="#ffffff" />
      </div>

      {/* Logotype */}
      <div
        style={{
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 900,
          letterSpacing: '0.2em',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 40,
          userSelect: 'none',
        }}
      >
        I AM RUNNING
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 200,
          height: 2,
          background: 'rgba(255,255,255,0.25)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '45%',
            background: '#ffffff',
            borderRadius: 2,
            animation: 'shimmer 1.4s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-220%); }
          100% { transform: translateX(520%); }
        }
      `}</style>
    </div>
  );
}
