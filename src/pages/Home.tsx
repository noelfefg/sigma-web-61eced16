import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Users, Video, Sparkles, Play, TrendingUp, Flame, CheckCircle } from 'lucide-react';
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
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// Fake tags for visual richness
const streamTags: Record<string, string[]> = {};
const tagOptions = [
  ['coding', 'react', 'typescript'],
  ['production', 'beats', 'chill'],
  ['digital', 'illustration', 'art'],
  ['gaming', 'fps', 'competitive'],
  ['irl', 'travel', 'vlog'],
  ['music', 'live', 'acoustic'],
];

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
          .limit(8),
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
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">

        {/* Section Header */}
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-xl bg-destructive/10"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Flame className="w-5 h-5 text-destructive" />
          </motion.div>
          <h1 className="text-xl font-black text-foreground">Live Now</h1>
          {liveStreams.length > 0 && (
            <motion.span
              className="text-xs font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-full"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {liveStreams.length} live
            </motion.span>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-video rounded-2xl" />
                <div className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stream Grid */}
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
                  {/* Thumbnail */}
                  <div className="relative rounded-2xl overflow-hidden bg-card">
                    <div className="aspect-video relative overflow-hidden">
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

                      {/* LIVE Badge + Viewers */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <motion.div
                          className="bg-destructive text-destructive-foreground text-xs font-black px-3 py-1 rounded-md flex items-center gap-1.5"
                          animate={{
                            boxShadow: [
                              "0 0 8px hsl(var(--destructive) / 0.3)",
                              "0 0 20px hsl(var(--destructive) / 0.5)",
                              "0 0 8px hsl(var(--destructive) / 0.3)",
                            ],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          LIVE
                        </motion.div>
                        <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {formatViewerCount(stream.viewer_count)}
                        </div>
                      </div>

                      {/* Hover play overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <motion.div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-xl">
                            <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Stream Info */}
                  <div className="flex gap-3 mt-3">
                    <div className="flex-shrink-0">
                      {stream.profiles.avatar_url ? (
                        <img
                          src={stream.profiles.avatar_url}
                          alt={stream.profiles.display_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-destructive/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center ring-2 ring-destructive/50">
                          <span className="text-sm font-bold text-muted-foreground">
                            {stream.profiles.display_name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {stream.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-sm text-muted-foreground">{stream.profiles.display_name}</span>
                        <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {stream.categories?.name || 'Uncategorized'}
                      </p>
                      {/* Tags */}
                      {streamTags[stream.id] && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {streamTags[stream.id].map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium text-muted-foreground border-border"
                            >
                              {tag}
                            </Badge>
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

        {/* Categories */}
        {!loading && categories.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={cardVariants} className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-black text-foreground">Categories</h2>
              </div>
              <Link to="/browse">
                <span className="text-sm text-primary hover:text-primary/80 font-bold">
                  View All →
                </span>
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={cardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Link to={`/browse?category=${cat.slug}`} className="group block">
                    <div className="rounded-2xl overflow-hidden bg-card">
                      <div className="aspect-[3/4] bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative overflow-hidden">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <span className="text-3xl font-black text-muted-foreground/20">{cat.name[0]}</span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{cat.name}</p>
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
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-primary/60" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-black text-foreground mb-3">Welcome to SIGMA</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              No one's live right now — be the first to start streaming!
            </p>
            <Link to="/go-live">
              <motion.button
                className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
