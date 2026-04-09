import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Heart, Star, Sparkles, Flame, Zap, Diamond, Crown, Trophy, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GiftNotification } from './GiftOverlay';
import roseImg from '@/assets/gifts/rose.png';
import flameHeartImg from '@/assets/gifts/flame-heart.png';
import ggImg from '@/assets/gifts/gg.png';
import awesomeCatImg from '@/assets/gifts/awesome-cat.png';

interface GiftItem {
  name: string;
  icon: string;
  price: number;
  color: string;
  image?: string;
  IconComp?: React.ComponentType<any>;
}

const gifts: GiftItem[] = [
  { name: 'Rose', icon: 'rose', price: 1, color: '#ec4899', image: roseImg },
  { name: 'Flame Heart', icon: 'flame-heart', price: 5, color: '#f97316', image: flameHeartImg },
  { name: 'GG', icon: 'gg', price: 10, color: '#a855f7', image: ggImg },
  { name: 'Awesome', icon: 'awesome', price: 25, color: '#facc15', image: awesomeCatImg },
  { name: 'Zap', icon: 'zap', price: 50, color: '#facc15', IconComp: Zap },
  { name: 'Diamond', icon: 'diamond', price: 100, color: '#06b6d4', IconComp: Diamond },
  { name: 'Crown', icon: 'crown', price: 250, color: '#f59e0b', IconComp: Crown },
  { name: 'Trophy', icon: 'trophy', price: 500, color: '#eab308', IconComp: Trophy },
];

interface StreamGiftPanelProps {
  senderName: string;
  onSendGift: (notification: GiftNotification) => void;
}

export function StreamGiftPanel({ senderName, onSendGift }: StreamGiftPanelProps) {
  const [open, setOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMsg, setDonationMsg] = useState('');

  const sendGift = (gift: typeof gifts[0]) => {
    onSendGift({
      id: Date.now().toString(),
      type: 'gift',
      senderName,
      giftName: gift.name,
      giftIcon: gift.icon,
    });
  };

  const sendDonation = () => {
    const amount = parseFloat(donationAmount);
    if (!amount || amount <= 0) return;
    onSendGift({
      id: Date.now().toString(),
      type: 'donation',
      senderName,
      amount,
      message: donationMsg || undefined,
    });
    setDonationAmount('');
    setDonationMsg('');
  };

  return (
    <div className="relative">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(!open)}
          className="gap-1.5"
        >
          <Gift className="w-4 h-4 text-pink-500" />
          Send Gift
        </Button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 right-0 w-72 bg-card border border-border rounded-2xl shadow-xl p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Send a Gift</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Gift Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {gifts.map((gift, i) => (
                <motion.button
                  key={gift.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => sendGift(gift)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-accent transition-colors"
                >
                  {gift.image ? (
                    <img src={gift.image} alt={gift.name} className="w-8 h-8 object-contain" />
                  ) : gift.IconComp ? (
                    <gift.IconComp className="w-6 h-6" style={{ color: gift.color }} fill={gift.color} />
                  ) : null}
                  <span className="text-[10px] text-muted-foreground">{gift.price}c</span>
                </motion.button>
              ))}
            </div>

            {/* Donation */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
                <Button size="sm" className="h-8" onClick={sendDonation}>Donate</Button>
              </div>
              <Input
                placeholder="Add a message (optional)"
                value={donationMsg}
                onChange={(e) => setDonationMsg(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
