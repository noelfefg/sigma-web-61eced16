import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, Flame, Star, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SigmaReaction } from '@/types/sigma';

const ICONS: Record<SigmaReaction, typeof Heart> = {
  heart: Heart,
  fire: Flame,
  star: Star,
  clap: PartyPopper,
};

interface FloatingReaction {
  id: number;
  type: SigmaReaction;
  left: number;
  drift: number;
}

export interface ReactionOverlayProps {
  /** Reactions pushed in from realtime; each new item spawns a floating icon. */
  incoming?: { id: number; type: SigmaReaction } | null;
  className?: string;
}

export function useReactionSpawner() {
  const counter = useRef(0);
  const [items, setItems] = useState<FloatingReaction[]>([]);

  const spawn = useCallback((type: SigmaReaction) => {
    const id = ++counter.current;
    setItems((prev) => [...prev, { id, type, left: 20 + Math.random() * 60, drift: (Math.random() - 0.5) * 90 }]);
    window.setTimeout(() => setItems((prev) => prev.filter((r) => r.id !== id)), 2700);
  }, []);

  return { items, spawn };
}

/** Floating reactions that drift upward and outward over the stream. */
export function ReactionOverlay({ items, className }: { items: FloatingReaction[]; className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {items.map((r) => {
        const Icon = ICONS[r.type];
        return (
          <span
            key={r.id}
            className="absolute bottom-6 animate-sigma-float-up drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"
            style={{ left: `${r.left}%`, ['--drift' as string]: `${r.drift}px` }}
          >
            <Icon className="h-7 w-7 text-white/90" fill="currentColor" />
          </span>
        );
      })}
    </div>
  );
}

export function ReactionButton({
  type,
  onReact,
  className,
}: {
  type: SigmaReaction;
  onReact: (type: SigmaReaction) => void;
  className?: string;
}) {
  const Icon = ICONS[type];
  return (
    <button
      type="button"
      aria-label={`React with ${type}`}
      onClick={() => onReact(type)}
      className={cn(
        'sigma-glass flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-all duration-200 hover:scale-110 hover:sigma-glow active:scale-90',
        className,
      )}
    >
      <Icon className="h-4.5 w-4.5" />
    </button>
  );
}

/** Convenience hook: mirrors a realtime reaction payload into the spawner. */
export function useMirrorReaction(spawn: (t: SigmaReaction) => void, incoming: ReactionOverlayProps['incoming']) {
  useEffect(() => {
    if (incoming) spawn(incoming.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming?.id]);
}
