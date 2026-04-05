import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Users, Video, Sparkles, Play, TrendingUp, Flame, CheckCircle, Star, Clock, Zap, Crown } from 'lucide-react';
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
    transition: { staggerChildren: 0.04, delayChildren: 0.01 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (streams) setLiveStreams(streams as unknown as Stream[]);
      if (cats) setCategories(cats);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 space-y-6">

        {/* Featured Hero Banner */}
        {!loading && liveStreams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Link to={`/watch/${liveStreams[0].profiles.username}`} className="block group">
              <div className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[3/1]">
                {liveStreams[0].thumbnail_url ? (
                  <img src={liveStreams[0].thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-accent/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                <div className="relative h-full flex flex-col justify-end p-5 md:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-destructive text-destructive-foreground text-[11px] font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Live
                    </span>
                    <span className="bg-white/15 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatViewerCount(liveStreams[0].viewer_count)} watching
                    </span>
                  </div>
                  <h2 className="text-white text-xl md:text-3xl font-black tracking-tight mb-1">{liveStreams[0].title}</h2>
                  <div className="flex items-center gap-2">
                    {liveStreams[0].profiles.avatar_url ? (
                      <img src={liveStreams[0].profiles.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">{liveStreams[0].profiles.display_name[0]}</div>
                    )}
                    <span className="text-white/90 text-sm font-medium">{liveStreams[0].profiles.display_name}</span>
                    <span className="text-white/50 text-xs">• {liveStreams[0].categories?.name || 'Live'}</span>
                  </div>
                </div>

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Section: Live Streams */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-black text-foreground tracking-tight">Live Channels</h2>
              {liveStreams.length > 0 && (
                <span className="text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{liveStreams.length}</span>
              )}
            </div>
            <Link to="/browse" className="text-xs font-semibold text-primary hover:underline">See all →</Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-full aspect-video rounded-xl" />
                  <div className="flex gap-2"><Skeleton className="w-8 h-8 rounded-full flex-shrink-0" /><div className="flex-1 space-y-1"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
              initial="hidden" animate="visible" variants={containerVariants}
            >
              {liveStreams.slice(1).map((stream) => (
                <motion.div key={stream.id} variants={cardVariants}>
                  <Link to={`/watch/${stream.profiles.username}`} className="group block">
                    <div className="rounded-xl overflow-hidden bg-card border border-border/40 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                      <div className="relative aspect-video overflow-hidden">
                        {stream.thumbnail_url ? (
                          <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary to-accent/10 flex items-center justify-center">
                            <Video className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                          </span>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> {formatViewerCount(stream.viewer_count)}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-lg" fill="white" />
                        </div>
                      </div>
                      <div className="p-2.5">
                        <div className="flex gap-2">
                          <div className="flex-shrink-0">
                            {stream.profiles.avatar_url ? (
                              <img src={stream.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                                <span className="text-[10px] font-bold text-muted-foreground">{stream.profiles.display_name[0]?.toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                            <p className="text-[10px] text-muted-foreground truncate">{stream.profiles.display_name}</p>
                            <p className="text-[10px] text-muted-foreground/60">{stream.categories?.name || 'Live'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Categories */}
        {!loading && categories.length > 0 && (
          <motion.section initial="hidden" animate="visible" variants={containerVariants}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-black text-foreground tracking-tight">Top Categories</h2>
              </div>
              <Link to="/browse" className="text-xs font-semibold text-primary hover:underline">Browse all →</Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={cardVariants} whileHover={{ y: -3, transition: { duration: 0.15 } }}>
                  <Link to={`/browse?category=${cat.slug}`} className="group block">
                    <div className="rounded-xl overflow-hidden border border-border/40 hover:border-primary/40 transition-all">
                      <div className="aspect-[3/4] bg-gradient-to-br from-primary/5 to-secondary relative overflow-hidden">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-black text-muted-foreground/20">{cat.name[0]}</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-[11px] font-bold truncate">{cat.name}</p>
                        </div>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 border border-border/50">
                <Sparkles className="w-10 h-10 text-primary/50" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to SIGMA</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">No one's live right now — be the first to start streaming!</p>
            <Link to="/go-live">
              <motion.button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Video className="w-4 h-4" /> Go Live Now
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
