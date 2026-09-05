import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2, Users, Send, Maximize2, Volume2, VolumeX, Play, Pause, MessageSquare, Loader2, Camera, X, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LiveReactions } from '@/components/stream/LiveReactions';
import { StreamPlayer } from '@/components/stream/StreamPlayer';
import { Message, MessageAvatar, MessageContent, Bubble, BubbleContent, MessageFooter } from '@/components/messaging/Bubble';
import { AvatarGroup } from '@/components/common/AvatarGroup';
import { useStreamEventLogger, useStreamMetricRecorder } from '@/hooks/useStreamMetrics';

interface StreamData {
  id: string; title: string; description: string | null; viewer_count: number; is_live: boolean;
  source_type: 'youtube' | 'hls'; source_url: string | null;
  profiles: { id: string; username: string; display_name: string; avatar_url: string | null; };
  categories: { name: string; } | null;
}

interface ChatMessage {
  id: string; message: string; created_at: string;
  profiles: { username: string; display_name: string; avatar_url?: string | null; };
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
  const [chatOpen, setChatOpen] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [isOwnStream, setIsOwnStream] = useState(false);
  const [myUsername, setMyUsername] = useState<string | null>(null);

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
      const { data: stream } = await supabase.from('streams').select('id, title, description, viewer_count, is_live, source_type, source_url, profiles!inner(id, username, display_name, avatar_url), categories(name)').eq('user_id', profile.id).eq('is_live', true).maybeSingle();
      if (stream) {
        setStreamData(stream as unknown as StreamData);
        const { data: chatData } = await supabase.from('chat_messages').select('id, message, created_at, profiles!inner(username, display_name)').eq('stream_id', stream.id).order('created_at', { ascending: true }).limit(100);
        if (chatData) setMessages(chatData as unknown as ChatMessage[]);
      } else {
        navigate(`/channel/${username}`); return;
      }
      setLoading(false);
      if (ownStream) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = mediaStream;
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (e) { console.log('Could not access camera'); }
      }
    }
    fetchStreamData();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };
  }, [username, user, navigate]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Realtime stream chat
  useEffect(() => {
    if (!streamData) return;
    const channel = supabase
      .channel(`stream-chat-${streamData.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `stream_id=eq.${streamData.id}` }, async (payload) => {
        const row: any = payload.new;
        const { data: prof } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', row.user_id).maybeSingle();
        setMessages((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, {
          id: row.id, message: row.message, created_at: row.created_at,
          profiles: { username: prof?.username || 'user', display_name: prof?.display_name || 'user', avatar_url: prof?.avatar_url ?? null },
        }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [streamData]);


  useEffect(() => {
    if (!user) { setMyUsername(null); return; }
    supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
      .then(({ data }) => setMyUsername(data?.username ?? null));
  }, [user]);

  const logEvent = useStreamEventLogger(streamData?.id);
  useStreamMetricRecorder({
    streamId: streamData?.id,
    isOwner: isOwnStream,
    active: !!streamData?.is_live,
    viewerCount: streamData?.viewer_count ?? 0,
  });

  useEffect(() => {
    if (streamData?.id && user) logEvent('join');
  }, [streamData?.id, user, logEvent]);

  /** Unique chatters shown in the chat header. */
  const chatters = useMemo(() => {
    const seen = new Map<string, { username: string; display_name: string; avatar_url?: string | null }>();
    for (const m of messages) if (!seen.has(m.profiles.username)) seen.set(m.profiles.username, m.profiles);
    return [...seen.values()];
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !user || !streamData) return;
    const { error } = await supabase.from('chat_messages').insert({ stream_id: streamData.id, user_id: user.id, message: chatMessage.trim() });
    if (!error) {
      setChatMessage('');
      logEvent('chat');
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
        {/* Main content area */}
        <div className={`flex-1 flex flex-col min-w-0 ${chatOpen ? 'lg:mr-[340px]' : ''}`}>
          {/* Video Player */}
          <div className="relative bg-black w-full" style={{ aspectRatio: '16/9' }}>
            {isOwnStream && !streamData.source_url ? (
              <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : streamData.source_url ? (
              <StreamPlayer sourceType={streamData.source_type} sourceUrl={streamData.source_url} muted={isMuted} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center">
                  <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-sm">Watching {streamData.profiles.display_name}'s live stream</p>
                </div>
              </div>
            )}

            {/* Live badge + viewers overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <div className="bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-0.5 rounded">LIVE</div>
              <div className="bg-black/70 text-white text-xs px-2.5 py-0.5 rounded flex items-center gap-1">
                <Users className="w-3 h-3" />{formatViewerCount(streamData.viewer_count)}
              </div>
            </div>

            {/* Bottom controls bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Below video – YouTube style info */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {/* Title */}
            <h1 className="text-xl font-bold text-foreground leading-tight">{streamData.title}</h1>

            {/* Channel info row + action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left: avatar, name, followers, subscribe/follow */}
              <div className="flex items-center gap-3">
                <Link to={`/channel/${streamData.profiles.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={streamData.profiles.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground font-bold">
                      {streamData.profiles.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0">
                  <Link to={`/channel/${streamData.profiles.username}`} className="text-sm font-semibold text-foreground hover:text-foreground/80 block truncate">
                    {streamData.profiles.display_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatViewerCount(followerCount)} Sigmatizers</p>
                </div>
                <Button
                  onClick={handleFollow}
                  disabled={!user}
                  className={`rounded-full px-4 h-9 text-sm font-semibold ml-2 ${
                    isFollowing
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      : 'bg-foreground text-background hover:bg-foreground/90'
                  }`}
                >
                  {isFollowing ? 'Sigmatized' : 'Sigmatize'}
                </Button>
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full gap-1.5 h-9"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  <Share2 className="w-4 h-4" />Share
                </Button>
              </div>
            </div>

            {/* Description card */}
            {streamData.description && (
              <div className="bg-secondary/50 rounded-xl p-3 text-sm text-foreground">
                <span className="font-medium text-muted-foreground">{streamData.categories?.name || 'Uncategorized'}</span>
                <p className="mt-1">{streamData.description}</p>
              </div>
            )}

            <LiveReactions />
          </div>
        </div>

        {/* Chat Panel – YouTube style */}
        {chatOpen && (
          <div className="hidden lg:flex flex-col fixed right-0 top-14 bottom-0 w-[340px] border-l border-border bg-card">
            {/* Chat header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-foreground">Live chat</span>
                {chatters.length > 0 && <AvatarGroup people={chatters} size="xs" max={3} />}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setChatOpen(false)} aria-label="Close chat">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat messages */}
            <ScrollArea className="flex-1">
              <div className="px-3 py-2">
                {messages.length === 0 && (
                  <p className="py-10 text-center text-xs text-muted-foreground">No messages yet. Say hello.</p>
                )}
                {messages.map((msg, i) => {
                  const mine = !!myUsername && msg.profiles.username === myUsername;
                  const grouped = i > 0 && messages[i - 1].profiles.username === msg.profiles.username;
                  return (
                    <Message key={msg.id} variant={mine ? 'outgoing' : 'incoming'} grouped={grouped}>
                      <MessageAvatar src={msg.profiles.avatar_url} name={msg.profiles.display_name} hidden={grouped} />
                      <MessageContent>
                        {!grouped && (
                          <span className={`px-1 text-[11px] font-medium text-muted-foreground ${mine ? 'text-right' : ''}`}>
                            @{msg.profiles.username}
                          </span>
                        )}
                        <Bubble variant={mine ? 'outgoing' : 'incoming'} grouped={grouped} className="max-w-[240px]">
                          <BubbleContent>{msg.message}</BubbleContent>
                        </Bubble>
                        <MessageFooter
                          variant={mine ? 'outgoing' : 'incoming'}
                          timestamp={new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        />
                      </MessageContent>
                    </Message>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>


            {/* Chat input */}
            <div className="p-3 border-t border-border">
              {user ? (
                <div className="flex gap-2 items-center">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-secondary">
                      {(user.email?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Chat..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-secondary text-sm h-8 rounded-full border-0"
                    />
                    <Button size="icon" onClick={handleSendMessage} className="h-8 w-8 rounded-full shrink-0" disabled={!chatMessage.trim()}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Link to="/auth"><Button variant="secondary" className="w-full text-sm rounded-full" size="sm">Sign in to chat</Button></Link>
              )}
            </div>
          </div>
        )}

        {/* Reopen chat button */}
        {!chatOpen && (
          <Button
            variant="secondary"
            size="sm"
            className="fixed right-4 top-20 z-10 rounded-full gap-1.5"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare className="w-4 h-4" />Chat
          </Button>
        )}

      </div>
    </AppLayout>
  );
}
