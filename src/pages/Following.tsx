import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Users, Video, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface FollowedChannel {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  stream?: {
    id: string;
    title: string;
    viewer_count: number;
    thumbnail_url: string | null;
    categories: {
      name: string;
    } | null;
  };
}

function formatViewerCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function FollowingPage() {
  const { user, loading: authLoading } = useAuth();
  const [followedChannels, setFollowedChannels] = useState<FollowedChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowing() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Get users this person follows
      const { data: followData } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!followData || followData.length === 0) {
        setFollowedChannels([]);
        setLoading(false);
        return;
      }

      const followingIds = followData.map((f) => f.following_id);

      // Get profiles and their active streams
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', followingIds);

      if (!profiles) {
        setFollowedChannels([]);
        setLoading(false);
        return;
      }

      // Get active streams for these users
      const { data: streams } = await supabase
        .from('streams')
        .select(`
          id,
          title,
          viewer_count,
          thumbnail_url,
          user_id,
          categories(name)
        `)
        .in('user_id', followingIds)
        .eq('is_live', true);

      // Map profiles with their streams
      const channels: FollowedChannel[] = profiles.map((profile) => {
        const stream = streams?.find((s) => s.user_id === profile.id);
        return {
          ...profile,
          stream: stream
            ? {
                id: stream.id,
                title: stream.title,
                viewer_count: stream.viewer_count,
                thumbnail_url: stream.thumbnail_url,
                categories: stream.categories as { name: string } | null,
              }
            : undefined,
        };
      });

      // Sort: live channels first
      channels.sort((a, b) => {
        if (a.stream && !b.stream) return -1;
        if (!a.stream && b.stream) return 1;
        return 0;
      });

      setFollowedChannels(channels);
      setLoading(false);
    }

    fetchFollowing();
  }, [user]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Follow your favorite creators</h1>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Sign in to follow channels and see when they go live
          </p>
          <Link to="/auth">
            <Button className="bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const liveChannels = followedChannels.filter((c) => c.stream);
  const offlineChannels = followedChannels.filter((c) => !c.stream);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Following</h1>
          <p className="text-muted-foreground">Channels you follow</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Live Now */}
            {liveChannels.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  <h2 className="text-lg font-semibold text-foreground">Live Now</h2>
                  <span className="text-muted-foreground text-sm">({liveChannels.length})</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {liveChannels.map((channel) => (
                    <Link
                      key={channel.id}
                      to={`/watch/${channel.username}`}
                      className="group block"
                    >
                      <div className="relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-200">
                        <div className="relative aspect-video">
                          {channel.stream?.thumbnail_url ? (
                            <img
                              src={channel.stream.thumbnail_url}
                              alt={channel.stream.title}
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
                            {formatViewerCount(channel.stream!.viewer_count)}
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex gap-3">
                            {channel.avatar_url ? (
                              <img
                                src={channel.avatar_url}
                                alt={channel.display_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {channel.display_name[0]?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {channel.stream!.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">{channel.display_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {channel.stream!.categories?.name || 'Uncategorized'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Offline Channels */}
            {offlineChannels.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Offline</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offlineChannels.map((channel) => (
                    <Link
                      key={channel.id}
                      to={`/channel/${channel.username}`}
                      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      {channel.avatar_url ? (
                        <img
                          src={channel.avatar_url}
                          alt={channel.display_name}
                          className="w-12 h-12 rounded-full object-cover opacity-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center opacity-50">
                          <span className="text-lg font-bold text-primary">
                            {channel.display_name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{channel.display_name}</p>
                        <p className="text-sm text-muted-foreground">Offline</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {followedChannels.length === 0 && (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No channels followed yet</h3>
                <p className="text-muted-foreground mb-4">Start following channels to see them here</p>
                <Link to="/browse">
                  <Button variant="secondary">Browse Channels</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
