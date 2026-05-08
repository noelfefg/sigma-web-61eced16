import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PresenceUser {
  user_id: string;
  username?: string;
  avatar_url?: string;
  online_at: string;
}

interface UsePresenceOptions {
  /** Channel name — same name on different clients = same room */
  room: string;
  /** Track typing state per user */
  trackTyping?: boolean;
}

/**
 * Realtime presence hook for live user lists, typing indicators, "who's watching".
 * Returns the current set of online users + helpers to broadcast typing.
 */
export function usePresence({ room, trackTyping = false }: UsePresenceOptions) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!room) return;
    const channel = supabase.channel(room, {
      config: { presence: { key: user?.id ?? `anon-${crypto.randomUUID()}` } },
    });
    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>();
      const users: PresenceUser[] = Object.values(state).flat() as any;
      setOnlineUsers(users);
    });

    if (trackTyping) {
      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        const uid = payload?.user_id as string | undefined;
        if (!uid || uid === user?.id) return;
        setTypingUsers(prev => new Set(prev).add(uid));
        const old = typingTimers.current.get(uid);
        if (old) clearTimeout(old);
        const t = setTimeout(() => {
          setTypingUsers(prev => { const n = new Set(prev); n.delete(uid); return n; });
          typingTimers.current.delete(uid);
        }, 2500);
        typingTimers.current.set(uid, t);
      });
    }

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && user) {
        const { data: profile } = await supabase
          .from('profiles').select('username, avatar_url').eq('id', user.id).single();
        await channel.track({
          user_id: user.id,
          username: profile?.username,
          avatar_url: profile?.avatar_url,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      typingTimers.current.forEach(t => clearTimeout(t));
      typingTimers.current.clear();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [room, user, trackTyping]);

  const broadcastTyping = useCallback(() => {
    if (!user || !channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id } });
  }, [user]);

  return { onlineUsers, count: onlineUsers.length, typingUsers, broadcastTyping };
}
