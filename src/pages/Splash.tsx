/**
 * Splash.tsx - Loading screen shown on first visit
 * Displays for ~1.2s then calls onDone() to reveal the app
 */
import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const DURATION = 1200;
    const start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setFading(true);
        setTimeout(onDone, 300);
      }
    }, 16);
    // Hard fallback — always exits within 2.5s
    const kill = setTimeout(onDone, 2500);
    return () => { clearInterval(id); clearTimeout(kill); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: 'none',
    }}>
      {/* Logo mark */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <span style={{ fontWeight: 900, fontSize: 32, color: '#fff', fontFamily: 'system-ui,sans-serif' }}>
          S
        </span>
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4, fontFamily: 'system-ui,sans-serif' }}>
        SIGMA
      </h1>
      <p style={{ fontSize: 12, color: '#444', marginBottom: 36, fontFamily: 'system-ui,sans-serif' }}>
        Live · Connect · Create
      </p>

      {/* Progress bar */}
      <div style={{ width: 140, height: 2, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${progress}%`,
          background: '#e5e7eb',
          transition: 'width 0.05s linear',
        }} />
      </div>
    </div>
  );
}
