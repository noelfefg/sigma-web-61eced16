import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type WaveformState = 'idle' | 'recording' | 'processing';

/**
 * Live microphone waveform for the Sigma voice-message composer.
 * When a MediaStream is supplied it renders real amplitude; otherwise a
 * scrolling placeholder is drawn so the recording UX stays readable.
 */
export function LiveWaveform({
  state,
  stream,
  bars = 40,
  className,
}: {
  state: WaveformState;
  stream?: MediaStream | null;
  bars?: number;
  className?: string;
}) {
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0.08));
  const raf = useRef<number>();

  useEffect(() => {
    if (state !== 'recording') {
      setLevels(Array(bars).fill(0.08));
      return;
    }

    let ctx: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    let data: Uint8Array | undefined;

    if (stream) {
      ctx = new AudioContext();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      data = new Uint8Array(analyser.frequencyBinCount);
    }

    const tick = () => {
      let level: number;
      if (analyser && data) {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
        level = Math.min(1, peak * 1.8);
      } else {
        level = 0.2 + Math.random() * 0.6;
      }
      setLevels((prev) => [...prev.slice(1), Math.max(0.08, level)]);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      void ctx?.close();
    };
  }, [state, stream, bars]);

  return (
    <div
      role="img"
      aria-label={state === 'recording' ? 'Recording audio' : state === 'processing' ? 'Processing audio' : 'Microphone idle'}
      className={cn('flex h-8 items-center gap-[2px]', state === 'processing' && 'animate-pulse', className)}
    >
      {levels.map((l, i) => (
        <span
          key={i}
          style={{ height: `${Math.round(l * 100)}%` }}
          className={cn(
            'w-[2px] flex-1 rounded-full transition-[height] duration-75',
            state === 'recording' ? 'bg-destructive' : 'bg-foreground/30',
          )}
        />
      ))}
    </div>
  );
}
