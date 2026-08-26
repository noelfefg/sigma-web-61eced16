import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export function formatViewerCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function LiveBadge({ className, label = 'LIVE' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-destructive-foreground',
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-destructive-foreground/70 animate-sigma-pulse-ring" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive-foreground" />
      </span>
      {label}
    </span>
  );
}

export function ViewerCount({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md',
        className,
      )}
    >
      <Eye className="h-3 w-3" />
      {formatViewerCount(count)}
    </span>
  );
}
