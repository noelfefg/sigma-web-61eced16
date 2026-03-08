import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Zap, Users, Video, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
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
          .limit(12),
        supabase
          .from('categories')
          .select('id, name, slug, image_url')
          .order('name')
          .limit(8),
      ]);
      if (streams) setLiveStreams(streams as unknown as Stream[]);
      if (cats) setCategories(cats);
      setLoading(false);
    }
    fetchData();
  }, []);

  const featuredStream = liveStreams[0];
  const otherStreams = liveStreams.slice(1);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-10 space-y-10">
        {/* Featured Stream */}
        {loading ? (
          <Skeleton className="w-full aspect-[21/9] rounded-2xl" />
        ) : featuredStream ? (
          <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Link to={`/watch/${featuredStream.profiles.username}`}>
              <div className="relative rounded-2xl overflow-hidden bg-card hover:shadow-2xl transition-all duration-500 group">
                <div className="aspect-[21/9] relative">
                  {featuredStream.thumbnail_url ? (
                    <img src={featuredStream.thumbnail_url} alt={featuredStream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-secondary flex items-center justify-center">
                      <Video className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded-md animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-white rounded-full" />
                      LIVE
                    </div>
                    <div className="bg-black/60 backdrop-blur-md text-white text-sm px-3 py-1 rounded-md flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewerCount(featuredStream.viewer_count)}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-end gap-4">
                      {featuredStream.profiles.avatar_url ? (
                        <img src={featuredStream.profiles.avatar_url} alt={featuredStream.profiles.display_name} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/30 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary-foreground">{featuredStream.profiles.display_name[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-white">{featuredStream.title}</h2>
                        <p className="text-white/70">{featuredStream.profiles.display_name} • {featuredStream.categories?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No live streams yet</h2>
            <p className="text-muted-foreground">Be the first to go live!</p>
          </motion.section>
        )}

        {/* Live Channels */}
        {otherStreams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-bold text-foreground">Live Channels</h2>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{otherStreams.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {otherStreams.map((stream, i) => (
                <motion.div key={stream.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                  <Link to={`/watch/${stream.profiles.username}`} className="group block">
                    <div className="rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                      <div className="relative aspect-video">
                        {stream.thumbnail_url ? (
                          <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                            <Video className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          LIVE
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViewerCount(stream.viewer_count)}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex gap-3">
                          {stream.profiles.avatar_url ? (
                            <img src={stream.profiles.avatar_url} alt={stream.profiles.display_name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                              <span className="text-sm font-bold text-muted-foreground">{stream.profiles.display_name[0]?.toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{stream.profiles.display_name}</p>
                            <p className="text-xs text-muted-foreground">{stream.categories?.name || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Categories</h2>
              </div>
              <Link to="/browse" className="text-sm text-primary hover:text-primary/80 font-medium">View All</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {categories.map((cat, i) => (
                <motion.div key={cat.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                  <Link to={`/browse?category=${cat.slug}`} className="group block">
                    <div className="rounded-xl overflow-hidden bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                      <div className="aspect-[3/4] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground/30">{cat.name[0]}</span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{cat.name}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && liveStreams.length === 0 && categories.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to SIGMA</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Start exploring or go live to get started!</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
