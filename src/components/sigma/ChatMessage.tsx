import { motion } from 'framer-motion';
import { OrbitalAvatar } from '@/components/sigma/OrbitalAvatar';
import { cn } from '@/lib/utils';
import type { SigmaStreamMessage } from '@/types/sigma';

export interface ChatMessageProps {
  message: SigmaStreamMessage;
  className?: string;
}

/** A single stream-chat line, sitting inside the stream glass environment. */
export function ChatMessage({ message, className }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn('group flex items-start gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.04]', className)}
    >
      <OrbitalAvatar user={message.profiles} size="sm" className="scale-[0.8] -ml-1" />
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="mr-1.5 font-semibold text-muted-foreground">@{message.profiles.username}</span>
        <span className="break-words text-foreground">{message.message}</span>
      </p>
    </motion.div>
  );
}
