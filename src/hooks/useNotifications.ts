import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'follow' | 'stream_live' | 'message' | 'mention' | 'like' | 'comment' | 'clip' | 'system';
  title: string;
  body: string | null;
  image_url: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('notifications').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(30);
      if (data) {
        const notifs = data as Notification[];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications(prev => [n, ...prev].slice(0, 30));
          if (!n.is_read) setUnreadCount(c => c + 1);
          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(n.title, { body: n.body || '', icon: n.image_url || '/favicon.ico' });
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await (supabase as any).from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await (supabase as any).from('notifications').update({ is_read: true }).eq('user_id', user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    const target = notifications.find(n => n.id === id);
    try {
      await (supabase as any).from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (target && !target.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, [notifications]);

  const requestPushPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refetch: fetchNotifications, requestPushPermission };
}
