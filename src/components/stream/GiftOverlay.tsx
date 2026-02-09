import { useEffect } from 'react';
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

function FloatingEmoji({ icon, delay, x }: { icon: React.ReactNode; delay: number; x: number }) {
  return (
    <motion.div
      className="absolute bottom-0 pointer-events-none"
      style={{ left: `${x}%` }}
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{
        y: -200,
        opacity: [1, 1, 0],
        scale: [0.5, 1.2, 0.8],
        x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 120],
        rotate: [0, Math.random() * 40 - 20, Math.random() * 60 - 30],
      }}
      transition={{ duration: 2.5, delay, ease: 'easeOut' }}
    >
      {icon}
    </motion.div>
  );
}

function CoinBurst({ amount }: { amount: number }) {
  const coinCount = Math.min(Math.ceil((amount || 5) / 10), 12);
  return (
    <>
      {[...Array(coinCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
          style={{ left: '50%', top: '50%' }}
          initial={{ scale: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 150,
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1.2, delay: i * 0.05, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

export function GiftOverlay({ notifications, onRemove }: GiftOverlayProps) {
  useEffect(() => {
    const timers = notifications.map((n) =>
      setTimeout(() => onRemove(n.id), 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, onRemove]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {notifications.map((notification, index) => {
          const isDonation = notification.type === 'donation';
          const iconNode = notification.giftIcon ? giftIcons[notification.giftIcon] : null;

          return (
            <motion.div
              key={notification.id}
              className="absolute right-4"
              initial={{ opacity: 0, x: 400, scale: 0.3, rotate: 10 }}
              animate={{ opacity: 1, x: 0, y: 80 + index * 110, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, x: -200, scale: 0.5, rotate: -10 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, mass: 0.8 }}
            >
              {/* Background pulse ring */}
              <motion.div
                className={`absolute inset-0 rounded-2xl ${isDonation ? 'bg-emerald-400/20' : 'bg-purple-400/20'}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: 2, ease: 'easeInOut' }}
              />

              {/* Main card */}
              <motion.div
                className={`relative flex items-center gap-3 px-5 py-4 rounded-2xl backdrop-blur-xl border ${
                  isDonation
                    ? 'bg-gradient-to-r from-emerald-500/90 via-green-500/90 to-teal-500/90 border-emerald-300/40 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-r from-purple-500/90 via-pink-500/90 to-rose-500/90 border-purple-300/40 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                }`}
                animate={{
                  boxShadow: isDonation
                    ? ['0 0 20px rgba(16,185,129,0.3)', '0 0 40px rgba(16,185,129,0.6)', '0 0 20px rgba(16,185,129,0.3)']
                    : ['0 0 20px rgba(168,85,247,0.3)', '0 0 40px rgba(168,85,247,0.6)', '0 0 20px rgba(168,85,247,0.3)'],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Coin burst for donations */}
                {isDonation && <CoinBurst amount={notification.amount || 0} />}

                {/* Icon with bounce */}
                <motion.div
                  className="flex-shrink-0"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {isDonation ? (
                    <div className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center">
                      {iconNode}
                    </div>
                  )}
                </motion.div>

                {/* Text content */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="font-bold text-white text-base"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {notification.senderName}
                    </motion.span>
                    <motion.span
                      className="text-white/80 text-sm"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      {isDonation ? `donated $${notification.amount}` : `sent ${notification.giftName}`}
                    </motion.span>
                  </div>
                  {notification.message && (
                    <motion.p
                      className="text-white/90 text-sm max-w-[220px] truncate"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      "{notification.message}"
                    </motion.p>
                  )}
                </div>

                {/* Sparkle particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-1.5 h-1.5 rounded-full ${isDonation ? 'bg-emerald-200' : 'bg-purple-200'}`}
                    style={{ left: `${10 + Math.random() * 80}%`, top: `${Math.random() * 100}%` }}
                    animate={{
                      y: [0, -30 - Math.random() * 30],
                      x: [(Math.random() - 0.5) * 20],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.3 + i * 0.15,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                ))}
              </motion.div>

              {/* Floating emojis for gifts */}
              {!isDonation && iconNode && (
                <div className="absolute -top-4 left-0 right-0 h-48">
                  {[...Array(4)].map((_, i) => (
                    <FloatingEmoji
                      key={i}
                      icon={iconNode}
                      delay={0.2 + i * 0.3}
                      x={20 + Math.random() * 60}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
