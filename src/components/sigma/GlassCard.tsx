import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover sheen sweep. */
  interactive?: boolean;
  /** Uses an opaque-ish surface instead of pure translucency. */
  solid?: boolean;
}

/** Central glass treatment for the Sigma design system. */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive = false, solid = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-3xl',
        solid ? 'sigma-glass-strong' : 'sigma-glass',
        interactive && 'sigma-sheen transition-transform duration-300 hover:-translate-y-0.5',
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = 'GlassCard';
