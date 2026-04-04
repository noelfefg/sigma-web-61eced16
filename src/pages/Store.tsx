import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Plus, Star, Package, Zap, Crown, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface StoreItem {
  id: string; title: string; description: string | null; price: number;
  category: string; image_url: string | null; is_active: boolean;
  sold_count: number; created_at: string;
  profiles?: { username: string; display_name: string; avatar_url: string | null };
}

const CATEGORIES = [
  { id: 'all',          label: 'All',          icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { id: 'emotes',       label: 'Emotes',       icon: '😊' },
  { id: 'badges',       label: 'Badges',       icon: <Crown className="w-3.5 h-3.5" /> },
  { id: 'subscription', label: 'Sub Perks',    icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'digital',      label: 'Digital',      icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'overlay',      label: 'Overlays',     icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export default function StorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [showSell, setShowSell] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', price: '', category: 'digital' });
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('store_items')
        .select('*, profiles:seller_id(username, display_name, avatar_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(60);
      setItems((data || []) as StoreItem[]);
    } catch { /* store_items table may not exist yet */ }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(item => {
    const matchQ = !query || item.title.toLowerCase().includes(query.toLowerCase());
    const matchC = category === 'all' || item.category === category;
    return matchQ && matchC;
  });

  const listItem = async () => {
    if (!user || !newItem.title || !newItem.price) return;
    setSubmitting(true);
    try {
      await (supabase as any).from('store_items').insert({
        seller_id: user.id,
        title: newItem.title.trim(),
        description: newItem.description.trim() || null,
        price: parseFloat(newItem.price),
        category: newItem.category,
        is_active: true,
      });
      toast({ title: '🛍️ Item listed!' });
      setShowSell(false);
      setNewItem({ title: '', description: '', price: '', category: 'digital' });
      await fetchItems();
    } catch (e: any) {
      toast({ title: 'Failed to list item', description: e?.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Store</h1>
              <p className="text-xs text-muted-foreground">Digital items, emotes & more</p>
            </div>
          </div>
          {user && (
            <Button
              onClick={() => setShowSell(v => !v)}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />Sell
            </Button>
          )}
        </div>

        {/* Sell form */}
        {showSell && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="p-5 rounded-xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-semibold text-foreground">List a new item</h3>
            <input placeholder="Item title *" value={newItem.title}
              onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none bg-secondary border border-border text-foreground placeholder:text-muted-foreground" />
            <input placeholder="Description (optional)" value={newItem.description}
              onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none bg-secondary border border-border text-foreground placeholder:text-muted-foreground" />
            <div className="flex gap-3">
              <input type="number" placeholder="Price ($) *" value={newItem.price}
                onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} min="0" step="0.01"
                className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none bg-secondary border border-border text-foreground placeholder:text-muted-foreground" />
              <select value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none bg-secondary border border-border text-foreground">
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <Button onClick={listItem} disabled={submitting || !newItem.title || !newItem.price} className="w-full">
              {submitting ? 'Listing…' : 'List Item'}
            </Button>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search store…" value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 h-11 rounded-xl text-sm outline-none bg-card border border-border text-foreground placeholder:text-muted-foreground" />
        </div>

        {/* Categories - VidBox filter style */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                category === cat.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/30'
              }`}>
              {typeof cat.icon === 'string' ? cat.icon : cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items grid - Poster card style */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                <div className="aspect-square bg-secondary animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center gap-3">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/20" />
            <p className="text-sm font-semibold text-foreground">No items found</p>
            <p className="text-xs text-muted-foreground">
              {user ? 'Be the first to list an item!' : 'Items will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl overflow-hidden cursor-pointer group bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="aspect-square flex items-center justify-center relative overflow-hidden bg-secondary">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="text-5xl opacity-30">
                      {item.category === 'emotes' ? '😊' :
                       item.category === 'badges' ? '🏆' :
                       item.category === 'subscription' ? '⚡' :
                       item.category === 'overlay' ? '✨' : '📦'}
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white capitalize">
                    {item.category}
                  </span>
                  {/* Rating badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    <Star className="w-2.5 h-2.5 fill-yellow-400" />
                    {(Math.random() * 2 + 3).toFixed(1)}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-[11px] mt-0.5 text-muted-foreground truncate">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-primary">
                      {item.price === 0 ? 'Free' : `$${item.price.toFixed(2)}`}
                    </span>
                    {item.sold_count > 0 && (
                      <span className="text-[10px] text-muted-foreground">{item.sold_count} sold</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
