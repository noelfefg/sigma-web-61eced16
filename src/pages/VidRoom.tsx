import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Send, Copy, Check, MessageSquare, Share2, Loader2, Play, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RoomMessage {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: string;
  type: 'chat' | 'system';
}

interface Participant {
  id: string;
  username: string;
  avatar?: string;
  joinedAt: string;
}

export default function VidRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState('');

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setUsername(data.username);
      });
  }, [user]);

  // WebSocket for real-time chat
  const handleWsMessage = useCallback((payload: any) => {
    if (payload.type === 'chat') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        username: payload.username,
        avatar: payload.avatar,
        message: payload.message,
        timestamp: new Date().toISOString(),
        type: 'chat',
      }]);
    } else if (payload.type === 'join') {
      setParticipants(prev => {
        if (prev.find(p => p.id === payload.userId)) return prev;
        return [...prev, { id: payload.userId, username: payload.username, avatar: payload.avatar, joinedAt: new Date().toISOString() }];
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        username: 'System',
        message: `${payload.username} joined the room`,
        timestamp: new Date().toISOString(),
        type: 'system',
      }]);
    } else if (payload.type === 'leave') {
      setParticipants(prev => prev.filter(p => p.id !== payload.userId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        username: 'System',
        message: `${payload.username} left the room`,
        timestamp: new Date().toISOString(),
        type: 'system',
      }]);
    }
  }, []);

  const { send } = useWebSocket(`vidroom:${roomId}`, handleWsMessage);

  // On mount, announce join
  useEffect(() => {
    if (!user || !username) return;
    send({ type: 'join', userId: user.id, username, avatar: null });
    return () => {
      send({ type: 'leave', userId: user.id, username });
    };
  }, [user, username, send]);

  // Load stream/post data
  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    // Try to load as stream first, then as post
    supabase.from('streams').select('id, title, description, viewer_count, is_live, profiles!inner(id, username, display_name, avatar_url), categories(name)')
      .eq('id', roomId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStreamData({ type: 'stream', ...data });
          setLoading(false);
        } else {
          supabase.from('posts').select('id, title, content, media_urls, post_type, profiles!inner(id, username, display_name, avatar_url)')
            .eq('id', roomId).maybeSingle()
            .then(({ data: postData }) => {
              if (postData) setStreamData({ type: 'post', ...postData });
              setLoading(false);
            });
        }
      });
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!chatMessage.trim() || !user) return;
    send({ type: 'chat', username, message: chatMessage.trim(), avatar: null });
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      username,
      message: chatMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'chat',
    }]);
    setChatMessage('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    toast({ title: 'Link copied!', description: 'Share this link to invite others to the room.' });
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
        {/* Main Video/Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video Player */}
          <div className="relative bg-black aspect-video lg:aspect-auto lg:flex-1">
            {streamData?.type === 'stream' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-foreground font-bold text-lg">{streamData.title}</h2>
                  <p className="text-muted-foreground text-sm mt-1">by {streamData.profiles?.display_name}</p>
                </div>
              </div>
            ) : streamData?.type === 'post' && streamData.media_urls?.[0] ? (
              streamData.post_type === 'video' ? (
                <video src={streamData.media_urls[0]} controls className="absolute inset-0 w-full h-full object-contain" />
              ) : (
                <img src={streamData.media_urls[0]} alt={streamData.title || ''} className="absolute inset-0 w-full h-full object-contain" />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center">
                  <Users className="w-12 h-12 text-primary/60 mx-auto mb-3" />
                  <h2 className="text-foreground font-bold text-lg">Vid Room</h2>
                  <p className="text-muted-foreground text-sm">Watch & chat together</p>
                </div>
              </div>
            )}

            {/* Viewer count badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {participants.length + 1}
              </div>
            </div>
          </div>

          {/* Room Info Bar */}
          <div className="px-4 py-3 bg-card border-t border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((p) => (
                  <Avatar key={p.id} className="w-8 h-8 border-2 border-card">
                    <AvatarImage src={p.avatar || ''} />
                    <AvatarFallback className="bg-secondary text-xs">{p.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {participants.length > 0
                  ? `${participants.length + 1} watching together`
                  : 'Invite friends to watch together'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setShowParticipants(!showParticipants)} className="gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">People</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCopyLink} className="gap-1.5">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Invite'}</span>
              </Button>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-80 flex flex-col bg-card border-l border-border h-64 lg:h-auto">
          <div className="h-12 px-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground">Room Chat</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {participants.length + 1} online
            </span>
          </div>

          {/* Participants panel */}
          {showParticipants && (
            <div className="px-4 py-3 border-b border-border bg-secondary/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In this room</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {/* Current user */}
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground">{username || 'You'}</span>
                  <span className="text-xs text-muted-foreground">(you)</span>
                </div>
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={p.avatar || ''} />
                      <AvatarFallback className="bg-secondary text-xs">{p.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">{p.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 px-4 py-2">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === 'system' ? (
                    <p className="text-xs text-center text-muted-foreground py-1">{msg.message}</p>
                  ) : (
                    <div className="flex gap-2 items-start">
                      <Avatar className="w-7 h-7 mt-0.5 flex-shrink-0">
                        <AvatarImage src={msg.avatar || ''} />
                        <AvatarFallback className="bg-secondary text-xs">{msg.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-primary">{msg.username}</span>
                        <p className="text-sm text-foreground break-words">{msg.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border">
            {user ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Say something..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="bg-secondary text-sm h-9"
                />
                <Button size="icon" onClick={handleSend} className="h-9 w-9 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="secondary" className="w-full text-sm" size="sm">Sign in to chat</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
