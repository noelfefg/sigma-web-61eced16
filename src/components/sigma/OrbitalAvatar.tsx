import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { SigmaUser } from '@/types/sigma';

const sizeMap = {
  sm: { box: 'h-9 w-9', ring: 'inset-[-4px]', text: 'text-xs' },
  md: { box: 'h-12 w-12', ring: 'inset-[-5px]', text: 'text-sm' },
  lg: { box: 'h-20 w-20', ring: 'inset-[-7px]', text: 'text-xl' },
  xl: { box: 'h-28 w-28', ring: 'inset-[-9px]', text: 'text-3xl' },
} as const;

export interface OrbitalAvatarProps {
  user: Pick<SigmaUser, 'display_name' | 'avatar_url'> & { username?: string };
  size?: keyof typeof sizeMap;
  online?: boolean;
  live?: boolean;
  className?: string;
}

/** Avatar wrapped in a subtle orbital ring with online / live state. */
export function OrbitalAvatar({ user, size = 'md', online = false, live = false, className }: OrbitalAvatarProps) {
  const s = sizeMap[size];
  const initial = (user.display_name || user.username || '?').charAt(0).toUpperCase();

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {/* orbit ring */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute rounded-full border animate-sigma-orbit-slow',
          s.ring,
          live ? 'border-destructive/60' : 'border-white/15',
        )}
      >
        <span
          className={cn(
            'absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full',
            live ? 'bg-destructive' : 'bg-foreground/50',
          )}
        />
      </span>

      {live && (
        <span
          aria-hidden
          className={cn('pointer-events-none absolute rounded-full border border-destructive/40 animate-sigma-pulse-ring', s.ring)}
        />
      )}

      <Avatar className={cn(s.box, 'ring-1 ring-white/10')}>
        <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
        <AvatarFallback className={cn('bg-secondary font-bold', s.text)}>{initial}</AvatarFallback>
      </Avatar>

      {online && !live && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
      )}
    </span>
  );
}
