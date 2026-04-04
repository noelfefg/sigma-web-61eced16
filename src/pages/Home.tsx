import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Users, Video, Sparkles, Play, TrendingUp, Flame, CheckCircle, Star, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface Stream {
  id: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string | null;
  category_id: string | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  categories: {
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

function formatViewerCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const tagOptions = [
  ['coding', 'react', 'typescript'],
  ['production', 'beats', 'chill'],
  ['digital', 'illustration', 'art'],
  ['gaming', 'fps', 'competitive'],
  ['irl', 'travel', 'vlog'],
  ['music', 'live', 'acoustic'],
];

const streamTags: Record<string, string[]> = {};

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: streams }, { data: cats }] = await Promise.all([
        supabase
          .from('streams')
          .select('id, title, viewer_count, thumbnail_url, category_id, profiles!inner(username, display_name, avatar_url), categories(name)')
          .eq('is_live', true)
          .order('viewer_count', { ascending: false })
          .limit(20),
        supabase
          .from('categories')
          .select('id, name, slug, image_url')
          .order('name')
          .limit(12),
      ]);
      if (streams) {
        const s = streams as unknown as Stream[];
        s.forEach((stream, i) => {
          streamTags[stream.id] = tagOptions[i % tagOptions.length];
        });
        setLiveStreams(s);
      }
      if (cats) setCategories(cats);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-destructive" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Live Now</h1>
              <p className="text-xs text-muted-foreground">Discover what's streaming</p>
            </div>
          </div>
          {liveStreams.length > 0 && (
            <span className="text-xs font-semibold text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
              {liveStreams.length} live
            </span>
          )}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-video rounded-xl" />
                <div className="flex gap-3">
                  <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Streams Grid - Modern poster-style cards */}
        {!loading && liveStreams.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {liveStreams.map((stream) => (
              <motion.div key={stream.id} variants={cardVariants}>
                <Link to={`/watch/${stream.profiles.username}`} className="group block">
                  <div className="rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      {stream.thumbnail_url ? (
                        <img
                          src={stream.thumbnail_url}
                          alt={stream.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-accent/10 flex items-center justify-center">
                          <Video className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                      )}

                      {/* LIVE Badge + Viewers overlay */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          LIVE
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatViewerCount(stream.viewer_count)}
                      </div>

                      {/* Hover play overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-80 transition-opacity duration-300 drop-shadow-lg" fill="white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex gap-2.5">
                        <div className="flex-shrink-0 mt-0.5">
                          {stream.profiles.avatar_url ? (
                            <img
                              src={stream.profiles.avatar_url}
                              alt={stream.profiles.display_name}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-destructive/40"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center ring-2 ring-destructive/40">
                              <span className="text-xs font-bold text-muted-foreground">
                                {stream.profiles.display_name[0]?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {stream.title}
                          </h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-muted-foreground truncate">{stream.profiles.display_name}</span>
                            <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          </div>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                            {stream.categories?.name || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      {/* Tags */}
                      {streamTags[stream.id] && (
                        <div className="flex gap-1.5 mt-2.5 flex-wrap">
                          {streamTags[stream.id].map(tag => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Categories - Modern poster grid */}
        {!loading && categories.length > 0 && (
          <motion.section initial="hidden" animate="visible" variants={containerVariants}>
            <motion.div variants={cardVariants} className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Categories</h2>
                  <p className="text-xs text-muted-foreground">Browse by interest</p>
                </div>
              </div>
              <Link to="/browse">
                <span className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">
                  View All →
                </span>
              </Link>
            </motion.div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={cardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Link to={`/browse?category=${cat.slug}`} className="group block">
                    <div className="rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
                      <div className="aspect-[3/4] bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative overflow-hidden">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <span className="text-3xl font-black text-muted-foreground/20">{cat.name[0]}</span>
                        )}
                        {/* Bottom gradient */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{cat.name}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Empty state */}
        {!loading && liveStreams.length === 0 && categories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 border border-border/50">
                <Sparkles className="w-10 h-10 text-primary/50" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to SIGMA</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              No one's live right now — be the first to start streaming!
            </p>
            <Link to="/go-live">
              <motion.button
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Video className="w-4 h-4" />
                Go Live Now
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
