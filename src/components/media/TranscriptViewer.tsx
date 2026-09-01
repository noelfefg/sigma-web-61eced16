import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface TranscriptWord {
  text: string;
  /** Start time in seconds. */
  start: number;
  end: number;
}

/** Word-aligned transcript for voice messages and audio posts. Only rendered when transcript data exists. */
export function TranscriptViewer({
  words,
  currentTime = 0,
  loading = false,
  onSeek,
  className,
}: {
  words?: TranscriptWord[];
  currentTime?: number;
  loading?: boolean;
  onSeek?: (time: number) => void;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (!words?.length) return null;

  return (
    <p className={cn('text-sm leading-relaxed text-muted-foreground', className)}>
      {words.map((w, i) => {
        const active = currentTime >= w.start && currentTime < w.end;
        return (
          <button
            key={`${w.start}-${i}`}
            type="button"
            onClick={() => onSeek?.(w.start)}
            className={cn(
              'rounded px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'bg-foreground/15 text-foreground' : 'hover:text-foreground',
            )}
          >
            {w.text}
          </button>
        );
      })}
    </p>
  );
}
