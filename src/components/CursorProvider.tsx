import { useEffect, useState } from 'react';
import TargetCursor from '@/components/TargetCursor';

const STORAGE_KEY = 'sigma.cursor.enabled';

export function getCursorEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // Touch devices: always off
  if (window.matchMedia?.('(pointer: coarse)').matches) return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setCursorEnabled(v: boolean) {
  localStorage.setItem(STORAGE_KEY, v ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('sigma-cursor-change', { detail: v }));
}

export function CursorProvider() {
  const [enabled, setEnabled] = useState(getCursorEnabled());
  useEffect(() => {
    const onChange = (e: Event) => setEnabled((e as CustomEvent).detail);
    window.addEventListener('sigma-cursor-change', onChange);
    return () => window.removeEventListener('sigma-cursor-change', onChange);
  }, []);
  if (!enabled) return null;
  return <TargetCursor targetSelector=".cursor-target" spinDuration={2} hideDefaultCursor={false} />;
}
