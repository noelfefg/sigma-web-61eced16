import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StarRatingProps {
  targetId: string;
  targetType: 'stream' | 'post' | 'short';
  initialRating?: number;
  totalRatings?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function StarRating({
  targetId, targetType, initialRating = 0, totalRatings = 0,
  size = 'sm', showCount = true,
}: StarRatingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hovered, setHovered] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(initialRating);
  const [count, setCount] = useState(totalRatings);
  const [submitted, setSubmitted] = useState(false);

  const starSizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const sz = starSizes[size];

  const handleRate = async (stars: number) => {
    if (!user) {
      toast({ title: 'Sign in to rate', description: 'Create an account to leave ratings.', variant: 'destructive' });
      return;
    }
    if (submitted) return;

    setUserRating(stars);
    setSubmitted(true);

    // Upsert rating
    const { error } = await supabase.from('ratings').upsert({
      user_id: user.id,
      target_id: targetId,
      target_type: targetType,
      stars,
    }, { onConflict: 'user_id,target_id,target_type' });

    if (error) {
      toast({ title: 'Rating failed', description: error.message, variant: 'destructive' });
      setSubmitted(false);
      return;
    }

    // Recalculate avg
    const { data } = await supabase
      .from('ratings')
      .select('stars')
      .eq('target_id', targetId)
      .eq('target_type', targetType);
    if (data && data.length > 0) {
      const avg = data.reduce((a, r) => a + r.stars, 0) / data.length;
      setAvgRating(avg);
      setCount(data.length);
    }

    toast({ title: '⭐ Rated!', description: `You gave this ${stars} star${stars !== 1 ? 's' : ''}.` });
  };

  const display = hovered || userRating || avgRating;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map(star => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => !submitted && setHovered(star)}
            onClick={() => handleRate(star)}
            disabled={submitted}
            className="relative focus:outline-none disabled:cursor-default"
          >
            <Star
              className={sz}
              style={{
                fill: star <= display ? '#fbbf24' : 'transparent',
                color: star <= display ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.1s ease',
              }}
            />
          </motion.button>
        ))}
      </div>
      {showCount && (
        <AnimatePresence>
          <motion.span
            key={count}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[11px] font-medium"
            style={{ color: '#888' }}
          >
            {avgRating > 0 ? avgRating.toFixed(1) : ''}
            {count > 0 ? ` (${count})` : ''}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
}
