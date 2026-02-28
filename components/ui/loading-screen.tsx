'use client';

export function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      {/* Logotype */}
      <div
        style={{
          fontSize: 'clamp(24px, 5vw, 40px)',
          fontWeight: 900,
          letterSpacing: '0.2em',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 40,
          userSelect: 'none',
        }}
      >
        I AM <span style={{ color: '#FF6B35' }}>RUNNING</span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 160,
          height: 1,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 1,
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
            width: '40%',
            background: '#FF6B35',
            borderRadius: 1,
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-250%); }
          100% { transform: translateX(500%); }
        }
      `}</style>
    </div>
  );
}
