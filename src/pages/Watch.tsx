import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, Users, Send, Settings, Maximize2, Volume2, VolumeX, Play, Pause, MessageSquare, Gift, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GiftOverlay, GiftNotification } from '@/components/stream/GiftOverlay';
import { LiveReactions } from '@/components/stream/LiveReactions';
import { StreamGiftPanel } from '@/components/stream/StreamGiftPanel';

interface StreamData {
  id: string; title: string; description: string | null; viewer_count: number; is_live: boolean;
  profiles: { id: string; username: string; display_name: string; avatar_url: string | null; };
  categories: { name: string; } | null;
}

interface ChatMessage {
  id: string; message: string; created_at: string;
  profiles: { username: string; display_name: string; };
}

function formatViewerCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

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
  const [isOwnStream, setIsOwnStream] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function fetchStreamData() {
      if (!username) return;
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('id, username, display_name, avatar_url').eq('username', username).maybeSingle();
      if (!profile) { setLoading(false); return; }
      const { data: followerData } = await supabase.rpc('get_follower_count', { profile_id: profile.id });
      setFollowerCount(followerData || 0);
      const ownStream = user?.id === profile.id;
      setIsOwnStream(ownStream);
      if (user) {
        const { data: followData } = await supabase.rpc('is_following', { follower: user.id, following: profile.id });
        setIsFollowing(!!followData);
      }
      const { data: stream } = await supabase.from('streams').select('id, title, description, viewer_count, is_live, profiles!inner(id, username, display_name, avatar_url), categories(name)').eq('user_id', profile.id).eq('is_live', true).maybeSingle();
      if (stream) {
        setStreamData(stream as unknown as StreamData);
        const { data: chatData } = await supabase.from('chat_messages').select('id, message, created_at, profiles!inner(username, display_name)').eq('stream_id', stream.id).order('created_at', { ascending: true }).limit(100);
        if (chatData) setMessages(chatData as unknown as ChatMessage[]);
      } else {
        navigate(`/channel/${username}`); return;
      }
      setLoading(false);

      // Start webcam for own stream
      if (ownStream) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (e) {
          console.log('Could not access camera for own stream preview');
        }
      }
    }
    fetchStreamData();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [username, user, navigate]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleRemoveNotification = useCallback((id: string) => {
    setGiftNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !user || !streamData) return;
    const { error } = await supabase.from('chat_messages').insert({ stream_id: streamData.id, user_id: user.id, message: chatMessage.trim() });
    if (!error) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), message: chatMessage.trim(), created_at: new Date().toISOString(), profiles: { username: user.email?.split('@')[0] || 'user', display_name: user.email?.split('@')[0] || 'user' } }]);
      setChatMessage('');
    }
  };

  const handleFollow = async () => {
    if (!user || !streamData) return;
    if (isFollowing) {
      await supabase.from('followers').delete().eq('follower_id', user.id).eq('following_id', streamData.profiles.id);
      setIsFollowing(false); setFollowerCount((p) => p - 1);
    } else {
      await supabase.from('followers').insert({ follower_id: user.id, following_id: streamData.profiles.id });
      setIsFollowing(true); setFollowerCount((p) => p + 1);
    }
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  if (!streamData) return (
    <AppLayout><div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Play className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-xl font-bold text-foreground mb-2">Stream not found</h1>
      <p className="text-muted-foreground mb-4">This user is not currently live</p>
      <Link to={`/channel/${username}`}><Button variant="secondary">View Channel</Button></Link>
    </div></AppLayout>
  );

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className={`flex-1 flex flex-col ${chatCollapsed ? '' : 'lg:mr-80'}`}>
          {/* Video */}
          <div className="relative bg-black aspect-video lg:aspect-auto lg:flex-1">
            {isOwnStream ? (
              <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center">
                  <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><Camera className="w-8 h-8 text-primary" /></div>
                  <p className="text-muted-foreground text-sm">Watching {streamData.profiles.display_name}'s live stream</p>
                </div>
              </div>
            )}
            <GiftOverlay notifications={giftNotifications} onRemove={handleRemoveNotification} />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded-md">LIVE</div>
              <div className="bg-black/70 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1"><Users className="w-4 h-4" />{formatViewerCount(streamData.viewer_count)}</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsMuted(!isMuted)}>{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><Settings className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><Maximize2 className="w-5 h-5" /></Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stream Info */}
          <div className="p-4 bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <Link to={`/channel/${streamData.profiles.username}`}>
                  {streamData.profiles.avatar_url ? (
                    <img src={streamData.profiles.avatar_url} alt={streamData.profiles.display_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><span className="text-lg font-bold text-muted-foreground">{streamData.profiles.display_name[0]?.toUpperCase()}</span></div>
                  )}
                </Link>
                <div>
                  <h1 className="text-lg font-bold text-foreground">{streamData.title}</h1>
                  <Link to={`/channel/${streamData.profiles.username}`} className="text-primary hover:underline text-sm font-medium">{streamData.profiles.display_name}</Link>
                  <p className="text-xs text-muted-foreground">{streamData.categories?.name || 'Uncategorized'} • {formatViewerCount(followerCount)} followers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={isFollowing ? 'secondary' : 'default'} onClick={handleFollow} disabled={!user} size="sm">
                  <Heart className={`w-4 h-4 mr-1 ${isFollowing ? 'fill-current text-destructive' : ''}`} />{isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button variant="secondary" size="sm"><Share2 className="w-4 h-4" /></Button>
                <StreamGiftPanel
                  senderName={user?.email?.split('@')[0] || 'Anonymous'}
                  onSendGift={(n) => setGiftNotifications(prev => [...prev, n])}
                />
              </div>
            </div>
            {/* Live Reactions */}
            <div className="mt-3 pt-3 border-t border-border">
              <LiveReactions />
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className={`hidden lg:flex flex-col fixed right-0 top-14 bottom-0 w-80 bg-card transition-transform ${chatCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
          <div className="h-12 px-4 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-foreground">Stream Chat</h2>
            <Button variant="ghost" size="icon" onClick={() => setChatCollapsed(true)} className="text-muted-foreground h-8 w-8"><MessageSquare className="w-4 h-4" /></Button>
          </div>
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm"><span className="font-semibold mr-1.5 text-primary">{msg.profiles.display_name}:</span><span className="text-foreground">{msg.message}</span></div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          <div className="p-3">
            {user ? (
              <div className="flex gap-2">
                <Input placeholder="Send a message..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="bg-secondary text-sm h-9" />
                <Button size="icon" onClick={handleSendMessage} className="h-9 w-9"><Send className="w-4 h-4" /></Button>
              </div>
            ) : (
              <Link to="/auth"><Button variant="secondary" className="w-full text-sm" size="sm">Sign in to chat</Button></Link>
            )}
          </div>
        </div>

        {chatCollapsed && <Button variant="secondary" size="icon" className="fixed right-4 top-20 z-10 h-8 w-8" onClick={() => setChatCollapsed(false)}><MessageSquare className="w-4 h-4" /></Button>}
      </div>
    </AppLayout>
  );
}
