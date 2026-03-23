import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { LottieIcon, LottieEmptyState } from '@/components/animations/LottieIcon';

interface Stream {
  id: string; title: string; viewer_count: number; thumbnail_url: string | null;
  profiles: { username: string; display_name: string; avatar_url: string | null };
  categories: { name: string; slug: string } | null;
  tags?: string[];
}
interface Category { id: string; name: string; slug: string; }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`;
  return String(n);
}

// Tags per category slug (dynamic feel like the screenshot)
const CAT_TAGS: Record<string, string[]> = {
  gaming:        ['fps', 'competitive', 'gameplay'],
  music:         ['production', 'beats', 'chill'],
  art:           ['digital', 'illustration', 'drawing'],
  technology:    ['coding', 'react', 'typescript'],
  sports:        ['fitness', 'training', 'live'],
  education:     ['tutorial', 'learn', 'tips'],
  cooking:       ['recipes', 'food', 'chef'],
  entertainment: ['fun', 'variety', 'talk'],
  science:       ['research', 'experiments', 'stem'],
  fashion:       ['style', 'trends', 'ootd'],
};

const CAT_ANIM: Record<string, any> = {
  gaming: 'gamepad', music: 'music', art: 'art', sports: 'trophy',
  science: 'lightning', cooking: 'fire', fashion: 'sparkle',
  education: 'analytics', technology: 'signal', entertainment: 'play',
};

// ── Kick/mobile style stream card ────────────────────────────────────────────
function StreamCard({ stream, i }: { stream: Stream; i: number }) {
  const [imgError, setImgError] = useState(false);
  const tags = CAT_TAGS[stream.categories?.slug || ''] || ['live', 'stream', 'sigma'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
      className="mb-1"
    >
      <Link to={`/watch/${stream.profiles.username}`} style={{ textDecoration: 'none' }}>
        {/* ── Streamer info row ── */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
          {/* Avatar with red live ring */}
          <div className="relative shrink-0">
            <div className="rounded-full p-[2.5px]" style={{ background: 'linear-gradient(135deg, #e91916, #ff4444)' }}>
              <Avatar className="w-[52px] h-[52px] rounded-full" style={{ border: '2px solid #0a0a0a' }}>
                <AvatarImage src={stream.profiles.avatar_url || ''} />
                <AvatarFallback style={{ background: '#1a1a2e', color: '#1a56db', fontWeight: 900, fontSize: 20 }}>
                  {stream.profiles.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Live pulse dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full animate-pulse"
              style={{ background: '#e91916', border: '2px solid #0a0a0a' }} />
          </div>

          {/* Name + category + tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-[15px] truncate" style={{ color: '#ffffff' }}>
                {stream.title}
              </h3>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-sm font-semibold truncate" style={{ color: '#d0d0d0' }}>
                {stream.profiles.display_name}
              </span>
              {/* Verified checkmark */}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="7.5" fill="#1a56db"/>
                <path d="M4.5 7.5L6.5 9.5L10.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-xs mb-2" style={{ color: '#888' }}>
              {stream.categories?.name || 'Live'}
            </p>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Thumbnail ── */}
        <div className="relative mx-4 mb-4 rounded-xl overflow-hidden"
          style={{ aspectRatio: '16/9', background: '#111' }}>

          {stream.thumbnail_url && !imgError ? (
            <img
              src={stream.thumbnail_url}
              alt={stream.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            /* Gradient placeholder with streamer identity */
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #0a1628 100%)` }}>
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, #1a56db 0, #1a56db 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #1a56db 0, #1a56db 1px, transparent 0, transparent 50%)', backgroundSize: '40px 40px' }} />
              <Avatar className="w-16 h-16 rounded-full ring-2 ring-white/10 z-10">
                <AvatarImage src={stream.profiles.avatar_url || ''} />
                <AvatarFallback style={{ background: '#0d1b3e', color: '#1a56db', fontWeight: 900, fontSize: 24 }}>
                  {stream.profiles.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs font-semibold z-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {stream.profiles.display_name} is LIVE
              </p>
              <div className="z-10">
                <LottieIcon name={CAT_ANIM[stream.categories?.slug || ''] || 'broadcast'} size={32} loop autoplay />
              </div>
            </div>
          )}

          {/* LIVE badge — top left, red pill */}
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-[3px] rounded"
            style={{ background: '#e91916', fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>
            LIVE
          </div>

          {/* Viewer count — top right, dark pill with icon */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-[3px] rounded"
            style={{ background: 'rgba(0,0,0,0.75)', fontSize: 11, fontWeight: 600, color: '#fff' }}>
            <Users className="w-3 h-3" />
            {fmt(stream.viewer_count)}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [{ data: cats }, { data: sd }] = await Promise.all([
          supabase.from('categories').select('*').order('name').limit(16),
          supabase.from('streams')
            .select('id,title,viewer_count,thumbnail_url,profiles(username,display_name,avatar_url),categories(name,slug)')
            .eq('is_live', true).order('viewer_count', { ascending: false }).limit(30),
        ]);
        setCategories(cats || []);
        setStreams((sd || []) as any);
      } catch {}
      setLoading(false);
    };
    loadData();

    // Realtime updates
    const ch = supabase.channel('home-streams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streams' }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = activeCategory === 'all' ? streams
    : streams.filter(s => s.categories?.slug === activeCategory);

  return (
    <AppLayout>
      <div style={{ background: '#0a0a0a', minHeight: '100%' }}>

        {/* ── Category filter pills ── */}
        <div className="sticky top-0 z-10 px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar"
          style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {[{ id: 'all', name: 'All', slug: 'all' }, ...categories].map(cat => (
            <motion.button key={cat.id} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.slug)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeCategory === cat.slug ? '#1a56db' : '#1a1a1a',
                color: activeCategory === cat.slug ? '#fff' : '#888',
                border: `1px solid ${activeCategory === cat.slug ? '#1a56db' : '#2a2a2a'}`,
              }}>
              {cat.slug !== 'all' && <LottieIcon name={(CAT_ANIM[cat.slug] || 'play') as any} size={13} loop autoplay />}
              {cat.name}
            </motion.button>
          ))}
        </div>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#e91916' }} />
            <span className="text-sm font-bold" style={{ color: '#efeff1' }}>
              Live Channels
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full tabular-nums"
              style={{ background: '#1a1a1a', color: '#666' }}>{filtered.length}</span>
          </div>
          <Link to="/browse" className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#1a56db' }}>
            Browse all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Stream list ── */}
        {loading ? (
          /* Skeleton loaders matching the card layout */
          <div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                  <div className="w-14 h-14 rounded-full shrink-0" style={{ background: '#1a1a1a' }} />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 rounded-full w-3/4" style={{ background: '#1a1a1a' }} />
                    <div className="h-3 rounded-full w-1/2" style={{ background: '#1a1a1a' }} />
                    <div className="h-3 rounded-full w-1/3" style={{ background: '#1a1a1a' }} />
                    <div className="flex gap-1.5">
                      {[1,2,3].map(j => <div key={j} className="h-5 w-12 rounded-full" style={{ background: '#1a1a1a' }} />)}
                    </div>
                  </div>
                </div>
                <div className="mx-4 mb-4 rounded-xl" style={{ background: '#1a1a1a', aspectRatio: '16/9' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <LottieEmptyState
            name="broadcast"
            title="No one is live right now"
            description="Be the first to go live on SIGMA!"
            action={
              <Link to="/go-live">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#1a56db', color: '#fff' }}>
                  <LottieIcon name="broadcast" size={18} loop autoplay />Go Live
                </motion.button>
              </Link>
            }
          />
        ) : (
          /* Divider between cards */
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {filtered.map((s, i) => (
              <div key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <StreamCard stream={s} i={i} />
              </div>
            ))}
          </div>
        )}

        {/* ── Go Live CTA ── */}
        {!loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mx-4 my-6 flex items-center justify-between p-4 rounded-xl"
            style={{ background: '#0d1b3e', border: '1px solid #1a2d5a' }}>
            <div className="flex items-center gap-3">
              <LottieIcon name="broadcast" size={36} loop autoplay />
              <div>
                <p className="text-sm font-bold" style={{ color: '#efeff1' }}>Start streaming</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>Go live in seconds</p>
              </div>
            </div>
            <Link to="/go-live">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="px-4 py-2 rounded-lg text-sm font-bold"
                style={{ background: '#1a56db', color: '#fff' }}>
                Go Live
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
