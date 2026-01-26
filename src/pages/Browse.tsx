import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Eye, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';

// Mock data for streams
const mockStreams = [
  {
    id: '1',
    title: 'Late Night Gaming Session 🎮',
    username: 'xQcOW',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop',
    category: 'Just Chatting',
    viewers: 45234,
    isLive: true,
  },
  {
    id: '2',
    title: 'Competitive Valorant - Road to Radiant',
    username: 'TenZ',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=640&h=360&fit=crop',
    category: 'Gaming',
    viewers: 32891,
    isLive: true,
  },
  {
    id: '3',
    title: '🎵 Chill Music Stream - Request Songs!',
    username: 'ChilledCow',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&h=360&fit=crop',
    category: 'Music',
    viewers: 18456,
    isLive: true,
  },
  {
    id: '4',
    title: 'IRL Stream from Tokyo 🗼',
    username: 'Robcdee',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=640&h=360&fit=crop',
    category: 'IRL',
    viewers: 12789,
    isLive: true,
  },
  {
    id: '5',
    title: 'Pro League Practice',
    username: 'Shroud',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=640&h=360&fit=crop',
    category: 'Gaming',
    viewers: 28567,
    isLive: true,
  },
  {
    id: '6',
    title: 'Art Commission Stream 🎨',
    username: 'ArtWithJess',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=640&h=360&fit=crop',
    category: 'Creative',
    viewers: 5678,
    isLive: true,
  },
];

const categories = [
  { name: 'Just Chatting', slug: 'just-chatting', viewers: 245000 },
  { name: 'Gaming', slug: 'gaming', viewers: 189000 },
  { name: 'Music', slug: 'music', viewers: 78000 },
  { name: 'IRL', slug: 'irl', viewers: 56000 },
  { name: 'Sports', slug: 'sports', viewers: 34000 },
  { name: 'Creative', slug: 'creative', viewers: 23000 },
];

function formatViewerCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredStreams = mockStreams.filter((stream) => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || stream.category.toLowerCase().replace(' ', '-') === selectedCategory;
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
                <span className="ml-2 text-xs opacity-70">{formatViewerCount(category.viewers)}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Live Streams Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold">Live Now</h2>
            <span className="text-muted-foreground text-sm">({filteredStreams.length} streams)</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStreams.map((stream) => (
              <Link
                key={stream.id}
                to={`/watch/${stream.username.toLowerCase()}`}
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
                    {stream.isLive && (
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
                        LIVE
                      </div>
                    )}
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
                        alt={stream.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {stream.title}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{stream.username}</p>
                        <p className="text-xs text-muted-foreground">{stream.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredStreams.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No streams found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
