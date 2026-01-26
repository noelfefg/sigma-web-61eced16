import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  Users, 
  Send, 
  Settings, 
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

// Mock stream data
const mockStreamData = {
  id: '1',
  title: 'Late Night Gaming Session 🎮',
  username: 'xqcow',
  displayName: 'xQcOW',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  category: 'Just Chatting',
  viewers: 45234,
  followers: 1234567,
  isLive: true,
  description: 'Welcome to my stream! Lets have some fun tonight. !socials for links.',
};

// Mock chat messages
const mockChatMessages = [
  { id: '1', username: 'viewer1', message: 'Hey everyone!', color: '#22c55e' },
  { id: '2', username: 'chatter42', message: 'POG', color: '#3b82f6' },
  { id: '3', username: 'sigma_fan', message: 'Lets goooo!', color: '#a855f7' },
  { id: '4', username: 'newbie123', message: 'First time here, love the content!', color: '#f59e0b' },
  { id: '5', username: 'mod_user', message: 'Welcome everyone!', color: '#ef4444' },
];

function formatViewerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function WatchPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState(mockChatMessages);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !user) return;
    
    const newMessage = {
      id: Date.now().toString(),
      username: user.email?.split('@')[0] || 'user',
      message: chatMessage,
      color: '#22c55e',
    };
    
    setMessages([...messages, newMessage]);
    setChatMessage('');
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Video Section */}
        <div className={`flex-1 flex flex-col ${chatCollapsed ? '' : 'lg:mr-80'}`}>
          {/* Video Player */}
          <div className="relative bg-black aspect-video lg:aspect-auto lg:flex-1">
            {/* Placeholder Video */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Live stream preview</p>
              </div>
            </div>

            {/* Live Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded">
                LIVE
              </div>
              <div className="bg-black/80 text-white text-sm px-3 py-1 rounded flex items-center gap-1">
                <Users className="w-4 h-4" />
                {formatViewerCount(mockStreamData.viewers)}
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stream Info */}
          <div className="p-4 bg-card border-t border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <Link to={`/channel/${mockStreamData.username}`}>
                  <img
                    src={mockStreamData.avatar}
                    alt={mockStreamData.displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{mockStreamData.title}</h1>
                  <Link 
                    to={`/channel/${mockStreamData.username}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {mockStreamData.displayName}
                  </Link>
                  <p className="text-sm text-muted-foreground">{mockStreamData.category}</p>
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
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section - Desktop */}
        <div 
          className={`hidden lg:flex flex-col fixed right-0 top-16 bottom-0 w-80 bg-card border-l border-border transition-transform ${
            chatCollapsed ? 'translate-x-full' : 'translate-x-0'
          }`}
        >
          {/* Chat Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-border">
            <h2 className="font-semibold text-foreground">Stream Chat</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatCollapsed(true)}
              className="text-muted-foreground"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span 
                    className="font-semibold mr-2"
                    style={{ color: msg.color }}
                  >
                    {msg.username}:
                  </span>
                  <span className="text-foreground">{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-border">
            {user ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Send a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-secondary border-border"
                />
                <Button 
                  size="icon"
                  onClick={handleSendMessage}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="secondary" className="w-full">
                  Sign in to chat
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Chat Toggle Button (when collapsed) */}
        {chatCollapsed && (
          <Button
            variant="secondary"
            size="icon"
            className="fixed right-4 top-20 z-10"
            onClick={() => setChatCollapsed(false)}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
