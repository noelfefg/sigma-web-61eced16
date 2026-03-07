import { useState, useEffect } from 'react';
import { User, Radio } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface LiveStreamer {
  username: string;
  display_name: string;
  avatar_url: string | null;
  viewer_count: number;
}

interface PopularStreamersProps {
  collapsed: boolean;
}

export function PopularStreamers({ collapsed }: PopularStreamersProps) {
  const [streamers, setStreamers] = useState<LiveStreamer[]>([]);

  useEffect(() => {
    async function fetchLiveStreamers() {
      const { data } = await supabase
        .from('streams')
        .select('viewer_count, profiles!inner(username, display_name, avatar_url)')
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(5);
      if (data) {
        setStreamers(data.map((s: any) => ({
          username: s.profiles.username,
          display_name: s.profiles.display_name,
          avatar_url: s.profiles.avatar_url,
          viewer_count: s.viewer_count,
        })));
      }
    }
    fetchLiveStreamers();
  }, []);

  if (streamers.length === 0) return null;

  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
          Live Now
        </p>
      )}
      {streamers.map(s => (
        <Link
          key={s.username}
          to={`/watch/${s.username}`}
          className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200 group ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="relative shrink-0">
            <Avatar className="w-7 h-7">
              <AvatarImage src={s.avatar_url || ''} />
              <AvatarFallback className="bg-secondary text-[10px]">
                <User className="w-3 h-3" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full border-[1.5px] border-card" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium truncate">{s.display_name}</p>
              <p className="text-[10px] text-destructive font-medium">
                {s.viewer_count >= 1000 ? `${(s.viewer_count / 1000).toFixed(1)}K` : s.viewer_count} viewers
              </p>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
