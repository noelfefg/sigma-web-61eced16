import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Eye, TrendingUp, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface Stream {
  id: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string | null;
  profiles: { username: string; display_name: string; avatar_url: string | null; };
  categories: { name: string; slug: string; } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function formatViewerCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
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
        supabase.from('categories').select('id, name, slug').order('name'),
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
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Browse</h1>
            <p className="text-sm text-muted-foreground">Discover live streams and creators</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search streams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/60 rounded-lg h-9 text-sm" />
          </div>
        </motion.div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedCategory === null ? 'default' : 'secondary'} size="sm" onClick={() => setSelectedCategory(null)} className="rounded-full text-xs">All</Button>
            {categories.map((cat) => (
              <Button key={cat.slug} variant={selectedCategory === cat.slug ? 'default' : 'secondary'} size="sm" onClick={() => setSelectedCategory(cat.slug)} className="rounded-full text-xs">{cat.name}</Button>
            ))}
          </div>
        )}

        {/* Streams */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <h2 className="text-sm font-semibold text-foreground">Live Now</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{filteredStreams.length}</span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-card">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-3"><div className="flex gap-3"><Skeleton className="w-9 h-9 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div></div></div>
                </div>
              ))}
            </div>
          ) : filteredStreams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredStreams.map((stream, i) => (
                  <motion.div key={stream.id} custom={i} variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout>
                    <Link to={`/watch/${stream.profiles.username}`} className="group block">
                      <div className="rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                        <div className="relative aspect-video">
                          {stream.thumbnail_url ? (
                            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center"><Video className="w-8 h-8 text-muted-foreground/30" /></div>
                          )}
                          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />LIVE
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1"><Eye className="w-3 h-3" />{formatViewerCount(stream.viewer_count)}</div>
                        </div>
                        <div className="p-3">
                          <div className="flex gap-3">
                            {stream.profiles.avatar_url ? (
                              <img src={stream.profiles.avatar_url} alt={stream.profiles.display_name} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"><span className="text-sm font-bold text-muted-foreground">{stream.profiles.display_name[0]?.toUpperCase()}</span></div>
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
              </AnimatePresence>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No streams found</h3>
              <p className="text-muted-foreground text-sm">{searchQuery || selectedCategory ? 'Try adjusting your search' : 'No one is live right now'}</p>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
