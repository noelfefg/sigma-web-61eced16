import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, BellOff, UserPlus, Radio, MessageSquare,
  Heart, AtSign, Video, Trash2, CheckCheck, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

// ── Icon map by notification type ─────────────────────────────────────────────
const typeConfig: Record<
  Notification['type'],
  { icon: React.ElementType; color: string; bg: string }
> = {
  follow:      { icon: UserPlus,      color: 'text-blue-400',   bg: 'bg-blue-400/15' },
  stream_live: { icon: Radio,         color: 'text-red-500',    bg: 'bg-red-500/15'  },
  message:     { icon: MessageSquare, color: 'text-primary',    bg: 'bg-primary/15'  },
  mention:     { icon: AtSign,        color: 'text-yellow-400', bg: 'bg-yellow-400/15' },
  like:        { icon: Heart,         color: 'text-red-400',    bg: 'bg-red-400/15'  },
  comment:     { icon: MessageSquare, color: 'text-green-400',  bg: 'bg-green-400/15' },
  clip:        { icon: Video,         color: 'text-orange-400', bg: 'bg-orange-400/15' },
  system:      { icon: Bell,          color: 'text-orange-400', bg: 'bg-orange-400/15' },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: Props) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-14 right-3 md:right-6 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/30 shadow-2xl shadow-black/30 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-sm text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-primary px-2"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <ScrollArea className="h-[420px]">
              {loading ? (
                <div className="space-y-1 p-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-secondary" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-secondary rounded w-3/4" />
                        <div className="h-2.5 bg-secondary/60 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <BellOff className="w-10 h-10 text-muted-foreground/30" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">You're all caught up!</p>
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  <AnimatePresence initial={false}>
                    {notifications.map((notif, i) => (
                      <NotifItem
                        key={notif.id}
                        notif={notif}
                        index={i}
                        onRead={markAsRead}
                        onDelete={deleteNotification}
                        onClose={onClose}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Single notification item ───────────────────────────────────────────────────
function NotifItem({
  notif, index, onRead, onDelete, onClose,
}: {
  notif: Notification;
  index: number;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const cfg = typeConfig[notif.type] ?? typeConfig.system;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notif.is_read) onRead(notif.id);
    onClose();
  };

  const inner = (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer relative',
        notif.is_read ? 'hover:bg-accent/30' : 'bg-primary/5 hover:bg-primary/10',
      )}
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
        />
      )}

      {/* Avatar + type icon */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={notif.image_url || ''} />
          <AvatarFallback className="bg-secondary text-xs font-bold">
            {notif.title[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className={cn('absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center', cfg.bg)}>
          <Icon className={cn('w-2.5 h-2.5', cfg.color)} />
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs leading-relaxed', notif.is_read ? 'text-foreground/80' : 'text-foreground font-medium')}>
          {sigmatizeWording(notif.title)}
        </p>
        {notif.body && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sigmatizeWording(notif.body)}</p>
        )}
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Delete button */}
      <motion.button
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(notif.id); }}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </motion.button>
    </motion.div>
  );

  return notif.link ? (
    <Link to={notif.link} onClick={(e) => e.stopPropagation()}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

// ── Bell button with badge (used in AppLayout header) ─────────────────────────
export function NotificationBell({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative h-9 w-9 rounded-full flex items-center justify-center bg-secondary/60 hover:bg-secondary transition-colors text-foreground"
    >
      <motion.div
        animate={count > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
        transition={{ duration: 0.5, repeat: count > 0 ? Infinity : 0, repeatDelay: 3 }}
      >
        <Bell className="w-4 h-4" />
      </motion.div>

      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-card"
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
