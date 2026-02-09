import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  DollarSign, 
  Heart, 
  Star, 
  Sparkles, 
  Crown,
  Flame,
  Zap,
  Diamond,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const giftItems = [
  { id: 'heart', name: 'Heart', icon: Heart, price: 1, color: 'text-red-500' },
  { id: 'star', name: 'Star', icon: Star, price: 5, color: 'text-yellow-400' },
  { id: 'sparkle', name: 'Sparkle', icon: Sparkles, price: 10, color: 'text-purple-400' },
  { id: 'flame', name: 'Flame', icon: Flame, price: 25, color: 'text-orange-500' },
  { id: 'zap', name: 'Lightning', icon: Zap, price: 50, color: 'text-blue-400' },
  { id: 'diamond', name: 'Diamond', icon: Diamond, price: 100, color: 'text-cyan-400' },
  { id: 'crown', name: 'Crown', icon: Crown, price: 250, color: 'text-amber-400' },
  { id: 'trophy', name: 'Trophy', icon: Trophy, price: 500, color: 'text-yellow-500' },
];

const donationPresets = [5, 10, 25, 50, 100, 500];

interface LiveDonation {
  id: string;
  username: string;
  amount: number;
  message: string;
  timestamp: string;
  type: 'gift' | 'donation';
  giftId?: string;
}

const mockLiveFeed: LiveDonation[] = [
  { id: '1', username: 'supporter123', amount: 50, message: 'Love your streams!', timestamp: '2 mins ago', type: 'donation' },
  { id: '2', username: 'bigfan', amount: 100, message: 'Amazing content!', timestamp: '5 mins ago', type: 'gift', giftId: 'diamond' },
  { id: '3', username: 'viewer42', amount: 25, message: '', timestamp: '12 mins ago', type: 'donation' },
  { id: '4', username: 'anonymous', amount: 10, message: 'Great stream!', timestamp: '20 mins ago', type: 'gift', giftId: 'sparkle' },
];

const topDonors = [
  { username: 'megafan', total: 2500, rank: 1 },
  { username: 'superfan', total: 1800, rank: 2 },
  { username: 'supporter123', total: 1200, rank: 3 },
  { username: 'viewer99', total: 850, rank: 4 },
  { username: 'donator', total: 600, rank: 5 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 20, stiffness: 300 } },
};

const feedItemVariants = {
  initial: { opacity: 0, x: -40, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring' as const, damping: 18, stiffness: 250 } },
  exit: { opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.3 } },
};

export default function GiftsPage() {
  const { user } = useAuth();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'gifts' | 'donate'>('gifts');
  const [sendingGift, setSendingGift] = useState(false);
  const [liveFeed, setLiveFeed] = useState<LiveDonation[]>(mockLiveFeed);

  const handleSendGift = (giftId: string) => {
    if (!user) return;
    setSendingGift(true);
    const gift = giftItems.find(g => g.id === giftId);
    const newDonation: LiveDonation = {
      id: Date.now().toString(),
      username: 'You',
      amount: gift?.price || 0,
      message: donationMessage,
      timestamp: 'Just now',
      type: 'gift',
      giftId,
    };
    setLiveFeed(prev => [newDonation, ...prev]);
    setTimeout(() => {
      setSendingGift(false);
      setSelectedGift(null);
      setDonationMessage('');
    }, 800);
  };

  const handleDonate = (amount: number) => {
    if (!user) return;
    setSendingGift(true);
    const newDonation: LiveDonation = {
      id: Date.now().toString(),
      username: 'You',
      amount,
      message: donationMessage,
      timestamp: 'Just now',
      type: 'donation',
    };
    setLiveFeed(prev => [newDonation, ...prev]);
    setTimeout(() => {
      setSendingGift(false);
      setCustomAmount('');
      setDonationMessage('');
    }, 800);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <motion.div
              className="inline-flex items-center gap-3 mb-4"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Gift className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold text-foreground">Support Streamers</h1>
            </motion.div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Show your appreciation with gifts and donations. Every contribution helps creators!
            </p>
          </motion.div>

          {/* Tab Switcher */}
          <motion.div
            className="flex justify-center gap-2 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {(['gifts', 'donate'] as const).map((tab) => (
              <motion.div key={tab} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={activeTab === tab ? 'default' : 'secondary'}
                  onClick={() => setActiveTab(tab)}
                  className="px-6 relative overflow-hidden"
                >
                  {tab === 'gifts' ? <Gift className="w-4 h-4 mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                  {tab === 'gifts' ? 'Virtual Gifts' : 'Donations'}
                  {activeTab === tab && (
                    <motion.div
                      className="absolute inset-0 bg-white/10 rounded"
                      layoutId="activeTab"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Section */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === 'gifts' && (
                  <motion.div
                    key="gifts"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Virtual Gifts
                    </h2>

                    <motion.div
                      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {giftItems.map((gift) => {
                        const IconComponent = gift.icon;
                        const isSelected = selectedGift === gift.id;
                        return (
                          <motion.button
                            key={gift.id}
                            variants={itemVariants}
                            whileHover={{ scale: 1.08, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedGift(gift.id)}
                            className={`relative p-4 rounded-xl border-2 transition-colors ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-border bg-secondary/50 hover:border-muted-foreground'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <motion.div
                                animate={isSelected ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] } : {}}
                                transition={{ duration: 0.5 }}
                              >
                                <IconComponent className={`w-10 h-10 ${gift.color}`} />
                              </motion.div>
                              <span className="font-medium text-foreground">{gift.name}</span>
                              <span className="text-sm text-muted-foreground">${gift.price}</span>
                            </div>
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                                >
                                  <span className="text-xs text-white">✓</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </motion.div>

                    {user ? (
                      <motion.div whileTap={{ scale: 0.98 }} className="mt-6">
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 relative overflow-hidden"
                          disabled={!selectedGift || sendingGift}
                          onClick={() => selectedGift && handleSendGift(selectedGift)}
                        >
                          {sendingGift ? (
                            <motion.span
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2"
                            >
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                <Sparkles className="w-4 h-4" />
                              </motion.div>
                              Sending...
                            </motion.span>
                          ) : (
                            <span className="flex items-center gap-2"><Gift className="w-4 h-4" /> Send Gift</span>
                          )}
                        </Button>
                      </motion.div>
                    ) : (
                      <Link to="/auth" className="block mt-6">
                        <Button variant="secondary" className="w-full">Sign in to send gifts</Button>
                      </Link>
                    )}
                  </motion.div>
                )}

                {activeTab === 'donate' && (
                  <motion.div
                    key="donate"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-500" />
                      Send a Donation
                    </h2>

                    <motion.div
                      className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {donationPresets.map((amount) => (
                        <motion.div key={amount} variants={itemVariants} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}>
                          <Button
                            variant="secondary"
                            onClick={() => setCustomAmount(amount.toString())}
                            className={`w-full relative ${
                              customAmount === amount.toString() ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : ''
                            }`}
                          >
                            ${amount}
                            {customAmount === amount.toString() && (
                              <motion.div
                                className="absolute inset-0 rounded-md bg-yellow-400/10"
                                initial={{ scale: 0 }}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.div className="mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                      <label className="text-sm text-muted-foreground mb-2 block">Or enter custom amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" placeholder="0.00" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="pl-9 bg-secondary border-border" min="1" />
                      </div>
                    </motion.div>

                    <motion.div className="mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                      <label className="text-sm text-muted-foreground mb-2 block">Add a message (optional)</label>
                      <Input placeholder="Write something nice..." value={donationMessage} onChange={(e) => setDonationMessage(e.target.value)} className="bg-secondary border-border" maxLength={200} />
                      <p className="text-xs text-muted-foreground mt-1">{donationMessage.length}/200 characters</p>
                    </motion.div>

                    {user ? (
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          className="w-full bg-yellow-600 hover:bg-yellow-700 relative overflow-hidden"
                          disabled={!customAmount || parseFloat(customAmount) <= 0 || sendingGift}
                          onClick={() => handleDonate(parseFloat(customAmount))}
                        >
                          {sendingGift ? (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                <DollarSign className="w-4 h-4" />
                              </motion.div>
                              Sending...
                            </motion.span>
                          ) : (
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Donate ${customAmount || '0'}</span>
                          )}
                        </Button>
                      </motion.div>
                    ) : (
                      <Link to="/auth" className="block">
                        <Button variant="secondary" className="w-full">Sign in to donate</Button>
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live Donation Feed */}
              <motion.div
                className="bg-card border border-border rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Flame className="w-5 h-5 text-orange-500" />
                  </motion.div>
                  Live Donation Feed
                  <motion.span
                    className="ml-2 w-2 h-2 rounded-full bg-green-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </h3>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {liveFeed.map((donation) => {
                      const giftItem = donation.giftId ? giftItems.find(g => g.id === donation.giftId) : null;
                      const GiftIcon = giftItem?.icon;
                      return (
                        <motion.div
                          key={donation.id}
                          variants={feedItemVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          layout
                          className={`flex items-start gap-4 p-3 rounded-lg relative overflow-hidden ${
                            donation.timestamp === 'Just now'
                              ? 'bg-purple-500/10 border border-purple-500/20'
                              : 'bg-secondary/50'
                          }`}
                        >
                          {donation.timestamp === 'Just now' && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent"
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ duration: 1.5, ease: 'easeInOut' }}
                            />
                          )}
                          <motion.div
                            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0"
                            initial={donation.timestamp === 'Just now' ? { scale: 0, rotate: -180 } : {}}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 12 }}
                          >
                            {donation.type === 'gift' && GiftIcon ? (
                              <GiftIcon className={`w-5 h-5 ${giftItem?.color}`} />
                            ) : (
                              <DollarSign className="w-5 h-5 text-yellow-500" />
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0 relative z-10">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{donation.username}</span>
                              <motion.span
                                className="text-yellow-500 font-semibold"
                                initial={donation.timestamp === 'Just now' ? { scale: 0 } : {}}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                              >
                                ${donation.amount}
                              </motion.span>
                              {donation.type === 'gift' && giftItem && (
                                <span className="text-xs text-muted-foreground">({giftItem.name})</span>
                              )}
                            </div>
                            {donation.message && (
                              <p className="text-sm text-muted-foreground truncate">{donation.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{donation.timestamp}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, type: 'spring', damping: 20 }}
            >
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Supporters
                </h3>
                <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                  {topDonors.map((donor) => (
                    <motion.div
                      key={donor.username}
                      variants={itemVariants}
                      whileHover={{ x: 4, transition: { duration: 0.2 } }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <motion.div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          donor.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                          donor.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                          donor.rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                          'bg-accent text-muted-foreground'
                        }`}
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                      >
                        #{donor.rank}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{donor.username}</p>
                        <p className="text-sm text-muted-foreground">${donor.total.toLocaleString()} total</p>
                      </div>
                      {donor.rank <= 3 && (
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: donor.rank * 0.3 }}
                        >
                          <Crown className={`w-5 h-5 ${
                            donor.rank === 1 ? 'text-yellow-500' :
                            donor.rank === 2 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                className="bg-gradient-to-br from-purple-900/30 to-purple-600/10 border border-purple-500/30 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-3">How it works</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    'Choose a gift or enter a donation amount',
                    'Add an optional message for the streamer',
                    'Your support appears live on stream',
                    '100% goes directly to the creator',
                  ].map((text, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <span className="text-purple-400">•</span>
                      {text}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
