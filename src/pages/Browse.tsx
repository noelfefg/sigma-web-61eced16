import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Eye, Video, Gamepad2, Palette, Music, GraduationCap, Camera, MessageCircle, Mic, Trophy, RotateCcw, ChevronDown, Bookmark, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import categoryGaming from '@/assets/category-gaming.jpg';
import categoryCreative from '@/assets/category-creative.jpg';
import categoryMusic from '@/assets/category-music.jpg';
import categoryEducation from '@/assets/category-education.jpg';
import categoryIrl from '@/assets/category-irl.jpg';
import categoryJustChatting from '@/assets/category-just-chatting.jpg';
import categoryPodcast from '@/assets/category-podcast.jpg';
import categorySports from '@/assets/category-sports.jpg';

const categoryImages: Record<string, string> = {
  gaming: categoryGaming, creative: categoryCreative, music: categoryMusic,
  education: categoryEducation, irl: categoryIrl, 'just-chatting': categoryJustChatting,
  podcast: categoryPodcast, sports: categorySports,
};

interface Stream {
  id: string; title: string; viewer_count: number; thumbnail_url: string | null;
  profiles: { username: string; display_name: string; avatar_url: string | null };
  categories: { name: string; slug: string } | null;
}

interface Category { id: string; name: string; slug: string; description: string | null; }

function formatViewerCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}


export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: catsData }, { data: streamsData }] = await Promise.all([
        supabase.from('categories').select('id, name, slug, description').order('name'),
        supabase.from('streams').select('id, title, viewer_count, thumbnail_url, profiles!inner(username, display_name, avatar_url), categories(name, slug)').eq('is_live', true).order('viewer_count', { ascending: false }),
      ]);
      if (catsData) setCategories(catsData);
      if (streamsData) setStreams(streamsData as unknown as Stream[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) || stream.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || stream.categories?.slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 space-y-5">
        {/* Back arrow + title */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-all hover:-translate-x-0.5 hover:scale-110">
            <ChevronDown className="w-4 h-4 rotate-90 text-foreground" />
          </Link>
          <h1 className="text-xl font-black tracking-tight text-aurora">Discover</h1>
        </motion.div>

        {/* Search Bar - VidBox full width */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-card border-border/60 rounded-xl text-sm font-medium"
            />
          </div>
        </motion.div>

        {/* VidBox-style dropdown filters */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}>
            <SelectTrigger className="w-auto min-w-[100px] h-9 bg-card border-border/60 rounded-lg text-xs font-medium">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {categories.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-auto min-w-[100px] h-9 bg-card border-border/60 rounded-lg text-xs font-medium">
              <SelectValue placeholder="Popular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="viewers">Most Viewers</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-auto min-w-[90px] h-9 bg-card border-border/60 rounded-lg text-xs font-medium">
              <SelectValue placeholder="Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="8+">8.0+</SelectItem>
              <SelectItem value="7+">7.0+</SelectItem>
              <SelectItem value="6+">6.0+</SelectItem>
            </SelectContent>
          </Select>

          {selectedCategory && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-destructive hover:text-destructive/80 gap-1 text-xs shrink-0 h-9 rounded-lg bg-destructive/10 hover:bg-destructive/15 px-3">
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          )}
        </motion.div>

        {/* Poster Grid - VidBox style */}
        <div>
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2.5">
              {[...Array(14)].map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
              ))}
            </div>
          ) : filteredStreams.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2.5">
              <AnimatePresence mode="popLayout">
                {filteredStreams.map((stream, i) => (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, y: 30, scale: 0.92, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.04, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    layout
                  >
                    <Link to={`/watch/${stream.profiles.username}`} className="group block">
                      <div className="tilt-3d shine-sweep rounded-xl overflow-hidden bg-card border border-border/30 hover:border-primary/50">
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {stream.thumbnail_url ? (
                            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary to-accent/5 flex items-center justify-center">
                              <Video className="w-8 h-8 text-muted-foreground/20 float-gentle" />
                            </div>
                          )}

                          {/* Viewer count badge */}
                          {stream.viewer_count > 0 && (
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {formatViewerCount(stream.viewer_count)} viewers
                            </div>
                          )}

                          {/* Bookmark - top left */}
                          <button className="absolute top-1.5 left-1.5 w-6 h-6 rounded bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:scale-125 active:scale-90 transition-all duration-200">
                            <Bookmark className="w-3 h-3" />
                          </button>

                          {/* LIVE badge */}
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                            <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <span className="w-1 h-1 bg-white rounded-full live-ripple" /> LIVE
                            </span>
                            <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Eye className="w-2.5 h-2.5" /> {formatViewerCount(stream.viewer_count)}
                            </span>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="p-2">
                          <h3 className="font-semibold text-[11px] text-foreground truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                          <p className="text-[10px] text-muted-foreground truncate">{stream.profiles.display_name}</p>
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
              <h3 className="text-lg font-bold text-foreground mb-1">No streams found</h3>
              <p className="text-muted-foreground text-sm">{searchQuery || selectedCategory ? 'Try adjusting your filters' : 'No one is live right now'}</p>
            </motion.div>
          )}
        </div>

        {/* Masthead */}
        <div className="border-t border-border/40 mt-12 pt-6 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
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
