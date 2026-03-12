import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp, Flame, Laugh, PartyPopper, Sparkles, Zap, Star, Crown, Ghost, Skull, Rocket, Music, Eye, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingReaction {
  id: string;
  emoji: string;
  icon: React.ReactNode;
  x: number;
  color: string;
}

const reactionTypes = [
  { emoji: '❤️', icon: Heart, color: '#ef4444', label: 'Love' },
  { emoji: '👍', icon: ThumbsUp, color: '#3b82f6', label: 'Like' },
  { emoji: '🔥', icon: Flame, color: '#f97316', label: 'Fire' },
  { emoji: '😂', icon: Laugh, color: '#eab308', label: 'Haha' },
  { emoji: '🎉', icon: PartyPopper, color: '#a855f7', label: 'Party' },
  { emoji: '✨', icon: Sparkles, color: '#ec4899', label: 'Sparkle' },
  { emoji: '⚡', icon: Zap, color: '#facc15', label: 'Zap' },
  { emoji: '⭐', icon: Star, color: '#fbbf24', label: 'Star' },
  { emoji: '👑', icon: Crown, color: '#f59e0b', label: 'Crown' },
  { emoji: '👻', icon: Ghost, color: '#a78bfa', label: 'Ghost' },
  { emoji: '💀', icon: Skull, color: '#9ca3af', label: 'Skull' },
  { emoji: '🚀', icon: Rocket, color: '#06b6d4', label: 'Rocket' },
  { emoji: '🎵', icon: Music, color: '#34d399', label: 'Music' },
  { emoji: '👁️', icon: Eye, color: '#818cf8', label: 'Eye' },
  { emoji: '💎', icon: Diamond, color: '#67e8f9', label: 'Diamond' },
];

interface LiveReactionsProps {
  onReaction?: (emoji: string) => void;
}

export function LiveReactions({ onReaction }: LiveReactionsProps) {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const [expanded, setExpanded] = useState(false);

  const addReaction = useCallback((type: typeof reactionTypes[0]) => {
    const count = 3 + Math.floor(Math.random() * 5); // 3-7 particles
    const newReactions: FloatingReaction[] = Array.from({ length: count }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      emoji: type.emoji,
      icon: <type.icon className="w-6 h-6" style={{ color: type.color }} fill={type.color} />,
      x: 10 + Math.random() * 80,
      color: type.color,
    }));
    setFloating(prev => [...prev, ...newReactions]);
    onReaction?.(type.emoji);

    // Clean up after animation
    setTimeout(() => {
      setFloating(prev => prev.filter(r => !newReactions.find(nr => nr.id === r.id)));
    }, 3000);
  }, [onReaction]);

  return (
    <div className="relative">
      {/* Floating reactions overlay */}
      <div className="absolute bottom-full left-0 right-0 h-64 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floating.map((reaction) => (
            <motion.div
              key={reaction.id}
              className="absolute bottom-0"
              style={{ left: `${reaction.x}%` }}
              initial={{ y: 0, opacity: 1, scale: 0.3 }}
              animate={{
                y: -250 - Math.random() * 100,
                opacity: [1, 1, 1, 0],
                scale: [0.3, 1.4, 1, 0.6],
                x: [0, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 80],
                rotate: [0, Math.random() * 60 - 30, Math.random() * 40 - 20],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5 + Math.random(), ease: 'easeOut' }}
            >
              {reaction.icon}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <motion.div
        className="flex items-center gap-1 flex-wrap"
        layout
      >
        {/* Quick reactions (first 5) */}
        {reactionTypes.slice(0, 5).map((type) => (
          <motion.div key={type.label} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.7 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full hover:bg-accent"
              onClick={() => addReaction(type)}
              title={type.label}
            >
              <type.icon className="w-5 h-5" style={{ color: type.color }} />
            </Button>
          </motion.div>
        ))}

        {/* Expand button */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 rounded-full text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : `+${reactionTypes.length - 5}`}
          </Button>
        </motion.div>

        {/* Extended reactions */}
        <AnimatePresence>
          {expanded && reactionTypes.slice(5).map((type, i) => (
            <motion.div
              key={type.label}
              initial={{ opacity: 0, scale: 0, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.7 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-full hover:bg-accent"
                onClick={() => addReaction(type)}
                title={type.label}
              >
                <type.icon className="w-5 h-5" style={{ color: type.color }} />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
