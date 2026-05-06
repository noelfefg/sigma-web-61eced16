/**
 * ChatRoom.tsx — SIGMA Global Chat Rooms
 * Themed with semantic tokens, animated, live ambient effects.
 */
import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, Users, Smile, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface RoomMessage {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  text: string;
  timestamp: number;
}

const ROOMS = [
  { id: 'general', label: 'General', emoji: '💬', desc: 'Talk about anything' },
  { id: 'gaming',  label: 'Gaming',  emoji: '🎮', desc: 'Games & streams' },
  { id: 'music',   label: 'Music',   emoji: '🎵', desc: 'Music & artists' },
  { id: 'art',     label: 'Art',     emoji: '🎨', desc: 'Creative content' },
  { id: 'sports',  label: 'Sports',  emoji: '⚽', desc: 'Sports talk' },
  { id: 'tech',    label: 'Tech',    emoji: '💻', desc: 'Technology & coding' },
];

const EMOJIS = ['😂','❤️','🔥','😮','👏','😢','🎉','💯','🙌','✨'];

export default function ChatRoomPage() {
  const { user } = useAuth();
  const [room, setRoom] = useState(ROOMS[0]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typing, setTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<{ username: string; display_name: string; avatar_url: string | null } | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username,display_name,avatar_url')
      .eq('id', user.id).maybeSingle()
      .then(({ data }) => setUserProfile(data));
  }, [user]);

  useEffect(() => {
    setMessages([]);
    const load = async () => {
      const { data } = await supabase.from('chat_messages')
        .select('id,message,created_at,user_id')
        .eq('stream_id', `room:${room.id}` as any)
        .order('created_at', { ascending: true })
        .limit(100);
      if (!data) return;
      const ids = Array.from(new Set(data.map((m: any) => m.user_id)));
      const { data: profs } = await supabase.from('profiles')
        .select('id,username,display_name,avatar_url').in('id', ids);
      const pmap = new Map((profs || []).map((p: any) => [p.id, p]));
      setMessages(data.map((m: any) => {
        const p = pmap.get(m.user_id);
        return {
          id: m.id,
          username: p?.username || 'user',
          display_name: p?.display_name || 'User',
          avatar_url: p?.avatar_url,
          text: m.message,
          timestamp: new Date(m.created_at).getTime(),
        };
      }));
      setTimeout(() => listRef.current?.scrollTo({ top: 9999 }), 100);
    };
    load();

    const ch = supabase.channel(`room:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `stream_id=eq.room:${room.id}`,
      }, async (payload) => {
        const { data: p } = await supabase.from('profiles')
          .select('username,display_name,avatar_url').eq('id', payload.new.user_id).maybeSingle();
        setMessages(prev => [...prev.slice(-200), {
          id: payload.new.id,
          username: p?.username || 'user',
          display_name: p?.display_name || 'User',
          avatar_url: p?.avatar_url,
          text: payload.new.message,
          timestamp: Date.now(),
        }]);
        setTimeout(() => listRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await ch.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(ch); };
  }, [room.id, user]);

  const send = async () => {
    if (!user || !draft.trim() || sending || !userProfile) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      await supabase.from('chat_messages').insert({
        stream_id: `room:${room.id}` as any,
        user_id: user.id,
        message: text,
      });
    } catch {}
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <AppLayout>
      <div className="relative flex h-[calc(100vh-56px)] bg-background overflow-hidden">
        {/* Live ambient background — soft moving aurora blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl"
            animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/30 blur-3xl"
            animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Room sidebar */}
        <aside className="relative z-10 w-56 shrink-0 flex flex-col bg-card/80 backdrop-blur-xl border-r border-border">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rooms</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
            {ROOMS.map(r => {
              const active = room.id === r.id;
              return (
                <motion.button
                  key={r.id}
                  onClick={() => setRoom(r)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="room-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-foreground rounded-r-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="text-lg">{r.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live · realtime
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <div className="relative z-10 flex-1 flex flex-col min-w-0 bg-background/40 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0 bg-card/70 backdrop-blur-xl border-b border-border">
            <div className="flex items-center gap-3">
              <motion.span
                key={room.id}
                initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="text-2xl"
              >
                {room.emoji}
              </motion.span>
              <div>
                <h2 className="text-sm font-extrabold text-foreground">#{room.label}</h2>
                <p className="text-xs text-muted-foreground">{room.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" />
              <span className="font-semibold">{onlineCount} online</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Hash className="w-12 h-12 text-muted-foreground" />
                  </motion.div>
                  <p className="text-sm font-bold text-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground">Start the conversation in #{room.label}</p>
                </motion.div>
              ) : (
                messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                    className="flex items-start gap-3 group"
                  >
                    <Avatar className="w-9 h-9 ring-2 ring-border shrink-0">
                      <AvatarImage src={msg.avatar_url || ''} />
                      <AvatarFallback className="bg-secondary text-xs font-bold">
                        {msg.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-bold text-foreground cursor-pointer hover:underline">
                          {msg.display_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed break-words text-foreground/90">{msg.text}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="px-5 pb-5 pt-3 border-t border-border bg-card/60 backdrop-blur-xl">
            <AnimatePresence>
              {showEmoji && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex gap-2 mb-2 overflow-x-auto"
                >
                  {EMOJIS.map(e => (
                    <motion.button
                      key={e}
                      whileHover={{ scale: 1.3, rotate: 10 }}
                      whileTap={{ scale: 0.7 }}
                      onClick={() => setDraft(d => d + e)}
                      className="text-2xl shrink-0"
                    >
                      {e}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmoji(v => !v)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-2 rounded-full hover:bg-accent"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 bg-secondary border border-border focus-within:border-foreground/40 transition-colors">
                  <input
                    ref={inputRef}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                    placeholder={`Message #${room.label}…`}
                    value={draft}
                    onChange={e => { setDraft(e.target.value); setTyping(true); setTimeout(() => setTyping(false), 1500); }}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                    maxLength={500}
                  />
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.08 }}
                    onClick={send}
                    disabled={!draft.trim() || sending}
                    className={`shrink-0 rounded-full p-2 transition-colors ${
                      draft.trim() ? 'bg-foreground text-background' : 'text-muted-foreground'
                    } disabled:opacity-40`}
                  >
                    {sending
                      ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      : <Send className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-3">
                <a href="/auth" className="text-sm font-bold text-foreground hover:underline">Sign in</a>
                <span className="text-sm mx-1 text-muted-foreground">to chat in #{room.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
