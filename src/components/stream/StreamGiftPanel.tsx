import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Coins, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { GiftNotification } from './GiftOverlay';

interface CatalogGift {
  id: string;
  name: string;
  icon: string;
  coin_cost: number;
  rarity: string;
}

interface StreamGiftPanelProps {
  senderName: string;
  recipientId: string;
  contextType?: 'stream' | 'post' | 'short' | 'clan_war';
  contextId?: string;
  onSendGift: (notification: GiftNotification) => void;
}

const RARITY_GLOW: Record<string, string> = {
  common: 'ring-border',
  rare: 'ring-primary/40',
  epic: 'ring-fuchsia-400/50',
  legendary: 'ring-amber-400/60',
};

export function StreamGiftPanel({ senderName, recipientId, contextType = 'stream', contextId, onSendGift }: StreamGiftPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<CatalogGift[]>([]);
  const [coins, setCoins] = useState<number>(0);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('gifts_catalog').select('id,name,icon,coin_cost,rarity').order('coin_cost')
      .then(({ data }) => setCatalog((data as CatalogGift[]) || []));
  }, []);

  useEffect(() => {
    if (!user || !open) return;
    supabase.from('wallets' as any).select('coins').eq('user_id', user.id).maybeSingle()
      .then(({ data }: any) => setCoins(data?.coins ?? 0));
  }, [user, open]);

  const send = async (gift: CatalogGift) => {
    if (!user) { toast({ title: 'Sign in required' }); return; }
    if (coins < gift.coin_cost) {
      toast({ title: 'Not enough coins', description: `Need ${gift.coin_cost}c — you have ${coins}c.`, variant: 'destructive' });
      return;
    }
    setSendingId(gift.id);
    const { error } = await supabase.rpc('send_gift', {
      _recipient: recipientId, _gift_id: gift.id,
      _context_type: contextType, _context_id: contextId ?? null,
    });
    setSendingId(null);
    if (error) { toast({ title: 'Could not send gift', description: error.message, variant: 'destructive' }); return; }
    setCoins(c => c - gift.coin_cost);
    onSendGift({ id: Date.now().toString(), type: 'gift', senderName, giftName: gift.name, giftIcon: gift.icon });
    toast({ title: `Sent ${gift.name}`, description: `${gift.coin_cost}c spent` });
  };

  return (
    <div className="relative">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button variant="secondary" size="sm" onClick={() => setOpen(o => !o)} className="gap-1.5 rounded-full h-9">
          <Gift className="w-4 h-4 text-pink-500" /> Send Gift
        </Button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 right-0 w-80 bg-card border border-border rounded-2xl shadow-2xl p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Send a gift</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                <Coins className="w-3.5 h-3.5" /> {coins.toLocaleString()}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {!user ? (
              <Link to="/auth" className="block">
                <Button className="w-full gap-2"><LogIn className="w-4 h-4" />Sign in to send gifts</Button>
              </Link>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {catalog.map((g, i) => {
                    const affordable = coins >= g.coin_cost;
                    return (
                      <motion.button
                        key={g.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={!affordable || sendingId === g.id}
                        onClick={() => send(g)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl bg-secondary/40 ring-1 ${RARITY_GLOW[g.rarity] || 'ring-border'} hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <span className="text-2xl leading-none">{g.icon}</span>
                        <span className="text-[10px] font-semibold text-foreground truncate w-full text-center">{g.name}</span>
                        <span className="text-[10px] flex items-center gap-0.5 text-amber-400 font-bold">
                          <Coins className="w-2.5 h-2.5" />{g.coin_cost}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-3">
                  Gifts spend coins from your wallet. Top-up coming soon.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
