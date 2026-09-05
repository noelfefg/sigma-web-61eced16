/**
 * Sigma messaging system — one bubble stack reused by DMs, stream chat and stream rooms.
 * Purely presentational: data + realtime stay in the calling page/hook.
 */
import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type BubbleVariant = 'incoming' | 'outgoing';
export type DeliveryState = 'sending' | 'sent' | 'delivered' | 'read';

/* ------------------------------------------------------------------ Message */

export interface MessageProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BubbleVariant;
  /** Part of a run from the same author — tightens spacing. */
  grouped?: boolean;
}

export const Message = forwardRef<HTMLDivElement, MessageProps>(
  ({ className, variant = 'incoming', grouped = false, ...props }, ref) => (
    <motion.div
      ref={ref as never}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'group/message flex w-full items-end gap-2',
        variant === 'outgoing' && 'flex-row-reverse',
        grouped ? 'mt-0.5' : 'mt-3',
        className,
      )}
      {...(props as Record<string, unknown>)}
    />
  ),
);
Message.displayName = 'Message';

export interface MessageAvatarProps {
  src?: string | null;
  name?: string | null;
  /** Hidden but space-preserving, for grouped runs. */
  hidden?: boolean;
  className?: string;
}

export function MessageAvatar({ src, name, hidden = false, className }: MessageAvatarProps) {
  return (
    <Avatar className={cn('h-7 w-7 shrink-0 ring-1 ring-border', hidden && 'invisible', className)}>
      <AvatarImage src={src || undefined} alt={name || ''} />
      <AvatarFallback className="bg-secondary text-[10px] font-bold">
        {(name || '?').charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/* ------------------------------------------------------------------- Bubble */

export interface BubbleProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BubbleVariant;
  grouped?: boolean;
  /** Removes padding/background — for media or audio payloads. */
  bare?: boolean;
}

export const Bubble = forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, variant = 'incoming', grouped = false, bare = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative max-w-[78%] min-w-0 rounded-2xl text-sm leading-relaxed transition-colors sm:max-w-[68%]',
        !bare && 'px-3.5 py-2',
        !bare && variant === 'outgoing'
          ? 'bg-primary text-primary-foreground'
          : !bare && 'bg-secondary text-secondary-foreground',
        bare && 'bg-transparent p-0',
        variant === 'outgoing'
          ? grouped
            ? 'rounded-tr-md'
            : 'rounded-br-md'
          : grouped
            ? 'rounded-tl-md'
            : 'rounded-bl-md',
        className,
      )}
      {...props}
    />
  ),
);
Bubble.displayName = 'Bubble';

export function BubbleContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('break-words whitespace-pre-wrap [overflow-wrap:anywhere]', className)} {...props} />;
}

export function MessageContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-w-0 flex-col', className)} {...props} />;
}

export function BubbleGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col', className)} {...props} />;
}

/* ------------------------------------------------------------------- Footer */

export interface MessageFooterProps {
  timestamp?: string;
  state?: DeliveryState;
  variant?: BubbleVariant;
  className?: string;
  children?: ReactNode;
}

export function MessageFooter({ timestamp, state, variant = 'incoming', className, children }: MessageFooterProps) {
  return (
    <div
      className={cn(
        'mt-0.5 flex items-center gap-1 px-1 text-[10px] text-muted-foreground',
        variant === 'outgoing' && 'justify-end',
        className,
      )}
    >
      {timestamp && <span>{timestamp}</span>}
      {state === 'sending' && <Clock className="h-3 w-3" aria-label="Sending" />}
      {state === 'sent' && <Check className="h-3 w-3" aria-label="Sent" />}
      {state === 'delivered' && <CheckCheck className="h-3 w-3" aria-label="Delivered" />}
      {state === 'read' && <CheckCheck className="h-3 w-3 text-foreground" aria-label="Read" />}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Reactions */

export interface BubbleReaction {
  emoji: string;
  count: number;
  reacted?: boolean;
}

export function BubbleReactions({
  reactions,
  onReact,
  className,
}: {
  reactions: BubbleReaction[];
  onReact?: (emoji: string) => void;
  className?: string;
}) {
  if (!reactions.length) return null;
  return (
    <div className={cn('mt-1 flex flex-wrap gap-1 px-1', className)}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onReact?.(r.emoji)}
          aria-label={`React ${r.emoji}`}
          aria-pressed={!!r.reacted}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors',
            r.reacted
              ? 'border-foreground/30 bg-foreground/10 text-foreground'
              : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground',
          )}
        >
          <span>{r.emoji}</span>
          {r.count > 1 && <span className="tabular-nums">{r.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- Marker */

export function Marker({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('my-4 flex items-center gap-3', className)} {...props}>
      <span className="h-px flex-1 bg-border" />
      <MarkerContent>{props.children}</MarkerContent>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function MarkerContent({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

/* --------------------------------------------------------- Typing indicator */

export function TypingIndicator({ name, className }: { name?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground', className)} role="status">
      <span className="flex items-end gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
      {name ? `${name} is typing…` : 'Typing…'}
    </div>
  );
}
