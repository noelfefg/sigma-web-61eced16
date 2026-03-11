import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Eye, Video, Gamepad2, Palette, Music, GraduationCap, Camera, MessageCircle, Mic, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

import categoryGaming from '@/assets/category-gaming.jpg';
import categoryCreative from '@/assets/category-creative.jpg';
import categoryMusic from '@/assets/category-music.jpg';
import categoryEducation from '@/assets/category-education.jpg';
import categoryIrl from '@/assets/category-irl.jpg';
import categoryJustChatting from '@/assets/category-just-chatting.jpg';
import categoryPodcast from '@/assets/category-podcast.jpg';
import categorySports from '@/assets/category-sports.jpg';

const categoryImages: Record<string, string> = {
  gaming: categoryGaming,
  creative: categoryCreative,
  music: categoryMusic,
  education: categoryEducation,
  irl: categoryIrl,
  'just-chatting': categoryJustChatting,
  podcast: categoryPodcast,
  sports: categorySports,
};

const categoryIcons: Record<string, React.ReactNode> = {
  gaming: <Gamepad2 className="w-5 h-5" />,
  creative: <Palette className="w-5 h-5" />,
  music: <Music className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  irl: <Camera className="w-5 h-5" />,
  'just-chatting': <MessageCircle className="w-5 h-5" />,
  podcast: <Mic className="w-5 h-5" />,
  sports: <Trophy className="w-5 h-5" />,
};

const categoryGradients: Record<string, string> = {
  gaming: 'from-purple-600/80 to-blue-600/80',
  creative: 'from-orange-500/80 to-pink-500/80',
  music: 'from-pink-600/80 to-cyan-500/80',
  education: 'from-amber-500/80 to-emerald-500/80',
  irl: 'from-orange-600/80 to-yellow-500/80',
  'just-chatting': 'from-violet-600/80 to-fuchsia-500/80',
  podcast: 'from-red-600/80 to-orange-500/80',
  sports: 'from-teal-500/80 to-blue-500/80',
};

interface Stream {
  id: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string | null;
  profiles: { username: string; display_name: string; avatar_url: string | null };
  categories: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

function formatViewerCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

const categoryCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

const streamCardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: catsData }, { data: streamsData }] = await Promise.all([
        supabase.from('categories').select('id, name, slug, description').order('name'),
        supabase
          .from('streams')
          .select('id, title, viewer_count, thumbnail_url, profiles!inner(username, display_name, avatar_url), categories(name, slug)')
          .eq('is_live', true)
          .order('viewer_count', { ascending: false }),
      ]);
      if (catsData) setCategories(catsData);
      if (streamsData) setStreams(streamsData as unknown as Stream[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch =
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || stream.categories?.slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Browse</h1>
            <p className="text-sm text-foreground/70">Discover live streams and creators</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
            <Input placeholder="Search streams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/60 rounded-lg h-9 text-sm" />
          </div>
        </motion.div>

        {/* Category Cards */}
        {categories.length > 0 && (
          <div className="space-y-4">
            <motion.h2 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-lg font-bold text-foreground">
              Categories
            </motion.h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  custom={i}
                  variants={categoryCardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
                >
                  <div
                    className={`relative rounded-xl overflow-hidden aspect-[16/10] group transition-all duration-300 ${
                      selectedCategory === cat.slug ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                    }`}
                  >
                    {/* Background Image */}
                    <img
                      src={categoryImages[cat.slug] || categoryGaming}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${categoryGradients[cat.slug] || 'from-black/80 to-black/30'} transition-opacity duration-300`} />

                    {/* Animated shimmer on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-end p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <motion.div
                          className="text-white"
                          animate={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                        >
                          {categoryIcons[cat.slug]}
                        </motion.div>
                        <h3 className="text-white font-bold text-sm drop-shadow-lg">{cat.name}</h3>
                      </div>
                      {cat.description && (
                        <p className="text-white/80 text-[10px] leading-tight line-clamp-2 drop-shadow">{cat.description}</p>
                      )}
                    </div>

                    {/* Active indicator */}
                    {selectedCategory === cat.slug && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <span className="text-primary-foreground text-xs font-bold">✓</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Active filter pill */}
            {selectedCategory && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                <span className="text-xs text-foreground/70">Filtering by:</span>
                <Button variant="secondary" size="sm" className="rounded-full text-xs gap-1" onClick={() => setSelectedCategory(null)}>
                  {categories.find((c) => c.slug === selectedCategory)?.name} ✕
                </Button>
              </motion.div>
            )}
          </div>
        )}

        {/* Streams */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <h2 className="text-sm font-semibold text-foreground">Live Now</h2>
            <span className="text-xs text-foreground/70 bg-secondary px-2 py-0.5 rounded-md">{filteredStreams.length}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-card">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-3">
                    <div className="flex gap-3">
                      <Skeleton className="w-9 h-9 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStreams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredStreams.map((stream, i) => (
                  <motion.div key={stream.id} custom={i} variants={streamCardVariants} initial="hidden" animate="visible" exit="exit" layout>
                    <Link to={`/watch/${stream.profiles.username}`} className="group block">
                      <div className="rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                        <div className="relative aspect-video">
                          {stream.thumbnail_url ? (
                            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                              <Video className="w-8 h-8 text-foreground/20" />
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
                                <span className="text-sm font-bold text-foreground/50">{stream.profiles.display_name[0]?.toUpperCase()}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                              <p className="text-xs text-foreground/70 truncate">{stream.profiles.display_name}</p>
                              <p className="text-xs text-foreground/60">{stream.categories?.name || 'Uncategorized'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Users className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No streams found</h3>
              <p className="text-foreground/60 text-sm">{searchQuery || selectedCategory ? 'Try adjusting your search' : 'No one is live right now'}</p>
            </motion.div>
          )}
        </div>

        {/* Masthead Footer */}
        <div className="border-t border-border mt-16 pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 NOSHIAN. INC</p>
            <div className="flex items-center gap-6">
              <span>CEO. Mifong NOEL (NOSH)</span>
              <span>CFO. Bekoula Fabrice Joyce</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
