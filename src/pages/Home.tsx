import { Link } from 'react-router-dom';
import { Eye, TrendingUp, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

// Mock featured streams
const featuredStream = {
  id: '1',
  title: 'MASSIVE GIVEAWAY - 10K SUBS CELEBRATION 🎉',
  username: 'xqcow',
  displayName: 'xQcOW',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1280&h=720&fit=crop',
  category: 'Just Chatting',
  viewers: 89234,
  isLive: true,
};

// Mock live streams
const liveStreams = [
  {
    id: '2',
    title: 'Competitive Valorant - Road to Radiant',
    username: 'tenz',
    displayName: 'TenZ',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=640&h=360&fit=crop',
    category: 'Gaming',
    viewers: 32891,
    isLive: true,
  },
  {
    id: '3',
    title: '🎵 Chill Music Stream - Request Songs!',
    username: 'chilledcow',
    displayName: 'ChilledCow',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&h=360&fit=crop',
    category: 'Music',
    viewers: 18456,
    isLive: true,
  },
  {
    id: '4',
    title: 'IRL Stream from Tokyo 🗼',
    username: 'robcdee',
    displayName: 'Robcdee',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=640&h=360&fit=crop',
    category: 'IRL',
    viewers: 12789,
    isLive: true,
  },
  {
    id: '5',
    title: 'Pro League Practice',
    username: 'shroud',
    displayName: 'Shroud',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=640&h=360&fit=crop',
    category: 'Gaming',
    viewers: 28567,
    isLive: true,
  },
  {
    id: '6',
    title: 'Art Commission Stream 🎨',
    username: 'artwithjess',
    displayName: 'ArtWithJess',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=640&h=360&fit=crop',
    category: 'Creative',
    viewers: 5678,
    isLive: true,
  },
];

// Recommended channels
const recommendedChannels = [
  { username: 'ninja', displayName: 'Ninja', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop', isLive: true, category: 'Gaming' },
  { username: 'pokimane', displayName: 'Pokimane', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop', isLive: true, category: 'Just Chatting' },
  { username: 'summit1g', displayName: 'summit1g', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop', isLive: false, category: 'Gaming' },
];

function formatViewerCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function HomePage() {
  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-8">
        {/* Featured Stream */}
        <section>
          <Link to={`/watch/${featuredStream.username}`}>
            <div className="relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 group">
              <div className="aspect-[21/9] relative">
                <img
                  src={featuredStream.thumbnail}
                  alt={featuredStream.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Live Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded animate-pulse">
                    LIVE
                  </div>
                  <div className="bg-black/80 text-white text-sm px-3 py-1 rounded flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatViewerCount(featuredStream.viewers)} watching
                  </div>
                </div>

                {/* Stream Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-end gap-4">
                    <img
                      src={featuredStream.avatar}
                      alt={featuredStream.displayName}
                      className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{featuredStream.title}</h2>
                      <p className="text-white/80">{featuredStream.displayName} • {featuredStream.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Live Channels */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Live Channels</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {liveStreams.map((stream) => (
              <Link
                key={stream.id}
                to={`/watch/${stream.username}`}
                className="group block"
              >
                <div className="relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-200">
                  {/* Thumbnail */}
                  <div className="relative aspect-video">
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Live Badge */}
                    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
                      LIVE
                    </div>
                    {/* Viewer Count */}
                    <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViewerCount(stream.viewers)}
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  
                  {/* Stream Info */}
                  <div className="p-3">
                    <div className="flex gap-3">
                      <img
                        src={stream.avatar}
                        alt={stream.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {stream.title}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{stream.displayName}</p>
                        <p className="text-xs text-muted-foreground">{stream.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recommended Channels */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Recommended Channels</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedChannels.map((channel) => (
              <Link
                key={channel.username}
                to={`/channel/${channel.username}`}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="relative">
                  <img
                    src={channel.avatar}
                    alt={channel.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {channel.isLive && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{channel.displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {channel.isLive ? `Live • ${channel.category}` : 'Offline'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
