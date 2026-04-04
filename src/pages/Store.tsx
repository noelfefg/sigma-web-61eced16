/**
 * Store.tsx - SIGMA Store
 * Users can browse and sell digital items, badges, emotes, subscriptions.
 * Sellers list items, buyers browse by category.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Plus, Star, Tag, Package, Zap, Crown, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

const CAT_COLORS: Record<string, string> = {
  emotes: '#f59e0b', badges: '#8b5cf6', subscription: '#06b6d4',
  digital: '#10b981', overlay: '#ec4899', all: '#6b7280',
};

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
      <div className="max-w-4xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">SIGMA Store</h1>
              <p className="text-xs" style={{ color: '#6b7280' }}>Digital items, emotes & more</p>
            </div>
          </div>
          {user && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setShowSell(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#1a1a1a', color: '#e5e7eb', border: '1px solid #2a2a2a' }}>
              <Plus className="w-4 h-4" />Sell
            </motion.button>
          )}
        </div>

        {/* Sell form */}
        {showSell && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-5 rounded-2xl space-y-3"
            style={{ background: '#111', border: '1px solid #1f1f1f' }}>
            <h3 className="text-sm font-bold text-white mb-3">List a new item</h3>
            <input placeholder="Item title *" value={newItem.title}
              onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e5e7eb' }} />
            <input placeholder="Description (optional)" value={newItem.description}
              onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e5e7eb' }} />
            <div className="flex gap-3">
              <input type="number" placeholder="Price ($) *" value={newItem.price}
                onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} min="0" step="0.01"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e5e7eb' }} />
              <select value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e5e7eb' }}>
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={listItem} disabled={submitting || !newItem.title || !newItem.price}
              className="w-full py-3 rounded-xl text-sm font-black disabled:opacity-40"
              style={{ background: '#e5e7eb', color: '#000' }}>
              {submitting ? 'Listing…' : 'List Item'}
            </motion.button>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#555' }} />
          <input placeholder="Search store…" value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#111', border: '1px solid #1f1f1f', color: '#e5e7eb' }} />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: category === cat.id ? '#e5e7eb' : '#1a1a1a',
                color: category === cat.id ? '#000' : '#6b7280',
                border: `1px solid ${category === cat.id ? '#e5e7eb' : '#2a2a2a'}`,
              }}>
              {typeof cat.icon === 'string' ? cat.icon : cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl" style={{ background: '#111', height: 180 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <ShoppingBag className="w-16 h-16" style={{ color: '#1f1f1f' }} />
            <p className="text-sm font-bold text-white">No items found</p>
            <p className="text-xs" style={{ color: '#555' }}>
              {user ? 'Be the first to list an item!' : 'Items will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl overflow-hidden cursor-pointer group"
                style={{ background: '#111', border: '1px solid #1f1f1f' }}>
                {/* Item image */}
                <div className="aspect-square flex items-center justify-center relative overflow-hidden"
                  style={{ background: `${CAT_COLORS[item.category]}15` }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-5xl" style={{ color: CAT_COLORS[item.category] }}>
                      {item.category === 'emotes' ? '😊' :
                       item.category === 'badges' ? '🏆' :
                       item.category === 'subscription' ? '⚡' :
                       item.category === 'overlay' ? '✨' : '📦'}
                    </div>
                  )}
                  {/* Category tag */}
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ background: `${CAT_COLORS[item.category]}30`, color: CAT_COLORS[item.category] }}>
                    {item.category}
                  </span>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: '#6b7280' }}>{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-black" style={{ color: '#e5e7eb' }}>
                      {item.price === 0 ? 'Free' : `$${item.price.toFixed(2)}`}
                    </span>
                    {item.sold_count > 0 && (
                      <span className="text-[10px]" style={{ color: '#555' }}>{item.sold_count} sold</span>
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
