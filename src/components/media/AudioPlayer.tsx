import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SPEEDS = [1, 1.25, 1.5, 2] as const;

function fmt(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface AudioPlayerProps {
  src: string;
  /** Optional pre-computed bars (0..1). Falls back to a static silver bar strip. */
  peaks?: number[];
  compact?: boolean;
  className?: string;
  onTimeUpdate?: (time: number) => void;
}

/** Shared audio surface for voice messages, audio posts and audio content. */
export function AudioPlayer({ src, peaks, compact = false, className, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => { setTime(el.currentTime); onTimeUpdate?.(el.currentTime); };
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => { setPlaying(false); setTime(0); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { void el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
  };

  const seek = (v: number[]) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = (v[0] / 100) * duration;
    setTime(el.currentTime);
  };

  const progress = duration ? (time / duration) * 100 : 0;
  const bars = peaks?.length ? peaks : Array.from({ length: 32 }, (_, i) => 0.35 + 0.5 * Math.abs(Math.sin(i * 1.7)));

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/50 px-3 py-2',
        compact && 'gap-2 px-2 py-1.5',
        className,
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        onClick={toggle}
        aria-label={playing ? 'Pause audio' : 'Play audio'}
        className="h-8 w-8 shrink-0 rounded-full"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex h-6 items-center gap-[2px]" aria-hidden>
          {bars.map((b, i) => {
            const active = (i / bars.length) * 100 <= progress;
            return (
              <span
                key={i}
                style={{ height: `${Math.max(12, b * 100)}%` }}
                className={cn('w-[2px] flex-1 rounded-full transition-colors', active ? 'bg-foreground' : 'bg-foreground/25')}
              />
            );
          })}
        </div>
        <Slider
          value={[progress]}
          max={100}
          step={0.5}
          onValueChange={seek}
          aria-label="Audio progress"
          className="mt-1"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="tabular-nums text-[11px] text-muted-foreground">
          {fmt(time)} / {fmt(duration)}
        </span>
        {!compact && (
          <button
            type="button"
            onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed as never) + 1) % SPEEDS.length])}
            aria-label="Playback speed"
            className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
          >
            {speed}x
          </button>
        )}
      </div>
    </div>
  );
}
