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
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  categories: {
    name: string;
    slug: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function formatViewerCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
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
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');
      if (categoriesData) setCategories(categoriesData);

      const { data: streamsData } = await supabase
        .from('streams')
        .select(`id, title, viewer_count, thumbnail_url,
          profiles!inner(username, display_name, avatar_url),
          categories(name, slug)`)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false });
      if (streamsData) setStreams(streamsData as unknown as Stream[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch = 
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.profiles.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || stream.categories?.slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Browse</h1>
            <p className="text-muted-foreground">Discover live streams and creators</p>
          </div>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <div className="absolute inset-0 rounded-full bg-primary/5 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
            <Input
              placeholder="Search streams or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-secondary/60 border-border/50 rounded-full backdrop-blur-sm transition-all duration-300 focus:shadow-md focus:shadow-primary/10 focus:border-primary/30"
            />
          </div>
        </motion.div>

        {/* Categories */}
        {categories.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full transition-all duration-200 ${selectedCategory === null ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'hover:bg-accent'}`}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.slug}
                  variant={selectedCategory === category.slug ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`rounded-full transition-all duration-200 ${selectedCategory === category.slug ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'hover:bg-accent'}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Live Streams Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse shadow-lg shadow-destructive/50" />
            <h2 className="text-lg font-semibold">Live Now</h2>
            <span className="text-muted-foreground text-sm bg-secondary/80 px-2 py-0.5 rounded-full">{filteredStreams.length}</span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-card border border-border/50">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-3">
                    <div className="flex gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
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
                  <motion.div key={stream.id} custom={i} variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout>
                    <Link to={`/watch/${stream.profiles.username}`} className="group block">
                      <div className="relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                        <div className="relative aspect-video">
                          {stream.thumbnail_url ? (
                            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/15 via-accent/30 to-secondary flex items-center justify-center">
                              <Video className="w-8 h-8 text-primary/30" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatViewerCount(stream.viewer_count)}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        
                        <div className="p-3">
                          <div className="flex gap-3">
                            {stream.profiles.avatar_url ? (
                              <img src={stream.profiles.avatar_url} alt={stream.profiles.display_name} className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{stream.profiles.display_name[0]?.toUpperCase()}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                              <p className="text-sm text-muted-foreground truncate">{stream.profiles.display_name}</p>
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
              <div className="w-20 h-20 bg-gradient-to-br from-muted to-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No streams found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your search or category filter'
                  : 'No one is live right now. Be the first to go live!'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
