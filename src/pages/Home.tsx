import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Zap, Users, Video, Sparkles, Play, TrendingUp, Flame } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

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
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 20px hsl(var(--primary) / 0.1)",
      "0 0 40px hsl(var(--primary) / 0.25)",
      "0 0 20px hsl(var(--primary) / 0.1)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);

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

  // Auto-rotate featured stream
  useEffect(() => {
    if (liveStreams.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % Math.min(liveStreams.length, 5));
    }, 6000);
    return () => clearInterval(interval);
  }, [liveStreams.length]);

  const featuredStream = liveStreams[featuredIndex];
  const otherStreams = liveStreams.filter((_, i) => i !== featuredIndex);

  return (
    <AppLayout>
      <div className="p-4 md:p-8 lg:p-10 space-y-10">

        {/* Hero Featured Stream */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="w-full aspect-[21/9] rounded-3xl" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-2 w-16 rounded-full" />)}
            </div>
          </div>
        ) : featuredStream ? (
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={featuredStream.id}
                initial={{ opacity: 0, scale: 0.96, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96, x: -40 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Link to={`/watch/${featuredStream.profiles.username}`}>
                  <motion.div
                    className="relative rounded-3xl overflow-hidden bg-card group cursor-pointer"
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="aspect-[21/9] relative overflow-hidden">
                      {featuredStream.thumbnail_url ? (
                        <motion.img
                          src={featuredStream.thumbnail_url}
                          alt={featuredStream.title}
                          className="w-full h-full object-cover"
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 8, ease: "linear" }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary to-accent/20 flex items-center justify-center relative">
                          <motion.div
                            variants={floatVariants}
                            animate="animate"
                            className="absolute"
                          >
                            <Video className="w-20 h-20 text-primary/20" />
                          </motion.div>
                          {/* Animated particles */}
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 rounded-full bg-primary/20"
                              animate={{
                                x: [0, Math.random() * 100 - 50],
                                y: [0, Math.random() * -80 - 20],
                                opacity: [0, 0.8, 0],
                                scale: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2 + Math.random() * 2,
                                repeat: Infinity,
                                delay: i * 0.4,
                                ease: "easeOut",
                              }}
                              style={{
                                left: `${20 + Math.random() * 60}%`,
                                top: `${40 + Math.random() * 30}%`,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Cinematic gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

                      {/* Live badge with glow */}
                      <div className="absolute top-5 left-5 flex items-center gap-2">
                        <motion.div
                          className="bg-destructive text-destructive-foreground text-sm font-black px-4 py-1.5 rounded-full flex items-center gap-2"
                          animate={{
                            boxShadow: [
                              "0 0 10px hsl(var(--destructive) / 0.3)",
                              "0 0 25px hsl(var(--destructive) / 0.6)",
                              "0 0 10px hsl(var(--destructive) / 0.3)",
                            ],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <motion.span
                            className="w-2 h-2 bg-white rounded-full"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          LIVE
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-black/50 backdrop-blur-xl text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          {formatViewerCount(featuredStream.viewer_count)}
                        </motion.div>
                      </div>

                      {/* Play button overlay */}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center shadow-2xl">
                          <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
                        </div>
                      </motion.div>

                      {/* Stream info */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 p-6 md:p-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <div className="flex items-end gap-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 3 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {featuredStream.profiles.avatar_url ? (
                              <img src={featuredStream.profiles.avatar_url} alt={featuredStream.profiles.display_name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/50" />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-primary/30 backdrop-blur-md flex items-center justify-center ring-2 ring-primary/50">
                                <span className="text-xl font-bold text-primary-foreground">{featuredStream.profiles.display_name[0]?.toUpperCase()}</span>
                              </div>
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <motion.h2
                              className="text-2xl md:text-3xl font-black text-white truncate"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              {featuredStream.title}
                            </motion.h2>
                            <motion.p
                              className="text-white/60 text-sm md:text-base"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 }}
                            >
                              {featuredStream.profiles.display_name} • {featuredStream.categories?.name || 'Uncategorized'}
                            </motion.p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Featured stream indicators */}
            {liveStreams.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {liveStreams.slice(0, 5).map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setFeaturedIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === featuredIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30 w-4 hover:bg-muted-foreground/50'
                    }`}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}
          </motion.section>
        ) : (
          /* Empty hero with animated elements */
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative rounded-3xl overflow-hidden bg-card p-12 md:p-16 text-center"
          >
            {/* Animated background orbs */}
            <motion.div
              className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-accent/5 blur-3xl"
              animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <motion.div
              className="relative z-10"
              variants={floatVariants}
              animate="animate"
            >
              <motion.div
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6"
                {...pulseGlow}
              >
                <Sparkles className="w-12 h-12 text-primary" />
              </motion.div>
            </motion.div>
            <motion.h2
              className="text-2xl md:text-3xl font-black text-foreground mb-3 relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome to SIGMA
            </motion.h2>
            <motion.p
              className="text-muted-foreground max-w-md mx-auto relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              No one's live right now — be the first to start streaming!
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 relative z-10"
            >
              <Link to="/go-live">
                <motion.button
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Video className="w-4 h-4" />
                  Go Live Now
                </motion.button>
              </Link>
            </motion.div>
          </motion.section>
        )}

        {/* Trending Section Header */}
        {otherStreams.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={cardVariants} className="flex items-center gap-3 mb-5">
              <motion.div
                className="p-2 rounded-xl bg-destructive/10"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Flame className="w-5 h-5 text-destructive" />
              </motion.div>
              <h2 className="text-xl font-black text-foreground">Live Now</h2>
              <motion.span
                className="text-xs font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-full"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {otherStreams.length} streaming
              </motion.span>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {otherStreams.map((stream, i) => (
                <motion.div
                  key={stream.id}
                  variants={cardVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  <Link to={`/watch/${stream.profiles.username}`} className="group block">
                    <motion.div
                      className="rounded-2xl overflow-hidden bg-card transition-all duration-300"
                      whileHover={{
                        boxShadow: "0 20px 40px -12px hsl(var(--primary) / 0.15)",
                      }}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        {stream.thumbnail_url ? (
                          <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-accent/10 flex items-center justify-center relative">
                            <Video className="w-8 h-8 text-muted-foreground/20" />
                            {/* Mini floating particles */}
                            {[...Array(3)].map((_, j) => (
                              <motion.div
                                key={j}
                                className="absolute w-1 h-1 rounded-full bg-primary/30"
                                animate={{
                                  y: [0, -30, 0],
                                  opacity: [0, 1, 0],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: j * 0.5,
                                }}
                                style={{
                                  left: `${30 + j * 20}%`,
                                  top: "60%",
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Hover overlay with play */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                          <motion.div
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            initial={false}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
                            </div>
                          </motion.div>
                        </div>

                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                          <motion.span
                            className="w-1.5 h-1.5 bg-white rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          LIVE
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViewerCount(stream.viewer_count)}
                        </div>
                      </div>
                      <div className="p-3.5">
                        <div className="flex gap-3">
                          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
                            {stream.profiles.avatar_url ? (
                              <img src={stream.profiles.avatar_url} alt={stream.profiles.display_name} className="w-9 h-9 rounded-xl object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                                <span className="text-sm font-bold text-muted-foreground">{stream.profiles.display_name[0]?.toUpperCase()}</span>
                              </div>
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{stream.profiles.display_name}</p>
                            <p className="text-xs text-muted-foreground/70">{stream.categories?.name || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={cardVariants} className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 rounded-xl bg-primary/10"
                  whileHover={{ rotate: 15 }}
                >
                  <TrendingUp className="w-5 h-5 text-primary" />
                </motion.div>
                <h2 className="text-xl font-black text-foreground">Categories</h2>
              </div>
              <Link to="/browse">
                <motion.span
                  className="text-sm text-primary hover:text-primary/80 font-bold"
                  whileHover={{ x: 4 }}
                >
                  View All →
                </motion.span>
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  variants={cardVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Link to={`/browse?category=${cat.slug}`} className="group block">
                    <motion.div
                      className="rounded-2xl overflow-hidden bg-card transition-all duration-300"
                      whileHover={{
                        boxShadow: "0 12px 30px -8px hsl(var(--primary) / 0.12)",
                      }}
                    >
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
                    </motion.div>
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
            className="text-center py-16 relative"
          >
            {/* Animated background */}
            <motion.div
              className="absolute top-0 left-1/4 w-48 h-48 rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.3, 1], x: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full bg-accent/5 blur-3xl"
              animate={{ scale: [1, 1.2, 1], x: [0, -20, 0] }}
              transition={{ duration: 7, repeat: Infinity, delay: 1 }}
            />

            <motion.div
              variants={floatVariants}
              animate="animate"
              className="relative z-10"
            >
              <motion.div
                className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mx-auto mb-6"
                {...pulseGlow}
              >
                <Sparkles className="w-14 h-14 text-primary/60" />
              </motion.div>
            </motion.div>
            <h2 className="text-3xl font-black text-foreground mb-3 relative z-10">Welcome to SIGMA</h2>
            <p className="text-muted-foreground max-w-md mx-auto relative z-10">Start exploring or go live to get started!</p>
            <motion.div
              className="mt-8 relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link to="/go-live">
                <motion.button
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Video className="w-4 h-4" />
                  Go Live Now
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
