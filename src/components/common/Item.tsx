import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/** Compact information row used by notifications, settings, verification and metadata lists. */
export const Item = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 transition-colors',
        interactive && 'cursor-pointer hover:border-foreground/20 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  ),
);
Item.displayName = 'Item';

export function ItemMedia({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex shrink-0 items-center justify-center', className)} {...props} />;
}

export function ItemContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-w-0 flex-1 flex-col', className)} {...props} />;
}

export function ItemTitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('truncate text-sm font-semibold text-foreground', className)} {...props} />;
}

export function ItemDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('truncate text-xs text-muted-foreground', className)} {...props} />;
}

export function ItemActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex shrink-0 items-center gap-1.5', className)} {...props} />;
}

export function ItemGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}
