import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, DollarSign, Heart, Star, Sparkles, Crown, Flame, Zap, Diamond, Trophy } from 'lucide-react';
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
  id: string; username: string; amount: number; message: string; timestamp: string; type: 'gift' | 'donation'; giftId?: string;
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 20, stiffness: 300 } } };

export default function GiftsPage() {
  const { user } = useAuth();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'gifts' | 'donate'>('gifts');
  const [sendingGift, setSendingGift] = useState(false);
  const [liveFeed, setLiveFeed] = useState<LiveDonation[]>([]);

  const handleSendGift = (giftId: string) => {
    if (!user) return;
    setSendingGift(true);
    const gift = giftItems.find(g => g.id === giftId);
    setLiveFeed(prev => [{ id: Date.now().toString(), username: 'You', amount: gift?.price || 0, message: donationMessage, timestamp: 'Just now', type: 'gift', giftId }, ...prev]);
    setTimeout(() => { setSendingGift(false); setSelectedGift(null); setDonationMessage(''); }, 800);
  };

  const handleDonate = (amount: number) => {
    if (!user) return;
    setSendingGift(true);
    setLiveFeed(prev => [{ id: Date.now().toString(), username: 'You', amount, message: donationMessage, timestamp: 'Just now', type: 'donation' }, ...prev]);
    setTimeout(() => { setSendingGift(false); setCustomAmount(''); setDonationMessage(''); }, 800);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background py-6">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-3 mb-3">
              <Gift className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-foreground">Support Streamers</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">Show your appreciation with gifts and donations</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-6">
            {(['gifts', 'donate'] as const).map((tab) => (
              <Button key={tab} variant={activeTab === tab ? 'default' : 'secondary'} onClick={() => setActiveTab(tab)} size="sm" className="rounded-full px-5">
                {tab === 'gifts' ? <Gift className="w-4 h-4 mr-1" /> : <DollarSign className="w-4 h-4 mr-1" />}
                {tab === 'gifts' ? 'Virtual Gifts' : 'Donations'}
              </Button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <AnimatePresence mode="wait">
                {activeTab === 'gifts' && (
                  <motion.div key="gifts" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-card rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" />Virtual Gifts</h2>
                    <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3" variants={containerVariants} initial="hidden" animate="visible">
                      {giftItems.map((gift) => {
                        const Icon = gift.icon;
                        const isSelected = selectedGift === gift.id;
                        return (
                          <motion.button key={gift.id} variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedGift(gift.id)}
                            className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-purple-500/15 ring-2 ring-purple-500' : 'bg-secondary/50 hover:bg-secondary'}`}>
                            <div className="flex flex-col items-center gap-1.5">
                              <Icon className={`w-8 h-8 ${gift.color}`} />
                              <span className="text-xs font-medium text-foreground">{gift.name}</span>
                              <span className="text-[11px] text-muted-foreground">${gift.price}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                    {user ? (
                      <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" size="sm" disabled={!selectedGift || sendingGift} onClick={() => selectedGift && handleSendGift(selectedGift)}>
                        {sendingGift ? 'Sending...' : <><Gift className="w-4 h-4 mr-1" />Send Gift</>}
                      </Button>
                    ) : (
                      <Link to="/auth" className="block mt-4"><Button variant="secondary" className="w-full" size="sm">Sign in to send gifts</Button></Link>
                    )}
                  </motion.div>
                )}

                {activeTab === 'donate' && (
                  <motion.div key="donate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-yellow-500" />Send a Donation</h2>
                    <motion.div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4" variants={containerVariants} initial="hidden" animate="visible">
                      {donationPresets.map((amount) => (
                        <motion.div key={amount} variants={itemVariants}>
                          <Button variant="secondary" size="sm" onClick={() => setCustomAmount(amount.toString())} className={`w-full text-xs ${customAmount === amount.toString() ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : ''}`}>${amount}</Button>
                        </motion.div>
                      ))}
                    </motion.div>
                    <div className="mb-3"><label className="text-xs text-muted-foreground mb-1 block">Custom amount</label><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" /><Input type="number" placeholder="0.00" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="pl-8 bg-secondary text-sm h-9" min="1" /></div></div>
                    <div className="mb-4"><label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label><Input placeholder="Write something nice..." value={donationMessage} onChange={(e) => setDonationMessage(e.target.value)} className="bg-secondary text-sm h-9" maxLength={200} /></div>
                    {user ? (
                      <Button className="w-full bg-yellow-600 hover:bg-yellow-700" size="sm" disabled={!customAmount || parseFloat(customAmount) <= 0 || sendingGift} onClick={() => handleDonate(parseFloat(customAmount))}>
                        {sendingGift ? 'Sending...' : <><DollarSign className="w-4 h-4 mr-1" />Donate ${customAmount || '0'}</>}
                      </Button>
                    ) : (
                      <Link to="/auth" className="block"><Button variant="secondary" className="w-full" size="sm">Sign in to donate</Button></Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live Feed */}
              {liveFeed.length > 0 && (
                <div className="bg-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" />Recent Activity</h3>
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {liveFeed.slice(0, 5).map((donation) => {
                        const giftItem = donation.giftId ? giftItems.find(g => g.id === donation.giftId) : null;
                        const GiftIcon = giftItem?.icon;
                        return (
                          <motion.div key={donation.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                              {donation.type === 'gift' && GiftIcon ? <GiftIcon className={`w-4 h-4 ${giftItem?.color}`} /> : <DollarSign className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-foreground">{donation.username}</span>
                              <span className="text-xs text-yellow-500 font-semibold ml-1">${donation.amount}</span>
                              {donation.message && <p className="text-[11px] text-muted-foreground truncate">{donation.message}</p>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-600/5 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">How it works</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {['Choose a gift or donation amount', 'Add an optional message', 'Your support appears live on stream', '100% goes directly to the creator'].map((text, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-purple-400">•</span>{text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
