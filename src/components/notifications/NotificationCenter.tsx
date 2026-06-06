/**
 * NotificationCenter — bell dropdown with realtime push from the Go server.
 *
 * Combines:
 *   - Persisted history from Supabase (useNotifications)
 *   - Live pushes from Socket.IO (useRealtimeNotifications)
 *
 * Use anywhere; safe whether or not the Go server is configured.
 */
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon, SIGMA_ICONS } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications();

  // Realtime push refreshes the persisted list.
  useRealtimeNotifications(() => refetch());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Icon icon={SIGMA_ICONS.bell} size={22} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 cosmic-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h3 className="font-cosmic text-base">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[28rem]">
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              <Icon icon={SIGMA_ICONS.bell} size={32} className="opacity-40 mx-auto mb-2" />
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "px-4 py-3 hover:bg-accent/40 cursor-pointer transition-colors",
                    !n.is_read && "bg-primary/5",
                  )}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                    if (n.link) window.location.href = n.link;
                  }}
                >
                  <div className="flex gap-3">
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
