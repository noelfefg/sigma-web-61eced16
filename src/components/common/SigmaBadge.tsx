import { cva, type VariantProps } from 'class-variance-authority';
import { BadgeCheck, Crown, Radio, Mic, UserRound, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const badge = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-secondary/70 text-muted-foreground',
        silver: 'border-foreground/20 bg-foreground/10 text-foreground',
        live: 'border-destructive/40 bg-destructive text-destructive-foreground',
        online: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type SigmaBadgeKind = 'verified' | 'creator' | 'live' | 'host' | 'guest' | 'online' | 'category';

const config: Record<SigmaBadgeKind, { label: string; icon?: typeof BadgeCheck; tone: VariantProps<typeof badge>['tone'] }> = {
  verified: { label: 'Verified', icon: BadgeCheck, tone: 'silver' },
  creator: { label: 'Creator', icon: Crown, tone: 'silver' },
  live: { label: 'Live', icon: Radio, tone: 'live' },
  host: { label: 'Host', icon: Mic, tone: 'silver' },
  guest: { label: 'Guest', icon: UserRound, tone: 'neutral' },
  online: { label: 'Online', icon: Circle, tone: 'online' },
  category: { label: 'Category', tone: 'neutral' },
};

export function SigmaBadge({
  kind,
  label,
  className,
}: {
  kind: SigmaBadgeKind;
  /** Overrides the default label (used for categories). */
  label?: string;
  className?: string;
}) {
  const c = config[kind];
  const Icon = c.icon;
  return (
    <span className={cn(badge({ tone: c.tone }), className)}>
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {label ?? c.label}
    </span>
  );
}
