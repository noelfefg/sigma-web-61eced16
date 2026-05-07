/**
 * useSound — lightweight WebAudio-based UI sound + haptic feedback.
 * No external assets; synthesised tones for click, tap, success, error.
 */
import { useCallback, useRef } from 'react';

type SoundType = 'tap' | 'click' | 'success' | 'error' | 'pop';

let sharedCtx: AudioContext | null = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    try { sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
    catch { return null; }
  }
  if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

const PRESETS: Record<SoundType, { freq: number; dur: number; type: OscillatorType; vol: number; sweep?: number }> = {
  tap:     { freq: 880,  dur: 0.04, type: 'sine',     vol: 0.06 },
  click:   { freq: 1200, dur: 0.05, type: 'triangle', vol: 0.08, sweep: -400 },
  pop:     { freq: 520,  dur: 0.08, type: 'sine',     vol: 0.10, sweep: 300 },
  success: { freq: 660,  dur: 0.18, type: 'sine',     vol: 0.10, sweep: 440 },
  error:   { freq: 220,  dur: 0.20, type: 'square',   vol: 0.08, sweep: -120 },
};

export function useSound(enabled = true) {
  const lastRef = useRef(0);

  const play = useCallback((type: SoundType = 'tap') => {
    if (!enabled) return;
    const now = performance.now();
    if (now - lastRef.current < 40) return; // throttle
    lastRef.current = now;
    const ctx = getCtx();
    if (!ctx) return;
    const p = PRESETS[type];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.freq, ctx.currentTime);
    if (p.sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(60, p.freq + p.sweep), ctx.currentTime + p.dur);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(p.vol, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + p.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + p.dur + 0.02);
  }, [enabled]);

  const haptic = useCallback((ms = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch {}
    }
  }, []);

  const feedback = useCallback((type: SoundType = 'tap', vibrateMs = 8) => {
    play(type); haptic(vibrateMs);
  }, [play, haptic]);

  return { play, haptic, feedback };
}
