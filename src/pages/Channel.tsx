import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  Users,
  Calendar,
  Play,
  Eye,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

// Mock channel data
const mockChannelData = {
  username: 'xqcow',
  displayName: 'xQcOW',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=400&fit=crop',
  bio: 'Professional gamer and full-time streamer. Variety content creator. Business: [email protected]',
  followers: 1234567,
  following: 342,
  isLive: true,
  currentCategory: 'Just Chatting',
  streamTitle: 'Late Night Gaming Session 🎮',
  viewers: 45234,
  joinedDate: 'January 2020',
};

// Mock videos
const mockVideos = [
  {
    id: '1',
    title: 'Best moments from last stream',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop',
    duration: '2:34:12',
    views: 234567,
    date: '2 days ago',
  },
  {
    id: '2',
    title: 'Competitive ranked gameplay',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=225&fit=crop',
    duration: '4:12:45',
    views: 189432,
    date: '4 days ago',
  },
  {
    id: '3',
    title: 'React Andy content',
    thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=225&fit=crop',
    duration: '3:45:23',
    views: 156789,
    date: '1 week ago',
  },
];

// Mock clips
const mockClips = [
  {
    id: '1',
    title: 'Insane clutch moment',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop',
    duration: '0:32',
    views: 45678,
    clipper: 'clipper123',
  },
  {
    id: '2',
    title: 'Funniest reaction ever',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=225&fit=crop',
    duration: '0:45',
    views: 34567,
    clipper: 'bestclips',
  },
];

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function ChannelPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <AppLayout>
      <div className="min-h-full">
        {/* Banner */}
        <div className="relative h-48 md:h-64">
          <img
            src={mockChannelData.banner}
            alt="Channel banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Profile Section */}
        <div className="relative px-4 md:px-6 -mt-16">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={mockChannelData.avatar}
                alt={mockChannelData.displayName}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover"
              />
              {mockChannelData.isLive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
                  LIVE
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{mockChannelData.displayName}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {formatCount(mockChannelData.followers)} followers
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {mockChannelData.joinedDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isFollowing ? 'secondary' : 'default'}
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={isFollowing ? '' : 'bg-primary hover:bg-primary/90'}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current text-destructive' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="secondary">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground mt-3 max-w-2xl">{mockChannelData.bio}</p>
            </div>
          </div>
        </div>

        {/* Live Stream Preview (if live) */}
        {mockChannelData.isLive && (
          <div className="px-4 md:px-6 mt-6">
            <Link to={`/watch/${mockChannelData.username}`}>
              <div className="relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors group">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/30 transition-colors">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-muted-foreground mt-2">Click to watch live</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded">
                    LIVE
                  </div>
                  <div className="bg-black/80 text-white text-sm px-3 py-1 rounded flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatCount(mockChannelData.viewers)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">{mockChannelData.streamTitle}</h3>
                  <p className="text-sm text-muted-foreground">{mockChannelData.currentCategory}</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Content Tabs */}
        <div className="px-4 md:px-6 mt-6 pb-8">
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="bg-secondary">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="clips">Clips</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors group cursor-pointer"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                        {video.duration}
                      </div>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-foreground truncate">{video.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatCount(video.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {video.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="clips" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors group cursor-pointer"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                        {clip.duration}
                      </div>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-foreground truncate">{clip.title}</h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatCount(clip.views)}
                        </span>
                        <span>Clipped by {clip.clipper}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <div className="max-w-2xl">
                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">About {mockChannelData.displayName}</h3>
                    <p className="text-muted-foreground">{mockChannelData.bio}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Followers</p>
                      <p className="text-xl font-bold text-foreground">{formatCount(mockChannelData.followers)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Following</p>
                      <p className="text-xl font-bold text-foreground">{formatCount(mockChannelData.following)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
