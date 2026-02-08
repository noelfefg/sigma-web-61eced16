import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Zap, Users, Video } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

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

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

function formatViewerCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [recommendedChannels, setRecommendedChannels] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch live streams
      const { data: streams } = await supabase
        .from('streams')
        .select(`
          id,
          title,
          viewer_count,
          thumbnail_url,
          category_id,
          profiles!inner(username, display_name, avatar_url),
          categories(name)
        `)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(8);

      if (streams) {
        setLiveStreams(streams as unknown as Stream[]);
      }

      // Fetch recommended channels (profiles)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .limit(6);

      if (profiles) {
        setRecommendedChannels(profiles);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const featuredStream = liveStreams[0];
  const otherStreams = liveStreams.slice(1);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-8">
        {/* Featured Stream */}
        {loading ? (
          <Skeleton className="w-full aspect-[21/9] rounded-xl" />
        ) : featuredStream ? (
          <section>
            <Link to={`/watch/${featuredStream.profiles.username}`}>
              <div className="relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 group">
                <div className="aspect-[21/9] relative">
                  {featuredStream.thumbnail_url ? (
                    <img
                      src={featuredStream.thumbnail_url}
                      alt={featuredStream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                      <Video className="w-16 h-16 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded animate-pulse">
                      LIVE
                    </div>
                    <div className="bg-black/80 text-white text-sm px-3 py-1 rounded flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewerCount(featuredStream.viewer_count)} watching
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-end gap-4">
                      {featuredStream.profiles.avatar_url ? (
                        <img
                          src={featuredStream.profiles.avatar_url}
                          alt={featuredStream.profiles.display_name}
                          className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {featuredStream.profiles.display_name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-white">{featuredStream.title}</h2>
                        <p className="text-white/80">
                          {featuredStream.profiles.display_name} • {featuredStream.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        ) : (
          <section className="bg-card rounded-xl border border-border p-12 text-center">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No live streams</h2>
            <p className="text-muted-foreground">Be the first to go live!</p>
          </section>
        )}

        {/* Live Channels */}
        {otherStreams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Live Channels</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {otherStreams.map((stream) => (
                <Link
                  key={stream.id}
                  to={`/watch/${stream.profiles.username}`}
                  className="group block"
                >
                  <div className="relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-200">
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
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
                        LIVE
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatViewerCount(stream.viewer_count)}
                      </div>
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    
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
          </section>
        )}

        {/* Recommended Channels */}
        {recommendedChannels.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Channels</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedChannels.map((channel) => (
                <Link
                  key={channel.id}
                  to={`/channel/${channel.username}`}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="relative">
                    {channel.avatar_url ? (
                      <img
                        src={channel.avatar_url}
                        alt={channel.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {channel.display_name[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{channel.display_name}</p>
                    <p className="text-sm text-muted-foreground truncate">@{channel.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state when no content */}
        {!loading && liveStreams.length === 0 && recommendedChannels.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Welcome to SIGMA</h2>
            <p className="text-muted-foreground">Start exploring or go live to get started!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
