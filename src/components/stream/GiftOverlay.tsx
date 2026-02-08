import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Sparkles, Flame, Zap, Diamond, Crown, Trophy, DollarSign } from 'lucide-react';

export interface GiftNotification {
  id: string;
  type: 'gift' | 'donation';
  senderName: string;
  giftName?: string;
  giftIcon?: string;
  amount?: number;
  message?: string;
}

const giftIcons: Record<string, React.ReactNode> = {
  heart: <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />,
  star: <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />,
  sparkle: <Sparkles className="w-8 h-8 text-purple-400" />,
  flame: <Flame className="w-8 h-8 text-orange-500" />,
  zap: <Zap className="w-8 h-8 text-yellow-300 fill-yellow-300" />,
  diamond: <Diamond className="w-8 h-8 text-cyan-400" />,
  crown: <Crown className="w-8 h-8 text-amber-500 fill-amber-500" />,
  trophy: <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500" />,
};

interface GiftOverlayProps {
  notifications: GiftNotification[];
  onRemove: (id: string) => void;
}

export function GiftOverlay({ notifications, onRemove }: GiftOverlayProps) {
  useEffect(() => {
    // Auto-remove notifications after 5 seconds
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [notifications, onRemove]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, y: 100 + index * 100 }}
            animate={{ opacity: 1, x: 0, y: 100 + index * 100 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute right-4"
          >
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md
              ${notification.type === 'donation' 
                ? 'bg-gradient-to-r from-emerald-500/90 to-green-600/90 shadow-lg shadow-emerald-500/30' 
                : 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 shadow-lg shadow-purple-500/30'
              }
            `}>
              {/* Icon */}
              <div className="flex-shrink-0">
                {notification.type === 'donation' ? (
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    {notification.giftIcon && giftIcons[notification.giftIcon]}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{notification.senderName}</span>
                  <span className="text-white/80 text-sm">
                    {notification.type === 'donation' 
                      ? `donated $${notification.amount}` 
                      : `sent ${notification.giftName}`
                    }
                  </span>
                </div>
                {notification.message && (
                  <p className="text-white/90 text-sm max-w-[200px] truncate">
                    "{notification.message}"
                  </p>
                )}
              </div>

              {/* Animated particles */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/60 rounded-full"
                    initial={{ 
                      x: Math.random() * 100, 
                      y: Math.random() * 50,
                      scale: 0 
                    }}
                    animate={{ 
                      y: -50, 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      delay: i * 0.2,
                      repeat: Infinity 
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
