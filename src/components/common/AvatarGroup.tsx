import { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type PresenceState = 'online' | 'live' | 'offline';

const sizes = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-16 w-16 text-lg',
} as const;

export interface SigmaAvatarPerson {
  id?: string;
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  presence?: PresenceState;
}

export function AvatarBadge({ state, className }: { state: PresenceState; className?: string }) {
  if (state === 'offline') return null;
  return (
    <span
      aria-label={state === 'live' ? 'Live' : 'Online'}
      className={cn(
        'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
        state === 'live' ? 'bg-destructive' : 'bg-emerald-500',
        className,
      )}
    />
  );
}

export function SigmaAvatar({
  person,
  size = 'md',
  className,
  children,
}: {
  person: SigmaAvatarPerson;
  size?: keyof typeof sizes;
  className?: string;
  children?: ReactNode;
}) {
  const label = person.display_name || person.username || '?';
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className={cn(sizes[size], 'ring-1 ring-border')}>
        <AvatarImage src={person.avatar_url || undefined} alt={label} />
        <AvatarFallback className="bg-secondary font-bold">{label.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {person.presence && <AvatarBadge state={person.presence} />}
      {children}
    </span>
  );
}

export function AvatarGroup({
  people,
  max = 4,
  size = 'sm',
  className,
}: {
  people: SigmaAvatarPerson[];
  max?: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((p, i) => (
        <SigmaAvatar
          key={p.id || p.username || i}
          person={p}
          size={size}
          className={cn(i > 0 && '-ml-2', '[&_.ring-border]:ring-2 [&_.ring-border]:ring-background')}
        />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            sizes[size],
            '-ml-2 inline-flex items-center justify-center rounded-full border-2 border-background bg-secondary font-semibold text-muted-foreground',
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
