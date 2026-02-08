import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Eye, TrendingUp, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch live streams
      const { data: streamsData } = await supabase
        .from('streams')
        .select(`
          id,
          title,
          viewer_count,
          thumbnail_url,
          profiles!inner(username, display_name, avatar_url),
          categories(name, slug)
        `)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false });

      if (streamsData) {
        setStreams(streamsData as unknown as Stream[]);
      }

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Browse</h1>
            <p className="text-muted-foreground">Discover live streams and creators</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search streams or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? 'bg-primary text-primary-foreground' : ''}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.slug}
                  variant={selectedCategory === category.slug ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.slug)}
                  className={selectedCategory === category.slug ? 'bg-primary text-primary-foreground' : ''}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Live Streams Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold">Live Now</h2>
            <span className="text-muted-foreground text-sm">({filteredStreams.length} streams)</span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden bg-card border border-border">
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
              {filteredStreams.map((stream) => (
                <Link
                  key={stream.id}
                  to={`/watch/${stream.profiles.username}`}
                  className="group block"
                >
                  <div className="relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-200">
                    {/* Thumbnail */}
                    <div className="relative aspect-video">
                      {stream.thumbnail_url ? (
                        <img
                          src={stream.thumbnail_url}
                          alt={stream.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
                          <Video className="w-8 h-8 text-primary/30" />
                        </div>
                      )}
                      {/* Live Badge */}
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
                        LIVE
                      </div>
                      {/* Viewer Count */}
                      <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatViewerCount(stream.viewer_count)}
                      </div>
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    
                    {/* Stream Info */}
                    <div className="p-3">
                      <div className="flex gap-3">
                        {stream.profiles.avatar_url ? (
                          <img
                            src={stream.profiles.avatar_url}
                            alt={stream.profiles.display_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {stream.profiles.display_name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {stream.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">{stream.profiles.display_name}</p>
                          <p className="text-xs text-muted-foreground">{stream.categories?.name || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No streams found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your search or category filter'
                  : 'No one is live right now. Be the first to go live!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
