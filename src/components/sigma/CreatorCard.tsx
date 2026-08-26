import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OrbitalAvatar } from '@/components/sigma/OrbitalAvatar';
import { cn } from '@/lib/utils';
import type { SigmaUser } from '@/types/sigma';

export interface CreatorCardProps {
  user: SigmaUser;
  live?: boolean;
  subtitle?: string;
  index?: number;
  className?: string;
}

/** Compact glass identity card for creator discovery rails. */
export function CreatorCard({ user, live = false, subtitle, index = 0, className }: CreatorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
      className={className}
    >
      <Link
        to={live ? `/watch/${user.username}` : `/channel/${user.username}`}
        className={cn(
          'sigma-glass flex w-full flex-col items-center gap-2 rounded-3xl px-4 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:sigma-glow',
        )}
      >
        <OrbitalAvatar user={user} size="lg" live={live} online={!live} />
        <div className="min-w-0 w-full">
          <p className="truncate text-sm font-semibold text-foreground">{user.display_name}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle ?? `@${user.username}`}</p>
        </div>
      </Link>
    </motion.div>
  );
}
