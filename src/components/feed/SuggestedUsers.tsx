import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Profile { id: string; username: string; display_name: string; avatar_url: string | null; }

export function SuggestedUsers() {
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('id, username, display_name, avatar_url').limit(3).then(({ data }) => { if (data) setUsers(data); });
  }, []);

  if (users.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/40 overflow-hidden">
      <h3 className="text-base font-bold text-foreground p-4 pb-2">Who to follow</h3>
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
          <Link to={`/channel/${u.username}`}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={u.avatar_url || ''} />
              <AvatarFallback className="bg-secondary text-xs"><User className="w-4 h-4" /></AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/channel/${u.username}`}><p className="text-sm font-bold text-foreground truncate hover:underline">{u.display_name}</p></Link>
            <p className="text-xs text-muted-foreground">@{u.username}</p>
          </div>
          <button className="bg-foreground text-background text-xs font-bold px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">Follow</button>
        </div>
      ))}
      <button className="w-full text-left px-4 py-3 text-sm text-primary hover:bg-accent/20 transition-colors">Show more</button>
    </motion.div>
  );
}
