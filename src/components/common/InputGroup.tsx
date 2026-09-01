import { HTMLAttributes, InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/** Grey glass input shell used by the global Sigma search and composers. */
export function InputGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex h-10 w-full items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3 transition-colors focus-within:border-foreground/25 focus-within:bg-secondary/80',
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('flex shrink-0 items-center text-muted-foreground', className)} {...props} />;
}

export const InputGroupInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
InputGroupInput.displayName = 'InputGroupInput';
