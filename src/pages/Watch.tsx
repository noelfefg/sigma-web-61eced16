import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  MessageSquare,
  Gift,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GiftOverlay, GiftNotification } from '@/components/stream/GiftOverlay';

interface StreamData {
  id: string;
  title: string;
  description: string | null;
  viewer_count: number;
  is_live: boolean;
  profiles: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  categories: {
    name: string;
  } | null;
}

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
  };
}

function formatViewerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const mockGifts = [
  { name: 'Heart', icon: 'heart', price: 50 },
  { name: 'Star', icon: 'star', price: 100 },
  { name: 'Diamond', icon: 'diamond', price: 1000 },
];

export default function WatchPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [giftNotifications, setGiftNotifications] = useState<GiftNotification[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStreamData() {
      if (!username) return;
      
      setLoading(true);

      // Find profile by username
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('username', username)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Get follower count
      const { data: followerData } = await supabase.rpc('get_follower_count', {
        profile_id: profile.id,
      });
      setFollowerCount(followerData || 0);

      // Check if current user is following
      if (user) {
        const { data: followData } = await supabase.rpc('is_following', {
          follower: user.id,
          following: profile.id,
        });
        setIsFollowing(!!followData);
      }

      // Get active stream
      const { data: stream } = await supabase
        .from('streams')
        .select(`
          id,
          title,
          description,
          viewer_count,
          is_live,
          profiles!inner(id, username, display_name, avatar_url),
          categories(name)
        `)
        .eq('user_id', profile.id)
        .eq('is_live', true)
        .maybeSingle();

      if (stream) {
        setStreamData(stream as unknown as StreamData);

        // Fetch chat messages
        const { data: chatData } = await supabase
          .from('chat_messages')
          .select(`
            id,
            message,
            created_at,
            profiles!inner(username, display_name)
          `)
          .eq('stream_id', stream.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (chatData) {
          setMessages(chatData as unknown as ChatMessage[]);
        }
      } else {
        // No live stream, redirect to channel
        navigate(`/channel/${username}`);
        return;
      }

      setLoading(false);
    }

    fetchStreamData();
  }, [username, user, navigate]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRemoveNotification = useCallback((id: string) => {
    setGiftNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const simulateGift = () => {
    const randomGift = mockGifts[Math.floor(Math.random() * mockGifts.length)];
    const senders = ['CoolViewer', 'StreamFan99', 'GiftKing'];
    const randomSender = senders[Math.floor(Math.random() * senders.length)];
    
    const newNotification: GiftNotification = {
      id: Date.now().toString(),
      type: 'gift',
      senderName: randomSender,
      giftName: randomGift.name,
      giftIcon: randomGift.icon,
    };
    
    setGiftNotifications((prev) => [...prev.slice(-4), newNotification]);
  };

  const simulateDonation = () => {
    const amounts = [5, 10, 25, 50, 100];
    const senders = ['GenerousOne', 'BigTipper', 'LoyalSub'];
    const donationMessages = ['Keep up the great work!', 'Love the stream!', ''];
    
    const newNotification: GiftNotification = {
      id: Date.now().toString(),
      type: 'donation',
      senderName: senders[Math.floor(Math.random() * senders.length)],
      amount: amounts[Math.floor(Math.random() * amounts.length)],
      message: donationMessages[Math.floor(Math.random() * donationMessages.length)],
    };
    
    setGiftNotifications((prev) => [...prev.slice(-4), newNotification]);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !user || !streamData) return;
    
    const { error } = await supabase.from('chat_messages').insert({
      stream_id: streamData.id,
      user_id: user.id,
      message: chatMessage.trim(),
    });

    if (!error) {
      // Optimistically add message
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message: chatMessage.trim(),
        created_at: new Date().toISOString(),
        profiles: {
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'user',
        },
      };
      setMessages((prev) => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  const handleFollow = async () => {
    if (!user || !streamData) return;

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', streamData.profiles.id);
      setIsFollowing(false);
      setFollowerCount((prev) => prev - 1);
    } else {
      await supabase.from('followers').insert({
        follower_id: user.id,
        following_id: streamData.profiles.id,
      });
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!streamData) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Play className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Stream not found</h1>
          <p className="text-muted-foreground mb-4">This user is not currently live</p>
          <Link to={`/channel/${username}`}>
            <Button variant="secondary">View Channel</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Video Section */}
        <div className={`flex-1 flex flex-col ${chatCollapsed ? '' : 'lg:mr-80'}`}>
          {/* Video Player */}
          <div className="relative bg-black aspect-video lg:aspect-auto lg:flex-1">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Live stream preview</p>
              </div>
            </div>

            <GiftOverlay 
              notifications={giftNotifications} 
              onRemove={handleRemoveNotification} 
            />

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded">
                LIVE
              </div>
              <div className="bg-black/80 text-white text-sm px-3 py-1 rounded flex items-center gap-1">
                <Users className="w-4 h-4" />
                {formatViewerCount(streamData.viewer_count)}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={simulateGift}
                className="bg-purple-500/80 hover:bg-purple-500 text-white text-xs"
              >
                <Gift className="w-3 h-3 mr-1" />
                Demo Gift
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={simulateDonation}
                className="bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs"
              >
                $ Demo Donate
              </Button>
            </div>

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
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Settings className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
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
                <Link to={`/channel/${streamData.profiles.username}`}>
                  {streamData.profiles.avatar_url ? (
                    <img
                      src={streamData.profiles.avatar_url}
                      alt={streamData.profiles.display_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {streamData.profiles.display_name[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{streamData.title}</h1>
                  <Link 
                    to={`/channel/${streamData.profiles.username}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {streamData.profiles.display_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {streamData.categories?.name || 'Uncategorized'} • {formatViewerCount(followerCount)} followers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isFollowing ? 'secondary' : 'default'}
                  onClick={handleFollow}
                  disabled={!user}
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

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-semibold mr-2 text-primary">
                    {msg.profiles.display_name}:
                  </span>
                  <span className="text-foreground">{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

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
