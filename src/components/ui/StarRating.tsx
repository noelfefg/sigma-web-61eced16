import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  value: number;        // current average (0-5)
  userRating?: number;  // what THIS user rated (0 = none)
  count?: number;
  size?: 'sm' | 'md';
  onRate?: (stars: number) => void;
  readonly?: boolean;
}

export function StarRating({ value, userRating = 0, count = 0, size = 'sm', onRate, readonly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [localRating, setLocalRating] = useState(userRating);
  const sz = size === 'sm' ? 13 : 16;
  const display = hover || localRating || value;

  const handleClick = (star: number) => {
    if (readonly || !onRate) return;
    setLocalRating(star);
    onRate(star);
  };

  return (
    <div className="flex items-center gap-1" title={`${value.toFixed(1)} / 5 (${count} ratings)`}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (readonly ? value : display);
        const half = !filled && star - 0.5 <= (readonly ? value : display);
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            whileTap={readonly ? {} : { scale: 1.3 }}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className="relative outline-none"
            style={{ width: sz, height: sz, cursor: readonly ? 'default' : 'pointer' }}
          >
            {/* Background star (empty) */}
            <Star
              size={sz}
              className="absolute inset-0"
              style={{ color: 'rgba(255,255,255,0.15)', fill: 'rgba(255,255,255,0.05)' }}
            />
            {/* Filled star */}
            {(filled || half) && (
              <Star
                size={sz}
                className="absolute inset-0 transition-all duration-100"
                style={{
                  color: localRating === star || hover === star ? '#ffd700' : '#f59e0b',
                  fill: localRating === star || hover === star ? '#ffd700' : '#f59e0b',
                  clipPath: half ? 'inset(0 50% 0 0)' : 'none',
                }}
              />
            )}
          </motion.button>
        );
      })}
      {count > 0 && (
        <span className="text-[10px] font-medium ml-0.5" style={{ color: '#666' }}>
          {value.toFixed(1)} ({count >= 1000 ? `${(count/1000).toFixed(1)}K` : count})
        </span>
      )}
    </div>
  );
}
