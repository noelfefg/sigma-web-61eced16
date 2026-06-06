/**
 * useRealtimeNotifications
 * Subscribes to the Go server's notif:{userId} Socket.IO room.
 * Merges incoming pushes with the existing Supabase-backed notification list
 * by surfacing a toast + delegating to the caller's `onPush` callback.
 *
 * Safe no-op when VITE_GO_API_URL is unset.
 */
import { useEffect } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { useAuth } from "./useAuth";

export interface RealtimeNotification {
  type: string;
  title: string;
  body?: string;
  link?: string;
  imageUrl?: string;
}

export function useRealtimeNotifications(onPush?: (n: RealtimeNotification) => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const socket = await getSocket();
      if (!socket || cancelled) return;
      const handler = (n: RealtimeNotification) => {
        toast(n.title, { description: n.body });
        onPush?.(n);
      };
      socket.on("notification", handler);
      cleanup = () => socket.off("notification", handler);
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user, onPush]);
}
