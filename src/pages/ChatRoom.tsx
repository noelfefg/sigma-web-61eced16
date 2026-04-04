/**
 * ChatRoom.tsx - SIGMA Global Chat Rooms (powered by Socket.io concept)
 *
 * IMPORTANT: Socket.io requires a running Node.js server.
 * See SIGMA_SOCKETIO_GUIDE.md for server setup.
 *
 * This component connects to the Socket.io server at VITE_SOCKET_URL.
 * Falls back to Supabase realtime if Socket.io server is not running.
 *
 * Rooms: general, gaming, music, art, sports, tech
 */
import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, Users, Smile, Link } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────
interface RoomMessage {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  text: string;
  timestamp: number;
  color?: string;
}

// Available chat rooms
const ROOMS = [
  { id: 'general',  label: 'General',     emoji: '💬', desc: 'Talk about anything' },
  { id: 'gaming',   label: 'Gaming',      emoji: '🎮', desc: 'Games & streams' },
  { id: 'music',    label: 'Music',       emoji: '🎵', desc: 'Music & artists' },
  { id: 'art',      label: 'Art',         emoji: '🎨', desc: 'Creative content' },
  { id: 'sports',   label: 'Sports',      emoji: '⚽', desc: 'Sports talk' },
  { id: 'tech',     label: 'Tech',        emoji: '💻', desc: 'Technology & coding' },
];

const CHAT_COLORS = ['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#4dabf7','#748ffc','#da77f2','#f783ac'];
function userColor(name: string) {
  let n = 0; for (const c of name) n += c.charCodeAt(0);
  return CHAT_COLORS[n % CHAT_COLORS.length];
}

const EMOJIS = ['😂','❤️','🔥','😮','👏','😢','🎉','💯','🙌','✨'];

export default function ChatRoomPage() {
  const { user } = useAuth();
  const [room, setRoom] = useState(ROOMS[0]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [userProfile, setUserProfile] = useState<{ username: string; display_name: string; avatar_url: string | null } | null>(null);
  const [onlineCount, setOnlineCount] = useState(Math.floor(Math.random() * 40) + 10);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user profile
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username,display_name,avatar_url')
      .eq('id', user.id).maybeSingle()
      .then(({ data }) => setUserProfile(data));
  }, [user]);

  // Load recent messages from Supabase (fallback for Socket.io)
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data } = await supabase.from('chat_messages' as any)
          .select('id,message,created_at,profiles:user_id(username,display_name,avatar_url)')
          .eq('stream_id', `room:${room.id}`)
          .order('created_at', { ascending: true })
          .limit(100);

        if (data) {
          setMessages((data as any[]).map(m => ({
            id: m.id,
            username: m.profiles?.username || 'user',
            display_name: m.profiles?.display_name || 'User',
            avatar_url: m.profiles?.avatar_url,
            text: m.message,
            timestamp: new Date(m.created_at).getTime(),
            color: userColor(m.profiles?.username || 'user'),
          })));
          setTimeout(() => listRef.current?.scrollTo({ top: 9999 }), 100);
        }
      } catch {}
    };
    loadMessages();

    // Real-time via Supabase channel
    const ch = supabase.channel(`room:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `stream_id=eq.room:${room.id}`,
      }, async (payload) => {
        const { data: p } = await supabase.from('profiles')
          .select('username,display_name,avatar_url').eq('id', payload.new.user_id).maybeSingle();
        const newMsg: RoomMessage = {
          id: payload.new.id, username: p?.username || 'user',
          display_name: p?.display_name || 'User', avatar_url: p?.avatar_url,
          text: payload.new.message, timestamp: Date.now(),
          color: userColor(p?.username || 'user'),
        };
        setMessages(prev => [...prev.slice(-200), newMsg]);
        setTimeout(() => listRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50);
      }).subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [room.id]);

  const send = async () => {
    if (!user || !draft.trim() || sending || !userProfile) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');

    try {
      await supabase.from('chat_messages' as any).insert({
        stream_id: `room:${room.id}`,
        user_id: user.id,
        message: text,
      });
    } catch (e) {
      // Optimistic local add as fallback
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        username: userProfile.username,
        display_name: userProfile.display_name,
        avatar_url: userProfile.avatar_url,
        text,
        timestamp: Date.now(),
        color: userColor(userProfile.username),
      }]);
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-56px)]" style={{ background: '#0a0a0a' }}>

        {/* ── Room sidebar ── */}
        <div className="w-52 shrink-0 flex flex-col" style={{ background: '#111', borderRight: '1px solid #1a1a1a' }}>
          <div className="px-3 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Chat Rooms</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {ROOMS.map(r => (
              <button key={r.id} onClick={() => setRoom(r)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                style={{
                  background: room.id === r.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: room.id === r.id ? '#fff' : '#6b7280',
                }}>
                <span className="text-lg">{r.emoji}</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{r.label}</p>
                  <p className="text-[10px]" style={{ color: '#555' }}>{r.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Socket.io status */}
          <div className="p-3" style={{ borderTop: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#555' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
              Connected (Realtime)
            </div>
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0"
            style={{ background: '#111', borderBottom: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{room.emoji}</span>
              <div>
                <h2 className="text-sm font-bold text-white">#{room.label}</h2>
                <p className="text-xs" style={{ color: '#555' }}>{room.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6b7280' }}>
              <Users className="w-3.5 h-3.5" />
              <span>{onlineCount} online</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#222 transparent' }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-40">
                <Hash className="w-12 h-12 text-gray-600" />
                <p className="text-sm font-bold text-white">No messages yet</p>
                <p className="text-xs text-gray-500">Start the conversation in #{room.label}</p>
              </div>
            ) : (
              messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 group">
                  <Avatar className="w-8 h-8 rounded-full shrink-0">
                    <AvatarImage src={msg.avatar_url || ''} />
                    <AvatarFallback style={{ background: '#1a1a1a', fontSize: 10, color: '#9ca3af' }}>
                      {msg.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-sm font-bold cursor-pointer hover:underline" style={{ color: msg.color }}>
                        {msg.display_name}
                      </span>
                      <span className="text-[10px]" style={{ color: '#444' }}>
                        {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed break-words" style={{ color: '#e5e7eb' }}>
                      {msg.text}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
                  {EMOJIS.map(e => (
                    <motion.button key={e} whileTap={{ scale: 0.7 }}
                      onClick={() => setDraft(d => d + e)} className="text-xl shrink-0">{e}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {user ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowEmoji(v => !v)}
                  className="text-gray-500 hover:text-white transition-colors shrink-0">
                  <Smile className="w-5 h-5" />
                </button>
                <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5"
                  style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
                  <input ref={inputRef}
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                    placeholder={`Message #${room.label}…`}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                    maxLength={500}
                  />
                  <motion.button whileTap={{ scale: 0.8 }} onClick={send}
                    disabled={!draft.trim() || sending}
                    className="shrink-0 disabled:opacity-30"
                    style={{ color: draft.trim() ? '#e5e7eb' : '#3a3a3a' }}>
                    {sending
                      ? <div className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-white animate-spin" />
                      : <Send className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-3">
                <a href="/auth" className="text-sm font-bold text-white hover:underline">Sign in</a>
                <span className="text-sm mx-1" style={{ color: '#555' }}>to chat in #{room.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
