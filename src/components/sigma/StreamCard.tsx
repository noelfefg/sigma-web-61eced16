import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LiveBadge, ViewerCount } from '@/components/sigma/LiveBadge';
import { OrbitalAvatar } from '@/components/sigma/OrbitalAvatar';
import type { SigmaStream } from '@/types/sigma';

export interface StreamCardProps {
  stream: SigmaStream;
  featured?: boolean;
  index?: number;
  className?: string;
}

/** Immersive glass media card used across Home / Discover / Sigmatized. */
export function StreamCard({ stream, featured = false, index = 0, className }: StreamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: Math.min(index * 0.035, 0.4), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      layout
      className={className}
    >
      <Link to={`/watch/${stream.profiles.username}`} className="group block">
        <div className="sigma-glass sigma-sheen overflow-hidden rounded-3xl transition-all duration-300 group-hover:-translate-y-1 group-hover:sigma-glow">
          <div className={cn('relative overflow-hidden', featured ? 'aspect-video' : 'aspect-[16/10]')}>
            {stream.thumbnail_url ? (
              <img
                src={stream.thumbnail_url}
                alt={stream.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.02]">
                <Video className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

            <div className="absolute left-3 top-3 flex items-center gap-1.5">
              <LiveBadge />
              <ViewerCount count={stream.viewer_count} />
            </div>

            <div className="absolute inset-x-3 bottom-3 flex items-end gap-2.5">
              <OrbitalAvatar user={stream.profiles} size="sm" live />
              <div className="min-w-0 flex-1">
                <h3 className={cn('truncate font-semibold text-white', featured ? 'text-base' : 'text-sm')}>
                  {stream.title}
                </h3>
                <p className="truncate text-[11px] text-white/70">
                  {stream.profiles.display_name}
                  {stream.categories?.name ? ` · ${stream.categories.name}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
