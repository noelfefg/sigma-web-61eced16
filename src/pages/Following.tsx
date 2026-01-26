import { Link } from 'react-router-dom';
import { Eye, Heart, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

// Mock following data
const mockFollowing = [
  {
    id: '1',
    username: 'xqcow',
    displayName: 'xQcOW',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop',
    category: 'Just Chatting',
    title: 'Late Night Gaming Session 🎮',
    viewers: 45234,
    isLive: true,
  },
  {
    id: '2',
    username: 'tenz',
    displayName: 'TenZ',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=640&h=360&fit=crop',
    category: 'Gaming',
    title: 'Competitive Valorant',
    viewers: 32891,
    isLive: true,
  },
  {
    id: '3',
    username: 'shroud',
    displayName: 'Shroud',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    thumbnail: null,
    category: 'Gaming',
    title: null,
    viewers: 0,
    isLive: false,
  },
];

function formatViewerCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function FollowingPage() {
  const { user } = useAuth();

  const liveChannels = mockFollowing.filter((c) => c.isLive);
  const offlineChannels = mockFollowing.filter((c) => !c.isLive);

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

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Following</h1>
          <p className="text-muted-foreground">Channels you follow</p>
        </div>

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
                      <img
                        src={channel.thumbnail!}
                        alt={channel.title!}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
                        LIVE
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatViewerCount(channel.viewers)}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex gap-3">
                        <img
                          src={channel.avatar}
                          alt={channel.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {channel.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">{channel.displayName}</p>
                          <p className="text-xs text-muted-foreground">{channel.category}</p>
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
                  <img
                    src={channel.avatar}
                    alt={channel.displayName}
                    className="w-12 h-12 rounded-full object-cover opacity-50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{channel.displayName}</p>
                    <p className="text-sm text-muted-foreground">Offline</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {mockFollowing.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No channels followed yet</h3>
            <p className="text-muted-foreground mb-4">Start following channels to see them here</p>
            <Link to="/browse">
              <Button variant="secondary">Browse Channels</Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
