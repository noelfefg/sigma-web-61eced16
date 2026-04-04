import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Eye, Video, Gamepad2, Palette, Music, GraduationCap, Camera, MessageCircle, Mic, Trophy, SlidersHorizontal, RotateCcw, Star, ChevronDown } from 'lucide-react';
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
  gaming: <Gamepad2 className="w-4 h-4" />,
  creative: <Palette className="w-4 h-4" />,
  music: <Music className="w-4 h-4" />,
  education: <GraduationCap className="w-4 h-4" />,
  irl: <Camera className="w-4 h-4" />,
  'just-chatting': <MessageCircle className="w-4 h-4" />,
  podcast: <Mic className="w-4 h-4" />,
  sports: <Trophy className="w-4 h-4" />,
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

const SORT_OPTIONS = ['Popular', 'New', 'Most Viewed'];

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('Popular');

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
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header & Search - VidBox inspired */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Browse</h1>
            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-destructive hover:text-destructive/80 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Search Bar - Full width like VidBox */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search streams, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-card border-border rounded-xl text-sm"
            />
          </div>

          {/* Filter Pills - VidBox style */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  selectedCategory === cat.slug
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/30 hover:bg-accent/50'
                }`}
              >
                {categoryIcons[cat.slug]}
                {cat.name}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            ))}
            {/* Sort */}
            <div className="shrink-0 ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {sortBy}
            </div>
          </div>
        </motion.div>

        {/* Category Cards - Poster style grid */}
        {!selectedCategory && categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
              >
                <div className="relative rounded-xl overflow-hidden aspect-[16/10] group border border-border/50 hover:border-primary/30 transition-all">
                  <img
                    src={categoryImages[cat.slug] || categoryGaming}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white/80">{categoryIcons[cat.slug]}</span>
                      <h3 className="text-white font-bold text-sm">{cat.name}</h3>
                    </div>
                    {cat.description && (
                      <p className="text-white/60 text-[10px] line-clamp-1">{cat.description}</p>
                    )}
                  </div>

                  {selectedCategory === cat.slug && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <span className="text-primary-foreground text-[10px] font-bold">✓</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Active filter */}
        {selectedCategory && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Showing:</span>
            <Button variant="secondary" size="sm" className="rounded-full text-xs gap-1 h-7" onClick={() => setSelectedCategory(null)}>
              {categories.find((c) => c.slug === selectedCategory)?.name} ✕
            </Button>
          </motion.div>
        )}

        {/* Streams Grid - Poster cards with ratings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <h2 className="text-sm font-semibold text-foreground">Live Now</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{filteredStreams.length}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-card border border-border/50">
                  <Skeleton className="aspect-[2/3] w-full" />
                  <div className="p-2.5 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStreams.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredStreams.map((stream, i) => (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    layout
                  >
                    <Link to={`/watch/${stream.profiles.username}`} className="group block">
                      <div className="rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        {/* Poster-style thumbnail */}
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {stream.thumbnail_url ? (
                            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                              <Video className="w-8 h-8 text-muted-foreground/20" />
                            </div>
                          )}

                          {/* Rating badge - top right like VidBox */}
                          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            <Star className="w-2.5 h-2.5 fill-yellow-400" />
                            {(Math.random() * 3 + 5).toFixed(1)}
                          </div>

                          {/* Bookmark icon - top left */}
                          <div className="absolute top-2 left-2">
                            <div className="w-6 h-6 rounded bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                            </div>
                          </div>

                          {/* LIVE badge */}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                              LIVE
                            </span>
                            <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Eye className="w-2.5 h-2.5" />
                              {formatViewerCount(stream.viewer_count)}
                            </span>
                          </div>

                          {/* Bottom gradient with title */}
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>

                        {/* Info */}
                        <div className="p-2.5">
                          <div className="flex gap-2">
                            {stream.profiles.avatar_url ? (
                              <img src={stream.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-muted-foreground">{stream.profiles.display_name[0]?.toUpperCase()}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                              <p className="text-[10px] text-muted-foreground truncate">{stream.profiles.display_name}</p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No streams found</h3>
              <p className="text-muted-foreground text-sm">{searchQuery || selectedCategory ? 'Try adjusting your filters' : 'No one is live right now'}</p>
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
