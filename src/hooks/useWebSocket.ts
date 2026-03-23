/**
 * useWebSocket — thin wrapper around Supabase Realtime for live chat.
 * Supabase Realtime IS a WebSocket connection — this hook exposes it
 * as a simple send/subscribe API identical to native WebSocket.
 */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Handler = (payload: any) => void;

export function useWebSocket(channelName: string, onMessage: Handler) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const ch = supabase.channel(channelName);
    channelRef.current = ch;

    ch.on('broadcast', { event: 'message' }, ({ payload }) => onMessage(payload));
    ch.subscribe();

    return () => { ch.unsubscribe(); };
  }, [channelName]);

  const send = useCallback((payload: object) => {
    channelRef.current?.send({ type: 'broadcast', event: 'message', payload });
  }, []);

  return { send };
}
