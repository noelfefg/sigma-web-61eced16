import { useState, useEffect } from 'react';
import { Plus, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LiveUser {
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export function StoriesBar() {
  const { user } = useAuth();
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('streams')
        .select('profiles!inner(username, display_name, avatar_url)')
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(8);
      if (data) {
        setLiveUsers(data.map((s: any) => ({
          username: s.profiles.username,
          display_name: s.profiles.display_name,
          avatar_url: s.profiles.avatar_url,
        })));
      }
    }
    fetch();
  }, []);

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 px-1 scrollbar-hide">
      {/* Your Story */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-1.5 shrink-0"
      >
        <div className="w-[64px] h-[64px] rounded-full bg-secondary p-[2px]">
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground w-16 text-center font-medium truncate">
          Your Story
        </span>
      </motion.div>
      
      {liveUsers.map((u, i) => (
        <motion.div
          key={u.username}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: (i + 1) * 0.05 }}
        >
          <Link to={`/watch/${u.username}`} className="flex flex-col items-center gap-1.5 shrink-0 group">
            <div className="w-[64px] h-[64px] rounded-full p-[3px] bg-gradient-to-br from-destructive to-primary group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-card p-[2px]">
                <Avatar className="w-full h-full">
                  <AvatarImage src={u.avatar_url || ''} />
                  <AvatarFallback className="bg-secondary text-xs">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground truncate w-16 text-center group-hover:text-foreground transition-colors font-medium">
              {u.display_name}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
